import { useAuth } from '../AuthProvider/AuthProvider'
import { useQuery } from '@tanstack/react-query'
import {
    SidebarProvider,
    SidebarInset,
} from '../components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import {
    Users,
    GraduationCap,
    TrendingUp,
    Eye,
    BarChart3,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    FileText,
    Award,
} from 'lucide-react'
import OrgSidebar from '../components/orgSidebar'
import Navbar from '../components/Navbar'

// Types for our data
interface OrganizationStats {
    totalScholarships: number;
    activeScholarships: number;
    totalApplications: number;
    archivedScholarships: number;
}

interface Application {
    id: string;
    userId: string;
    scholarshipId: string;
    status: 'PENDING' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED';
    submittedAt: string;
    Firstname: string;
    Lastname: string;
    Email: string;
    scholarship: {
        id: string;
        title: string;
        deadline: string;
        benefits: string;
    };
}

interface Scholarship {
    id: string;
    title: string;
    description: string;
    deadline: string;
    location: string;
    benefits: string;
    requirements: string;
    type: string;
    status: 'ACTIVE' | 'EXPIRED';
    createdAt: string;
    updatedAt: string;
}

const orgdashboard = () => {
    const { user } = useAuth()

    // Fetch organization statistics
    const { data: stats, isLoading: statsLoading } = useQuery<OrganizationStats>({
        queryKey: ['organization-stats', user?.id],
        queryFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/organization/stats`, {
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }
            return response.json();
        },
        enabled: !!user?.id && user?.role === 'ORGANIZATION',
    });

    // Fetch organization's scholarships
    const { data: scholarships, isLoading: scholarshipsLoading } = useQuery<Scholarship[]>({
        queryKey: ['organization-scholarships', user?.id],
        queryFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/scholar/organization`, {
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error('Failed to fetch scholarships');
            }
            const data = await response.json();
            return data.data || [];
        },
        enabled: !!user?.id && user?.role === 'ORGANIZATION',
    });

    // Fetch recent applications across all scholarships
    const { data: recentApplications, isLoading: applicationsLoading } = useQuery<Application[]>({
        queryKey: ['recent-applications', user?.id],
        queryFn: async () => {
            if (!scholarships || scholarships.length === 0) return [];

            // Get applications for all scholarships
            const allApplications: Application[] = [];
            for (const scholarship of scholarships) {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/applications/scholarship/${scholarship.id}`, {
                        credentials: 'include',
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const applicationsWithScholarship = (data.data || []).map((app: any) => ({
                            ...app,
                            scholarship: {
                                id: scholarship.id,
                                title: scholarship.title,
                                deadline: scholarship.deadline,
                                benefits: scholarship.benefits,
                            }
                        }));
                        allApplications.push(...applicationsWithScholarship);
                    }
                } catch (error) {
                    console.error(`Error fetching applications for scholarship ${scholarship.id}:`, error);
                }
            }

            // Sort by submission date and return the most recent 10
            return allApplications
                .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                .slice(0, 10);
        },
        enabled: !!scholarships && scholarships.length > 0,
    });

    // Calculate application statistics
    const applicationStats = recentApplications ? {
        pending: recentApplications.filter(app => app.status === 'PENDING').length,
        underReview: recentApplications.filter(app => app.status === 'UNDER_REVIEW').length,
        accepted: recentApplications.filter(app => app.status === 'ACCEPTED').length,
        rejected: recentApplications.filter(app => app.status === 'REJECTED').length,
    } : null;

    // Get upcoming deadlines (next 30 days)
    const upcomingDeadlines = scholarships?.filter(scholarship => {
        const deadlineDate = new Date(scholarship.deadline);
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        return deadlineDate > now && deadlineDate <= thirtyDaysFromNow && scholarship.status === 'ACTIVE';
    }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()) || [];

    // Helper function to format time ago
    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    };

    // Helper function to get deadline urgency
    const getDeadlineUrgency = (deadline: string) => {
        const deadlineDate = new Date(deadline);
        const now = new Date();
        const daysUntilDeadline = Math.floor((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDeadline <= 7) return { color: 'text-red-600', bgColor: 'bg-red-100', status: 'Closing Soon' };
        if (daysUntilDeadline <= 14) return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', status: 'Due Soon' };
        return { color: 'text-green-600', bgColor: 'bg-green-100', status: 'Active' };
    };

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <OrgSidebar />

                <SidebarInset className="flex-1">
                    <Navbar showSidebarToggle={true} pageTitle="Dashboard" />

                    <div className="flex flex-1 flex-col gap-6 p-6 bg-gray-50">
                        {/* Welcome Header */}
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.fullname || user?.email || 'User'}!</h1>
                            <p className="text-gray-600">Here's what's happening with your scholarships today.</p>
                        </div>

                        {/* Key Metrics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="border-gray-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1 font-medium">Total Scholarships</p>
                                            <p className="text-3xl font-bold text-gray-900">
                                                {statsLoading ? '...' : stats?.totalScholarships || 0}
                                            </p>
                                            <p className="text-sm text-indigo-600 mt-1 font-medium">
                                                {stats?.activeScholarships || 0} currently active
                                            </p>
                                        </div>
                                        <div className="bg-indigo-100 p-3 rounded-xl">
                                            <GraduationCap className="w-6 h-6 text-indigo-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-gray-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1 font-medium">Total Applications</p>
                                            <p className="text-3xl font-bold text-gray-900">
                                                {statsLoading ? '...' : stats?.totalApplications || 0}
                                            </p>
                                            <p className="text-sm text-green-600 mt-1 font-medium">
                                                {recentApplications?.filter(app => {
                                                    const today = new Date();
                                                    const appDate = new Date(app.submittedAt);
                                                    return appDate.toDateString() === today.toDateString();
                                                }).length || 0} received today
                                            </p>
                                        </div>
                                        <div className="bg-green-100 p-3 rounded-xl">
                                            <Users className="w-6 h-6 text-green-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-gray-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1 font-medium">Archived Scholarships</p>
                                            <p className="text-3xl font-bold text-gray-900">
                                                {statsLoading ? '...' : stats?.archivedScholarships || 0}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1 font-medium">
                                                Completed programs
                                            </p>
                                        </div>
                                        <div className="bg-yellow-100 p-3 rounded-xl">
                                            <Award className="w-6 h-6 text-yellow-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-gray-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1 font-medium">Acceptance Rate</p>
                                            <p className="text-3xl font-bold text-gray-900">
                                                {(() => {
                                                    const total = stats?.totalApplications || 0;
                                                    const accepted = recentApplications?.filter(app => app.status === 'ACCEPTED').length || 0;
                                                    const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;
                                                    return statsLoading ? '...' : `${rate}%`;
                                                })()}
                                            </p>
                                            <p className="text-sm text-purple-600 mt-1 font-medium">
                                                {recentApplications?.filter(app => app.status === 'ACCEPTED').length || 0} applications approved
                                            </p>
                                        </div>
                                        <div className="bg-purple-100 p-3 rounded-xl">
                                            <TrendingUp className="w-6 h-6 text-purple-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>



                        {/* Recent Activity & Analytics */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Activity */}
                            <Card className="border-gray-200 bg-white shadow-lg">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xl text-gray-900">Recent Applications</CardTitle>

                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {applicationsLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="text-gray-500">Loading recent applications...</div>
                                        </div>
                                    ) : recentApplications && recentApplications.length > 0 ? (
                                        recentApplications.slice(0, 4).map((application) => (
                                            <div key={application.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                                <div className={`p-2 rounded-xl mt-1 ${application.status === 'ACCEPTED' ? 'bg-green-100' :
                                                    application.status === 'REJECTED' ? 'bg-red-100' :
                                                        application.status === 'UNDER_REVIEW' ? 'bg-blue-100' :
                                                            'bg-yellow-100'
                                                    }`}>
                                                    {application.status === 'ACCEPTED' ? (
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                    ) : application.status === 'REJECTED' ? (
                                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                                    ) : application.status === 'UNDER_REVIEW' ? (
                                                        <Eye className="w-4 h-4 text-blue-600" />
                                                    ) : (
                                                        <FileText className="w-4 h-4 text-yellow-600" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-900 font-medium">
                                                        {application.status === 'ACCEPTED' ? 'Application Accepted' :
                                                            application.status === 'REJECTED' ? 'Application Rejected' :
                                                                application.status === 'UNDER_REVIEW' ? 'Application Under Review' :
                                                                    'New Application Received'}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        {application.Firstname} {application.Lastname} applied for {application.scholarship.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {getTimeAgo(application.submittedAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="text-center">
                                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                    <FileText className="w-8 h-8 text-indigo-600" />
                                                </div>
                                                <p className="text-gray-500 text-sm font-medium">No recent applications</p>
                                                <p className="text-gray-400 text-xs">Applications will appear here when students apply</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Application Statistics */}
                            <Card className="border-gray-200 bg-white shadow-lg">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-xl text-gray-900">Application Status Overview</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {applicationsLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="text-gray-500">Loading application statistics...</div>
                                        </div>
                                    ) : applicationStats ? (
                                        <>
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm text-gray-600 font-medium">Pending Review</span>
                                                    <span className="text-sm font-bold text-gray-900">{applicationStats.pending}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                                                        style={{
                                                            width: stats?.totalApplications
                                                                ? `${(applicationStats.pending / stats.totalApplications) * 100}%`
                                                                : '0%'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm text-gray-600 font-medium">Under Review</span>
                                                    <span className="text-sm font-bold text-gray-900">{applicationStats.underReview}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                                        style={{
                                                            width: stats?.totalApplications
                                                                ? `${(applicationStats.underReview / stats.totalApplications) * 100}%`
                                                                : '0%'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm text-gray-600 font-medium">Accepted</span>
                                                    <span className="text-sm font-bold text-gray-900">{applicationStats.accepted}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                                        style={{
                                                            width: stats?.totalApplications
                                                                ? `${(applicationStats.accepted / stats.totalApplications) * 100}%`
                                                                : '0%'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm text-gray-600 font-medium">Rejected</span>
                                                    <span className="text-sm font-bold text-gray-900">{applicationStats.rejected}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-red-500 h-2 rounded-full transition-all duration-500"
                                                        style={{
                                                            width: stats?.totalApplications
                                                                ? `${(applicationStats.rejected / stats.totalApplications) * 100}%`
                                                                : '0%'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="text-center">
                                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                    <BarChart3 className="w-8 h-8 text-indigo-600" />
                                                </div>
                                                <p className="text-gray-500 text-sm font-medium">No application data available</p>
                                                <p className="text-gray-400 text-xs">Statistics will appear when you receive applications</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Upcoming Deadlines */}
                        <Card className="border-gray-200 bg-white shadow-lg">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl text-gray-900">Upcoming Deadlines</CardTitle>
                                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-0">
                                        Next 30 days
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    {scholarshipsLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="text-gray-500">Loading scholarship deadlines...</div>
                                        </div>
                                    ) : upcomingDeadlines.length > 0 ? (
                                        <div className="space-y-4">
                                            {upcomingDeadlines.map((scholarship) => {
                                                const urgency = getDeadlineUrgency(scholarship.deadline);
                                                const applicationCount = recentApplications?.filter(
                                                    app => app.scholarship.id === scholarship.id
                                                ).length || 0;

                                                return (
                                                    <div key={scholarship.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-gray-900 mb-1">{scholarship.title}</h4>
                                                            <p className="text-sm text-gray-600 mb-2">{scholarship.benefits}</p>
                                                            <div className="flex items-center gap-4 text-sm">
                                                                <div className="flex items-center gap-1">
                                                                    <Users className="h-4 w-4 text-gray-400" />
                                                                    <span className="text-gray-600">{applicationCount} applications</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Clock className={`w-4 h-4 ${urgency.color.replace('text-', 'text-')}`} />
                                                                    <span className={urgency.color}>
                                                                        {new Date(scholarship.deadline).toLocaleDateString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Badge className={`${urgency.bgColor} ${urgency.color} border-0 px-3 py-1 rounded-full`}>
                                                            {urgency.status}
                                                        </Badge>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="text-center">
                                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                    <Calendar className="w-8 h-8 text-indigo-600" />
                                                </div>
                                                <p className="text-gray-500 text-sm font-medium">No upcoming deadlines</p>
                                                <p className="text-gray-400 text-xs">
                                                    {scholarships?.length === 0
                                                        ? 'Create your first scholarship to see deadlines here'
                                                        : 'All your scholarships have deadlines beyond 30 days'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}

export default orgdashboard