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
    Users,
    FileCheck,
    Clock,
    Shield,
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
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
};

const formatBulletPoints = (text: string): string[] => {
    const raw = String(text || '');
    return raw
        .split(/\r?\n/)
        .map(line => line.replace(/^[-•*\s]+/, '').trim())
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

        if (!firstName || !middleName || !lastName || !email || !phone || !address || !city) {
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
            MiddleName: middleName.trim(),
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
            <div className="min-h-screen bg-white">
                <StudentNavbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-7xl mx-auto">
                        <Skeleton className="h-6 w-64 mb-8 bg-gray-200" />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <Card className="border border-gray-200 bg-white shadow-sm rounded-xl">
                                    <CardContent className="p-8">
                                        <Skeleton className="h-8 w-3/4 mb-4 bg-gray-200" />
                                        <div className="flex gap-2 mb-6">
                                            <Skeleton className="h-6 w-24 rounded-full bg-gray-200" />
                                            <Skeleton className="h-6 w-20 rounded-full bg-gray-200" />
                                        </div>
                                        <Skeleton className="h-4 w-full mb-3 bg-gray-200" />
                                        <Skeleton className="h-4 w-5/6 mb-3 bg-gray-200" />
                                        <Skeleton className="h-4 w-4/6 bg-gray-200" />
                                    </CardContent>
                                </Card>
                                <Card className="border border-gray-200 bg-white shadow-sm rounded-xl">
                                    <CardHeader>
                                        <Skeleton className="h-7 w-48 bg-gray-200" />
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Skeleton className="h-4 w-full bg-gray-200" />
                                        <Skeleton className="h-4 w-4/5 bg-gray-200" />
                                        <Skeleton className="h-4 w-3/4 bg-gray-200" />
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="lg:col-span-1">
                                <Card className="border border-gray-200 bg-white shadow-sm rounded-xl sticky top-8">
                                    <CardContent className="p-6">
                                        <Skeleton className="h-8 w-40 mx-auto mb-4 bg-gray-200" />
                                        <Skeleton className="h-20 w-full mb-6 rounded-lg bg-gray-200" />
                                        <Skeleton className="h-12 w-full mb-4 rounded-lg bg-gray-200" />
                                        <Skeleton className="h-3 w-48 mx-auto bg-gray-200" />
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
            <div className="min-h-screen bg-white">
                <StudentNavbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <Button variant="ghost" onClick={handleBack} className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Scholarships
                        </Button>
                        <Card className="border border-red-200 bg-white shadow-sm rounded-xl">
                            <CardContent className="p-8 text-center">
                                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                                    Error Loading Scholarship
                                </CardTitle>
                                <p className="text-gray-700 mb-6">{error.message}</p>
                                <div className="flex gap-3 justify-center">
                                    <Button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                                        Try Again
                                    </Button>
                                    <Button variant="outline" onClick={handleBack} className="border-gray-300 text-gray-700 rounded-lg">
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
            <div className="min-h-screen bg-white">
                <StudentNavbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <Button variant="ghost" onClick={handleBack} className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Scholarships
                        </Button>
                        <Card className="text-center py-16 border border-gray-200 bg-white shadow-sm rounded-xl">
                            <CardContent>
                                <AlertCircle className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                                <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
                                    Scholarship Not Found
                                </CardTitle>
                                <p className="text-gray-600 mb-8 text-lg">
                                    The scholarship you're looking for doesn't exist or may have been removed.
                                </p>
                                <Button onClick={handleBack} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 text-lg rounded-lg">
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
        <div className="min-h-screen bg-white">
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
                            <Card className="border border-gray-200 bg-white shadow-sm rounded-xl overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-6">
                                    <h1 className="text-3xl font-bold text-white leading-tight mb-3">
                                        {scholarship.title}
                                    </h1>
                                    <div className="flex flex-wrap gap-3">
                                        <Badge className="flex items-center gap-2 bg-white/20 text-white backdrop-blur-sm border-0">
                                            <MapPin className="h-4 w-4" />
                                            {scholarship.location}
                                        </Badge>
                                        <Badge className="bg-white/10 text-white backdrop-blur-sm border-0">
                                            {scholarship.type}
                                        </Badge>
                                    </div>
                                </div>
                                <CardContent className="p-8">
                                    <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                                        {formatTextContent(scholarship.description)}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Scholarship Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Benefits */}
                                <Card className="border border-gray-200 bg-white shadow-sm rounded-xl">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-3 text-gray-900">
                                            <span className="text-xl">Scholarship Benefits</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-4">
                                            {benefitsList.map((benefit, index) => (
                                                <li key={index} className="flex items-start gap-4">
                                                    <span className="text-gray-700 leading-relaxed">{benefit}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>

                                {/* Requirements */}
                                <Card className="border border-gray-200 bg-white shadow-sm rounded-xl">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-3 text-gray-900">
                                            <span className="text-xl">Eligibility Requirements</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-4">
                                            {requirementsList.map((requirement, index) => (
                                                <li key={index} className="flex items-start gap-4">

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
                                <Card className="border border-gray-200 bg-white shadow-sm rounded-xl overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="text-center mb-6">
                                            <div className="text-3xl font-bold text-gray-900 mb-2">
                                                {scholarship.scholarshipValue || 'Full Scholarship'}
                                            </div>
                                            <div className="text-gray-600 flex items-center justify-center gap-2">
                                                <Users className="h-4 w-4" />
                                                For {scholarship.eligibleStudents || 'eligible students'}
                                            </div>
                                        </div>

                                        {/* Deadline */}
                                        <div className={`rounded-xl p-4 mb-6 border ${isExpired
                                            ? 'bg-red-50 border-red-200'
                                            : isUrgent
                                                ? 'bg-orange-50 border-orange-200'
                                                : 'bg-indigo-50 border-indigo-200'
                                            }`}>
                                            <div className="flex items-center gap-3 mb-2">
                                                <Clock className={`h-5 w-5 ${isExpired ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-indigo-600'
                                                    }`} />
                                                <span className={`font-semibold text-sm ${isExpired ? 'text-red-800' : isUrgent ? 'text-orange-800' : 'text-indigo-800'
                                                    }`}>
                                                    Application Deadline
                                                </span>
                                            </div>
                                            <div className={`font-bold text-lg ${isExpired ? 'text-red-700' : isUrgent ? 'text-orange-700' : 'text-indigo-700'
                                                }`}>
                                                {formatDate(scholarship.deadline)}
                                            </div>
                                            {!isExpired && (
                                                <div className={`text-sm mt-2 font-medium ${isUrgent ? 'text-orange-600' : 'text-indigo-600'
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
                                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 mb-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                                                    onClick={() => setIsApplyOpen(true)}
                                                >
                                                    Apply Now
                                                </Button>

                                                {/* responsive modal width: full on small screens, constrained on larger screens */}
                                                {/* wider modal so internal form fields don't compress on desktop */}
                                                <DialogContent className="w-full max-w-[900px] sm:max-w-[900px] max-h-[85vh] overflow-auto border border-gray-200 rounded-xl bg-white">
                                                    <DialogHeader className="border-b border-gray-200 pb-6">
                                                        <DialogTitle className="text-2xl font-bold text-gray-900">
                                                            Apply for {scholarship.title}
                                                        </DialogTitle>
                                                        <DialogDescription className="text-gray-600 text-lg">
                                                            Complete your application by filling out the form below and uploading required documents.
                                                        </DialogDescription>
                                                    </DialogHeader>

                                                    <div className="space-y-6 py-6">
                                                        {/* Personal Information */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                            {[
                                                                { key: 'firstName', label: 'First name *', placeholder: 'Enter your first name' },
                                                                { key: 'middleName', label: 'Middle name *', placeholder: 'Enter your middle name' },
                                                                { key: 'lastName', label: 'Last name *', placeholder: 'Enter your last name' }
                                                            ].map((field) => (
                                                                <div key={field.key} className="space-y-2">
                                                                    <label className="text-sm font-medium text-gray-700">{field.label}</label>
                                                                    <input
                                                                        value={applicationData[field.key as keyof typeof applicationData]}
                                                                        onChange={(e) => setApplicationData(prev => ({
                                                                            ...prev,
                                                                            [field.key]: e.target.value
                                                                        }))}
                                                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors"
                                                                        placeholder={field.placeholder}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-gray-700">Email address *</label>
                                                            <input
                                                                type="email"
                                                                value={applicationData.email}
                                                                onChange={(e) => setApplicationData(prev => ({
                                                                    ...prev,
                                                                    email: e.target.value
                                                                }))}
                                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors"
                                                                placeholder="your.email@example.com"
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-medium text-gray-700">Phone number *</label>
                                                                <input
                                                                    type="tel"
                                                                    value={applicationData.phone}
                                                                    onChange={(e) => setApplicationData(prev => ({
                                                                        ...prev,
                                                                        phone: e.target.value
                                                                    }))}
                                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors"
                                                                    placeholder="Your phone number"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-medium text-gray-700">City *</label>
                                                                <input
                                                                    value={applicationData.city}
                                                                    onChange={(e) => setApplicationData(prev => ({
                                                                        ...prev,
                                                                        city: e.target.value
                                                                    }))}
                                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors"
                                                                    placeholder="Your city"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-gray-700">Address *</label>
                                                            <input
                                                                value={applicationData.address}
                                                                onChange={(e) => setApplicationData(prev => ({
                                                                    ...prev,
                                                                    address: e.target.value
                                                                }))}
                                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors"
                                                                placeholder="Your full address"
                                                            />
                                                        </div>

                                                        {/* File Upload */}
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-gray-700">School document (PDF) *</label>
                                                            <div
                                                                onDragOver={handleDragOver}
                                                                onDragLeave={handleDragLeave}
                                                                onDrop={handleDrop}
                                                                onClick={() => fileInputRef.current?.click()}
                                                                role="button"
                                                                tabIndex={0}
                                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                                                                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${isDragOver
                                                                    ? 'border-indigo-600 bg-indigo-50'
                                                                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
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
                                                                    or <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="text-indigo-600 font-medium underline-offset-2 hover:underline">browse files</button>
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
                                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <DialogFooter className="border-t border-gray-200 pt-6">
                                                        <DialogClose asChild>
                                                            <Button variant="outline" className="border-gray-300 text-gray-700 rounded-lg">Cancel</Button>
                                                        </DialogClose>
                                                        <Button
                                                            onClick={handleApplicationSubmit}
                                                            disabled={applicationMutation.isPending}
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6"
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

                                        <div className="text-center text-sm text-gray-500 mt-3 flex items-center justify-center gap-2">
                                            <Shield className="h-4 w-4" />
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