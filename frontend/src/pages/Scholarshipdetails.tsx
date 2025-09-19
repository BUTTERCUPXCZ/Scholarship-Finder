import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import StudentNavbar from '../components/studentNavbar';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
    ArrowLeft,
    MapPin,
    AlertCircle,
    Upload,
    FileText,
    X
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from '../components/ui/dialog';
import toast from 'react-hot-toast';
import { submitApplication } from '../services/applications';
import { useAuth } from '../AuthProvider/AuthProvider';

// Scholarship interface matching the backend
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
    // Added optional fields for enhanced UI
    applicationLink?: string
    scholarshipValue?: string
    eligibleStudents?: string
}

// Service function to fetch scholarship details
const getScholarshipDetails = async (id: string): Promise<Scholarship> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/scholar/get-scholarship/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    })

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Scholarship not found')
        }
        throw new Error('Failed to fetch scholarship details')
    }

    const data = await response.json()
    return data.data
}

const Scholarshipdetails = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()

    const {
        data: scholarship,
        isLoading,
        error
    } = useQuery<Scholarship, Error>({
        queryKey: ['scholarship', id],
        queryFn: () => getScholarshipDetails(id!),
        enabled: !!id,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1
    })

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        } catch {
            return dateString
        }
    }

    const handleBack = () => {
        navigate('/scholarship')
    }

    // File upload state and handlers
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [isDragOver, setIsDragOver] = useState(false)
    // Apply modal form state
    const [isApplyOpen, setIsApplyOpen] = useState(false)
    const [firstName, setFirstName] = useState('')
    const [middleName, setMiddleName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [applyFile, setApplyFile] = useState<File | null>(null)

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            if (file.type === 'application/pdf') {
                setUploadedFile(file)
                toast.success('PDF file uploaded successfully!')
            } else {
                toast.error('Please upload a PDF file only.')
            }
        }
    }

    const handleApplyFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            if (file.type === 'application/pdf') {
                setApplyFile(file)
                toast.success('PDF file selected for application')
            } else {
                toast.error('Please upload a PDF file only.')
            }
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file && file.type === 'application/pdf') {
            setUploadedFile(file)
            toast.success('PDF file uploaded successfully!')
        } else {
            toast.error('Please upload a PDF file only.')
        }
    }

    const removeFile = () => {
        setUploadedFile(null)
        toast.success('File removed.')
    }

    // Application submission mutation
    const applicationMutation = useMutation({
        mutationFn: (applicationData: { scholarshipId: string; documents?: File[]; Firstname: string; Middlename?: string; Lastname: string; Email: string; Phone: string; Address: string; City: string }) =>
            submitApplication(applicationData, user?.id),
        onSuccess: () => {
            toast.success('Application submitted successfully!')
            setIsApplyOpen(false)
            setApplyFile(null)
            setFirstName('')
            setMiddleName('')
            setLastName('')
            setEmail('')
            setPhone('')
            setAddress('')
            setCity('')
        },
        onError: (error: Error) => {
            console.error('Application submission error:', error)
            // Show more detailed error message
            let errorMessage = 'Failed to submit application'
            if (error.message.includes('400')) {
                errorMessage = 'Please check your information and try again. Make sure all required fields are filled correctly.'
            } else if (error.message.includes('401')) {
                errorMessage = 'Please log in again to submit your application.'
            } else if (error.message.includes('already applied')) {
                errorMessage = 'You have already applied for this scholarship.'
            } else if (error.message) {
                errorMessage = error.message
            }
            toast.error(errorMessage)
        }
    })

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <StudentNavbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <Skeleton className="h-10 w-40 mb-6 rounded-lg" />
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-8 w-3/4 mb-3" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-6 w-24 rounded-full" />
                                        <Skeleton className="h-6 w-24 rounded-full" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <Skeleton className="h-20 w-full" />
                                        <Skeleton className="h-20 w-full" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-6 w-32" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-20 w-full" />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <StudentNavbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            className="mb-6 flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Scholarships
                        </Button>
                        <Card className="border-red-200 bg-red-50">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                    <CardTitle className="text-red-900">Error Loading Scholarship</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-red-700 mb-4">{error.message}</p>
                                <Button
                                    onClick={() => window.location.reload()}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Try Again
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    if (!scholarship) {
        return (
            <div className="min-h-screen bg-gray-50">
                <StudentNavbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            className="mb-6 flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Scholarships
                        </Button>
                        <Card className="text-center py-12">
                            <CardContent>
                                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <CardTitle className="text-2xl font-semibold text-gray-700 mb-2">
                                    Scholarship Not Found
                                </CardTitle>
                                <p className="text-gray-600 mb-6">
                                    The scholarship you're looking for doesn't exist or may have been removed.
                                </p>
                                <Button onClick={handleBack} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    Browse All Scholarships
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    const isExpired = scholarship.status === 'EXPIRED' || new Date(scholarship.deadline) < new Date()

    return (
        <div className="min-h-screen bg-gray-50">
            <StudentNavbar />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        className="mb-6 flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Scholarships
                    </Button>

                    {/* Single Container for Scholarship Details */}
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div className="flex-1">
                                    <CardTitle className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">
                                        {scholarship.title}
                                    </CardTitle>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <Badge variant="secondary" className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {scholarship.location}
                                        </Badge>
                                        <Badge variant="outline">
                                            {scholarship.type}
                                        </Badge>
                                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 border flex items-center gap-1">
                                            <span>Deadline: </span>
                                            {formatDate(scholarship.deadline)}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {/* Description Section */}
                            <div className="p-6 border-b">
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                                    Description
                                </h3>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {scholarship.description}
                                </p>
                            </div>

                            {/* Benefits and Requirements Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                {/* Benefits */}
                                <div className="p-6 border-b md:border-r">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                                        Benefits
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        {scholarship.benefits}
                                    </p>
                                </div>

                                {/* Requirements */}
                                <div className="p-6 border-b">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                                        Requirements
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        {scholarship.requirements}
                                    </p>
                                </div>
                            </div>

                            {/* Apply Section */}
                            <div className="p-6 bg-gray-50">
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                                        {isExpired ? 'Application Closed' : 'Ready to Apply?'}
                                    </h3>
                                    <p className="text-gray-600">
                                        {isExpired
                                            ? 'This scholarship application has closed. Check back for future opportunities.'
                                            : 'Submit your school information in PDF format to apply for this scholarship.'}
                                    </p>
                                </div>

                                {!isExpired && (
                                    <div className="space-y-4">
                                        <div className="flex justify-center">
                                            <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
                                                <DialogTrigger asChild>
                                                    <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                                        Apply
                                                    </Button>
                                                </DialogTrigger>

                                                <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-auto">
                                                    <DialogHeader>
                                                        <DialogTitle>Apply for {scholarship.title}</DialogTitle>
                                                        <DialogDescription>
                                                            Fill out your details and attach your school information (PDF).
                                                        </DialogDescription>
                                                    </DialogHeader>

                                                    <div className="grid gap-3 py-4">
                                                        {/* Name fields with labels for accessibility */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                            <div className="flex flex-col">
                                                                <label htmlFor="firstName" className="text-sm font-medium text-gray-700">First name <span className="text-red-500">*</span></label>
                                                                <input
                                                                    id="firstName"
                                                                    placeholder="First name"
                                                                    value={firstName}
                                                                    onChange={(e) => setFirstName(e.target.value)}
                                                                    className="mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                                                    aria-invalid={!firstName.trim() ? 'true' : 'false'}
                                                                />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <label htmlFor="middleName" className="text-sm font-medium text-gray-700">Middle name</label>
                                                                <input
                                                                    id="middleName"
                                                                    placeholder="Middle name"
                                                                    value={middleName}
                                                                    onChange={(e) => setMiddleName(e.target.value)}
                                                                    className="mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last name <span className="text-red-500">*</span></label>
                                                                <input
                                                                    id="lastName"
                                                                    placeholder="Last name"
                                                                    value={lastName}
                                                                    onChange={(e) => setLastName(e.target.value)}
                                                                    className="mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                                                    aria-invalid={!lastName.trim() ? 'true' : 'false'}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col">
                                                            <label htmlFor="email" className="text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                                                            <input
                                                                id="email"
                                                                type="email"
                                                                placeholder="you@example.com"
                                                                value={email}
                                                                onChange={(e) => setEmail(e.target.value)}
                                                                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                                                aria-invalid={!email.trim() || !/^[\w-.]+@[\w-]+\.[\w-.]+$/.test(email) ? 'true' : 'false'}
                                                            />
                                                            {email && !/^[\w-.]+@[\w-]+\.[\w-.]+$/.test(email) && (
                                                                <span role="alert" className="text-xs text-red-600 mt-1">Please enter a valid email address.</span>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div className="flex flex-col">
                                                                <label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone <span className="text-red-500">*</span></label>
                                                                <input
                                                                    id="phone"
                                                                    type="tel"
                                                                    placeholder="Your phone number"
                                                                    value={phone}
                                                                    onChange={(e) => setPhone(e.target.value)}
                                                                    className="mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                                                    aria-invalid={!phone.trim() ? 'true' : 'false'}
                                                                />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <label htmlFor="city" className="text-sm font-medium text-gray-700">City <span className="text-red-500">*</span></label>
                                                                <input
                                                                    id="city"
                                                                    placeholder="Your city"
                                                                    value={city}
                                                                    onChange={(e) => setCity(e.target.value)}
                                                                    className="mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                                                    aria-invalid={!city.trim() ? 'true' : 'false'}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col">
                                                            <label htmlFor="address" className="text-sm font-medium text-gray-700">Address <span className="text-red-500">*</span></label>
                                                            <input
                                                                id="address"
                                                                placeholder="Your full address"
                                                                value={address}
                                                                onChange={(e) => setAddress(e.target.value)}
                                                                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                                                aria-invalid={!address.trim() ? 'true' : 'false'}
                                                            />
                                                        </div>


                                                        {/* Drag-and-drop PDF upload area */}
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-700 block mb-2">School document (PDF) <span className="text-red-500">*</span></label>
                                                            <div
                                                                onDragOver={handleDragOver}
                                                                onDragLeave={handleDragLeave}
                                                                onDrop={handleDrop}
                                                                className={`relative flex items-center justify-center border-2 border-dashed rounded-md p-6 min-h-[200px] bg-white cursor-pointer transition ${isDragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'}`}
                                                                role="button"
                                                                tabIndex={0}
                                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { const el = document.getElementById('apply-file'); if (el) (el as HTMLInputElement).click() } }}
                                                                aria-describedby="apply-file-help"
                                                            >
                                                                <input
                                                                    type="file"
                                                                    accept="application/pdf"
                                                                    id="apply-file"
                                                                    onChange={handleApplyFileChange}
                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                    aria-label="Upload school document in PDF format"
                                                                />

                                                                <div className="flex flex-col items-center pointer-events-none">
                                                                    <Upload className="h-8 w-8 text-gray-500" />
                                                                    <p className="mt-2 text-sm text-gray-600">Drag & drop your PDF here, or click to browse</p>
                                                                    <p className="text-sm text-gray-500 mt-1">Max file size 5MB. PDF only.</p>
                                                                </div>
                                                            </div>
                                                            <div id="apply-file-help" className="sr-only">Upload your school document in PDF format. Press Enter or Space to open file browser.</div>

                                                            {/* File preview + remove */}
                                                            {applyFile && (
                                                                <div className="mt-3 flex items-center justify-between bg-gray-50 p-3 rounded-md border">
                                                                    <div className="flex items-center gap-3">
                                                                        <FileText className="h-5 w-5 text-gray-600" />
                                                                        <div className="text-sm">
                                                                            <div className="font-medium text-gray-800">{applyFile.name}</div>
                                                                            <div className="text-xs text-gray-500">{(applyFile.size / 1024).toFixed(0)} KB</div>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setApplyFile(null)}
                                                                        type="button"
                                                                        className="inline-flex items-center gap-2 px-3 py-1 bg-white border rounded text-sm"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <DialogFooter>
                                                        <div className="w-full flex gap-2 justify-end">
                                                            <DialogClose asChild>
                                                                <Button variant="outline" disabled={applicationMutation.isPending}>Cancel</Button>
                                                            </DialogClose>
                                                            <Button
                                                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                                                onClick={() => {
                                                                    // Inline validation before submitting
                                                                    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !address.trim() || !city.trim()) {
                                                                        toast.error('Please fill in all required fields.')
                                                                        return
                                                                    }
                                                                    if (!email.includes('@')) {
                                                                        toast.error('Please enter a valid email address.')
                                                                        return
                                                                    }
                                                                    if (!applyFile) {
                                                                        toast.error('Please attach a PDF file.')
                                                                        return
                                                                    }

                                                                    // Submit application with all required fields
                                                                    const submissionData: any = {
                                                                        scholarshipId: scholarship.id,
                                                                        documents: [applyFile],
                                                                        Firstname: firstName.trim(),
                                                                        Lastname: lastName.trim(),
                                                                        Email: email.trim(),
                                                                        Phone: phone.trim(),
                                                                        Address: address.trim(),
                                                                        City: city.trim()
                                                                    }

                                                                    // Only include Middlename if it has content
                                                                    if (middleName.trim()) {
                                                                        submissionData.Middlename = middleName.trim()
                                                                    }

                                                                    applicationMutation.mutate(submissionData)
                                                                }}
                                                                disabled={applicationMutation.isPending}
                                                            >
                                                                {applicationMutation.isPending ? 'Submitting...' : 'Submit Application'}
                                                            </Button>
                                                        </div>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>

                                        <div className="flex justify-center">
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                onClick={handleBack}
                                                className="flex items-center gap-2"
                                            >
                                                <ArrowLeft className="h-4 w-4" />
                                                Back to Listings
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {isExpired && (
                                    <div className="flex justify-center">
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            onClick={handleBack}
                                            className="flex items-center gap-2"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Back to Listings
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default Scholarshipdetails;