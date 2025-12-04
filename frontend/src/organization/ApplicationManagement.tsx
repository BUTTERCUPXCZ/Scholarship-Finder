import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../AuthProvider/AuthProvider'
import toast from 'react-hot-toast'
import { getDownloadUrl, getDownloadUrlFromBackend } from '../services/supabaseStorage'
import {
    getScholarshipApplications,
    updateApplicationStatus,
    type BackendApplication,
    type ApplicationDocument
} from '../services/applications'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import {
    Search,
    Filter,
    Download,
    Send,
    MoreHorizontal,
    Check,
    X,
    Clock,
    Star,
    Users,
    MapPin,
    Mail,
    Phone,
    Calendar,
    ChevronLeft,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2
} from 'lucide-react'


interface Applicant {
    id: string
    name: string
    email: string
    phone: string
    status: 'pending' | 'under_review' | 'accepted' | 'rejected'
    location: string
    appliedDate: string
    documents: ApplicationDocument[]
    scholarshipId: string
    address: string
    city: string
    firstname: string
    lastname: string
    middlename?: string
}

interface ApplicationManagementProps {
    scholarshipId: string
    scholarshipTitle: string
    onBack: () => void
}

const ApplicationManagement = ({ scholarshipId, scholarshipTitle, onBack }: ApplicationManagementProps) => {
    const queryClient = useQueryClient()
    const { getToken } = useAuth()


    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'under_review' | 'accepted' | 'rejected'>('all')
    const [selectedApplicants, setSelectedApplicants] = useState<string[]>([])
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)


    const transformApplication = (app: BackendApplication): Applicant => ({
        id: app.id,
        name: `${app.Firstname} ${app.Middlename ? app.Middlename + ' ' : ''}${app.Lastname}`,
        email: app.Email,
        phone: app.Phone,
        status: app.status.toLowerCase() as 'pending' | 'under_review' | 'accepted' | 'rejected',
        location: `${app.City}, ${app.Address}`,
        appliedDate: app.submittedAt,
        documents: app.documents,
        scholarshipId: app.scholarshipId,
        address: app.Address,
        city: app.City,
        firstname: app.Firstname,
        lastname: app.Lastname,
        middlename: app.Middlename
    })


    const {
        data: backendApplications = [],
        isLoading,
        error,
        refetch
    } = useQuery<BackendApplication[], Error>({
        queryKey: ['scholarship-applications', scholarshipId],
        queryFn: async () => {
            const token = await getToken();
            return getScholarshipApplications(scholarshipId, token || undefined);
        },
        enabled: !!scholarshipId,
        staleTime: 1000 * 60 * 5,
        retry: 1
    })


    const applicants = backendApplications.map(transformApplication)

    // Update application status mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ applicationId, status }: { applicationId: string, status: 'PENDING' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' }) => {
            const token = await getToken();
            return updateApplicationStatus(applicationId, status, token || undefined);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scholarship-applications', scholarshipId] })
        },
        onError: (error: Error) => {
            console.error('Failed to update application status:', error)

        }
    })


    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'accepted': return 'bg-green-100 text-green-800 border-green-200'
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
            case 'under_review': return 'bg-blue-100 text-blue-800 border-blue-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="h-4 w-4" />
            case 'accepted': return <CheckCircle2 className="h-4 w-4" />
            case 'rejected': return <XCircle className="h-4 w-4" />
            case 'under_review': return <Star className="h-4 w-4" />
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


    const handleStatusChange = async (applicantId: string, newStatus: Applicant['status']) => {
        try {
            setUpdatingStatus(applicantId)
            const backendStatus = newStatus.toUpperCase() as 'PENDING' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED'
            await updateStatusMutation.mutateAsync({ applicationId: applicantId, status: backendStatus })
        } catch (error) {
            console.error('Error updating status:', error)

            alert('Failed to update application status. Please try again.')
        } finally {
            setUpdatingStatus(null)
        }
    }

    const handleDownloadDocument = async (documentFile: ApplicationDocument) => {
        try {
            console.log(`Downloading document: ${documentFile.filename}`)
            console.log(`Storage path: ${documentFile.storagePath}`)

            // First, try to get signed URL using the backend endpoint (more reliable)
            let signedUrl = await getDownloadUrlFromBackend(documentFile.storagePath)

            if (!signedUrl) {
                console.log('Backend download failed, trying direct Supabase client...')
                signedUrl = await getDownloadUrl(documentFile.storagePath)
            }

            if (!signedUrl) {
                console.log('Both methods failed, trying public URL...')
                // Fallback: try using the fileUrl directly if available
                if (documentFile.fileUrl) {
                    signedUrl = documentFile.fileUrl
                } else {
                    throw new Error('No download URL available')
                }
            }

            // Create download link
            const link = window.document.createElement('a')
            link.href = signedUrl
            link.download = documentFile.filename
            link.target = '_blank'

            // Trigger download
            window.document.body.appendChild(link)
            link.click()
            window.document.body.removeChild(link)

            toast.success(`Downloaded ${documentFile.filename}`)

        } catch (error) {
            console.error('Error downloading document:', error)
            toast.error('Failed to download document. Please try again or contact support.')
        }
    }

    const handleSendResponse = async (applicantIds: string[], responseType: 'under_review' | 'accepted' | 'rejected') => {
        try {
            const backendStatus = responseType.toUpperCase().replace('_', '_') as 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED'
            await Promise.all(
                applicantIds.map(id =>
                    updateStatusMutation.mutateAsync({ applicationId: id, status: backendStatus })
                )
            )
            setSelectedApplicants([])
        } catch (error) {
            console.error('Error sending response:', error)
        }
    }

    const handleSelectApplicant = (applicantId: string) => {
        setSelectedApplicants(prev =>
            prev.includes(applicantId)
                ? prev.filter(id => id !== applicantId)
                : [...prev, applicantId]
        )
    }

    const handleSelectAll = (filteredApplicants: Applicant[]) => {
        if (selectedApplicants.length === filteredApplicants.length) {
            setSelectedApplicants([])
        } else {
            setSelectedApplicants(filteredApplicants.map(a => a.id))
        }
    }


    const scholarshipApplicants = applicants


    const filteredAndSortedApplicants = scholarshipApplicants
        .filter((applicant: Applicant) => {
            const matchesSearch = applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                applicant.email.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesStatus = statusFilter === 'all' || applicant.status === statusFilter

            return matchesSearch && matchesStatus
        })
        .sort((a: Applicant, b: Applicant) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-lg">Loading applications...</span>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Applications</h3>
                        <p className="text-gray-600 mb-4">{error.message}</p>
                        <Button onClick={() => refetch()}>Try Again</Button>
                    </div>
                </div>
            </div>
        )
    }

    return (

        <>
            {/* Back Button Row */}
            <div className="mb-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onBack}
                    className="flex items-center gap-2 text-white bg-indigo-600 hover:bg-indigo-800 hover:text-white"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Scholarships
                </Button>
            </div>
            {/* Heading Row */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Application Management</h1>
                <p className="text-gray-600 mt-1">
                    Applications for "{scholarshipTitle}"
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Applications</p>
                            <p className="text-2xl font-bold text-gray-900">{scholarshipApplicants.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Pending Review</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {scholarshipApplicants.filter(a => a.status === 'pending').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Accepted</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {scholarshipApplicants.filter(a => a.status === 'accepted').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Star className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Under Review</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {scholarshipApplicants.filter((a: Applicant) => a.status === 'under_review').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-lg border shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search applicants..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {/* Status Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2 border-2"

                                >
                                    <Filter className="h-4 w-4" />
                                    Status: {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Applications</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending Only</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('under_review')}>Under Review Only</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('accepted')}>Accepted Only</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('rejected')}>Rejected Only</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Bulk Actions */}
                        {selectedApplicants.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="gap-2 border-2" disabled={updateStatusMutation.isPending}
                                        style={{ borderColor: '#4F39F6', color: '#4F39F6' }}
                                        onMouseEnter={(e) => {
                                            if (!updateStatusMutation.isPending) {
                                                e.currentTarget.style.backgroundColor = '#4F39F6'
                                                e.currentTarget.style.color = 'white'
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!updateStatusMutation.isPending) {
                                                e.currentTarget.style.backgroundColor = 'transparent'
                                                e.currentTarget.style.color = '#4F39F6'
                                            }
                                        }}
                                    >
                                        <Send className="h-4 w-4" />
                                        {updateStatusMutation.isPending ? 'Sending...' : `Send Response (${selectedApplicants.length})`}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleSendResponse(selectedApplicants, 'under_review')}>Under Review</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSendResponse(selectedApplicants, 'accepted')}>Congratulations</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSendResponse(selectedApplicants, 'rejected')}>Thank You</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </div>

            {/* Applicants Table */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                {filteredAndSortedApplicants.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                                <Users className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                            <p className="text-gray-600">No applications match your current filters</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedApplicants.length === filteredAndSortedApplicants.length && filteredAndSortedApplicants.length > 0}
                                            onChange={() => handleSelectAll(filteredAndSortedApplicants)}
                                            className="rounded border-gray-300"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>

                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredAndSortedApplicants.map((applicant) => (
                                    <tr key={applicant.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedApplicants.includes(applicant.id)}
                                                onChange={() => handleSelectApplicant(applicant.id)}
                                                className="rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{applicant.name}</div>
                                                <div className="text-sm text-gray-500 flex items-center gap-4">
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {applicant.email}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {applicant.phone}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {applicant.location}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 ${getStatusColor(applicant.status)}`}
                                                        disabled={updatingStatus === applicant.id}
                                                    >
                                                        {updatingStatus === applicant.id ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            getStatusIcon(applicant.status)
                                                        )}
                                                        {applicant.status === 'under_review' ? 'Under Review' : applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusChange(applicant.id, 'pending')}
                                                        className="gap-2"
                                                        disabled={updatingStatus === applicant.id}
                                                    >
                                                        <Clock className="h-4 w-4 text-yellow-600" />
                                                        Pending
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusChange(applicant.id, 'under_review')}
                                                        className="gap-2"
                                                        disabled={updatingStatus === applicant.id}
                                                    >
                                                        <Star className="h-4 w-4 text-blue-600" />
                                                        Under Review
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusChange(applicant.id, 'accepted')}
                                                        className="gap-2"
                                                        disabled={updatingStatus === applicant.id}
                                                    >
                                                        <Check className="h-4 w-4 text-green-600" />
                                                        Accept
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusChange(applicant.id, 'rejected')}
                                                        className="gap-2"
                                                        disabled={updatingStatus === applicant.id}
                                                    >
                                                        <X className="h-4 w-4 text-red-600" />
                                                        Reject
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                                                <span className="text-sm text-gray-900">{applicant.location}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                                                <span className="text-sm text-gray-900">{formatDate(applicant.appliedDate)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">


                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="sm" className="border-2"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {applicant.documents.map((document, index) => (
                                                            <DropdownMenuItem
                                                                key={index}
                                                                onClick={() => handleDownloadDocument(document)}
                                                                className="gap-2"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                                Download {document.filename}
                                                            </DropdownMenuItem>
                                                        ))}
                                                        <DropdownMenuSeparator />
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Summary */}
            {filteredAndSortedApplicants.length > 0 && (
                <div className="mt-4 text-sm text-gray-600 text-center">
                    Showing {filteredAndSortedApplicants.length} of {scholarshipApplicants.length} applications
                    {selectedApplicants.length > 0 && (
                        <span className="ml-2 font-medium">
                            • {selectedApplicants.length} selected
                        </span>
                    )}
                </div>
            )}
        </>
    )
}

export default ApplicationManagement