import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
import toast from 'react-hot-toast';

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

    const handleSubmitApplication = () => {
        if (!uploadedFile) {
            toast.error('Please upload your school information in PDF format.')
            return
        }
        // Handle application submission with file
        toast.success('Application submitted successfully!')
        // Add actual submission logic here
    }

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

                    {/* Main Content */}
                    <div className="space-y-6">
                        {/* Header Card */}
                        <Card>
                            <CardHeader>
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
                                        </div>
                                    </div>
                                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 border flex items-center gap-1">
                                        <span>Deadline: </span>
                                        {formatDate(scholarship.deadline)}

                                    </Badge>
                                </div>
                            </CardHeader>

                        </Card>
                        {/* Description */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold text-gray-800">
                                    Description
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {scholarship.description}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Benefits and Requirements */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Benefits */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-gray-800">
                                        Benefits
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 leading-relaxed">
                                        {scholarship.benefits}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Requirements */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-gray-800">
                                        Requirements
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 leading-relaxed">
                                        {scholarship.requirements}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Apply Section */}
                        <Card>
                            <CardContent className="p-6">
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
                                        {/* File Upload Area */}
                                        <div
                                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragOver
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                                                }`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                        >
                                            {uploadedFile ? (
                                                <div className="flex items-center justify-center gap-3">
                                                    <FileText className="h-8 w-8 text-green-600" />
                                                    <div className="flex-1 text-left">
                                                        <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={removeFile}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                    <p className="text-lg font-medium text-gray-700 mb-2">
                                                        Upload School Information
                                                    </p>
                                                    <p className="text-sm text-gray-500 mb-4">
                                                        Drag and drop your PDF file here, or click to browse
                                                    </p>
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        onChange={handleFileUpload}
                                                        className="hidden"
                                                        id="file-upload"
                                                    />
                                                    <label
                                                        htmlFor="file-upload"
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors"
                                                    >
                                                        <Upload className="h-4 w-4" />
                                                        Choose PDF File
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        {/* Submit Button */}
                                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                            <Button
                                                size="lg"
                                                onClick={handleSubmitApplication}
                                                className="bg-indigo-600 hover:bg-indigo-600 text-white"
                                            >
                                                Submit Application
                                            </Button>
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
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Scholarshipdetails