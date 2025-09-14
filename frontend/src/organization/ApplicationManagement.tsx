import { useState } from 'react'
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
    Eye,
    Check,
    X,
    Clock,
    Star,
    Users,
    GraduationCap,
    MapPin,
    Mail,
    Phone,
    FileText,
    Calendar,
    ChevronLeft,
    CheckCircle2,
    XCircle,
    AlertTriangle
} from 'lucide-react'

// Types for applicant data
interface Applicant {
    id: string
    name: string
    email: string
    phone: string
    status: 'pending' | 'accepted' | 'rejected' | 'shortlisted'
    location: string
    university: string
    appliedDate: string
    documents: {
        resume: string
        transcript: string
        coverLetter: string
        recommendations: string[]
    }
    scholarshipId: string
}

interface ApplicationManagementProps {
    scholarshipId: string
    scholarshipTitle: string
    onBack: () => void
}

const ApplicationManagement = ({ scholarshipId, scholarshipTitle, onBack }: ApplicationManagementProps) => {
    // State management
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'shortlisted'>('all')
    const [selectedApplicants, setSelectedApplicants] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Mock applicant data - In real app, this would come from an API
    const applicants: Applicant[] = [
        {
            id: '1',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@email.com',
            phone: '+1 (555) 123-4567',
            status: 'pending',
            location: 'California, USA',
            university: 'Stanford University',
            appliedDate: '2025-09-10',
            scholarshipId: '1',
            documents: {
                resume: 'sarah_resume.pdf',
                transcript: 'sarah_transcript.pdf',
                coverLetter: 'sarah_cover.pdf',
                recommendations: ['prof_smith_rec.pdf', 'prof_davis_rec.pdf']
            }
        },
        {
            id: '2',
            name: 'Michael Chen',
            email: 'michael.chen@email.com',
            phone: '+1 (555) 987-6543',
            status: 'shortlisted',
            location: 'New York, USA',
            university: 'MIT',
            appliedDate: '2025-09-08',
            scholarshipId: '1',
            documents: {
                resume: 'michael_resume.pdf',
                transcript: 'michael_transcript.pdf',
                coverLetter: 'michael_cover.pdf',
                recommendations: ['prof_wong_rec.pdf']
            }
        },
        {
            id: '3',
            name: 'Emily Rodriguez',
            email: 'emily.rodriguez@email.com',
            phone: '+1 (555) 456-7890',
            status: 'accepted',
            location: 'Texas, USA',
            university: 'University of Texas',
            appliedDate: '2025-09-12',
            scholarshipId: '1',
            documents: {
                resume: 'emily_resume.pdf',
                transcript: 'emily_transcript.pdf',
                coverLetter: 'emily_cover.pdf',
                recommendations: ['prof_garcia_rec.pdf', 'prof_kim_rec.pdf']
            }
        },
        {
            id: '4',
            name: 'David Wilson',
            email: 'david.wilson@email.com',
            phone: '+1 (555) 234-5678',
            status: 'rejected',
            location: 'Florida, USA',
            university: 'University of Florida',
            appliedDate: '2025-09-05',
            scholarshipId: '2',
            documents: {
                resume: 'david_resume.pdf',
                transcript: 'david_transcript.pdf',
                coverLetter: 'david_cover.pdf',
                recommendations: ['prof_brown_rec.pdf']
            }
        },
        {
            id: '5',
            name: 'Aisha Patel',
            email: 'aisha.patel@email.com',
            phone: '+1 (555) 345-6789',
            status: 'pending',
            location: 'Washington, USA',
            university: 'University of Washington',
            appliedDate: '2025-09-11',
            scholarshipId: '1',
            documents: {
                resume: 'aisha_resume.pdf',
                transcript: 'aisha_transcript.pdf',
                coverLetter: 'aisha_cover.pdf',
                recommendations: ['prof_lee_rec.pdf', 'prof_taylor_rec.pdf']
            }
        }
    ]

    // Utility functions
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'accepted': return 'bg-green-100 text-green-800 border-green-200'
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
            case 'shortlisted': return 'bg-blue-100 text-blue-800 border-blue-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="h-4 w-4" />
            case 'accepted': return <CheckCircle2 className="h-4 w-4" />
            case 'rejected': return <XCircle className="h-4 w-4" />
            case 'shortlisted': return <Star className="h-4 w-4" />
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

    // Event handlers
    const handleStatusChange = async (applicantId: string, newStatus: Applicant['status']) => {
        setIsLoading(true)
        try {
            console.log(`Updating applicant ${applicantId} status to ${newStatus}`)
            // In real app, make API call to update status
        } catch (error) {
            console.error('Error updating status:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDownloadDocument = (applicantId: string, documentType: string, fileName: string) => {
        console.log(`Downloading ${documentType} for applicant ${applicantId}: ${fileName}`)
        const link = document.createElement('a')
        link.href = '#'
        link.download = fileName
        link.click()
    }

    const handleSendResponse = async (applicantIds: string[], responseType: 'review' | 'accepted' | 'rejected') => {
        setIsLoading(true)
        try {
            console.log(`Sending ${responseType} response to applicants:`, applicantIds)
            alert(`Response sent to ${applicantIds.length} applicant(s)`)
        } catch (error) {
            console.error('Error sending response:', error)
        } finally {
            setIsLoading(false)
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

    // Get applicants for the current scholarship
    const scholarshipApplicants = applicants.filter(applicant => applicant.scholarshipId === scholarshipId)

    // Filter and sort applicants
    const filteredAndSortedApplicants = scholarshipApplicants
        .filter(applicant => {
            const matchesSearch = applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                applicant.email.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesStatus = statusFilter === 'all' || applicant.status === statusFilter

            return matchesSearch && matchesStatus
        })
        .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())

    return (

        <>
            {/* Back Button Row */}
            <div className="mb-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onBack}
                    className="gap-2 border-2"
                    style={{ borderColor: '#4F39F6', color: '#4F39F6' }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#4F39F6'
                        e.currentTarget.style.color = 'white'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#4F39F6'
                    }}
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
                            <p className="text-sm font-medium text-gray-600">Shortlisted</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {scholarshipApplicants.filter(a => a.status === 'shortlisted').length}
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
                                    style={{ borderColor: '#4F39F6', color: '#4F39F6' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#4F39F6'
                                        e.currentTarget.style.color = 'white'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                        e.currentTarget.style.color = '#4F39F6'
                                    }}
                                >
                                    <Filter className="h-4 w-4" />
                                    Status: {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Applications</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending Only</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('shortlisted')}>Shortlisted Only</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('accepted')}>Accepted Only</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter('rejected')}>Rejected Only</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Bulk Actions */}
                        {selectedApplicants.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="gap-2 border-2" disabled={isLoading}
                                        style={{ borderColor: '#4F39F6', color: '#4F39F6' }}
                                        onMouseEnter={(e) => {
                                            if (!isLoading) {
                                                e.currentTarget.style.backgroundColor = '#4F39F6'
                                                e.currentTarget.style.color = 'white'
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isLoading) {
                                                e.currentTarget.style.backgroundColor = 'transparent'
                                                e.currentTarget.style.color = '#4F39F6'
                                            }
                                        }}
                                    >
                                        <Send className="h-4 w-4" />
                                        {isLoading ? 'Sending...' : `Send Response (${selectedApplicants.length})`}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleSendResponse(selectedApplicants, 'review')}>Under Review</DropdownMenuItem>
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
                                                    <GraduationCap className="h-3 w-3" />
                                                    {applicant.university}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 ${getStatusColor(applicant.status)}`}>
                                                        {getStatusIcon(applicant.status)}
                                                        {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    <DropdownMenuItem onClick={() => handleStatusChange(applicant.id, 'pending')} className="gap-2">
                                                        <Clock className="h-4 w-4 text-yellow-600" />
                                                        Pending
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(applicant.id, 'shortlisted')} className="gap-2">
                                                        <Star className="h-4 w-4 text-blue-600" />
                                                        Shortlist
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(applicant.id, 'accepted')} className="gap-2">
                                                        <Check className="h-4 w-4 text-green-600" />
                                                        Accept
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(applicant.id, 'rejected')} className="gap-2">
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
                                                <Button variant="outline" size="sm" className="gap-1 border-2"
                                                    style={{ borderColor: '#4F39F6', color: '#4F39F6' }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#4F39F6'
                                                        e.currentTarget.style.color = 'white'
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent'
                                                        e.currentTarget.style.color = '#4F39F6'
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    View
                                                </Button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="sm" className="border-2"
                                                            style={{ borderColor: '#4F39F6', color: '#4F39F6' }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#4F39F6'
                                                                e.currentTarget.style.color = 'white'
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = 'transparent'
                                                                e.currentTarget.style.color = '#4F39F6'
                                                            }}
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleDownloadDocument(applicant.id, 'resume', applicant.documents.resume)} className="gap-2">
                                                            <Download className="h-4 w-4" />
                                                            Download Resume
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDownloadDocument(applicant.id, 'transcript', applicant.documents.transcript)} className="gap-2">
                                                            <Download className="h-4 w-4" />
                                                            Download Transcript
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDownloadDocument(applicant.id, 'cover', applicant.documents.coverLetter)} className="gap-2">
                                                            <FileText className="h-4 w-4" />
                                                            Cover Letter
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleSendResponse([applicant.id], 'review')} className="gap-2">
                                                            <Send className="h-4 w-4" />
                                                            Send Response
                                                        </DropdownMenuItem>
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