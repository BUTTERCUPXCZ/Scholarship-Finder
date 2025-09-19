import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';

// Initialize Supabase client with service role key for server-side operations
const supabaseUrl = (process.env as any).SUPABASE_URL || '';
const supabaseServiceKey = (process.env as any).SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req: any, file: any, cb: any) => {
        // Allow only PDF files
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

export const uploadMiddleware = upload.array('documents', 5); // Max 5 files

/**
 * Upload files to Supabase storage
 */
export const uploadFiles = async (req: Request, res: Response) => {
    try {
        const userId = req.userId as string;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const files = req.files as any[];
        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No files provided' });
        }

        const uploadResults = [];

        for (const file of files) {
            // Generate unique file path
            const timestamp = Date.now();
            const storagePath = `${userId}/temp-${timestamp}/${timestamp}-${file.originalname}`;

            // Upload to Supabase storage
            const { data, error } = await supabase.storage
                .from('application-documents')
                .upload(storagePath, file.buffer, {
                    contentType: file.mimetype,
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Supabase upload error:', error);
                return res.status(500).json({
                    message: `Failed to upload ${file.originalname}: ${error.message}`
                });
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('application-documents')
                .getPublicUrl(storagePath);

            uploadResults.push({
                filename: file.originalname,
                contentType: file.mimetype,
                size: file.size,
                fileUrl: urlData.publicUrl,
                storagePath: storagePath
            });
        }

        res.status(200).json({
            success: true,
            message: 'Files uploaded successfully',
            data: uploadResults
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Download a file from Supabase storage with proper authentication
 */
export const downloadFile = async (req: Request, res: Response) => {
    try {
        // Extract the storage path from the request body
        const { storagePath } = req.body;
        const userId = req.userId as string;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!storagePath) {
            return res.status(400).json({ message: 'Storage path is required in request body' });
        }

        console.log('Downloading file from path:', storagePath);

        // Get signed URL with service role key (has more permissions)
        const { data, error } = await supabase.storage
            .from('application-documents')
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