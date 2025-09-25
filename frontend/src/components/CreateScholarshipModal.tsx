import { useState } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createScholar } from '../services/createScholar'
import toast from 'react-hot-toast'
import {
    type ScholarshipFormData,
    organizationTypes,
    validateScholarshipForm
} from '../schemas/scholarshipSchema'
import { Loader2 } from 'lucide-react'

interface CreateScholarshipModalProps {
    isOpen: boolean
    onClose: () => void
}

const CreateScholarshipModal = ({ isOpen, onClose }: CreateScholarshipModalProps) => {
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState<ScholarshipFormData>({
        title: '',
        organizationType: '',
        description: '',
        eligibilityRequirements: '',
        location: '',
        benefits: '',
        deadline: '',
    })

    const [errors, setErrors] = useState<Partial<Record<keyof ScholarshipFormData, string>>>({})

    const createScholarshipMutation = useMutation({
        mutationFn: createScholar,
        onSuccess: () => {
            toast.success('Scholarship created successfully!')
            // Invalidate and refetch scholarships
            queryClient.invalidateQueries({ queryKey: ['scholarships'] })
            handleClose()
        },
        onError: (error) => {
            toast.error('Failed to create scholarship. Please try again.')
            console.error('Error creating scholarship:', error)
        },
    })

    const handleClose = () => {
        setFormData({
            title: '',
            organizationType: '',
            description: '',
            eligibilityRequirements: '',
            location: '',
            benefits: '',
            deadline: '',
        })
        setErrors({})
        onClose()
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))

        // Clear error when user starts typing
        if (errors[name as keyof ScholarshipFormData]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }))
        }
    }

    const validateForm = (): boolean => {
        const result = validateScholarshipForm(formData)
        setErrors(result.errors)
        return result.success
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            toast.error('Please fill in all required fields correctly')
            return
        }

        const scholarData = {
            title: formData.title,
            type: formData.organizationType,
            description: formData.description,
            location: formData.location,
            requirements: formData.eligibilityRequirements,
            benefits: formData.benefits,
            deadline: formData.deadline,
        }

        createScholarshipMutation.mutate(scholarData)
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto" style={{ width: '80vw', maxWidth: '1200px' }}>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Create New Scholarship</DialogTitle>
                    <DialogDescription>
                        Fill in the details to create a new scholarship opportunity for students.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information Section */}
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
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Enter scholarship title"
                                    className={errors.title ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                                />
                                {errors.title && (
                                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="organizationType" className="block text-sm font-medium text-gray-700 mb-2">
                                    Organization Type *
                                </label>
                                <select
                                    id="organizationType"
                                    name="organizationType"
                                    value={formData.organizationType}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white ${errors.organizationType ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                                        }`}
                                >
                                    <option value="">Select organization type</option>
                                    {organizationTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.organizationType && (
                                    <p className="mt-1 text-sm text-red-600">{errors.organizationType}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Provide a detailed description of the scholarship..."
                                rows={4}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.description ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                                    }`}
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                            )}
                        </div>
                    </div>

                    {/* Requirements and Details Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Requirements & Details</h3>

                        <div>
                            <label htmlFor="eligibilityRequirements" className="block text-sm font-medium text-gray-700 mb-2">
                                Eligibility Requirements *
                            </label>
                            <textarea
                                id="eligibilityRequirements"
                                name="eligibilityRequirements"
                                value={formData.eligibilityRequirements}
                                onChange={handleInputChange}
                                placeholder="Enter each requirement on a new line (one per line). You may start lines with -, • or * if you prefer."
                                rows={4}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.eligibilityRequirements ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                                    }`}
                            />
                            {errors.eligibilityRequirements && (
                                <p className="mt-1 text-sm text-red-600">{errors.eligibilityRequirements}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                                    Location *
                                </label>
                                <Input
                                    id="location"
                                    name="location"
                                    type="text"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    placeholder="e.g., USA, Global, Philippines"
                                    className={errors.location ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                                />
                                {errors.location && (
                                    <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                                    Application Deadline *
                                </label>
                                <Input
                                    id="deadline"
                                    name="deadline"
                                    type="date"
                                    value={formData.deadline}
                                    onChange={handleInputChange}
                                    className={errors.deadline ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                                />
                                {errors.deadline && (
                                    <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="benefits" className="block text-sm font-medium text-gray-700 mb-2">
                                Benefits & Value *
                            </label>
                            <textarea
                                id="benefits"
                                name="benefits"
                                value={formData.benefits}
                                onChange={handleInputChange}
                                placeholder="List benefits one per line (e.g., Tuition waiver, Monthly stipend). You can also start lines with -, • or *."
                                rows={3}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.benefits ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                                    }`}
                            />
                            {errors.benefits && (
                                <p className="mt-1 text-sm text-red-600">{errors.benefits}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={createScholarshipMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createScholarshipMutation.isPending}
                            className="text-white"
                            style={{ backgroundColor: '#4F39F6' }}
                            onMouseEnter={(e) => {
                                if (!createScholarshipMutation.isPending) {
                                    e.currentTarget.style.backgroundColor = '#3D2DB8'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!createScholarshipMutation.isPending) {
                                    e.currentTarget.style.backgroundColor = '#4F39F6'
                                }
                            }}
                        >
                            {createScholarshipMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Scholarship'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default CreateScholarshipModal