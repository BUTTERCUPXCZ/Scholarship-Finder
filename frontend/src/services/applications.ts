// Application service for managing scholarship applications

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
}

interface ApplicationData {
    scholarshipId: string;
    personalStatement?: string;
    documents?: File[];
}

export const submitApplication = async (applicationData: ApplicationData): Promise<Application> => {
    const formData = new FormData();
    formData.append('scholarshipId', applicationData.scholarshipId);

    if (applicationData.personalStatement) {
        formData.append('personalStatement', applicationData.personalStatement);
    }

    if (applicationData.documents) {
        applicationData.documents.forEach((doc, index) => {
            formData.append(`documents[${index}]`, doc);
        });
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/applications/submit`, {
        method: 'POST',
        credentials: 'include',
        body: formData
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('UNAUTHORIZED');
        }

        let errorMessage = 'Failed to submit application';
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