import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Configure auth settings if needed
        persistSession: true,
        autoRefreshToken: true,
    }
})

// Storage bucket name - use consistent naming without spaces
export const STORAGE_BUCKET = 'application-documents'

// Helper function to generate file path in storage
export const generateFilePath = (userId: string, applicationId: string, originalFilename: string): string => {
    const timestamp = Date.now()
    return `${userId}/${applicationId}/${timestamp}-${originalFilename}`
}

// Helper function to get public URL for a file
export const getFileUrl = (path: string): string => {
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
    return data.publicUrl
}