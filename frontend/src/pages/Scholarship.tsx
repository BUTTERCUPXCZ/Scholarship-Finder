import React, { useState, useMemo } from 'react'
import StudentNavbar from '../components/studentNavbar'
import ScholarshipCard from '../components/ScholarshipCard'
import { useScholarships, type Scholarship as ScholarshipType } from '../hooks/useScholarshipQueries'
import { Skeleton } from '../components/ui/skeleton'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import {
    Search,
    AlertCircle,
    X,
    ChevronDown,
    RotateCw,
    SlidersHorizontal
} from 'lucide-react'

const Scholarship = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('all')
    const [sortBy, setSortBy] = useState<'deadline' | 'title' | 'newest' | 'oldest'>('deadline')
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    const {
        data: scholarships,
        isLoading,
        error,
        refetch,
        isRefetching
    } = useScholarships()

    // recent searches removed

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        // search handled via controlled input + filtering
    }

    const handleClearSearch = () => {
        setSearchTerm('')
    }

    // Filtered scholarships with improved logic
    const filteredScholarships = useMemo(() => {
        if (!scholarships) return []

        let filtered = scholarships.filter((scholarship: ScholarshipType) => {
            const matchesSearch = searchTerm === '' ||
                scholarship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                scholarship.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                scholarship.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                scholarship.benefits.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesType = filterType === 'all' || scholarship.type === filterType

            return matchesSearch && matchesType
        })

        // Sort scholarships
        filtered.sort((a: ScholarshipType, b: ScholarshipType) => {
            switch (sortBy) {
                case 'deadline':
                    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
                case 'title':
                    return a.title.localeCompare(b.title)
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                default:
                    return 0
            }
        })

        return filtered
    }, [scholarships, searchTerm, filterType, sortBy])

    const scholarshipTypes = useMemo(() => {
        if (!scholarships) return []
        return [...new Set(scholarships.map((s: ScholarshipType) => s.type))]
    }, [scholarships])

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <StudentNavbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-2xl mx-auto">
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="flex items-center gap-3 p-6">
                                <AlertCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-red-900 mb-1">
                                        Unable to Load Scholarships
                                    </h3>
                                    <p className="text-red-700 text-sm mb-3">
                                        {error instanceof Error ? error.message : 'Something went wrong'}
                                    </p>
                                    <Button
                                        onClick={() => refetch()}
                                        size="sm"
                                        className="bg-red-600 hover:bg-red-700"
                                        disabled={isRefetching}
                                    >
                                        {isRefetching ? (
                                            <>
                                                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                                                Retrying...
                                            </>
                                        ) : (
                                            'Try Again'
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <StudentNavbar />

            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="container mx-auto px-4 py-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Scholarship Opportunities
                            </h1>
                            <p className="text-gray-600">
                                Discover and apply for scholarships that match your profile
                            </p>
                        </div>

                        {/* Search and Filter Bar */}
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex-1 max-w-2xl relative">
                                <form onSubmit={handleSearch} className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        type="text"
                                        placeholder="Search scholarships by title, description, location..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-10 py-2.5 w-full"
                                    />
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={handleClearSearch}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </form>

                                {/* recent searches removed */}
                            </div>

                            {/* Filter and Sort Controls */}
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                        className="flex items-center gap-2"
                                    >
                                        <SlidersHorizontal className="h-4 w-4" />
                                        Filter
                                        <ChevronDown className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                                    </Button>

                                    {isFilterOpen && (
                                        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                        Scholarship Type
                                                    </label>
                                                    <select
                                                        value={filterType}
                                                        onChange={(e) => setFilterType(e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                                    >
                                                        <option value="all">All Types</option>
                                                        {scholarshipTypes.map((type: string) => (
                                                            <option key={type} value={type}>{type}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                        Sort By
                                                    </label>
                                                    <select
                                                        value={sortBy}
                                                        onChange={(e) => setSortBy(e.target.value as any)}
                                                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                                    >
                                                        <option value="deadline">Deadline (Earliest)</option>
                                                        <option value="title">Title (A-Z)</option>
                                                        <option value="newest">Newest First</option>
                                                        <option value="oldest">Oldest First</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => refetch()}
                                    disabled={isRefetching}
                                    className="flex items-center gap-2"
                                >
                                    <RotateCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>
                        </div>

                        {/* Active Filters */}
                        {(filterType !== 'all' || searchTerm) && (
                            <div className="flex flex-wrap gap-2 mt-4">
                                {searchTerm && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        Search: "{searchTerm}"
                                        <button onClick={handleClearSearch}>
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                                {filterType !== 'all' && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        Type: {filterType}
                                        <button onClick={() => setFilterType('all')}>
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Results Summary */}
                    {!isLoading && (
                        <div className="mb-6">
                            <p className="text-gray-600">
                                Showing {filteredScholarships.length} of {scholarships?.length || 0} scholarships
                            </p>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div key={index} className="w-full h-[400px] max-w-sm mx-auto">
                                    <Skeleton className="h-full w-full rounded-lg" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && filteredScholarships.length === 0 && (
                        <div className="text-center py-12">
                            <div className="max-w-md mx-auto">
                                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    No Scholarships Found
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    {searchTerm ?
                                        `No scholarships match your search for "${searchTerm}". Try adjusting your search terms or filters.` :
                                        'No scholarships are currently available. Check back later for new opportunities.'
                                    }
                                </p>
                                {searchTerm && (
                                    <Button onClick={handleClearSearch} variant="outline">
                                        Clear Search
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Scholarships Grid */}
                    {!isLoading && filteredScholarships.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                            {filteredScholarships.map((scholarship: ScholarshipType) => (
                                <div key={scholarship.id} className="w-full h-[400px] max-w-sm mx-auto">
                                    <ScholarshipCard
                                        scholarship={scholarship}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Scholarship