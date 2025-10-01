// Application service for managing scholarship applications
import type { FileMetadata } from './supabaseStorage'

export interface ApplicationDocument {
    id: string;
    filename: string;
    contentType: string;
    size: number;
    fileUrl: string;
    storagePath: string;
    uploadedAt: string;
}

interface Application {
    id: string;
    userId: string;
    scholarshipId: string;
    status: 'PENDING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED';
    submittedAt: string;
    scholarship: {
        id: string;
        title: string;
        description: string;
        deadline: string;
        location: string;
        benefits: string;
        requirements: string;
        type: string;
        status: 'ACTIVE' | 'EXPIRED';
    };
    documents?: ApplicationDocument[];
}

interface ApplicationData {
    scholarshipId: string;
    personalStatement?: string;
    documents?: File[];
    // Applicant fields required by backend/prisma
    Firstname: string;
    Middlename?: string;
    Lastname: string;
    Email: string;
    Phone: string;
    Address: string;
    City: string;
}

export const submitApplication = async (
    applicationData: ApplicationData,
    userId?: string
): Promise<Application> => {
    try {
        // Step 1: Upload documents to backend if any
        let uploadedDocuments: FileMetadata[] = []

        if (applicationData.documents && applicationData.documents.length > 0) {
            if (!userId) {
                throw new Error('User ID is required for file upload')
            }

            try {
                // Upload files through backend endpoint
                const formData = new FormData()
                applicationData.documents.forEach((file) => {
                    formData.append('documents', file)
                })

                const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL}/upload/files`, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                })

                if (!uploadResponse.ok) {
                    throw new Error('File upload failed')
                }

                const uploadResult = await uploadResponse.json()
                uploadedDocuments = uploadResult.data

            } catch (uploadError) {
                console.error('File upload failed:', uploadError)
                throw new Error('Failed to upload documents. Please try again.')
            }
        }

        // Step 2: Submit application with document URLs to backend
        const submitData = {
            scholarshipId: applicationData.scholarshipId,
            personalStatement: applicationData.personalStatement,
            Firstname: applicationData.Firstname,
            Middlename: applicationData.Middlename || '',
            Lastname: applicationData.Lastname,
            Email: applicationData.Email,
            Phone: applicationData.Phone,
            Address: applicationData.Address,
            City: applicationData.City,
            documents: uploadedDocuments.map(doc => ({
                filename: doc.filename,
                contentType: doc.contentType,
                size: doc.size,
                fileUrl: doc.fileUrl,
                storagePath: doc.storagePath
            }))
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/applications/submit`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(submitData)
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Please log in again to submit your application');
            }

            let errorMessage = 'Failed to submit application';
            try {
                const errorData = await response.json();
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.errors) {
                    // Handle validation errors from Zod
                    const firstError = Object.values(errorData.errors)[0];
                    if (firstError && typeof firstError === 'object' && '_errors' in firstError) {
                        errorMessage = (firstError as any)._errors[0] || errorMessage;
                    }
                }
            } catch {
                // If parsing error response fails, use status-based message
                if (response.status === 400) {
                    errorMessage = 'Invalid application data. Please check all fields and try again.';
                }
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.data;

    } catch (error) {
        console.error('Application submission error:', error)
        throw error instanceof Error ? error : new Error('Failed to submit application')
    }
};

export const getUserApplications = async (): Promise<Application[]> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/applications/my-applications`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('UNAUTHORIZED');
        }

        let errorMessage = 'Failed to fetch applications';
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch {
            // If parsing error response fails, use default message
        }

        throw new Error(`${response.status} ${errorMessage}`);
    }

    const data = await response.json();
    return data.data;
};

export const getApplicationStatus = async (applicationId: string): Promise<Application> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/applications/${applicationId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('UNAUTHORIZED');
        }

        let errorMessage = 'Failed to fetch application status';
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch {
            // If parsing error response fails, use default message
        }

        throw new Error(`${response.status} ${errorMessage}`);
    }

    const data = await response.json();
    return data.data;
};

export const withdrawApplication = async (applicationId: string): Promise<void> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/applications/${applicationId}/withdraw`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('UNAUTHORIZED');
        }

        let errorMessage = 'Failed to withdraw application';
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch {
            // If parsing error response fails, use default message
        }

        throw new Error(`${response.status} ${errorMessage}`);
    }
};

// Organization service for managing applications
export interface BackendApplication {
    id: string;
    userId: string;
    scholarshipId: string;
    status: 'PENDING' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED';
    submittedAt: string;
    Address: string;
    City: string;
    Email: string;
    Firstname: string;
    Lastname: string;
    Middlename: string;
    Phone: string;
    documents: ApplicationDocument[];
    user: {
        id: string;
        fullname: string;
        email: string;
    };
}

export const getScholarshipApplications = async (scholarshipId: string): Promise<BackendApplication[]> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/applications/scholarship/${scholarshipId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('UNAUTHORIZED');
        }

        if (response.status === 404) {
            throw new Error('Scholarship not found or you do not have access to it');
        }

        let errorMessage = 'Failed to fetch scholarship applications';
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch {
            // If parsing error response fails, use default message
        }

        throw new Error(`${response.status} ${errorMessage}`);
    }

    const data = await response.json();
    return data.data;
};

export const updateApplicationStatus = async (
    applicationId: string,
    status: 'PENDING' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED'
): Promise<Application> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/applications/${applicationId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('UNAUTHORIZED');
        }

        if (response.status === 404) {
            throw new Error('Application not found');
        }

        let errorMessage = 'Failed to update application status';
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch {
            // If parsing error response fails, use default message
        }

        throw new Error(`${response.status} ${errorMessage}`);
    }

    const data = await response.json();
    return data.data;
};

export const getApplicants = async (): Promise<BackendApplication[]> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/applications/get-applicants`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('UNAUTHORIZED');
        }

        let errorMessage = 'Failed to fetch applicants';
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch {
            // If parsing error response fails, use default message
        }

        throw new Error(`${response.status} ${errorMessage}`);
    }

    const data = await response.json();
    return data.data;
};
