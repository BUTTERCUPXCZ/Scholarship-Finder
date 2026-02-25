import { useAuth } from '../AuthProvider/AuthProvider'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '../components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import {
    Users,
    GraduationCap,
    FileText,
    ShieldAlert,
    CheckCircle,
    XCircle,
} from 'lucide-react'
import AdminSidebar from '../components/adminSidebar'
import Navbar from '../components/Navbar'
import { fetchAdminStats, fetchAuditLogs, type AdminStats, type AuditLogEntry } from '../services/admin'

const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

const AdminDashboard = () => {
    const { getToken } = useAuth()
    const navigate = useNavigate()

    const { data: statsRes, isLoading: statsLoading } = useQuery<{ success: boolean; data: AdminStats }>({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const token = await getToken()
            return fetchAdminStats(token!)
        },
        staleTime: 5 * 60 * 1000,
    })

    const { data: eventsRes, isLoading: eventsLoading } = useQuery<{
        success: boolean;
        data: AuditLogEntry[];
        pagination: { totalCount: number; currentPage: number; totalPages: number; hasNext: boolean; hasPrev: boolean }
    }>({
        queryKey: ['admin-recent-events'],
        queryFn: async () => {
            const token = await getToken()
            return fetchAuditLogs(token!, { limit: 10 })
        },
        staleTime: 60 * 1000,
    })

    const stats = statsRes?.data
    const events = eventsRes?.data ?? []

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <AdminSidebar />
                <SidebarInset className="flex-1">
                    <Navbar showSidebarToggle={true} pageTitle="Admin Dashboard" />
                    <div className="flex flex-1 flex-col gap-6 p-6 bg-gray-50 overflow-y-auto">

                        {/* Header */}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
                            <p className="text-gray-600 mt-1">System overview — ScholarSphere</p>
                        </div>

                        {/* Stat cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="border-gray-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1 font-medium">Total Users</p>
                                            <p className="text-3xl font-bold text-gray-900">
                                                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.users.total ?? 0}
                                            </p>
                                            <p className="text-sm text-blue-600 mt-1 font-medium">
                                                {statsLoading ? '' : `${stats?.users.students ?? 0} students · ${stats?.users.organizations ?? 0} orgs`}
                                            </p>
                                        </div>
                                        <div className="bg-blue-100 p-3 rounded-xl">
                                            <Users className="w-6 h-6 text-blue-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-gray-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1 font-medium">Total Scholarships</p>
                                            <p className="text-3xl font-bold text-gray-900">
                                                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.scholarships.total ?? 0}
                                            </p>
                                            <p className="text-sm text-green-600 mt-1 font-medium">
                                                {statsLoading ? '' : `${stats?.scholarships.active ?? 0} active`}
                                            </p>
                                        </div>
                                        <div className="bg-green-100 p-3 rounded-xl">
                                            <GraduationCap className="w-6 h-6 text-green-600" />
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
                                                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.applications.total ?? 0}
                                            </p>
                                            <p className="text-sm text-yellow-600 mt-1 font-medium">
                                                {statsLoading ? '' : `${stats?.applications.pending ?? 0} pending`}
                                            </p>
                                        </div>
                                        <div className="bg-yellow-100 p-3 rounded-xl">
                                            <FileText className="w-6 h-6 text-yellow-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-gray-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1 font-medium">Security Events (24h)</p>
                                            <p className="text-3xl font-bold text-gray-900">
                                                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.auditEvents24h ?? 0}
                                            </p>
                                            <p className="text-sm text-purple-600 mt-1 font-medium">
                                                audit log entries
                                            </p>
                                        </div>
                                        <div className="bg-purple-100 p-3 rounded-xl">
                                            <ShieldAlert className="w-6 h-6 text-purple-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Bottom row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Recent Security Events */}
                            <Card className="lg:col-span-2 border-gray-200 bg-white shadow-lg">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xl text-gray-900">Recent Security Events</CardTitle>
                                        <button
                                            onClick={() => navigate('/admin/audit-logs')}
                                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                        >
                                            View all →
                                        </button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {eventsLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <Skeleton key={i} className="h-12 w-full" />
                                        ))
                                    ) : events.length === 0 ? (
                                        <p className="text-gray-500 text-sm text-center py-6">No recent events</p>
                                    ) : (
                                        events.map((event) => (
                                            <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    {event.status === 'SUCCESS'
                                                        ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                                        : <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                                                    }
                                                    <div>
                                                        <Badge variant="secondary" className="text-xs mb-1">{event.action}</Badge>
                                                        <p className="text-xs text-gray-500">{event.ipAddress}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge
                                                        className={event.status === 'SUCCESS'
                                                            ? 'bg-green-100 text-green-700 border-0 text-xs'
                                                            : 'bg-red-100 text-red-700 border-0 text-xs'
                                                        }
                                                    >
                                                        {event.status}
                                                    </Badge>
                                                    <p className="text-xs text-gray-400 mt-1">{getTimeAgo(event.createdAt)}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>

                            {/* User Role Distribution */}
                            <Card className="border-gray-200 bg-white shadow-lg">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-xl text-gray-900">User Breakdown</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {statsLoading ? (
                                        <div className="space-y-4">
                                            <Skeleton className="h-6 w-full" />
                                            <Skeleton className="h-6 w-full" />
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm text-gray-600 font-medium">Students</span>
                                                    <span className="text-sm font-bold text-gray-900">{stats?.users.students ?? 0}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                                        style={{
                                                            width: stats?.users.total
                                                                ? `${((stats.users.students / stats.users.total) * 100).toFixed(1)}%`
                                                                : '0%'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm text-gray-600 font-medium">Organizations</span>
                                                    <span className="text-sm font-bold text-gray-900">{stats?.users.organizations ?? 0}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                                        style={{
                                                            width: stats?.users.total
                                                                ? `${((stats.users.organizations / stats.users.total) * 100).toFixed(1)}%`
                                                                : '0%'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-gray-100">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Accepted applications</span>
                                                    <span className="font-bold text-green-600">{stats?.applications.accepted ?? 0}</span>
                                                </div>
                                                <div className="flex justify-between text-sm mt-2">
                                                    <span className="text-gray-600">Rejected applications</span>
                                                    <span className="font-bold text-red-600">{stats?.applications.rejected ?? 0}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}

export default AdminDashboard
