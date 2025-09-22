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

interface PaginationInfo {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrev: boolean
}

interface ScholarshipResponse {
    success: boolean
    data: Scholarship[]
    pagination?: PaginationInfo
}

interface ScholarshipFilters {
    page?: number
    limit?: number
    status?: 'ACTIVE' | 'EXPIRED'
    type?: string
    search?: string
}

export const getAllScholars = async (filters: ScholarshipFilters = {}): Promise<ScholarshipResponse> => {
    const queryParams = new URLSearchParams();

    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.search) queryParams.append('search', filters.search);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/scholar/get-scholars?${queryParams}`, {
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

    return await response.json();
}

// Keep the old function for backward compatibility (without filters)
export const getScholarships = async (): Promise<Scholarship[]> => {
    const response = await getAllScholars();
    return response.data;
}