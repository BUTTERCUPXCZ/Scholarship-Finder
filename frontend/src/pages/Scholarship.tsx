import React, { useState, useMemo } from 'react'
import StudentNavbar from '../components/studentNavbar'
import ScholarshipCard from '../components/ScholarshipCard'
import { useScholarships, type Scholarship as ScholarshipType } from '../hooks/useScholarshipQueries'
import { Skeleton } from '../components/ui/skeleton'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import {
    Search,
    AlertCircle,
    X,
    RotateCw,
    SlidersHorizontal,
    Filter,
    GraduationCap,
    MapPin,
    Calendar,
    TrendingUp
} from 'lucide-react'

const Scholarship = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('all')
    const [sortBy, setSortBy] = useState<'deadline' | 'title' | 'newest' | 'oldest'>('deadline')
    const [locationFilter, setLocationFilter] = useState('all')

    const {
        data: scholarships,
        isLoading,
        error,
        refetch,
        isRefetching
    } = useScholarships()

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
    }

    const handleClearSearch = () => {
        setSearchTerm('')
    }

    const handleClearFilters = () => {
        setSearchTerm('')
        setFilterType('all')
        setLocationFilter('all')
        setSortBy('deadline')
    }

    // Get unique types and locations for filters
    const scholarshipTypes = useMemo(() => {
        if (!scholarships) return []
        return [...new Set(scholarships.map((s: ScholarshipType) => s.type))]
    }, [scholarships])

    const scholarshipLocations = useMemo(() => {
        if (!scholarships) return []
        return [...new Set(scholarships.map((s: ScholarshipType) => s.location))]
    }, [scholarships])

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
            const matchesLocation = locationFilter === 'all' || scholarship.location === locationFilter

            return matchesSearch && matchesType && matchesLocation
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
    }, [scholarships, searchTerm, filterType, locationFilter, sortBy])

    const hasActiveFilters = searchTerm || filterType !== 'all' || locationFilter !== 'all' || sortBy !== 'deadline'

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <StudentNavbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-2xl mx-auto">
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="flex items-center gap-4 p-8">
                                <AlertCircle className="h-12 w-12 text-red-600 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-red-900 mb-2 text-lg">
                                        Unable to Load Scholarships
                                    </h3>
                                    <p className="text-red-700 mb-4">
                                        {error instanceof Error ? error.message : 'Something went wrong while loading scholarships'}
                                    </p>
                                    <Button
                                        onClick={() => refetch()}
                                        size="sm"
                                        className="bg-red-600 hover:bg-red-700 text-white"
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
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Page Header */}
                        <div className="text-center mb-8">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
                                    <GraduationCap className="h-7 w-7 text-white" />
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                                    Scholarship Opportunities
                                </h1>
                            </div>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Discover and apply for scholarships that match your academic profile and career goals
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="max-w-2xl mx-auto mb-8">
                            <form onSubmit={handleSearch} className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <Input
                                    type="text"
                                    placeholder="Search scholarships by title, description, location, or benefits..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 pr-12 py-4 h-14 text-base border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                )}
                            </form>
                        </div>

                        {/* Filters */}
                        <Card className="border-gray-200 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row gap-4 items-center">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Filter className="h-4 w-4" />
                                        Filters:
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-3 flex-1">
                                        {/* Type Filter */}
                                        <Select value={filterType} onValueChange={setFilterType}>
                                            <SelectTrigger className="w-48 border-gray-200">
                                                <SelectValue placeholder="All Types" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Types</SelectItem>
                                                {scholarshipTypes.map((type: string) => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {/* Location Filter */}
                                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                                            <SelectTrigger className="w-48 border-gray-200">
                                                <SelectValue placeholder="All Locations" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Locations</SelectItem>
                                                {scholarshipLocations.map((location: string) => (
                                                    <SelectItem key={location} value={location}>{location}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {/* Sort Filter */}
                                        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                                            <SelectTrigger className="w-48 border-gray-200">
                                                <SelectValue placeholder="Sort by" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="deadline">Deadline (Earliest)</SelectItem>
                                                <SelectItem value="title">Title (A-Z)</SelectItem>
                                                <SelectItem value="newest">Newest First</SelectItem>
                                                <SelectItem value="oldest">Oldest First</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex gap-2">
                                        {hasActiveFilters && (
                                            <Button
                                                variant="outline"
                                                onClick={handleClearFilters}
                                                className="border-gray-200 text-gray-600 hover:bg-gray-50"
                                            >
                                                Clear All
                                            </Button>
                                        )}
                                        
                                        <Button
                                            variant="outline"
                                            onClick={() => refetch()}
                                            disabled={isRefetching}
                                            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                        >
                                            <RotateCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                                            Refresh
                                        </Button>
                                    </div>
                                </div>

                                {/* Active Filters Display */}
                                {hasActiveFilters && (
                                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                                        {searchTerm && (
                                            <Badge variant="secondary" className="flex items-center gap-1 bg-indigo-100 text-indigo-700">
                                                Search: "{searchTerm}"
                                                <button onClick={handleClearSearch} className="hover:bg-indigo-200 rounded-full p-0.5">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        )}
                                        {filterType !== 'all' && (
                                            <Badge variant="secondary" className="flex items-center gap-1 bg-indigo-100 text-indigo-700">
                                                Type: {filterType}
                                                <button onClick={() => setFilterType('all')} className="hover:bg-indigo-200 rounded-full p-0.5">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        )}
                                        {locationFilter !== 'all' && (
                                            <Badge variant="secondary" className="flex items-center gap-1 bg-indigo-100 text-indigo-700">
                                                Location: {locationFilter}
                                                <button onClick={() => setLocationFilter('all')} className="hover:bg-indigo-200 rounded-full p-0.5">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Results Summary */}
                    {!isLoading && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between">
                                <p className="text-gray-600 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Showing {filteredScholarships.length} of {scholarships?.length || 0} scholarships
                                </p>
                                {filteredScholarships.length > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar className="h-4 w-4" />
                                        <span>Updated {new Date().toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Array.from({ length: 9 }).map((_, index) => (
                                    <Card key={index} className="h-[400px] border-gray-200">
                                        <CardContent className="p-6 space-y-4">
                                            <Skeleton className="h-6 w-3/4" />
                                            <Skeleton className="h-4 w-1/2" />
                                            <Skeleton className="h-20 w-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-4 w-2/3" />
                                            </div>
                                            <Skeleton className="h-10 w-full" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && filteredScholarships.length === 0 && (
                        <Card className="border-gray-200">
                            <CardContent className="text-center py-16">
                                <div className="max-w-md mx-auto space-y-6">
                                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                                        <Search className="h-10 w-10 text-gray-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            No Scholarships Found
                                        </h3>
                                        <p className="text-gray-600">
                                            {searchTerm ?
                                                `No scholarships match your search for "${searchTerm}". Try adjusting your search terms or filters.` :
                                                'No scholarships are currently available. Check back later for new opportunities.'
                                            }
                                        </p>
                                    </div>
                                    {hasActiveFilters && (
                                        <Button 
                                            onClick={handleClearFilters} 
                                            variant="outline"
                                            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                        >
                                            Clear All Filters
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Scholarships Grid */}
                    {!isLoading && filteredScholarships.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredScholarships.map((scholarship: ScholarshipType) => (
                                <div key={scholarship.id} className="h-full">
                                    <ScholarshipCard scholarship={scholarship} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Load More Section */}
                    {!isLoading && filteredScholarships.length > 0 && (
                        <div className="text-center mt-12">
                            <Card className="border-gray-200 bg-white">
                                <CardContent className="p-8">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Looking for more opportunities?
                                        </h3>
                                        <p className="text-gray-600">
                                            We're constantly adding new scholarships. Check back regularly or set up notifications.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                            <Button 
                                                onClick={() => refetch()}
                                                variant="outline"
                                                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                                disabled={isRefetching}
                                            >
                                                <RotateCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                                                Check for New Scholarships
                                            </Button>
                                            <Button 
                                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                            >
                                                Back to Top
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Scholarship