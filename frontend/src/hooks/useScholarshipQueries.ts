import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { getAllScholars, getPublicScholars } from '../services/getScholarships'
import { deleteScholarship } from '../services/deleteScholarship'
import { archiveScholarship } from '../services/Archive'
import { updateExpiredScholarships } from '../services/updateExpiredScholarships'
import { createScholar } from '../services/createScholar'
import { updateScholar } from '../services/updateScholar'
import { getArchiveScholarships } from '../services/getArchiveScholarship'
import toast from 'react-hot-toast'
import { useAuth } from '../AuthProvider/AuthProvider'
import { useNavigate } from 'react-router-dom'

// ✅ Archive interface matching the service
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

// ✅ Optimized query keys for better cache management
export const scholarshipKeys = {
    all: ['scholarships'] as const,
    lists: () => [...scholarshipKeys.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...scholarshipKeys.lists(), { filters }] as const,
    details: () => [...scholarshipKeys.all, 'detail'] as const,
    detail: (id: string) => [...scholarshipKeys.details(), id] as const,
    archived: () => [...scholarshipKeys.all, 'archived'] as const,
    statistics: () => [...scholarshipKeys.all, 'statistics'] as const,
}

// ✅ Interface for scholarship data
export interface Scholarship {
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

// ✅ Filters interface for better type safety
export interface ScholarshipFilters {
    page?: number
    limit?: number
    status?: 'ACTIVE' | 'EXPIRED'
    type?: string
    search?: string
}

// ✅ Hook for fetching all scholarships with advanced filtering and caching
export const useScholarships = (filters: ScholarshipFilters = {}) => {
    return useQuery<Scholarship[], Error>({
        queryKey: scholarshipKeys.list(filters),
        queryFn: async () => {
            // Student-facing pages should use the public endpoint which returns only ACTIVE scholarships
            const response = await getPublicScholars(filters)
            return response.data
        },

        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
        retry: 2,
        refetchInterval: 1000 * 60 * 5,
        enabled: true,
    })
}


export const useInfiniteScholarships = (filters: ScholarshipFilters = {}) => {
    const { logout } = useAuth()
    const navigate = useNavigate()

    return useInfiniteQuery({
        queryKey: [...scholarshipKeys.lists(), 'infinite', filters],
        queryFn: async ({ pageParam }: { pageParam: number }) => {
            try {
                // This would be modified to support pagination in the backend
                const response = await getAllScholars({ ...filters, page: pageParam })
                const limit = filters.limit || 10
                const start = (pageParam - 1) * limit
                const end = start + limit

                return {
                    data: response.data.slice(start, end),
                    currentPage: pageParam,
                    hasNextPage: end < response.data.length,
                    totalCount: response.data.length
                }
            } catch (error: any) {
                if (error?.message?.includes('UNAUTHORIZED')) {
                    toast.error('Your session has expired. Please log in again.')
                    logout()
                    navigate('/login')
                    throw error
                }
                throw error
            }
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage: { hasNextPage: boolean; currentPage: number }) =>
            lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
    })
}


export const useArchivedScholarships = () => {
    const { logout } = useAuth()
    const navigate = useNavigate()

    return useQuery<Archive[]>({
        queryKey: scholarshipKeys.archived(),
        queryFn: async () => {
            try {
                const response = await getArchiveScholarships()
                return response
            } catch (error: any) {
                if (error.message?.includes('401') || error.message?.includes('UNAUTHORIZED')) {
                    toast.error('Session expired. Please login again.')
                    logout()
                    navigate('/login')
                    throw error
                }
                throw error
            }
        },

        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 15,
        refetchOnWindowFocus: false,
        retry: 2,
        enabled: true,
    })
}


export const useCreateScholarship = () => {
    const queryClient = useQueryClient()
    const { logout } = useAuth()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: createScholar,
        onMutate: async (newScholarship) => {

            await queryClient.cancelQueries({ queryKey: scholarshipKeys.lists() })

            const previousScholarships = queryClient.getQueryData(scholarshipKeys.lists())


            queryClient.setQueryData(scholarshipKeys.lists(), (old: Scholarship[] = []) => [
                {
                    id: `temp-${Date.now()}`,
                    ...newScholarship,
                    status: 'ACTIVE' as const,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    providerId: 'temp',
                },
                ...old,
            ])

            return { previousScholarships }
        },
        onError: (error: any, _newScholarship, context) => {

            if (context?.previousScholarships) {
                queryClient.setQueryData(scholarshipKeys.lists(), context.previousScholarships)
            }

            if (error?.message?.includes('UNAUTHORIZED')) {
                toast.error('Your session has expired. Please log in again.')
                logout()
                navigate('/login')
            } else {
                toast.error(error.message || 'Failed to create scholarship')
            }
        },
        onSuccess: (_data) => {
            toast.success('Scholarship created successfully!')

            queryClient.invalidateQueries({ queryKey: scholarshipKeys.lists() })
        },
        onSettled: () => {

            queryClient.invalidateQueries({ queryKey: scholarshipKeys.lists() })
        },
    })
}


export const useUpdateScholarship = () => {
    const queryClient = useQueryClient()
    const { logout } = useAuth()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateScholar(id, data),
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: scholarshipKeys.lists() })

            const previousScholarships = queryClient.getQueryData(scholarshipKeys.lists())

            // ✅ Optimistically update
            queryClient.setQueryData(scholarshipKeys.lists(), (old: Scholarship[] = []) =>
                old.map(scholarship =>
                    scholarship.id === id
                        ? { ...scholarship, ...data, updatedAt: new Date().toISOString() }
                        : scholarship
                )
            )

            return { previousScholarships }
        },
        onError: (error: any, _variables, context) => {
            if (context?.previousScholarships) {
                queryClient.setQueryData(scholarshipKeys.lists(), context.previousScholarships)
            }

            if (error?.message?.includes('UNAUTHORIZED')) {
                toast.error('Your session has expired. Please log in again.')
                logout()
                navigate('/login')
            } else {
                toast.error(error.message || 'Failed to update scholarship')
            }
        },
        onSuccess: () => {
            toast.success('Scholarship updated successfully!')
            queryClient.invalidateQueries({ queryKey: scholarshipKeys.lists() })
        },
    })
}

// ✅ Hook for deleting scholarships with optimistic updates
export const useDeleteScholarship = () => {
    const queryClient = useQueryClient()
    const { logout } = useAuth()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: deleteScholarship,
        onMutate: async (scholarshipId) => {
            await queryClient.cancelQueries({ queryKey: scholarshipKeys.lists() })

            const previousScholarships = queryClient.getQueryData(scholarshipKeys.lists())

            // ✅ Optimistically remove from cache
            queryClient.setQueryData(scholarshipKeys.lists(), (old: Scholarship[] = []) =>
                old.filter(scholarship => scholarship.id !== scholarshipId)
            )

            return { previousScholarships }
        },
        onError: (error: any, _scholarshipId, context) => {
            if (context?.previousScholarships) {
                queryClient.setQueryData(scholarshipKeys.lists(), context.previousScholarships)
            }

            if (error?.message?.includes('UNAUTHORIZED')) {
                toast.error('Your session has expired. Please log in again.')
                logout()
                navigate('/login')
            } else {
                toast.error(error.message || 'Failed to delete scholarship')
            }
        },
        onSuccess: () => {
            toast.success('Scholarship deleted successfully!')
            queryClient.invalidateQueries({ queryKey: scholarshipKeys.lists() })
        },
    })
}

// ✅ Hook for archiving scholarships
export const useArchiveScholarship = () => {
    const queryClient = useQueryClient()
    const { logout } = useAuth()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: archiveScholarship,
        onMutate: async (scholarshipId) => {
            await queryClient.cancelQueries({ queryKey: scholarshipKeys.lists() })

            const previousScholarships = queryClient.getQueryData(scholarshipKeys.lists())

            // ✅ Optimistically update status
            queryClient.setQueryData(scholarshipKeys.lists(), (old: Scholarship[] = []) =>
                old.map(scholarship =>
                    scholarship.id === scholarshipId
                        ? { ...scholarship, status: 'EXPIRED' as const, updatedAt: new Date().toISOString() }
                        : scholarship
                )
            )

            return { previousScholarships }
        },
        onError: (error: any, _scholarshipId, context) => {
            if (context?.previousScholarships) {
                queryClient.setQueryData(scholarshipKeys.lists(), context.previousScholarships)
            }

            if (error?.message?.includes('UNAUTHORIZED')) {
                toast.error('Your session has expired. Please log in again.')
                logout()
                navigate('/login')
            } else {
                toast.error(error.message || 'Failed to archive scholarship')
            }
        },
        onSuccess: () => {
            toast.success('Scholarship archived successfully!')
            queryClient.invalidateQueries({ queryKey: scholarshipKeys.lists() })
            queryClient.invalidateQueries({ queryKey: scholarshipKeys.archived() })
        },
    })
}

// ✅ Hook for updating expired scholarships
export const useUpdateExpiredScholarships = () => {
    const queryClient = useQueryClient()
    const { logout } = useAuth()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: updateExpiredScholarships,
        onError: (error: any) => {
            if (error?.message?.includes('UNAUTHORIZED')) {
                toast.error('Your session has expired. Please log in again.')
                logout()
                navigate('/login')
            } else {
                toast.error(error.message || 'Failed to update expired scholarships')
            }
        },
        onSuccess: () => {
            // ✅ Invalidate all scholarship queries to reflect status changes
            queryClient.invalidateQueries({ queryKey: scholarshipKeys.all })
        },
    })
}


export const usePrefetchScholarships = () => {
    const queryClient = useQueryClient()

    return (filters: ScholarshipFilters = {}) => {
        queryClient.prefetchQuery({
            queryKey: scholarshipKeys.list(filters),
            queryFn: () => getAllScholars(filters),
            staleTime: 1000 * 60 * 2,
        })
    }
}