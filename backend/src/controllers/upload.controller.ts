import { Request, Response, RequestHandler } from 'express';
import { createClient } from '@supabase/supabase-js';
import multer, { FileFilterCallback } from 'multer';

interface AuthenticatedRequest extends Request {
    userId?: string; // set by your auth middleware
    files?: Express.Multer.File[]; // multer adds this when using upload.array(...)
}

const supabaseUrl = (process.env).SUPABASE_URL as string;
const supabaseServiceKey = (process.env).SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    throw new Error('Supabase configuration missing');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Storage bucket name - consistent with frontend
const BUCKET_NAME = 'application-documents';

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        // Allow PDF, DOC, DOCX, and image files
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/jpg'
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX, and image files are allowed'));
        }
    }
});

export const uploadMiddleware = upload.array('documents', 5);



export const uploadFiles: RequestHandler = async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
        console.log('Upload files endpoint called');

        const userId = authReq.userId as string | undefined;
        if (!userId) {
            console.error('No user ID found in request');
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const files = authReq.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No files provided' });
        }

        console.log(`Processing ${files.length} files for user ${userId}`);

        const uploadResults = [];

        for (const file of files) {
            try {
                console.log(`Uploading file: ${file.originalname}, Size: ${file.size}, Type: ${file.mimetype}`);

                // Generate unique file path
                const timestamp = Date.now();
                const randomId = Math.random().toString(36).substring(2, 8);
                const storagePath = `${userId}/documents/${timestamp}-${randomId}-${file.originalname}`;

                console.log(`Storage path: ${storagePath}`);

                // Upload to Supabase storage
                const { error } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(storagePath, file.buffer, {
                        contentType: file.mimetype,
                        cacheControl: '3600',
                        upsert: false
                    });

                if (error) {
                    console.error('Supabase upload error for file', file.originalname, ':', error);

                    // If bucket doesn't exist, try to create it
                    if (error.message.includes('Bucket not found')) {
                        console.log('Attempting to create bucket...');
                        const { error: bucketError } = await supabase.storage.createBucket(BUCKET_NAME, {
                            public: true,
                            allowedMimeTypes: [
                                'application/pdf',
                                'application/msword',
                                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                'image/jpeg',
                                'image/png',
                                'image/jpg'
                            ],
                            fileSizeLimit: 10485760 // 10MB
                        });

                        if (bucketError) {
                            console.error('Failed to create bucket:', bucketError);
                            return res.status(500).json({
                                message: `Storage bucket error: ${bucketError.message}`
                            });
                        }

                        // Retry upload after creating bucket
                        const { error: retryError } = await supabase.storage
                            .from(BUCKET_NAME)
                            .upload(storagePath, file.buffer, {
                                contentType: file.mimetype,
                                cacheControl: '3600',
                                upsert: false
                            });

                        if (retryError) {
                            console.error('Retry upload failed:', retryError);
                            return res.status(500).json({
                                message: `Failed to upload ${file.originalname}: ${retryError.message}`
                            });
                        }
                    } else {
                        return res.status(500).json({
                            message: `Failed to upload ${file.originalname}: ${error.message}`
                        });
                    }
                }

                console.log(`Successfully uploaded file: ${file.originalname}`);

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(storagePath);

                uploadResults.push({
                    filename: file.originalname,
                    contentType: file.mimetype,
                    size: file.size,
                    fileUrl: urlData.publicUrl,
                    storagePath: storagePath
                });

            } catch (fileError) {
                console.error(`Error processing file ${file.originalname}:`, fileError);
                return res.status(500).json({
                    message: `Failed to process file ${file.originalname}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`
                });
            }
        }

        console.log(`Successfully uploaded ${uploadResults.length} files`);
        res.status(200).json({
            success: true,
            message: 'Files uploaded successfully',
            data: uploadResults
        });

    } catch (error) {
        console.error('Upload controller error:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Download a file from Supabase storage with proper authentication
 */
export const downloadFile: RequestHandler = async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
        // Extract the storage path from the request body
        const { storagePath } = req.body;
        const userId = authReq.userId as string | undefined;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!storagePath) {
            return res.status(400).json({ message: 'Storage path is required in request body' });
        }

        console.log('Downloading file from path:', storagePath);

        // Get signed URL with service role key (has more permissions)
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(storagePath, 3600); // 1 hour expiry

        if (error) {
            console.error('Error creating signed URL:', error);
            return res.status(404).json({
                message: 'File not found or access denied',
                error: error.message
            });
        }

        if (!data.signedUrl) {
            return res.status(404).json({ message: 'Could not generate download URL' });
        }

        console.log('Successfully created signed URL');

        // Return the signed URL
        res.json({ downloadUrl: data.signedUrl });

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ message: 'Failed to download file' });
    }
};