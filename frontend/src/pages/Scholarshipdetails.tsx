import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import StudentNavbar from '../components/studentNavbar';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
    ArrowLeft,
    MapPin,
    AlertCircle,
    FileText,
    X,
    Calendar,
    Users,
    Award,
    Target,
    FileCheck
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '../components/ui/dialog';
import toast from 'react-hot-toast';
import { submitApplication } from '../services/applications';
import { useAuth } from '../AuthProvider/AuthProvider';
import { Breadcrumbs } from '../components/ui/breadcrumbs';

interface Scholarship {
    id: string;
    title: string;
    description: string;
    location: string;
    benefits: string;
    deadline: string;
    type: string;
    requirements: string;
    status: 'ACTIVE' | 'EXPIRED';
    createdAt: string;
    updatedAt: string;
    providerId: string;
    applicationLink?: string;
    scholarshipValue?: string;
    eligibleStudents?: string;
}

const getScholarshipDetails = async (id: string): Promise<Scholarship> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/scholar/get-scholarship/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Scholarship not found');
        }
        throw new Error('Failed to fetch scholarship details');
    }

    const data = await response.json();
    return data.data;
};

// Text formatting utilities
const formatTextContent = (text: string): string => {
    return String(text || '')
        .split(/\r?\n/) // handle CRLF and LF
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
};

const formatBulletPoints = (text: string): string[] => {
    // Accept either a string with newlines or an array-like string
    const raw = String(text || '');
    return raw
        .split(/\r?\n/) // handle CRLF and LF
        .map(line => line.replace(/^[-•*\s]+/, '').trim()) // remove leading bullets and extra whitespace
        .filter(line => line.length > 0);
};

const ScholarshipDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const { data: scholarship, isLoading, error } = useQuery<Scholarship, Error>({
        queryKey: ['scholarship', id],
        queryFn: () => getScholarshipDetails(id!),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
        retry: 1
    });

    // Application state
    const [isApplyOpen, setIsApplyOpen] = useState(false);
    const [applicationData, setApplicationData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: ''
    });
    const [applyFile, setApplyFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Utility functions
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const getDaysUntilDeadline = (deadline: string) => {
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const handleBack = () => navigate('/scholarship');

    // File handling
    const handleApplyFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error('Please upload a PDF file only.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        setApplyFile(file);
        toast.success('PDF file selected for application');
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleApplyFileChange({ target: { files: [file] } } as any);
    };

    // Application submission
    const applicationMutation = useMutation({
        mutationFn: (submissionData: any) => submitApplication(submissionData, user?.id),
        onSuccess: () => {
            toast.success('Application submitted successfully!');
            setIsApplyOpen(false);
            setApplyFile(null);
            setApplicationData({
                firstName: '',
                middleName: '',
                lastName: '',
                email: '',
                phone: '',
                address: '',
                city: ''
            });
        },
        onError: (error: Error) => {
            console.error('Application submission error:', error);
            let errorMessage = 'Failed to submit application';

            if (error.message.includes('400')) errorMessage = 'Please check your information and try again.';
            else if (error.message.includes('401')) errorMessage = 'Please log in again to submit your application.';
            else if (error.message.includes('already applied')) errorMessage = 'You have already applied for this scholarship.';
            else if (error.message) errorMessage = error.message;

            toast.error(errorMessage);
        }
    });

    const handleApplicationSubmit = () => {
        const { firstName, middleName, lastName, email, phone, address, city } = applicationData;

        if (!firstName || !lastName || !email || !phone || !address || !city) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!applyFile) {
            toast.error('Please upload your school document');
            return;
        }

        const submissionData = {
            scholarshipId: scholarship!.id,
            documents: [applyFile],
            Firstname: firstName.trim(),
            Lastname: lastName.trim(),
            Email: email.trim(),
            Phone: phone.trim(),
            Address: address.trim(),
            City: city.trim(),
            ...(middleName.trim() && { Middlename: middleName.trim() })
        };

        applicationMutation.mutate(submissionData);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <StudentNavbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-7xl mx-auto">
                        <Skeleton className="h-6 w-64 mb-6" />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <Card className="border-0 shadow-lg">
                                    <CardContent className="p-8">
                                        <Skeleton className="h-8 w-3/4 mb-4" />
                                        <div className="flex gap-2 mb-6">
                                            <Skeleton className="h-6 w-24 rounded-full" />
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </div>
                                        <Skeleton className="h-4 w-full mb-3" />
                                        <Skeleton className="h-4 w-5/6 mb-3" />
                                        <Skeleton className="h-4 w-4/6" />
                                    </CardContent>
                                </Card>
                                <Card className="border-0 shadow-lg">
                                    <CardHeader>
                                        <Skeleton className="h-7 w-48" />
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-4/5" />
                                        <Skeleton className="h-4 w-3/4" />
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="lg:col-span-1">
                                <Card className="border-0 shadow-xl sticky top-8">
                                    <CardContent className="p-6">
                                        <Skeleton className="h-8 w-40 mx-auto mb-4" />
                                        <Skeleton className="h-20 w-full mb-6 rounded-lg" />
                                        <Skeleton className="h-12 w-full mb-4 rounded-xl" />
                                        <Skeleton className="h-3 w-48 mx-auto" />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error states
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <StudentNavbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <Button variant="ghost" onClick={handleBack} className="mb-6 flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Scholarships
                        </Button>
                        <Card className="border-red-200 bg-red-50/50 border-0 shadow-lg">
                            <CardContent className="p-8 text-center">
                                <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                                <CardTitle className="text-2xl font-bold text-red-900 mb-2">
                                    Error Loading Scholarship
                                </CardTitle>
                                <p className="text-red-700 mb-6">{error.message}</p>
                                <div className="flex gap-3 justify-center">
                                    <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 text-white">
                                        Try Again
                                    </Button>
                                    <Button variant="outline" onClick={handleBack} className="border-red-200 text-red-700">
                                        Back to Scholarships
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    if (!scholarship) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <StudentNavbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <Button variant="ghost" onClick={handleBack} className="mb-6 flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Scholarships
                        </Button>
                        <Card className="text-center py-16 border-0 shadow-lg">
                            <CardContent>
                                <AlertCircle className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                                <CardTitle className="text-3xl font-bold text-gray-700 mb-4">
                                    Scholarship Not Found
                                </CardTitle>
                                <p className="text-gray-600 mb-8 text-lg">
                                    The scholarship you're looking for doesn't exist or may have been removed.
                                </p>
                                <Button onClick={handleBack} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                                    Browse All Scholarships
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // Scholarship status calculations
    const isExpired = scholarship.status === 'EXPIRED' || new Date(scholarship.deadline) < new Date();
    const daysUntilDeadline = getDaysUntilDeadline(scholarship.deadline);
    const isUrgent = daysUntilDeadline <= 7 && daysUntilDeadline > 0;
    const benefitsList = formatBulletPoints(scholarship.benefits);
    const requirementsList = formatBulletPoints(scholarship.requirements);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <StudentNavbar />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    <Breadcrumbs
                        className="mb-8"
                        items={[
                            { label: 'Scholarships', href: '/scholarship' },
                            { label: scholarship.title, active: true }
                        ]}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Scholarship Header */}
                            <Card className="border-0 shadow-lg">
                                <CardContent className="p-8">
                                    <div className="flex items-start justify-between mb-4">
                                        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                                            {scholarship.title}
                                        </h1>
                                    </div>

                                    <div className="flex flex-wrap gap-3 mb-6">
                                        <Badge variant="secondary" className="flex items-center gap-2 bg-blue-50 text-blue-700">
                                            <MapPin className="h-4 w-4" />
                                            {scholarship.location}
                                        </Badge>
                                        <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
                                            {scholarship.type}
                                        </Badge>
                                    </div>

                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {formatTextContent(scholarship.description)}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Scholarship Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Benefits */}
                                <Card className="border-0 shadow-lg">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-2 text-gray-900">
                                            <Award className="h-5 w-5 text-green-600" />
                                            Scholarship Benefits
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-3">
                                            {benefitsList.map((benefit, index) => (
                                                <li key={index} className="flex items-start gap-3">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                                    <span className="text-gray-700 leading-relaxed">{benefit}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>

                                {/* Requirements */}
                                <Card className="border-0 shadow-lg">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-2 text-gray-900">
                                            <Target className="h-5 w-5 text-blue-600" />
                                            Eligibility Requirements
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-3">
                                            {requirementsList.map((requirement, index) => (
                                                <li key={index} className="flex items-start gap-3">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                                    <span className="text-gray-700 leading-relaxed">{requirement}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-8 space-y-6">
                                {/* Application Card */}
                                <Card className="border-0 shadow-xl">
                                    <CardContent className="p-6">
                                        <div className="text-center mb-6">
                                            <div className="text-3xl font-bold text-gray-900 mb-2">
                                                {scholarship.scholarshipValue || 'Full Scholarship'}
                                            </div>
                                            <div className="text-gray-600 flex items-center justify-center gap-1">
                                                <Users className="h-4 w-4" />
                                                For {scholarship.eligibleStudents || 'eligible students'}
                                            </div>
                                        </div>

                                        {/* Deadline */}
                                        <div className={`rounded-lg p-4 mb-6 border ${isExpired ? 'bg-red-50 border-red-200' :
                                            isUrgent ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'
                                            }`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Calendar className={`h-4 w-4 ${isExpired ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-blue-600'
                                                    }`} />
                                                <span className={`font-semibold text-sm ${isExpired ? 'text-red-800' : isUrgent ? 'text-orange-800' : 'text-blue-800'
                                                    }`}>
                                                    Application Deadline
                                                </span>
                                            </div>
                                            <div className={`font-bold ${isExpired ? 'text-red-700' : isUrgent ? 'text-orange-700' : 'text-blue-700'
                                                }`}>
                                                {formatDate(scholarship.deadline)}
                                            </div>
                                            {!isExpired && (
                                                <div className={`text-sm mt-1 ${isUrgent ? 'text-orange-600' : 'text-blue-600'
                                                    }`}>
                                                    {daysUntilDeadline > 0 ? (
                                                        `${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''} remaining`
                                                    ) : (
                                                        'Last day to apply!'
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Apply Button */}
                                        {!isExpired ? (
                                            <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
                                                <Button
                                                    size="lg"
                                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 mb-4"
                                                    onClick={() => setIsApplyOpen(true)}
                                                >
                                                    Apply Now
                                                </Button>

                                                <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-2xl font-bold">
                                                            Apply for {scholarship.title}
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            Complete your application by filling out the form below and uploading required documents.
                                                        </DialogDescription>
                                                    </DialogHeader>

                                                    <div className="space-y-6">
                                                        {/* Personal Information */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-medium">First name *</label>
                                                                <input
                                                                    value={applicationData.firstName}
                                                                    onChange={(e) => setApplicationData(prev => ({
                                                                        ...prev,
                                                                        firstName: e.target.value
                                                                    }))}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                    placeholder="Enter your first name"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-medium">Last name *</label>
                                                                <input
                                                                    value={applicationData.lastName}
                                                                    onChange={(e) => setApplicationData(prev => ({
                                                                        ...prev,
                                                                        lastName: e.target.value
                                                                    }))}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                    placeholder="Enter your last name"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Email address *</label>
                                                            <input
                                                                type="email"
                                                                value={applicationData.email}
                                                                onChange={(e) => setApplicationData(prev => ({
                                                                    ...prev,
                                                                    email: e.target.value
                                                                }))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                placeholder="your.email@example.com"
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-medium">Phone number *</label>
                                                                <input
                                                                    type="tel"
                                                                    value={applicationData.phone}
                                                                    onChange={(e) => setApplicationData(prev => ({
                                                                        ...prev,
                                                                        phone: e.target.value
                                                                    }))}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                    placeholder="Your phone number"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-medium">City *</label>
                                                                <input
                                                                    value={applicationData.city}
                                                                    onChange={(e) => setApplicationData(prev => ({
                                                                        ...prev,
                                                                        city: e.target.value
                                                                    }))}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                    placeholder="Your city"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Address *</label>
                                                            <input
                                                                value={applicationData.address}
                                                                onChange={(e) => setApplicationData(prev => ({
                                                                    ...prev,
                                                                    address: e.target.value
                                                                }))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                placeholder="Your full address"
                                                            />
                                                        </div>

                                                        {/* File Upload */}
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">School document (PDF) *</label>
                                                            <div
                                                                onDragOver={handleDragOver}
                                                                onDragLeave={handleDragLeave}
                                                                onDrop={handleDrop}
                                                                onClick={() => fileInputRef.current?.click()}
                                                                role="button"
                                                                tabIndex={0}
                                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                                                                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                                                                    }`}
                                                            >
                                                                <input
                                                                    ref={fileInputRef}
                                                                    type="file"
                                                                    accept="application/pdf"
                                                                    onChange={handleApplyFileChange}
                                                                    className="hidden"
                                                                    id="file-upload"
                                                                />
                                                                <FileCheck className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                                                <p className="text-gray-600 font-medium mb-1">
                                                                    Drag & drop your PDF here
                                                                </p>
                                                                <p className="text-gray-500 text-sm">
                                                                    or <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="text-blue-600 font-medium underline-offset-2">browse files</button>
                                                                </p>
                                                                <p className="text-gray-400 text-xs mt-1">Max file size: 5MB</p>
                                                            </div>

                                                            {applyFile && (
                                                                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <FileText className="h-4 w-4 text-green-600" />
                                                                        <span className="font-medium text-green-800">{applyFile.name}</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setApplyFile(null)}
                                                                        className="text-red-600 hover:text-red-800"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <DialogFooter>
                                                        <DialogClose asChild>
                                                            <Button variant="outline">Cancel</Button>
                                                        </DialogClose>
                                                        <Button
                                                            onClick={handleApplicationSubmit}
                                                            disabled={applicationMutation.isPending}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                                        >
                                                            {applicationMutation.isPending ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                                    Submitting...
                                                                </div>
                                                            ) : (
                                                                'Submit Application'
                                                            )}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        ) : (
                                            <div className="w-full bg-gray-100 text-gray-500 text-center py-3 rounded-lg font-medium">
                                                Application Closed
                                            </div>
                                        )}

                                        <div className="text-center text-sm text-gray-500 mt-3">
                                            Secure application process
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
};

export default ScholarshipDetails;