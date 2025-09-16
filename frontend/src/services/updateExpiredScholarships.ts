import { isNetworkError } from '../hooks/useNetworkStatus'

export const updateExpiredScholarships = async () => {
    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/scholar/update-expired`, {
            method: "POST",
            credentials: 'include', // Include cookies
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            if (res.status === 401) {
                throw new Error('UNAUTHORIZED');
            }

            let errorMessage = 'Failed to update expired scholarships';
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