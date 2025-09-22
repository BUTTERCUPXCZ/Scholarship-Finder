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
import { Breadcrumbs } from '../components/ui/breadcrumbs';

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
            setApplyFile(file)
            toast.success('PDF file uploaded successfully!')
        } else {
            toast.error('Please upload a PDF file only.')
        }
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
                    <div className="max-w-7xl mx-auto">
                        {/* Back Button Skeleton */}
                        <Skeleton className="h-10 w-40 mb-6 rounded-lg" />

                        {/* Breadcrumbs Skeleton */}
                        <div className="flex items-center space-x-2 mb-6">
                            <Skeleton className="h-4 w-20" />
                            <span className="text-gray-400">/</span>
                            <Skeleton className="h-4 w-32" />
                        </div>

                        {/* Two-Column Layout Skeleton */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Content - Left Column */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Scholarship Header Skeleton */}
                                <Card>
                                    <CardContent className="p-6">
                                        <Skeleton className="h-8 w-3/4 mb-4" />
                                        <div className="flex gap-2 mb-4">
                                            <Skeleton className="h-6 w-24 rounded-full" />
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </div>
                                        <Skeleton className="h-4 w-full mb-2" />
                                        <Skeleton className="h-4 w-5/6" />
                                    </CardContent>
                                </Card>

                                {/* What You'll Get Section Skeleton */}
                                <Card>
                                    <CardHeader>
                                        <Skeleton className="h-7 w-48" />
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="h-4 w-full mb-2" />
                                        <Skeleton className="h-4 w-4/5 mb-2" />
                                        <Skeleton className="h-4 w-3/4 mb-2" />
                                        <Skeleton className="h-4 w-5/6" />
                                    </CardContent>
                                </Card>

                                {/* Requirements Section Skeleton */}
                                <Card>
                                    <CardHeader>
                                        <Skeleton className="h-7 w-36" />
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="h-4 w-full mb-2" />
                                        <Skeleton className="h-4 w-4/5 mb-2" />
                                        <Skeleton className="h-4 w-3/4" />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar - Right Column */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-8">
                                    <Card className="shadow-lg">
                                        <CardContent className="p-6">
                                            {/* Scholarship Info Skeleton */}
                                            <div className="text-center mb-6">
                                                <Skeleton className="h-8 w-40 mx-auto mb-2" />
                                                <Skeleton className="h-4 w-32 mx-auto" />
                                            </div>

                                            {/* Deadline Alert Skeleton */}
                                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                                                <Skeleton className="h-4 w-32 mb-2" />
                                                <Skeleton className="h-4 w-24" />
                                            </div>

                                            {/* Apply Button Skeleton */}
                                            <Skeleton className="h-12 w-full mb-4 rounded-lg" />

                                            {/* Additional Info Skeleton */}
                                            <Skeleton className="h-3 w-48 mx-auto mb-4" />

                                            {/* Features List Skeleton */}
                                            <div className="space-y-3 mb-6">
                                                {[...Array(4)].map((_, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <Skeleton className="w-2 h-2 rounded-full" />
                                                        <Skeleton className="h-3 w-32" />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Back Button Skeleton */}
                                            <Skeleton className="h-10 w-full rounded-lg" />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
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
                <div className="max-w-7xl mx-auto">

                    {/* Breadcrumbs */}
                    <Breadcrumbs
                        className="mb-6"
                        items={[
                            { label: 'Scholarships', href: '/scholarship' },
                            { label: scholarship?.title || 'Details', active: true }
                        ]}
                    />

                    {/* Two-Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content - Left Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Scholarship Header */}
                            <div className="bg-white rounded-lg p-6 shadow-sm border">
                                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                    {scholarship.title}
                                </h1>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {scholarship.location}
                                    </Badge>
                                    <Badge variant="outline">
                                        {scholarship.type}
                                    </Badge>
                                </div>

                                <p className="text-gray-600 text-lg leading-relaxed">
                                    {scholarship.description}
                                </p>
                            </div>

                            {/* What You'll Get Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900">
                                        What you'll get
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose prose-gray max-w-none">
                                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                                            {scholarship.benefits}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Requirements Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900">
                                        Requirements
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose prose-gray max-w-none">
                                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                                            {scholarship.requirements}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar - Right Column */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-8">
                                <Card className="shadow-lg">
                                    <CardContent className="p-6">
                                        {/* Scholarship Info */}
                                        <div className="text-center mb-6">
                                            <div className="text-3xl font-bold text-gray-900 mb-2">
                                                {scholarship.scholarshipValue || 'Full Scholarship'}
                                            </div>
                                            <div className="text-gray-600">
                                                Available for {scholarship.eligibleStudents || 'eligible students'}
                                            </div>
                                        </div>

                                        {/* Deadline Alert */}
                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                                            <div className="flex items-center gap-2 text-orange-800">
                                                <AlertCircle className="h-4 w-4" />
                                                <span className="font-medium">Application Deadline</span>
                                            </div>
                                            <div className="text-orange-700 mt-1">
                                                {formatDate(scholarship.deadline)}
                                            </div>
                                        </div>

                                        {/* Apply Button */}
                                        {!isExpired ? (
                                            <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        size="lg"
                                                        className="w-full bg-indigo-600 hover:bg-indigo-800 text-white text-lg py-3 mb-4"

                                                    >
                                                        Apply Now
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
                                                                className="bg-purple-600 hover:bg-purple-700 text-white"
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
                                        ) : (
                                            <div className="w-full bg-gray-200 text-gray-600 text-center py-3 rounded-lg text-lg">
                                                Application Closed
                                            </div>
                                        )}

                                        {/* Additional Info */}
                                        <div className="text-center text-sm text-gray-600 mb-4">
                                            Submit your school information in PDF format
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Scholarshipdetails;