import { isNetworkError } from '../hooks/useNetworkStatus'

export const archiveScholarship = async (id: string) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/scholar/archive-scholar/${id}`, {
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

            let errorMessage = 'Failed to archive scholarship';
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

// Interface for fetching archived scholarships
export const getArchivedScholarships = async () => {
    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/scholar/archived-scholarships`, {
            method: "GET",
            credentials: 'include', // Include cookies
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            if (res.status === 401) {
                throw new Error('UNAUTHORIZED');
            }

            let errorMessage = 'Failed to fetch archived scholarships';
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

// Interface for restoring archived scholarships (if needed)
export const restoreScholarship = async (id: string) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/scholar/restore-scholar/${id}`, {
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

            let errorMessage = 'Failed to restore scholarship';
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