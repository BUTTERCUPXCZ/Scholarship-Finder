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
import { Bell, Calendar } from 'lucide-react'
import OrgSidebar from '../components/orgSidebar'
import { useQuery } from '@tanstack/react-query'

const CreateScholar = () => {
    const navigate = useNavigate()
    const { logout } = useAuth()

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        organizationType: '',
        description: '',
        eligibilityRequirements: '',
        location: '',
        benefits: '',
        deadline: '',

    })


    const [isSubmitting, setIsSubmitting] = useState(false)

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            // Here you would typically send the data to your backend
            console.log('Form data:', formData)

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Reset form or navigate somewhere
            alert('Scholarship created successfully!')

        } catch (error) {
            console.error('Error creating scholarship:', error)
            alert('Error creating scholarship. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

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
                                <span className="text-muted-foreground">Create Scholar</span>
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
                        <div className="max-w-4xl mx-auto w-full">
                            <div className="mb-6">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Scholarship Post</h1>
                                <p className="text-gray-600">Fill in the details to create a new scholarship opportunity for students.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Basic Information Section */}
                                <div className="bg-white p-6 rounded-lg border shadow-sm">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>

                                    <div className="space-y-4">
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
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="organizationType" className="block text-sm font-medium text-gray-700 mb-2">
                                                Organization Type *
                                            </label>
                                            <select
                                                id="organizationType"
                                                name="organizationType"
                                                required
                                                value={formData.organizationType}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                            >
                                                <option value="">Select organization type</option>
                                                <option value="university">University/College</option>
                                                <option value="nonprofit">Non-Profit Organization</option>
                                                <option value="foundation">Private Foundation</option>
                                                <option value="corporation">Corporation/Business</option>
                                                <option value="government">Government Agency</option>
                                                <option value="religious">Religious Organization</option>
                                                <option value="professional">Professional Association</option>
                                                <option value="community">Community Organization</option>
                                                <option value="individual">Individual/Family</option>
                                                <option value="other">Other</option>
                                            </select>
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
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Requirements & Benefits Section */}
                                <div className="bg-white p-6 rounded-lg border shadow-sm">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements & Benefits</h2>

                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="eligibilityRequirements" className="block text-sm font-medium text-gray-700 mb-2">
                                                Eligibility Requirements *
                                            </label>
                                            <textarea
                                                id="eligibilityRequirements"
                                                name="eligibilityRequirements"
                                                required
                                                value={formData.eligibilityRequirements}
                                                onChange={handleInputChange}
                                                placeholder="List all eligibility criteria (GPA, field of study, nationality, etc.)..."
                                                rows={4}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                                                placeholder="Describe the benefits (monetary amount, tuition coverage, mentorship, etc.)..."
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Application Details Section */}
                                <div className="bg-white p-6 rounded-lg border shadow-sm">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Details</h2>

                                    <div className="space-y-4">
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
                                                />
                                                <Calendar className="absolute right-3 top-2 h-5 w-5 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* File Upload Section removed per request */}

                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isSubmitting} className="gap-2 border-2"
                                        style={{ backgroundColor: '#4F39F6', color: 'white', borderColor: '#4F39F6' }}
                                        onMouseEnter={(e) => {
                                            if (!isSubmitting) {
                                                e.currentTarget.style.backgroundColor = '#3D2DB8';
                                                e.currentTarget.style.color = 'white';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSubmitting) {
                                                e.currentTarget.style.backgroundColor = '#4F39F6';
                                                e.currentTarget.style.color = 'white';
                                            }
                                        }}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Scholarship'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}

export default CreateScholar