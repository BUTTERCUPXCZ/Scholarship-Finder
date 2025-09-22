"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadFile = exports.uploadFiles = exports.uploadMiddleware = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const multer_1 = __importDefault(require("multer"));
// Initialize Supabase client with service role key for server-side operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    throw new Error('Supabase configuration missing');
}
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
// Storage bucket name - consistent with frontend
const BUCKET_NAME = 'application-documents';
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
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
        }
        else {
            cb(new Error('Only PDF, DOC, DOCX, and image files are allowed'));
        }
    }
});
exports.uploadMiddleware = upload.array('documents', 5); // Max 5 files
/**
 * Upload files to Supabase storage
 */
const uploadFiles = async (req, res) => {
    try {
        console.log('Upload files endpoint called');
        const userId = req.userId;
        if (!userId) {
            console.error('No user ID found in request');
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const files = req.files;
        if (!files || files.length === 0) {
            console.error('No files provided in request');
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
                const { data, error } = await supabase.storage
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
                        const { data: retryData, error: retryError } = await supabase.storage
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
                    }
                    else {
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
            }
            catch (fileError) {
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
    }
    catch (error) {
        console.error('Upload controller error:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.uploadFiles = uploadFiles;
/**
 * Download a file from Supabase storage with proper authentication
 */
const downloadFile = async (req, res) => {
    try {
        // Extract the storage path from the request body
        const { storagePath } = req.body;
        const userId = req.userId;
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
    }
    catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ message: 'Failed to download file' });
    }
};
exports.downloadFile = downloadFile;
