import { supabase, STORAGE_BUCKET, generateFilePath } from '../lib/supabase'
import toast from 'react-hot-toast'

export interface UploadResult {
    success: boolean
    fileUrl?: string
    storagePath?: string
    error?: string
}

export interface FileMetadata {
    filename: string
    contentType: string
    size: number
    fileUrl: string
    storagePath: string
}

/**
 * Upload a file to Supabase storage
 * @param file - The file to upload
 * @param userId - The ID of the user uploading the file
 * @param applicationId - The ID of the application this file belongs to
 * @returns Promise<UploadResult>
 */
export const uploadFileToSupabase = async (
    file: File,
    userId: string,
    applicationId: string
): Promise<UploadResult> => {
    try {
        // Validate file
        if (!file) {
            return { success: false, error: 'No file provided' }
        }

        // Check file size (limit to 10MB)
        const maxSizeInBytes = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSizeInBytes) {
            return { success: false, error: 'File size must be less than 10MB' }
        }

        // Check file type (allow PDFs, DOCs, images)
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/jpg'
        ]

        if (!allowedTypes.includes(file.type)) {
            return {
                success: false,
                error: 'Only PDF, DOC, DOCX, and image files are allowed'
            }
        }

        // Generate unique file path
        const storagePath = generateFilePath(userId, applicationId, file.name)

        // Upload file to Supabase storage
        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(storagePath, file, {
                cacheControl: '3600',
                upsert: false // Don't overwrite existing files
            })

        if (error) {
            console.error('Supabase upload error:', error)
            return { success: false, error: error.message }
        }

        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(storagePath)

        return {
            success: true,
            fileUrl: urlData.publicUrl,
            storagePath: storagePath
        }

    } catch (error) {
        console.error('Upload error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        }
    }
}

/**
 * Upload multiple files to Supabase storage
 * @param files - Array of files to upload
 * @param userId - The ID of the user uploading the files
 * @param applicationId - The ID of the application these files belong to
 * @returns Promise<FileMetadata[]>
 */
export const uploadMultipleFilesToSupabase = async (
    files: File[],
    userId: string,
    applicationId: string
): Promise<FileMetadata[]> => {
    const uploadPromises = files.map(async (file) => {
        const result = await uploadFileToSupabase(file, userId, applicationId)

        if (result.success) {
            return {
                filename: file.name,
                contentType: file.type,
                size: file.size,
                fileUrl: result.fileUrl!,
                storagePath: result.storagePath!
            }
        } else {
            toast.error(`Failed to upload ${file.name}: ${result.error}`)
            throw new Error(`Failed to upload ${file.name}: ${result.error}`)
        }
    })

    try {
        const results = await Promise.all(uploadPromises)
        return results
    } catch (error) {
        console.error('Multiple file upload error:', error)
        throw error
    }
}

/**
 * Delete a file from Supabase storage
 * @param storagePath - The path of the file in Supabase storage
 * @returns Promise<boolean>
 */
export const deleteFileFromSupabase = async (storagePath: string): Promise<boolean> => {
    try {
        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([storagePath])

        if (error) {
            console.error('Supabase delete error:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('Delete error:', error)
        return false
    }
}

/**
 * Get download URL for a file (for private access)
 * @param storagePath - The path of the file in Supabase storage
 * @param expiresIn - How long the URL should be valid (in seconds)
 * @returns Promise<string | null>
 */
/**
 * Download a file from Supabase storage using the backend endpoint
 * @param storagePath - The path of the file in Supabase storage
 * @returns Promise<string | null> - Returns the download URL
 */
export const getDownloadUrlFromBackend = async (storagePath: string): Promise<string | null> => {
    try {
        console.log('Getting download URL from backend for path:', storagePath)

        const response = await fetch(`${import.meta.env.VITE_API_URL}/upload/download`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                storagePath: storagePath
            })
        })

        if (!response.ok) {
            console.error('Backend download URL request failed:', response.status, response.statusText)
            const errorText = await response.text()
            console.error('Error details:', errorText)
            return null
        }

        const data = await response.json()

        if (data.downloadUrl) {
            console.log('Successfully got download URL from backend')
            return data.downloadUrl
        }

        console.error('No download URL in backend response')
        return null
    } catch (error) {
        console.error('Error getting download URL from backend:', error)
        return null
    }
}

export const getDownloadUrl = async (
    storagePath: string,
    expiresIn: number = 3600
): Promise<string | null> => {
    try {
        console.log('Attempting to create signed URL for path:', storagePath)

        // Ensure the storage path is properly formatted (remove leading slash if present)
        const cleanPath = storagePath.startsWith('/') ? storagePath.substring(1) : storagePath

        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(cleanPath, expiresIn)

        if (error) {
            console.error('Supabase signed URL error:', error)
            console.error('Storage bucket:', STORAGE_BUCKET)
            console.error('Clean path:', cleanPath)

            // Try to get public URL as fallback (if the bucket allows public access)
            try {
                const { data: publicData } = supabase.storage
                    .from(STORAGE_BUCKET)
                    .getPublicUrl(cleanPath)

                if (publicData.publicUrl) {
                    console.log('Using public URL as fallback:', publicData.publicUrl)
                    return publicData.publicUrl
                }
            } catch (publicError) {
                console.error('Public URL fallback also failed:', publicError)
            }

            return null
        }

        console.log('Successfully created signed URL')
        return data.signedUrl
    } catch (error) {
        console.error('Get download URL error:', error)
        return null
    }
}

/**
 * Download a file from Supabase storage
 * @param storagePath - The path of the file in Supabase storage
 * @returns Promise<Blob | null>
 */
export const downloadFileFromSupabase = async (storagePath: string): Promise<Blob | null> => {
    try {
        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .download(storagePath)

        if (error) {
            console.error('Supabase download error:', error)
            return null
        }

        return data
    } catch (error) {
        console.error('Download error:', error)
        return null
    }
}