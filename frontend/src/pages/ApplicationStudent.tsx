import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { getUserApplications, withdrawApplication } from '../services/applications';
import { CalendarDays, MapPin, DollarSign, FileText, Clock, CheckCircle, XCircle, AlertCircle, Send, Eye, Trash2 } from 'lucide-react';
import StudentNavbar from '../components/studentNavbar';
import { useAuth } from '../AuthProvider/AuthProvider';

interface Application {
    id: string;
    userId: string;
    scholarshipId: string;
    status: 'PENDING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED';
    submittedAt: string;
    scholarship: {
        id: string;
        title: string;
        description: string;
        deadline: string;
        location: string;
        benefits: string;
        requirements: string;
        type: string;
        status: 'ACTIVE' | 'EXPIRED';
    };
}

const ApplicationStudent = () => {
    const { getToken } = useAuth();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const applicationsData = await getUserApplications(token || undefined);
            setApplications(applicationsData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'SUBMITTED':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'UNDER_REVIEW':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'ACCEPTED':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'REJECTED':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Clock className="w-4 h-4" />;
            case 'SUBMITTED':
                return <Send className="w-4 h-4" />;
            case 'UNDER_REVIEW':
                return <Eye className="w-4 h-4" />;
            case 'ACCEPTED':
                return <CheckCircle className="w-4 h-4" />;
            case 'REJECTED':
                return <XCircle className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    const handleWithdraw = async (applicationId: string) => {
        try {
            const token = await getToken();
            await withdrawApplication(applicationId, token || undefined);
            await fetchData(); // Refresh data
        } catch (error) {
            console.error('Error withdrawing application:', error);
        }
    };

    if (loading) {
        return (
            <>
                <StudentNavbar />
                <div className="h-screen bg-gray-50 flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                            <div className="flex items-center justify-center h-64">
                                <div className="flex items-center gap-3">
                                    {/* SVG gradient arc spinner */}
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <linearGradient id="lg-spinner-home" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#4F39F6" stopOpacity="1" />
                                                <stop offset="100%" stopColor="#C7B8FF" stopOpacity="0.6" />
                                            </linearGradient>
                                        </defs>
                                        <g className="animate-spin origin-center">
                                            <circle cx="12" cy="12" r="9" stroke="url(#lg-spinner-home)" strokeWidth="2" strokeLinecap="round" strokeDasharray="40 120" strokeDashoffset="0" fill="none" />
                                        </g>
                                    </svg>
                                    <div className="text-lg text-gray-600">Loading...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <StudentNavbar />
            <div className="4h-screen bg-gray-50 flex flex-col">
                {/* Scrollable container with custom scrollbar */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                My Applications
                            </h1>
                            <p className="text-gray-600">
                                Track your scholarship application status
                            </p>
                        </div>

                        <div className="space-y-6">
                            {applications.length === 0 ? (
                                <Card>
                                    <CardContent className="py-12">
                                        <div className="text-center">
                                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                No Applications Yet
                                            </h3>
                                            <p className="text-gray-600 mb-4">
                                                You haven't applied to any scholarships yet.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                applications.map((application) => (
                                    <Card key={application.id}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg">
                                                        {application.scholarship.title}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        Applied on{" "}
                                                        {new Date(
                                                            application.submittedAt
                                                        ).toLocaleDateString()}
                                                    </CardDescription>
                                                </div>
                                                <Badge className={getStatusColor(application.status)}>
                                                    <div className="flex items-center gap-1">
                                                        {getStatusIcon(application.status)}
                                                        {application.status.replace("_", " ")}
                                                    </div>
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <MapPin className="w-4 h-4 mr-2" />
                                                    {application.scholarship.location}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <CalendarDays className="w-4 h-4 mr-2" />
                                                    Deadline:{" "}
                                                    {new Date(
                                                        application.scholarship.deadline
                                                    ).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <DollarSign className="w-4 h-4 mr-2" />
                                                    {application.scholarship.type}
                                                </div>
                                            </div>

                                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                                {application.scholarship.description}
                                            </p>

                                            <div className="flex gap-2">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm">
                                                            View Details
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle>
                                                                {application.scholarship.title}
                                                            </DialogTitle>
                                                            <DialogDescription>
                                                                Application Details
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4">
                                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                                <h4 className="font-semibold mb-2">
                                                                    Application Status
                                                                </h4>
                                                                <Badge
                                                                    className={getStatusColor(application.status)}
                                                                >
                                                                    <div className="flex items-center gap-1">
                                                                        {getStatusIcon(application.status)}
                                                                        {application.status.replace("_", " ")}
                                                                    </div>
                                                                </Badge>
                                                                <p className="text-sm text-gray-600 mt-2">
                                                                    Submitted on{" "}
                                                                    {new Date(
                                                                        application.submittedAt
                                                                    ).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold mb-2">
                                                                    Scholarship Description
                                                                </h4>
                                                                <p className="text-sm text-gray-600">
                                                                    {application.scholarship.description}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold mb-2">Benefits</h4>
                                                                <p className="text-sm text-gray-600">
                                                                    {application.scholarship.benefits}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>

                                                {application.status === "PENDING" && (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleWithdraw(application.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-1" />
                                                        Withdraw
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ApplicationStudent;