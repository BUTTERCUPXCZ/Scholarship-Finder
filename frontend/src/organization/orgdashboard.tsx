import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider/AuthProvider'
import { useQuery } from '@tanstack/react-query'
import {
    SidebarProvider,
    SidebarInset,
} from '../components/ui/sidebar'
import { Button } from '../components/ui/button'
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
    Award
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
    const navigate = useNavigate()
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

                    <div className="flex flex-1 flex-col gap-6 p-6">
                        {/* Welcome Header */}
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.fullname || user?.email || 'User'}!</h1>
                            <p className="text-gray-600">Here's what's happening with your scholarships today.</p>
                        </div>

                        {/* Key Metrics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-lg border shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Total Scholarships</p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {statsLoading ? '...' : stats?.totalScholarships || 0}
                                        </p>
                                        <p className="text-sm text-blue-600 mt-1">
                                            {stats?.activeScholarships || 0} currently active
                                        </p>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-lg">
                                        <GraduationCap className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg border shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Total Applications</p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {statsLoading ? '...' : stats?.totalApplications || 0}
                                        </p>
                                        <p className="text-sm text-green-600 mt-1">
                                            {recentApplications?.filter(app => {
                                                const today = new Date();
                                                const appDate = new Date(app.submittedAt);
                                                return appDate.toDateString() === today.toDateString();
                                            }).length || 0} received today
                                        </p>
                                    </div>
                                    <div className="bg-green-100 p-3 rounded-lg">
                                        <Users className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg border shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Archived Scholarships</p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {statsLoading ? '...' : stats?.archivedScholarships || 0}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Completed programs
                                        </p>
                                    </div>
                                    <div className="bg-yellow-100 p-3 rounded-lg">
                                        <Award className="w-6 h-6 text-yellow-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg border shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Acceptance Rate</p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {(() => {
                                                const total = stats?.totalApplications || 0;
                                                const accepted = recentApplications?.filter(app => app.status === 'ACCEPTED').length || 0;
                                                const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;
                                                return statsLoading ? '...' : `${rate}%`;
                                            })()}
                                        </p>
                                        <p className="text-sm text-purple-600 mt-1">
                                            {recentApplications?.filter(app => app.status === 'ACCEPTED').length || 0} applications approved
                                        </p>
                                    </div>
                                    <div className="bg-purple-100 p-3 rounded-lg">
                                        <TrendingUp className="w-6 h-6 text-purple-600" />
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Recent Activity & Analytics */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Activity */}
                            <div className="bg-white p-6 rounded-lg border shadow-sm">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Applications</h2>
                                <div className="space-y-4">
                                    {applicationsLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="text-gray-500">Loading recent applications...</div>
                                        </div>
                                    ) : recentApplications && recentApplications.length > 0 ? (
                                        recentApplications.slice(0, 4).map((application) => (
                                            <div key={application.id} className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg mt-1 ${application.status === 'ACCEPTED' ? 'bg-green-100' :
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
                                                <div>
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
                                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                <p className="text-gray-500 text-sm">No recent applications</p>
                                                <p className="text-gray-400 text-xs">Applications will appear here when students apply</p>
                                            </div>
                                        </div>
                                    )}

                                    {recentApplications && recentApplications.length > 4 && (
                                        <div className="pt-3 border-t">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate('/manage-scholarships')}
                                                className="w-full"
                                            >
                                                View All Applications
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Application Statistics */}
                            <div className="bg-white p-6 rounded-lg border shadow-sm">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Status Overview</h2>
                                <div className="space-y-6">
                                    {applicationsLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="text-gray-500">Loading application statistics...</div>
                                        </div>
                                    ) : applicationStats ? (
                                        <>
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm text-gray-600">Pending Review</span>
                                                    <span className="text-sm font-medium text-gray-900">{applicationStats.pending}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-yellow-500 h-2 rounded-full"
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
                                                    <span className="text-sm text-gray-600">Under Review</span>
                                                    <span className="text-sm font-medium text-gray-900">{applicationStats.underReview}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full"
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
                                                    <span className="text-sm text-gray-600">Accepted</span>
                                                    <span className="text-sm font-medium text-gray-900">{applicationStats.accepted}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-green-500 h-2 rounded-full"
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
                                                    <span className="text-sm text-gray-600">Rejected</span>
                                                    <span className="text-sm font-medium text-gray-900">{applicationStats.rejected}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-red-500 h-2 rounded-full"
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
                                                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                <p className="text-gray-500 text-sm">No application data available</p>
                                                <p className="text-gray-400 text-xs">Statistics will appear when you receive applications</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Upcoming Deadlines */}
                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h2>
                            <div className="overflow-x-auto">
                                {scholarshipsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="text-gray-500">Loading scholarship deadlines...</div>
                                    </div>
                                ) : upcomingDeadlines.length > 0 ? (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left text-sm font-medium text-gray-600 pb-3">Scholarship</th>
                                                <th className="text-left text-sm font-medium text-gray-600 pb-3">Applications</th>
                                                <th className="text-left text-sm font-medium text-gray-600 pb-3">Deadline</th>
                                                <th className="text-left text-sm font-medium text-gray-600 pb-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {upcomingDeadlines.map((scholarship) => {
                                                const urgency = getDeadlineUrgency(scholarship.deadline);
                                                const applicationCount = recentApplications?.filter(
                                                    app => app.scholarship.id === scholarship.id
                                                ).length || 0;

                                                return (
                                                    <tr key={scholarship.id}>
                                                        <td className="py-3">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{scholarship.title}</p>
                                                                <p className="text-xs text-gray-600">{scholarship.benefits}</p>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 text-sm text-gray-900">{applicationCount}</td>
                                                        <td className="py-3">
                                                            <div className="flex items-center gap-1">
                                                                <Clock className={`w-4 h-4 ${urgency.color.replace('text-', 'text-')}`} />
                                                                <span className={`text-sm ${urgency.color}`}>
                                                                    {new Date(scholarship.deadline).toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        year: 'numeric'
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3">
                                                            <span className={`px-2 py-1 text-xs ${urgency.bgColor} ${urgency.color} rounded-full`}>
                                                                {urgency.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="text-center">
                                            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500 text-sm">No upcoming deadlines</p>
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
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}

export default orgdashboard