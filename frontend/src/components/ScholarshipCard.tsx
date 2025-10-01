import React from 'react'
import { Card, CardContent, CardFooter, CardHeader } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Calendar, MapPin, Award, Clock, AlertTriangle, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider/AuthProvider'

interface Scholarship {
    id: string
    title: string
    description: string
    location: string
    deadline: string
    type: string
    requirements: string
    status: 'ACTIVE' | 'EXPIRED'
    createdAt: string
    updatedAt: string
    providerId: string
    benefits: string
    applications?: any[]
    _count?: {
        applications: number
    }
}

interface ScholarshipCardProps {
    scholarship: Scholarship
    onViewDetails?: (scholarshipId: string) => void
    layout?: 'grid' | 'list'
}

const ScholarshipCard: React.FC<ScholarshipCardProps> = ({ scholarship, onViewDetails, layout = 'grid' }) => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const isExpired = scholarship.status === 'EXPIRED' || new Date(scholarship.deadline) < new Date()

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        } catch {
            return dateString
        }
    }

    const getDaysUntilDeadline = (deadline: string) => {
        try {
            const deadlineDate = new Date(deadline)
            const today = new Date()
            const timeDiff = deadlineDate.getTime() - today.getTime()
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
            return daysDiff
        } catch {
            return null
        }
    }



    const daysLeft = getDaysUntilDeadline(scholarship.deadline)
    const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft > 0

    // Standardized button classes to keep list and grid layouts consistent
    const primaryBtnClass = isExpired
        ? 'bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-200'
        : 'bg-indigo-600 hover:bg-indigo-700 text-white'

    const getStatusBadge = () => {
        if (isExpired) {
            return (
                <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Expired
                </Badge>
            )
        }

        if (isUrgent) {
            return (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {daysLeft} days left
                </Badge>
            )
        }

        // For regular active scholarships we no longer render an "Active" badge.
        return null
    }

    const handleClick = () => {
        if (isExpired) return

        if (onViewDetails) {
            onViewDetails(scholarship.id)
            return
        }

        if (!user) {
            navigate('/login')
            return
        }

        navigate(`/scholarship/${scholarship.id}`)
    }

    if (layout === 'list') {
        return (
            <Card className="w-full hover:shadow-lg transition-all duration-300 border-gray-200 bg-white group hover:border-indigo-200 rounded-lg">
                <CardContent className="flex gap-4 items-start p-4">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="border-indigo-200 text-indigo-600 bg-indigo-50">
                                    {scholarship.type}
                                </Badge>
                                <h3 className="text-md font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                    {scholarship.title}
                                </h3>
                            </div>

                            {getStatusBadge()}
                        </div>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                            {scholarship.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="truncate">{scholarship.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="truncate">Deadline: {formatDate(scholarship.deadline)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="truncate">
                                    {(scholarship.applications?.length ?? scholarship._count?.applications) ?? 0} applicants
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="w-40 flex-shrink-0 flex flex-col gap-2">
                        <div className="p-2 bg-indigo-50 rounded-md border border-indigo-100 text-indigo-700 text-sm">
                            <div className="font-medium">Benefits</div>
                            <div className="line-clamp-3 text-xs text-indigo-600">{scholarship.benefits}</div>
                        </div>
                        <Button
                            onClick={handleClick}
                            disabled={isExpired}
                            className={`${primaryBtnClass} w-full`}
                        >
                            {isExpired ? 'Closed' : 'View'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={`${layout === 'grid' ? 'h-full' : ''} flex flex-col hover:shadow-lg transition-all duration-300 border-gray-200 bg-white group hover:border-indigo-200 rounded-lg`}>
            {/* Header */}
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <Badge variant="outline" className="border-indigo-200 text-indigo-600 bg-indigo-50">
                        {scholarship.type}
                    </Badge>
                    {getStatusBadge()}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {scholarship.title}
                </h3>
            </CardHeader>

            <CardContent className="flex-1 pb-4">
                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {scholarship.description}
                </p>


                {/* Details */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        <span className="truncate">{scholarship.location}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        <span className="truncate">Deadline: {formatDate(scholarship.deadline)}</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-0">
                <Button
                    onClick={handleClick}
                    disabled={isExpired}
                    className={`w-full ${primaryBtnClass}`}
                >
                    {isExpired ? 'Application Closed' : 'View Details & Apply'}
                </Button>
            </CardFooter>
        </Card>
    )
}

export default ScholarshipCard