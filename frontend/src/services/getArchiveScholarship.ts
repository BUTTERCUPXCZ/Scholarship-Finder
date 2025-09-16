// Archive interface matching backend schema
interface Archive {
    id: string
    scholarshipId: string
    title: string
    description: string
    location: string
    benefits: string
    deadline: string
    type: string
    requirements: string
    originalStatus: 'ACTIVE' | 'EXPIRED'
    archivedAt: string
    archivedBy: string
    providerId: string
    originalCreatedAt: string
    originalUpdatedAt: string
}

export const getArchiveScholarships = async (): Promise<Archive[]> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/scholar/get-archived`, {
        method: 'POST',
        credentials: 'include', // Include cookies in request
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('UNAUTHORIZED');
        }

        let errorMessage = 'Failed to fetch archived scholarships';
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
}

// Keep the old function for backward compatibility
export const getArchiveScholarship = getArchiveScholarships;
