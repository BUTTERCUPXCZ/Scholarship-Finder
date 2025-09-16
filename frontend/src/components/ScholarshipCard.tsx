import React from 'react'
import { Card, CardContent, CardFooter } from './ui/card'
import { Button } from './ui/button'
import { Calendar, MapPin, Award, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider/AuthProvider'

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

interface ScholarshipCardProps {
    scholarship: Scholarship
    onApply?: (scholarshipId: string) => void
    onViewDetails?: (scholarshipId: string) => void
}

const ScholarshipCard: React.FC<ScholarshipCardProps> = ({ scholarship, onApply, onViewDetails }) => {
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

    const getStatusText = () => {
        if (isExpired) return 'Expired'
        if (daysLeft !== null && daysLeft <= 7) return `${daysLeft} days left`
        return 'Ready'
    }

    const getStatusColor = () => {
        if (isExpired) return 'bg-red-100 text-red-700'
        if (daysLeft !== null && daysLeft <= 7) return 'bg-orange-100 text-orange-700'
        return 'bg-green-100 text-green-700'
    }

    return (
        <Card className="h-full w-full flex flex-col hover:shadow-lg transition-all duration-200 border border-gray-200 rounded-lg overflow-hidden">
            {/* Header Section */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{scholarship.type}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor()}`}>
                        {getStatusText()}
                    </span>
                </div>
            </div>

            <CardContent className="flex-1 p-4 flex flex-col">
                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {scholarship.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
                    {scholarship.description}
                </p>

                {/* Details */}
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{scholarship.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>Deadline: {formatDate(scholarship.deadline)}</span>
                    </div>
                </div>

                {/* Benefits */}
                <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                        <Award className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm text-blue-900">Benefits</span>
                    </div>
                    <p className="text-sm text-blue-700 line-clamp-2">
                        {scholarship.benefits}
                    </p>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex-shrink-0">
                <div className="flex gap-2 w-full">
                    <Button
                        variant="outline"
                        className="flex-1 border-none bg-[#4F39F6] hover:bg-[#3D2DB8] text-white hover:text-white transition-colors duration-200 shadow-md cursor-pointer"
                        onClick={() => {
                            // If parent passed handler, use it. Otherwise, only allow navigation to details when authenticated.
                            if (onViewDetails) {
                                onViewDetails(scholarship.id)
                                return
                            }

                            if (!user) {
                                // Not authenticated -> redirect to login
                                navigate('/login')
                                return
                            }

                            navigate(`/scholarship/${scholarship.id}`)
                        }}
                    >

                        View Details
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}

export default ScholarshipCard