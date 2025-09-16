import { isNetworkError } from '../hooks/useNetworkStatus'

interface UpdateScholarInput {
    title: string;
    type: string;
    description: string;
    location: string;
    requirements: string;
    benefits: string;
    deadline: string;
}

export const updateScholar = async (id: string, data: UpdateScholarInput) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/scholar/update-scholar/${id}`, {
            method: "PUT",
            credentials: 'include', // Include cookies
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            if (res.status === 401) {
                throw new Error('UNAUTHORIZED');
            }

            let errorMessage = 'Failed to update scholarship';
            try {
                const errorData = await res.json();
                errorMessage = errorData.message || errorMessage;
            } catch {
                // If parsing error response fails, use default message
            }

            throw new Error(`${res.status} ${errorMessage}`);
        }

        return res.json();
    } catch (error: any) {
        // Check if it's a network error
        if (isNetworkError(error)) {
            throw new Error("No internet connection. Please check your network and try again.");
        }
        throw error;
    }
};