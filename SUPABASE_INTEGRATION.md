# Supabase Integration for Application Documents

This guide outlines the integration of Supabase storage for handling application documents in your scholarship finder application.

## What was changed:

### 1. Database Schema
- Modified `ApplicationDocument` model to store Supabase URLs instead of binary data
- Added `fileUrl` and `storagePath` fields
- Removed `data` BLOB field

### 2. Frontend Changes
- Added Supabase client configuration (`src/lib/supabase.ts`)
- Created Supabase storage service (`src/services/supabaseStorage.ts`)
- Updated application submission service to use Supabase
- Modified Scholarship details component to handle new flow

### 3. Backend Changes
- Created application controller (`src/controllers/application.controller.ts`)
- Created application routes (`src/routes/application.routes.ts`)
- Updated main server to include application routes

## Setup Instructions:

### 1. Supabase Project Setup

1. **Create Supabase Account & Project**
   - Go to https://supabase.com
   - Create a new project
   - Note your project URL and anon key

2. **Create Storage Bucket**
   - In Supabase dashboard: Storage > Buckets
   - Create bucket named `application-documents`
   - Make it **private** (not public)

3. **Set Storage Policies**
   ```sql
   -- Enable RLS on storage.objects table
   ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

   -- Allow authenticated users to upload
   CREATE POLICY "Allow authenticated users to upload application documents" ON storage.objects
   FOR INSERT TO authenticated
   WITH CHECK (bucket_id = 'application-documents');

   -- Allow users to view their own files
   CREATE POLICY "Allow users to view their own application documents" ON storage.objects
   FOR SELECT TO authenticated
   USING (bucket_id = 'application-documents');

   -- Allow users to delete their own files
   CREATE POLICY "Allow users to delete their own application documents" ON storage.objects
   FOR DELETE TO authenticated
   USING (bucket_id = 'application-documents');
   ```

### 2. Environment Variables

Update your `frontend/.env` file:
```env
VITE_API_URL=http://localhost:3000

# Replace with your actual Supabase credentials
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Database Migration

The database migration has been applied. If you need to rerun it:
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

## How it works:

### File Upload Flow:
1. User selects file on frontend
2. Frontend uploads file directly to Supabase storage
3. Supabase returns file URL and storage path
4. Frontend sends application data with file URLs to backend
5. Backend stores application with document URLs in database

### File Access:
- Files are stored privately in Supabase
- Access through signed URLs for security
- Organization can view applicant documents
- Students can view their own submitted documents

## File Types Supported:
- PDF documents
- Word documents (.doc, .docx)
- Images (JPEG, PNG)
- Maximum file size: 10MB

## Security Features:
- Files stored privately in Supabase
- Row Level Security (RLS) policies
- User authentication required
- File access through signed URLs
- Automatic cleanup of unused files

## Testing:

1. **Start your backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start your frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test file upload**
   - Navigate to a scholarship details page
   - Try uploading a document
   - Submit application
   - Check Supabase storage bucket for uploaded file
   - Verify database has file URL stored

## Troubleshooting:

### Common Issues:
1. **CORS errors**: Ensure Supabase bucket policies are set correctly
2. **File upload fails**: Check Supabase credentials in .env
3. **Authentication errors**: Verify user is logged in before file upload
4. **File size errors**: Ensure files are under 10MB limit

### Debug Steps:
1. Check browser console for errors
2. Verify Supabase credentials
3. Check network tab for failed requests
4. Verify bucket policies in Supabase dashboard

## Benefits of this integration:

1. **Performance**: No large file storage in PostgreSQL
2. **Scalability**: Supabase handles file storage and CDN
3. **Security**: Private file storage with access control
4. **Cost**: More cost-effective than database BLOB storage
5. **Reliability**: Built-in backup and redundancy