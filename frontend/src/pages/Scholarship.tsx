import { useState, useMemo, useEffect } from 'react'
import StudentNavbar from '../components/studentNavbar'
import ScholarshipCard from '../components/ScholarshipCard'
import { useScholarships, type Scholarship as ScholarshipType } from '../hooks/useScholarshipQueries'
import { Skeleton } from '../components/ui/skeleton'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import {
    Search,
    AlertCircle,
    X,
    RotateCw
} from 'lucide-react'

type ViewMode = 'grid' | 'list'

const Scholarship = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('all')
    const [sortBy, setSortBy] = useState<'deadline' | 'title' | 'newest' | 'oldest'>('deadline')
    const [locationFilter, setLocationFilter] = useState('all')
    const [viewMode] = useState<ViewMode>('grid')

    const {
        data: scholarships,
        isLoading,
        error,
        refetch,
        isRefetching
    } = useScholarships()

    // search form handling removed; search input is controlled directly via state

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

    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1)
    const itemsPerPage = 9

    // Reset page when filters/search change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, filterType, locationFilter, sortBy])

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <StudentNavbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="h-screen bg-gray-50 flex flex-col">
            {/* Only Navbar is sticky */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <StudentNavbar />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Hero */}
                <div className="bg-blue-600">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
                        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                            <div className="flex-1 text-white py-6 lg:py-0">
                                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-extrabold leading-tight mb-3">
                                    Find the right scholarship or grant for you.
                                </h1>
                                <p className="text-blue-100 max-w-2xl text-base">
                                    Easily search available scholarships, student financial assistance programs and learn how you can apply.
                                </p>

                            </div>

                            <div className="flex-shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 flex justify-center lg:justify-end">
                                <img src="/find.png" alt="Scholarship illustration" className="w-4/5 sm:w-3/4 md:w-2/3 lg:w-full h-auto object-contain" loading="lazy" decoding="async" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Controls & Results Summary */}
                    <div className="mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            {/* Search + Filters inline on desktop, stacked on mobile */}
                            <div className="flex-1 min-w-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search scholarship"
                                        className="w-full pl-10 pr-10 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={handleClearSearch}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                                            aria-label="Clear search"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Select onValueChange={(v) => setFilterType(v)} defaultValue={filterType}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="All Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {scholarshipTypes.map((t) => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select onValueChange={(v) => setLocationFilter(v)} defaultValue={locationFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="All Locations" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Locations</SelectItem>
                                        {scholarshipLocations.map((l) => (
                                            <SelectItem key={l} value={l}>{l}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select onValueChange={(v) => setSortBy(v as any)} defaultValue={sortBy}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Deadline" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="deadline">Deadline</SelectItem>
                                        <SelectItem value="title">Title</SelectItem>
                                        <SelectItem value="newest">Newest</SelectItem>
                                        <SelectItem value="oldest">Oldest</SelectItem>
                                    </SelectContent>
                                </Select>

                                {hasActiveFilters && (
                                    <Button
                                        onClick={handleClearFilters}
                                        variant="outline"
                                        className="hidden sm:inline-flex ml-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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
                                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
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
                        <>
                            {/* Paginate filtered scholarships */}
                            {(() => {
                                const totalItems = filteredScholarships.length
                                const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
                                const startIndex = (currentPage - 1) * itemsPerPage
                                const endIndex = startIndex + itemsPerPage
                                const pageItems = filteredScholarships.slice(startIndex, endIndex)

                                return (
                                    <>
                                        {/* Results count */}
                                        <div className="mb-4">
                                            <p className="text-sm text-gray-600">
                                                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} scholarships
                                                {searchTerm && ` for "${searchTerm}"`}
                                            </p>
                                        </div>

                                        {/* Responsive Grid: 1 column on mobile, 2 on tablet, 3 on desktop */}
                                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 auto-rows-fr' : 'space-y-4'}>
                                            {pageItems.map((scholarship: ScholarshipType) => (
                                                <div key={scholarship.id} className={viewMode === 'grid' ? 'h-full flex' : ''}>
                                                    {/* make ScholarshipCard grow to fill the grid cell */}
                                                    <div className="flex-1">
                                                        <ScholarshipCard scholarship={scholarship} layout={viewMode === 'grid' ? 'grid' : 'list'} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Pagination controls */}
                                        <div className="flex items-center justify-center gap-3 mt-8">
                                            <Button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage <= 1}
                                                variant="outline"
                                                className="px-3 py-1"
                                            >
                                                Prev
                                            </Button>

                                            <div className="flex items-center gap-2">
                                                {Array.from({ length: totalPages }).map((_, idx) => {
                                                    const page = idx + 1
                                                    return (
                                                        <button
                                                            key={page}
                                                            onClick={() => setCurrentPage(page)}
                                                            className={`px-3 py-1 rounded ${page === currentPage ? 'bg-blue-600 text-white' : 'bg-white border'}`}
                                                            aria-current={page === currentPage}
                                                        >
                                                            {page}
                                                        </button>
                                                    )
                                                })}
                                            </div>

                                            <Button
                                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredScholarships.length / itemsPerPage), p + 1))}
                                                disabled={currentPage >= Math.ceil(filteredScholarships.length / itemsPerPage)}
                                                variant="outline"
                                                className="px-3 py-1"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </>
                                )
                            })()}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Scholarship