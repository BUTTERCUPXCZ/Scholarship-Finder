interface CreateScholarInput {
    title: string;
    type: string;
    description: string;
    location: string;
    requirements: string;
    benefits: string;
    deadline: string;
}

export const createScholar = async (data: CreateScholarInput, token?: string) => {
    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${import.meta.env.VITE_API_URL}/scholar/create-scholar`, {
        method: "POST",
        credentials: 'include', // Include cookies
        headers: headers,
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        if (res.status === 401) {
            throw new Error('UNAUTHORIZED');
        }

        let errorMessage = 'Failed to create scholarship';
        try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
        } catch {
            // If parsing fails, use default message
        }

        throw new Error(errorMessage);
    }

    return res.json();
};