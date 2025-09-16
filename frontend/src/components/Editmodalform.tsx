import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Calendar, Loader2 } from 'lucide-react'
import { updateScholar } from '../services/updateScholar'
import { organizationTypes } from '../schemas/scholarshipSchema'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

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
}

interface EditModalFormProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    scholarship: Scholarship | null
    onSuccess: () => void
}

interface FormData {
    title: string
    type: string
    description: string
    location: string
    requirements: string
    benefits: string
    deadline: string
}

const EditModalForm: React.FC<EditModalFormProps> = ({
    isOpen,
    onOpenChange,
    scholarship,
    onSuccess
}) => {
    const queryClient = useQueryClient()
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState<FormData>({
        title: '',
        type: '',
        description: '',
        location: '',
        requirements: '',
        benefits: '',
        deadline: ''
    })

    // Update scholarship mutation
    const updateScholarshipMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: FormData }) =>
            updateScholar(id, data),
        onSuccess: (data) => {
            // Invalidate and refetch scholarships list
            queryClient.invalidateQueries({ queryKey: ['scholarships'] })
            // Show success message
            toast.success(data.message || 'Scholarship updated successfully!')
            onSuccess()
            onOpenChange(false)
        },
        onError: (error: Error) => {
            // Show error message
            const errorMessage = error.message || 'Failed to update scholarship'
            setError(errorMessage)
            toast.error(errorMessage)
        },
    })

    // Initialize form data when scholarship changes
    useEffect(() => {
        if (scholarship) {
            setFormData({
                title: scholarship.title,
                type: scholarship.type,
                description: scholarship.description,
                location: scholarship.location,
                requirements: scholarship.requirements,
                benefits: scholarship.benefits,
                deadline: scholarship.deadline.split('T')[0] // Format date for input
            })
        }
    }, [scholarship])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        // Clear error when user starts typing
        if (error) setError(null)
        // Reset mutation error state when user starts typing
        if (updateScholarshipMutation.error) {
            updateScholarshipMutation.reset()
        }
    }

    const validateForm = (): boolean => {
        if (!formData.title.trim()) {
            setError('Title is required')
            return false
        }
        if (formData.title.length < 5) {
            setError('Title must be at least 5 characters long')
            return false
        }
        if (!formData.type) {
            setError('Organization type is required')
            return false
        }
        if (!formData.description.trim()) {
            setError('Description is required')
            return false
        }
        if (formData.description.length < 20) {
            setError('Description must be at least 20 characters long')
            return false
        }
        if (!formData.location.trim()) {
            setError('Location is required')
            return false
        }
        if (!formData.requirements.trim()) {
            setError('Requirements are required')
            return false
        }
        if (!formData.benefits.trim()) {
            setError('Benefits are required')
            return false
        }
        if (!formData.deadline) {
            setError('Deadline is required')
            return false
        }

        // Check if deadline is in the future
        const deadlineDate = new Date(formData.deadline)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (deadlineDate <= today) {
            setError('Deadline must be a future date')
            return false
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!scholarship) return

        if (!validateForm()) return

        updateScholarshipMutation.mutate({
            id: scholarship.id,
            data: formData
        })
    }

    const handleCancel = () => {
        setError(null)
        updateScholarshipMutation.reset()
        onOpenChange(false)
        // Reset form to original values
        if (scholarship) {
            setFormData({
                title: scholarship.title,
                type: scholarship.type,
                description: scholarship.description,
                location: scholarship.location,
                requirements: scholarship.requirements,
                benefits: scholarship.benefits,
                deadline: scholarship.deadline.split('T')[0]
            })
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto" style={{ width: '80vw', maxWidth: '1200px' }}>
                <DialogHeader>
                    <DialogTitle>Edit Scholarship</DialogTitle>
                    <DialogDescription>
                        Update the details of your scholarship. All fields marked with * are required.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error Message */}
                    {(error || updateScholarshipMutation.error) && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <p className="text-red-800 text-sm">
                                {error || updateScholarshipMutation.error?.message}
                            </p>
                        </div>
                    )}

                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                    Scholarship Title *
                                </label>
                                <Input
                                    id="title"
                                    name="title"
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Enter scholarship title"
                                    className="w-full"
                                    disabled={updateScholarshipMutation.isPending}
                                />
                            </div>

                            <div>
                                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                                    Organization Type *
                                </label>
                                <select
                                    id="type"
                                    name="type"
                                    required
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                                    disabled={updateScholarshipMutation.isPending}
                                >
                                    <option value="">Select organization type</option>
                                    {organizationTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                required
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Provide a detailed description of the scholarship..."
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                                disabled={updateScholarshipMutation.isPending}
                            />
                        </div>

                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                                Location *
                            </label>
                            <Input
                                id="location"
                                name="location"
                                type="text"
                                required
                                value={formData.location}
                                onChange={handleInputChange}
                                placeholder="e.g., United States, Online, Global"
                                className="w-full"
                                disabled={updateScholarshipMutation.isPending}
                            />
                        </div>
                    </div>

                    {/* Requirements & Benefits */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Requirements & Benefits</h3>

                        <div>
                            <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
                                Eligibility Requirements *
                            </label>
                            <textarea
                                id="requirements"
                                name="requirements"
                                required
                                value={formData.requirements}
                                onChange={handleInputChange}
                                placeholder="List the eligibility requirements for this scholarship..."
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                                disabled={updateScholarshipMutation.isPending}
                            />
                        </div>

                        <div>
                            <label htmlFor="benefits" className="block text-sm font-medium text-gray-700 mb-2">
                                Benefits & Award Amount *
                            </label>
                            <textarea
                                id="benefits"
                                name="benefits"
                                required
                                value={formData.benefits}
                                onChange={handleInputChange}
                                placeholder="Describe the benefits, award amount, and any additional perks..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                                disabled={updateScholarshipMutation.isPending}
                            />
                        </div>

                        <div>
                            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                                Application Deadline *
                            </label>
                            <div className="relative">
                                <Input
                                    id="deadline"
                                    name="deadline"
                                    type="date"
                                    required
                                    value={formData.deadline}
                                    onChange={handleInputChange}
                                    className="w-full pr-10"
                                    disabled={updateScholarshipMutation.isPending}
                                />
                                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={updateScholarshipMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={updateScholarshipMutation.isPending}
                            className="text-white"
                            style={{ backgroundColor: '#4F39F6' }}
                            onMouseEnter={(e) => !updateScholarshipMutation.isPending && (e.currentTarget.style.backgroundColor = '#3D2DB8')}
                            onMouseLeave={(e) => !updateScholarshipMutation.isPending && (e.currentTarget.style.backgroundColor = '#4F39F6')}
                        >
                            {updateScholarshipMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Scholarship'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default EditModalForm