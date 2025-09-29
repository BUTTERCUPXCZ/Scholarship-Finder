import React from 'react'
import { Card, CardContent, CardFooter, CardHeader } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Calendar, MapPin, Award, Clock, AlertTriangle } from 'lucide-react'
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
}

interface ScholarshipCardProps {
    scholarship: Scholarship
    onViewDetails?: (scholarshipId: string) => void
}

const ScholarshipCard: React.FC<ScholarshipCardProps> = ({ scholarship, onViewDetails }) => {
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

        return (
            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                <Award className="h-3 w-3 mr-1" />
                Active
            </Badge>
        )
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

    return (
        <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-300 border-gray-200 bg-white group hover:border-indigo-200">
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

                {/* Benefits Preview */}
                <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-2 mb-1">
                        <Award className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-700">Benefits</span>
                    </div>
                    <p className="text-sm text-indigo-600 line-clamp-2">
                        {scholarship.benefits}
                    </p>
                </div>

                {/* Details */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        <span className="truncate">{scholarship.location}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        <span>Deadline: {formatDate(scholarship.deadline)}</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-0">
                <Button
                    onClick={handleClick}
                    disabled={isExpired}
                    className={`w-full ${
                        isExpired 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-200' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                >
                    {isExpired ? 'Application Closed' : 'View Details & Apply'}
                </Button>
            </CardFooter>
        </Card>
    )
}

export default ScholarshipCard