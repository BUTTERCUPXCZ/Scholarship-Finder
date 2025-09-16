import React, { useState } from 'react'
import { SidebarProvider, SidebarInset } from '../components/ui/sidebar'
import { Button } from '../components/ui/button'
import OrgSidebar from '../components/orgSidebar'
import Navbar from '../components/Navbar'
import { useArchivedScholarships } from '../hooks/useScholarshipQueries'
import { useOptimizedFilter, useDebounce } from '../hooks/useOptimizations'
import toast from 'react-hot-toast'
import {
    Archive as ArchiveIcon,
    RotateCcw,
    Trash2,
    Search,
    Calendar,
    Users
} from 'lucide-react'

// Archive interface matching the API response
interface ArchiveScholarship {
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

const Archive: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedScholarships, setSelectedScholarships] = useState<string[]>([])
    // ✅ Use TanStack Query for optimized data fetching
    const {
        data: archivedScholarships = [],
        isLoading: loading,
        error: queryError,
        refetch
    } = useArchivedScholarships()

    // ✅ Use debounced search for better performance  
    const debouncedSearchTerm = useDebounce(searchTerm, 300)

    // ✅ Optimized filtering with memoization
    const filteredScholarships = useOptimizedFilter(
        archivedScholarships,
        (scholarship: ArchiveScholarship) => {
            const searchLower = debouncedSearchTerm.toLowerCase()
            const matchesSearch = !debouncedSearchTerm ||
                scholarship.title.toLowerCase().includes(searchLower) ||
                scholarship.description.toLowerCase().includes(searchLower) ||
                scholarship.location.toLowerCase().includes(searchLower) ||
                scholarship.type.toLowerCase().includes(searchLower)

            const matchesStatus = statusFilter === 'all' ||
                scholarship.originalStatus.toLowerCase() === statusFilter

            return matchesSearch && matchesStatus
        },
        [debouncedSearchTerm, statusFilter]
    )

    // Convert error to string format
    const error = queryError ? String(queryError) : null

    const handleSelectScholarship = (scholarshipId: string) => {
        setSelectedScholarships(prev =>
            prev.includes(scholarshipId)
                ? prev.filter(id => id !== scholarshipId)
                : [...prev, scholarshipId]
        )
    }

    // ✅ Optimized refresh handler with user feedback
    const handleRefresh = async () => {
        try {
            await refetch()
            toast.success('Archive data refreshed successfully')
        } catch (error) {
            toast.error('Failed to refresh archive data')
        }
    }

    const handleSelectAll = () => {
        if (selectedScholarships.length === filteredScholarships.length) {
            setSelectedScholarships([])
        } else {
            setSelectedScholarships(filteredScholarships.map(s => s.id))
        }
    }

    const handleRestore = (scholarshipId: string) => {
        console.log('Restoring scholarship:', scholarshipId)
        // Implementation for restoring scholarship
    }

    const handlePermanentDelete = (scholarshipId: string) => {
        console.log('Permanently deleting scholarship:', scholarshipId)
        // Implementation for permanent deletion
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            EXPIRED: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Expired' },
            ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
            expired: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Expired' },
            completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
            cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' }
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.EXPIRED

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        )
    }

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <OrgSidebar />

                <SidebarInset className="flex-1 overflow-hidden">
                    <Navbar showSidebarToggle={true} pageTitle="Archive" />

                    <div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 sm:p-6 overflow-y-auto">
                        <div className="max-w-7xl mx-auto w-full">
                            {/* Header Section */}
                            <div className="flex flex-col gap-4 mb-4 sm:mb-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                                            <ArchiveIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600" />
                                            Archive
                                        </h1>
                                        <p className="text-gray-600 mt-1 text-sm sm:text-base">View and manage archived scholarship posts</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRefresh}
                                        className="gap-2"
                                        disabled={loading}
                                    >
                                        <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </Button>
                                </div>
                                {selectedScholarships.length > 0 && (
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => selectedScholarships.forEach(handleRestore)}
                                            className="gap-2 justify-center"
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                            Restore ({selectedScholarships.length})
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => selectedScholarships.forEach(handlePermanentDelete)}
                                            className="gap-2 text-red-600 hover:text-red-700 justify-center"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete Permanently
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Loading State */}
                            {loading && (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                                    <p className="mt-4 text-gray-600">Loading archived scholarships...</p>
                                </div>
                            )}

                            {/* Error State */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="text-red-600">
                                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-red-600">
                                                    Error loading archived scholarships: {error}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleRefresh}
                                            className="gap-2 text-red-600 border-red-300 hover:bg-red-50"
                                            disabled={loading}
                                        >
                                            <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                            Retry
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Content - only show when not loading and no error */}
                            {!loading && !error && (
                                <>
                                    {/* Search and Filter Section */}
                                    <div className="bg-white rounded-lg border p-3 sm:p-4 mb-4 sm:mb-6">
                                        <div className="flex flex-col gap-3 sm:gap-4">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                                <input
                                                    type="text"
                                                    placeholder="Search archived scholarships..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                                />
                                            </div>
                                            <div className="flex justify-start">
                                                <select
                                                    value={statusFilter}
                                                    onChange={(e) => setStatusFilter(e.target.value)}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm min-w-[140px]"
                                                >
                                                    <option value="all">All Status</option>
                                                    <option value="expired">Expired</option>
                                                    <option value="active">Active</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Statistics Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                                        <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-gray-100 rounded-lg">
                                                    <ArchiveIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                                                </div>
                                                <div className="ml-3 sm:ml-4">
                                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Archived</p>
                                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{archivedScholarships.length}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-orange-100 rounded-lg">
                                                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                                                </div>
                                                <div className="ml-3 sm:ml-4">
                                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Expired</p>
                                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                                        {archivedScholarships.filter(s => s.originalStatus === 'EXPIRED').length}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm sm:col-span-2 lg:col-span-1">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-green-100 rounded-lg">
                                                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                                                </div>
                                                <div className="ml-3 sm:ml-4">
                                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Applications</p>
                                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                                        {/* Applications data not available in current API schema */}
                                                        0
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Archive Table - Desktop View */}
                                    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-semibold text-gray-900">Archived Scholarships</h3>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedScholarships.length === filteredScholarships.length && filteredScholarships.length > 0}
                                                        onChange={handleSelectAll}
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-gray-600">Select All</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Desktop Table View - Hidden on mobile */}
                                        <div className="hidden lg:block overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Select
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Scholarship
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Benefits
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Applications
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Archived Date
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {filteredScholarships.map((scholarship) => (
                                                        <tr key={scholarship.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedScholarships.includes(scholarship.id)}
                                                                    onChange={() => handleSelectScholarship(scholarship.id)}
                                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="max-w-xs">
                                                                    <div className="text-sm font-medium text-gray-900 truncate">
                                                                        {scholarship.title}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500 truncate">
                                                                        {scholarship.description}
                                                                    </div>
                                                                    <div className="text-xs text-gray-400 mt-1">
                                                                        Type: {scholarship.type}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {scholarship.benefits}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900">
                                                                    {/* Applications data not available in current API schema */}
                                                                    0
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {getStatusBadge(scholarship.originalStatus)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900">
                                                                    {new Date(scholarship.archivedAt).toLocaleDateString()}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleRestore(scholarship.id)}
                                                                        className="gap-1 text-green-600 hover:text-green-700"
                                                                    >
                                                                        <RotateCcw className="h-3 w-3" />
                                                                        Restore
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handlePermanentDelete(scholarship.id)}
                                                                        className="gap-1 text-red-600 hover:text-red-700"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                        Delete
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile Card View - Visible on mobile */}
                                        <div className="lg:hidden">
                                            <div className="divide-y divide-gray-200">
                                                {filteredScholarships.map((scholarship) => (
                                                    <div key={scholarship.id} className="p-4 hover:bg-gray-50">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedScholarships.includes(scholarship.id)}
                                                                    onChange={() => handleSelectScholarship(scholarship.id)}
                                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                                                                />
                                                                <div className="flex-1">
                                                                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                                                                        {scholarship.title}
                                                                    </h4>
                                                                    <p className="text-sm text-gray-500 mb-2">
                                                                        {scholarship.description}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {getStatusBadge(scholarship.originalStatus)}
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                                            <div>
                                                                <span className="text-gray-500">Type:</span>
                                                                <span className="ml-1 text-gray-900">{scholarship.type}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Applications:</span>
                                                                <span className="ml-1 text-gray-900">0</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Benefits:</span>
                                                                <span className="ml-1 text-gray-900">{scholarship.benefits}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Archived:</span>
                                                                <span className="ml-1 text-gray-900">
                                                                    {new Date(scholarship.archivedAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleRestore(scholarship.id)}
                                                                className="gap-1 text-green-600 hover:text-green-700 flex-1"
                                                            >
                                                                <RotateCcw className="h-3 w-3" />
                                                                Restore
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handlePermanentDelete(scholarship.id)}
                                                                className="gap-1 text-red-600 hover:text-red-700 flex-1"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {filteredScholarships.length === 0 && (
                                            <div className="text-center py-8 sm:py-12 px-4">
                                                <ArchiveIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                                                <h3 className="mt-2 text-sm font-medium text-gray-900">No archived scholarships</h3>
                                                <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                                                    Archived scholarships will appear here when scholarships are moved to archive.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}

export default Archive