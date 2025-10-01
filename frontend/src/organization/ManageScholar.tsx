import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider/AuthProvider'
import {
    SidebarProvider,
    SidebarInset,
} from '../components/ui/sidebar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import {
    Search,
    Edit,
    Archive,
    Eye,
    MoreHorizontal,
    Calendar,
    MapPin,
    DollarSign,
    Users,
    Filter,
    SortDesc,
    Plus,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
} from 'lucide-react'
import OrgSidebar from '../components/orgSidebar'
import Navbar from '../components/Navbar'
import ApplicationManagement from './ApplicationManagement'
import EditModalForm from '../components/Editmodalform'
import CreateScholarshipModal from '../components/CreateScholarshipModal'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllScholars } from '../services/getScholarships'
import { deleteScholarship } from '../services/deleteScholarship'
import { archiveScholarship } from '../services/Archive'
import { updateExpiredScholarships } from '../services/updateExpiredScholarships'
import toast from 'react-hot-toast'

// Interface matching backend schema
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

const ManageScholar = () => {
    const navigate = useNavigate()
    const { logout, isAuthenticated, isLoading: authLoading } = useAuth()
    const queryClient = useQueryClient()

    // State management
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'ACTIVE' | 'EXPIRED'>('all')
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'deadline' | 'applicants' | 'name' | 'gpa'>('newest')

    // State for viewing applications
    const [viewingApplications, setViewingApplications] = useState<string | null>(null)

    // State for edit modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null)

    // State for create scholarship modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    // Fetch scholarships using TanStack Query
    const {
        data: scholarships = [],
        isLoading,
        error,
        refetch
    } = useQuery<Scholarship[], Error>({
        queryKey: ['scholarships'],
        queryFn: async () => {
            try {
                const response = await getAllScholars()
                return response.data
            } catch (error: any) {
                // Handle authentication errors
                if (error?.message?.includes('UNAUTHORIZED')) {
                    toast.error('Your session has expired. Please log in again.')
                    logout()
                    navigate('/login')
                    throw error
                }
                // For other errors, show generic message and re-throw
                toast.error('Failed to load scholarships. Please try again.')
                throw error
            }
        },
        enabled: isAuthenticated, // Only run query if authenticated
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error: any) => {
            // If it's an auth error, don't retry
            if (error?.message?.includes('UNAUTHORIZED')) {
                return false
            }
            // For other errors, retry up to 3 times
            return failureCount < 3
        }
    })

    // Redirect to login if not authenticated - only run once when auth state changes
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            toast.error('Please log in to access this page')
            navigate('/login', { replace: true })
        }
    }, [isAuthenticated, authLoading, navigate])

    // Delete scholarship mutation
    const deleteScholarshipMutation = useMutation({
        mutationFn: (id: string) =>
            deleteScholarship(id),
        onSuccess: (data) => {
            // Invalidate and refetch scholarships list
            queryClient.invalidateQueries({ queryKey: ['scholarships'] })
            // Show success message
            toast.success(data.message || 'Scholarship deleted successfully')
        },
        onError: (error: Error) => {
            // Handle authentication errors
            if (error?.message?.includes('UNAUTHORIZED')) {
                toast.error('Your session has expired. Please log in again.')
                logout()
                navigate('/login')
            } else {
                toast.error(error.message || 'Failed to delete scholarship')
            }
        },
    })

    // Archive scholarship mutation
    const archiveScholarshipMutation = useMutation({
        mutationFn: (id: string) =>
            archiveScholarship(id),
        onSuccess: (data) => {
            // Invalidate and refetch scholarships list
            queryClient.invalidateQueries({ queryKey: ['scholarships'] })
            // Show success message
            toast.success(data.message || 'Scholarship archived successfully')
        },
        onError: (error: Error) => {
            // Handle authentication errors
            if (error?.message?.includes('UNAUTHORIZED')) {
                toast.error('Your session has expired. Please log in again.')
                logout()
                navigate('/login')
            } else {
                toast.error(error.message || 'Failed to archive scholarship')
            }
        },
    })

    // Update expired scholarships mutation
    const updateExpiredMutation = useMutation({
        mutationFn: () =>
            updateExpiredScholarships(),
        onSuccess: (data) => {
            // Invalidate and refetch scholarships list to show updated statuses
            queryClient.invalidateQueries({ queryKey: ['scholarships'] })
            // Show success message if any scholarships were updated
            if (data.count > 0) {
                toast.success(`${data.count} scholarship(s) marked as expired`)
            }
        },
        onError: (error: Error) => {
            // Handle authentication errors
            if (error?.message?.includes('UNAUTHORIZED')) {
                toast.error('Your session has expired. Please log in again.')
                logout()
                navigate('/login')
            } else {
                toast.error(error.message || 'Failed to update expired scholarships')
            }
        },
    })

    // Function to manually check for expired scholarships
    const handleCheckExpired = () => {
        updateExpiredMutation.mutate()
    }

    // Function to check if a scholarship is expired (client-side check)
    const isScholarshipExpired = (deadline: string) => {
        return new Date(deadline) < new Date()
    }

    // Utility functions - updated to work with backend data
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200'
            case 'EXPIRED': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ACTIVE': return <CheckCircle className="h-4 w-4" />
            case 'EXPIRED': return <XCircle className="h-4 w-4" />
            default: return <AlertTriangle className="h-4 w-4" />
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const isDeadlineNear = (deadline: string) => {
        const deadlineDate = new Date(deadline)
        const today = new Date()
        const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
        return daysUntilDeadline <= 7 && daysUntilDeadline > 0
    }

    const handleDeleteScholarship = async (id: string) => {
        // Show confirmation dialog
        if (window.confirm('Are you sure you want to delete this scholarship? This action cannot be undone.')) {
            deleteScholarshipMutation.mutate(id)
        }
    }

    // Event handlers
    const handleEditScholarship = (scholarship: Scholarship) => {
        setSelectedScholarship(scholarship)
        setIsEditModalOpen(true)
    }

    const handleEditSuccess = () => {
        // Invalidate and refetch scholarships data after successful edit
        queryClient.invalidateQueries({ queryKey: ['scholarships'] })
    }

    const handleArchiveScholarship = async (id: string) => {
        // Show confirmation dialog
        if (window.confirm('Are you sure you want to archive this scholarship? It will be moved to the archive and no longer visible to applicants.')) {
            try {
                await archiveScholarshipMutation.mutateAsync(id)
            } catch (error) {
                console.error('Error archiving scholarship:', error)
                // Error handling is already done in the mutation's onError callback
            }
        }
    }

    const handleViewApplications = (id: string) => {
        setViewingApplications(id)
    }

    const handleBackToScholarships = () => {
        setViewingApplications(null)
    }

    // Filter and sort scholarships - updated for backend data
    const filteredAndSortedScholarships = (scholarships || [])
        .filter(scholarship => {
            const matchesSearch = scholarship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                scholarship.description.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesFilter = filterStatus === 'all' || scholarship.status === filterStatus
            return matchesSearch && matchesFilter
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                case 'deadline':
                    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
                case 'applicants':
                    return (b.applications?.length || 0) - (a.applications?.length || 0)
                default:
                    return 0
            }
        })

    const LoadingContent = () => (
        <div className="flex items-center justify-center min-h-[60vh] bg-white">
            <div className="flex flex-col items-center space-y-6">
                {/* Spinner */}
                <div className="relative">
                    <div className="h-24 w-24 rounded-full border-4 border-gray-200"></div>
                    <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-4 border-t-indigo-500 border-r-indigo-400 animate-spin"></div>
                </div>

                {/* Loading text */}
                <p className="text-lg font-medium text-gray-700 animate-pulse">
                    Loading scholarships...
                </p>
            </div>
        </div>
    )

    const ErrorContent = () => (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="border-red-200 bg-red-50 shadow-lg max-w-md">
                <CardContent className="p-8 text-center">
                    <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading scholarships</h2>
                    <p className="text-gray-600 mb-4">Something went wrong. Please try again.</p>
                    <Button onClick={() => refetch()} className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        </div>
    )

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <OrgSidebar />

                <SidebarInset className="flex-1 overflow-hidden">
                    <Navbar showSidebarToggle={true} pageTitle="Manage Scholarships" />

                    <div className="flex flex-1 flex-col gap-6 p-6 bg-gray-50 overflow-y-auto">
                        <div className="max-w-7xl mx-auto w-full">
                            {isLoading ? (
                                <LoadingContent />
                            ) : error ? (
                                <ErrorContent />
                            ) : viewingApplications ? (
                                // Applications View using the component
                                <ApplicationManagement
                                    scholarshipId={viewingApplications}
                                    scholarshipTitle={(scholarships || []).find(s => s.id === viewingApplications)?.title || 'Unknown Scholarship'}
                                    onBack={handleBackToScholarships}
                                />
                            ) : (
                                // Scholarships Grid View
                                <>
                                    {/* Header Section */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <h1 className="text-3xl font-bold text-gray-900">Manage Scholarships</h1>
                                                <p className="text-gray-600 mt-1">Monitor, edit, and manage your posted scholarship opportunities</p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => setIsCreateModalOpen(true)}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create New Scholarship
                                        </Button>
                                    </div>

                                    {/* Statistics Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                        <Card className="border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
                                            <CardContent className="p-6">
                                                <div className="flex items-center">

                                                    <div className="ml-4">
                                                        <p className="text-sm font-medium text-gray-600">Active</p>
                                                        <p className="text-2xl font-bold text-gray-900">
                                                            {(scholarships || []).filter(s => s.status === 'ACTIVE').length}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
                                            <CardContent className="p-6">
                                                <div className="flex items-center">
                                                    <div className="ml-4">
                                                        <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                                                        <p className="text-2xl font-bold text-gray-900">
                                                            {(scholarships || []).filter(s => s.status === 'ACTIVE' && isDeadlineNear(s.deadline)).length}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
                                            <CardContent className="p-6">
                                                <div className="flex items-center">

                                                    <div className="ml-4">
                                                        <p className="text-sm font-medium text-gray-600">Total Applicants</p>
                                                        <p className="text-2xl font-bold text-gray-900">
                                                            {(scholarships || []).reduce((sum, s) => sum + (s.applications?.length || 0), 0)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
                                            <CardContent className="p-6">
                                                <div className="flex items-center">

                                                    <div className="ml-4">
                                                        <p className="text-sm font-medium text-gray-600">Expired</p>
                                                        <p className="text-2xl font-bold text-gray-900">
                                                            {(scholarships || []).filter(s => s.status === 'EXPIRED').length}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Filters and Search */}
                                    <Card className="border-gray-200 bg-white shadow-sm mb-6">
                                        <CardContent className="p-4">
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                {/* Search */}
                                                <div className="flex-1">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                        <Input
                                                            placeholder="Search scholarships..."
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                            className="pl-9 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Status Filter */}
                                                <div className="flex gap-2">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" className="gap-2 border-gray-200 rounded-xl">
                                                                <Filter className="h-4 w-4" />
                                                                Status: {filterStatus === 'all' ? 'All' : filterStatus}
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                                                                All Scholarships
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setFilterStatus('ACTIVE')}>
                                                                Active Only
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setFilterStatus('EXPIRED')}>
                                                                Expired Only
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>

                                                    {/* Sort */}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" className="gap-2 border-gray-200 rounded-xl">
                                                                <SortDesc className="h-4 w-4" />
                                                                Sort
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => setSortBy('newest')}>
                                                                Newest First
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                                                                Oldest First
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setSortBy('deadline')}>
                                                                By Deadline
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setSortBy('applicants')}>
                                                                Most Applicants
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>

                                                    {/* Check Expired Button */}
                                                    <Button
                                                        variant="outline"
                                                        className="gap-2 border-gray-200 rounded-xl"
                                                        onClick={handleCheckExpired}
                                                        disabled={updateExpiredMutation.isPending}
                                                    >
                                                        <Clock className="h-4 w-4" />
                                                        {updateExpiredMutation.isPending ? 'Checking...' : 'Check Expired'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Scholarships Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {filteredAndSortedScholarships.length === 0 ? (
                                            <div className="col-span-full">
                                                <Card className="border-gray-200 bg-white shadow-sm">
                                                    <CardContent className="p-12 text-center">
                                                        <div className="max-w-md mx-auto">
                                                            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                                                <Search className="h-10 w-10 text-indigo-600" />
                                                            </div>
                                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No scholarships found</h3>
                                                            <p className="text-gray-600 mb-6">
                                                                {searchTerm || filterStatus !== 'all'
                                                                    ? 'Try adjusting your search or filter criteria'
                                                                    : 'Get started by creating your first scholarship'
                                                                }
                                                            </p>
                                                            {!searchTerm && filterStatus === 'all' && (
                                                                <Button
                                                                    onClick={() => setIsCreateModalOpen(true)}
                                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg"
                                                                >
                                                                    <Plus className="h-4 w-4 mr-2" />
                                                                    Create Your First Scholarship
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        ) : (
                                            filteredAndSortedScholarships.map((scholarship) => {
                                                const isExpired = isScholarshipExpired(scholarship.deadline)
                                                const isNearDeadline = isDeadlineNear(scholarship.deadline)

                                                return (
                                                    <Card key={scholarship.id} className={`bg-white border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full ${isExpired && scholarship.status === 'ACTIVE' ? 'border-red-200 bg-red-50' : ''}`}>
                                                        {/* Header with Title and Status */}
                                                        <CardHeader className="pb-4">
                                                            <div className="flex items-start justify-between gap-2 mb-4">
                                                                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                                                                    {scholarship.title}
                                                                </h3>
                                                                <div className="flex flex-col gap-1 items-end flex-shrink-0">
                                                                    {/* Status badge - show "Deadline Passed" if expired, otherwise show normal status */}
                                                                    {isExpired && scholarship.status === 'ACTIVE' ? (
                                                                        <Badge className="bg-red-100 text-red-800 border-red-200 border-0 px-3 py-1 rounded-full">
                                                                            <XCircle className="h-3 w-3 mr-1" />
                                                                            Deadline Passed
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge className={`border-0 px-3 py-1 rounded-full ${getStatusColor(scholarship.status)}`}>
                                                                            {getStatusIcon(scholarship.status)}
                                                                            <span className="ml-1">{scholarship.status}</span>
                                                                        </Badge>
                                                                    )}

                                                                    {/* Near deadline indicator - only show if not expired */}
                                                                    {isNearDeadline && scholarship.status === 'ACTIVE' && !isExpired && (
                                                                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 border-0 px-2 py-1 rounded-full text-xs">
                                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                                            Soon
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CardHeader>

                                                        <CardContent className="flex-1 pb-4 space-y-4">
                                                            {/* Description */}
                                                            <p className="text-gray-600 text-sm line-clamp-3 flex-grow">
                                                                {scholarship.description}
                                                            </p>

                                                            {/* Metadata */}
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                    <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                                                    <span className="truncate">{scholarship.location}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                    <DollarSign className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                                                    <span className="truncate">{scholarship.benefits}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                    <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                                                    <span className="truncate">Deadline: {formatDate(scholarship.deadline)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                    <Users className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                                                    <span>{scholarship.applications?.length || 0} applicants</span>
                                                                </div>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-gray-100">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleViewApplications(scholarship.id)}
                                                                    className="gap-2 w-full justify-center border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                    View Applications
                                                                </Button>

                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleEditScholarship(scholarship)}
                                                                        className="gap-2 flex-1 justify-center border-gray-200 rounded-lg"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                        Edit
                                                                    </Button>

                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="outline" size="sm" className="px-3 border-gray-200 rounded-lg">
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleArchiveScholarship(scholarship.id)}
                                                                                className="gap-2 text-amber-600 focus:text-amber-600"
                                                                                disabled={archiveScholarshipMutation.isPending}
                                                                            >
                                                                                <Archive className="h-4 w-4" />
                                                                                {archiveScholarshipMutation.isPending ? 'Archiving...' : 'Archive'}
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleDeleteScholarship(scholarship.id)}
                                                                                className="gap-2 text-red-600 focus:text-red-600"
                                                                                disabled={deleteScholarshipMutation.isPending}
                                                                            >
                                                                                <XCircle className="h-4 w-4" />
                                                                                {deleteScholarshipMutation.isPending &&
                                                                                    deleteScholarshipMutation.variables === scholarship.id
                                                                                    ? 'Deleting...'
                                                                                    : 'Delete'
                                                                                }
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )
                                            })
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </SidebarInset>
            </div>

            {/* Edit Modal */}
            <EditModalForm
                isOpen={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                scholarship={selectedScholarship}
                onSuccess={handleEditSuccess}
            />

            <CreateScholarshipModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </SidebarProvider>
    )
}

export default ManageScholar