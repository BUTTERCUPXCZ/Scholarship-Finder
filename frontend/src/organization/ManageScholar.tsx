import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider/AuthProvider'
import {
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
} from '../components/ui/sidebar'
import { Separator } from '../components/ui/separator'
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
    Bell,
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
    AlertTriangle
} from 'lucide-react'
import OrgSidebar from '../components/orgSidebar'
import ApplicationManagement from './ApplicationManagement'
import { useQuery } from '@tanstack/react-query'

// Mock data type for scholarships
interface Scholarship {
    id: string
    title: string
    description: string
    location: string
    benefits: string
    deadline: string
    applicationLink: string
    status: 'active' | 'archived' | 'expired'
    applicants: number
    createdAt: string
    isExpired: boolean
}

const ManageScholar = () => {
    const navigate = useNavigate()
    const { logout } = useAuth()

    // State management
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived' | 'expired'>('all')
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'deadline' | 'applicants' | 'name' | 'gpa'>('newest')
    const [isLoading, setIsLoading] = useState(false)

    // State for viewing applications
    const [viewingApplications, setViewingApplications] = useState<string | null>(null)

    // Mock scholarship data - In real app, this would come from an API
    const [scholarships, setScholarships] = useState<Scholarship[]>([
        {
            id: '1',
            title: 'Tech Innovation Scholarship',
            description: 'Supporting students pursuing computer science and engineering degrees with a focus on innovation and technology.',
            location: 'United States',
            benefits: '$5,000 annual award + mentorship program',
            deadline: '2025-10-15',
            applicationLink: 'https://example.com/apply/tech',
            status: 'active',
            applicants: 145,
            createdAt: '2025-08-15',
            isExpired: false
        },
        {
            id: '2',
            title: 'Global Leadership Fellowship',
            description: 'Empowering future leaders through education and international experience opportunities.',
            location: 'Global',
            benefits: '$10,000 + study abroad opportunity',
            deadline: '2025-09-01',
            applicationLink: 'https://example.com/apply/leadership',
            status: 'expired',
            applicants: 289,
            createdAt: '2025-06-20',
            isExpired: true
        },
        {
            id: '3',
            title: 'Women in STEM Scholarship',
            description: 'Encouraging women to pursue careers in Science, Technology, Engineering, and Mathematics.',
            location: 'Canada',
            benefits: '$3,000 + networking opportunities',
            deadline: '2025-12-01',
            applicationLink: 'https://example.com/apply/women-stem',
            status: 'active',
            applicants: 87,
            createdAt: '2025-09-01',
            isExpired: false
        },
        {
            id: '4',
            title: 'Community Service Award',
            description: 'Recognizing students who have made significant contributions to their communities.',
            location: 'Online',
            benefits: '$2,500 + community project funding',
            deadline: '2025-08-30',
            applicationLink: 'https://example.com/apply/community',
            status: 'archived',
            applicants: 234,
            createdAt: '2025-05-10',
            isExpired: true
        }
    ])

    // Fetch user data from localStorage using useQuery
    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => {
            const authData = localStorage.getItem('auth')
            if (authData) {
                try {
                    const parsed = JSON.parse(authData)
                    return parsed.user as { fullname?: string; email?: string } | null
                } catch (error) {
                    console.error('Error parsing auth data:', error)
                    return null
                }
            }
            return null
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    })

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    // Utility functions
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 border-green-200'
            case 'expired': return 'bg-red-100 text-red-800 border-red-200'
            case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle className="h-4 w-4" />
            case 'expired': return <XCircle className="h-4 w-4" />
            case 'archived': return <Archive className="h-4 w-4" />
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

    // Event handlers
    const handleEditScholarship = (id: string) => {
        // Navigate to edit page or open edit modal
        navigate(`/organization/edit-scholarship/${id}`)
    }

    const handleArchiveScholarship = async (id: string) => {
        setIsLoading(true)
        try {
            // In real app, make API call to archive scholarship
            setScholarships(prev =>
                prev.map(scholarship =>
                    scholarship.id === id
                        ? { ...scholarship, status: 'archived' as const }
                        : scholarship
                )
            )
        } catch (error) {
            console.error('Error archiving scholarship:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleViewApplications = (id: string) => {
        setViewingApplications(id)
    }

    const handleBackToScholarships = () => {
        setViewingApplications(null)
    }

    // Scholarship utility functions

    // Filter and sort scholarships
    const filteredAndSortedScholarships = scholarships
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
                    return b.applicants - a.applicants
                default:
                    return 0
            }
        })

    const getUserDisplayName = () => {
        return user?.fullname || user?.email || 'User'
    }
    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <OrgSidebar />

                <SidebarInset className="flex-1">
                    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Manage Scholarships</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Notification Bell */}
                            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <Bell className="size-5 text-gray-600" />
                            </button>

                            {/* User Dropdown */}
                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 text-white rounded-full cursor-pointer transition"
                                        style={{ backgroundColor: '#4F39F6' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3D2DB8'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4F39F6'}
                                    >
                                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-sm font-medium"
                                            style={{ color: '#4F39F6' }}
                                        >
                                            {getUserDisplayName().charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm">{getUserDisplayName()}</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuItem className="cursor-pointer">
                                            <span>Profile</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer">
                                            <span>Settings</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="cursor-pointer text-red-600 focus:text-red-600"
                                            onClick={handleLogout}
                                        >
                                            <span>Log out</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <button
                                    className="cursor-pointer px-8 py-2 text-white rounded-full transition"
                                    style={{ backgroundColor: '#4F39F6' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3D2DB8'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4F39F6'}
                                    onClick={() => navigate('/login')}
                                >
                                    Login
                                </button>
                            )}
                        </div>
                    </header>

                    <div className="flex flex-1 flex-col gap-6 p-6">
                        <div className="max-w-7xl mx-auto w-full">
                            {viewingApplications ? (
                                // Applications View using the component
                                <ApplicationManagement
                                    scholarshipId={viewingApplications}
                                    scholarshipTitle={scholarships.find(s => s.id === viewingApplications)?.title || 'Unknown Scholarship'}
                                    onBack={handleBackToScholarships}
                                />
                            ) : (
                                // Scholarships Grid View
                                <>
                                    {/* Header Section */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                        <div>
                                            <h1 className="text-3xl font-bold text-gray-900">Manage Scholarships</h1>
                                            <p className="text-gray-600 mt-1">Monitor, edit, and manage your posted scholarship opportunities</p>
                                        </div>
                                        <Button
                                            onClick={() => navigate('/organization/create-scholar')}
                                            className="text-white"
                                            style={{ backgroundColor: '#4F39F6' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3D2DB8'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4F39F6'}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create New Scholarship
                                        </Button>
                                    </div>

                                    {/* Statistics Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                                            <div className="flex items-center">
                                                <div className="p-2 rounded-lg" style={{ backgroundColor: '#E8E4FF' }}>
                                                    <CheckCircle className="h-6 w-6" style={{ color: '#4F39F6' }} />
                                                </div>
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-gray-600">Active</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {scholarships.filter(s => s.status === 'active').length}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-yellow-100 rounded-lg">
                                                    <Clock className="h-6 w-6 text-yellow-600" />
                                                </div>
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {scholarships.filter(s => s.status === 'active' && isDeadlineNear(s.deadline)).length}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-green-100 rounded-lg">
                                                    <Users className="h-6 w-6 text-green-600" />
                                                </div>
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-gray-600">Total Applicants</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {scholarships.reduce((sum, s) => sum + s.applicants, 0)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-gray-100 rounded-lg">
                                                    <Archive className="h-6 w-6 text-gray-600" />
                                                </div>
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-gray-600">Archived</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {scholarships.filter(s => s.status === 'archived').length}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Filters and Search */}
                                    <div className="bg-white p-4 rounded-lg border shadow-sm mb-6">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {/* Search */}
                                            <div className="flex-1">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        placeholder="Search scholarships..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="pl-9"
                                                    />
                                                </div>
                                            </div>

                                            {/* Status Filter */}
                                            <div className="flex gap-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" className="gap-2">
                                                            <Filter className="h-4 w-4" />
                                                            Status: {filterStatus === 'all' ? 'All' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                                                            All Scholarships
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setFilterStatus('active')}>
                                                            Active Only
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setFilterStatus('expired')}>
                                                            Expired Only
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setFilterStatus('archived')}>
                                                            Archived Only
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                                {/* Sort */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" className="gap-2">
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
                                            </div>
                                        </div>
                                    </div>

                                    {/* Scholarships Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {filteredAndSortedScholarships.length === 0 ? (
                                            <div className="col-span-full bg-white p-12 rounded-lg border shadow-sm text-center">
                                                <div className="max-w-md mx-auto">
                                                    <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                                                        <Search className="h-8 w-8 text-gray-400" />
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
                                                            onClick={() => navigate('/organization/create-scholar')}
                                                            className="text-white"
                                                            style={{ backgroundColor: '#4F39F6' }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3D2DB8'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4F39F6'}
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Create Your First Scholarship
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            filteredAndSortedScholarships.map((scholarship) => (
                                                <div key={scholarship.id} className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                                                    {/* Header with Title and Status */}
                                                    <div className="flex items-start justify-between gap-2 mb-4">
                                                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                                                            {scholarship.title}
                                                        </h3>
                                                        <div className="flex flex-col gap-1 items-end flex-shrink-0">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(scholarship.status)}`}>
                                                                {getStatusIcon(scholarship.status)}
                                                                {scholarship.status.charAt(0).toUpperCase() + scholarship.status.slice(1)}
                                                            </span>
                                                            {isDeadlineNear(scholarship.deadline) && scholarship.status === 'active' && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                                                    <AlertTriangle className="h-3 w-3" />
                                                                    Soon
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Description */}
                                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
                                                        {scholarship.description}
                                                    </p>

                                                    {/* Metadata */}
                                                    <div className="space-y-2 mb-4">
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                            <MapPin className="h-4 w-4 flex-shrink-0" />
                                                            <span className="truncate">{scholarship.location}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                            <DollarSign className="h-4 w-4 flex-shrink-0" />
                                                            <span className="truncate">{scholarship.benefits}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                            <Calendar className="h-4 w-4 flex-shrink-0" />
                                                            <span className="truncate">Deadline: {formatDate(scholarship.deadline)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                            <Users className="h-4 w-4 flex-shrink-0" />
                                                            <span>{scholarship.applicants} applicants</span>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex flex-col gap-2 mt-auto pt-4 border-t">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleViewApplications(scholarship.id)}
                                                            className="gap-2 w-full justify-center"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            View Applications
                                                        </Button>

                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleEditScholarship(scholarship.id)}
                                                                className="gap-2 flex-1 justify-center"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                                Edit
                                                            </Button>

                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="outline" size="sm" className="px-3">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    {scholarship.status !== 'archived' && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleArchiveScholarship(scholarship.id)}
                                                                            className="gap-2 text-amber-600 focus:text-amber-600"
                                                                        >
                                                                            <Archive className="h-4 w-4" />
                                                                            Archive
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="gap-2 text-red-600 focus:text-red-600"
                                                                    >
                                                                        <XCircle className="h-4 w-4" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Load More Button (if needed for pagination) */}
                                    {filteredAndSortedScholarships.length > 0 && (
                                        <div className="text-center mt-8">
                                            <Button variant="outline" disabled={isLoading}>
                                                {isLoading ? 'Loading...' : 'Load More Scholarships'}
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}

export default ManageScholar