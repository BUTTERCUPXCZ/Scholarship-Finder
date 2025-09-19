// Scholarship interface matching backend schema
interface Scholarship {
    id: string
    title: string
    description: string
    location: string
    benefits: string
    deadline: string
    type: string
    requirements: string
    status: 'ACTIVE' | 'EXPIRED'
    createdAt: string
    updatedAt: string
    providerId: string
    applications?: any[]
}

export const getAllScholars = async (): Promise<Scholarship[]> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/scholar/get-scholars`, {
        method: 'GET',
        credentials: 'include', // Include cookies in request
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        let errorMessage = 'Failed to fetch scholarships';
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
}// Keep the old function for backward compatibility
export const getScholarships = getAllScholars;