import { useState } from 'react'
import { useAuth } from '../AuthProvider/AuthProvider'
import { useQuery } from '@tanstack/react-query'
import { SidebarProvider, SidebarInset } from '../components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import AdminSidebar from '../components/adminSidebar'
import Navbar from '../components/Navbar'
import {
    fetchApplicationsOverTime,
    fetchScholarshipPerformance,
    fetchUserRegistrations,
    fetchApplicationFunnel,
    type TimeSeriesPoint,
    type ScholarshipPerf,
    type FunnelSlice,
} from '../services/admin'
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts'

// ─── constants ────────────────────────────────────────────────────────────────

const PERIODS = [
    { label: '7 days', value: 7 },
    { label: '30 days', value: 30 },
    { label: '90 days', value: 90 },
] as const

type Period = 7 | 30 | 90

const FUNNEL_COLORS: Record<string, string> = {
    PENDING: '#f59e0b',
    SUBMITTED: '#3b82f6',
    UNDER_REVIEW: '#8b5cf6',
    ACCEPTED: '#10b981',
    REJECTED: '#ef4444',
}

const BAR_COLOR = '#4f46e5'

// ─── sub-components ───────────────────────────────────────────────────────────

const ChartSkeleton = () => (
    <div className="h-64 w-full">
        <Skeleton className="h-full w-full rounded-md" />
    </div>
)

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()}`
}

// ─── main component ───────────────────────────────────────────────────────────

const AdminAnalytics = () => {
    const { getToken } = useAuth()
    const [period, setPeriod] = useState<Period>(30)

    // Applications over time
    const { data: appsData, isLoading: appsLoading } = useQuery<{ success: boolean; data: TimeSeriesPoint[] }>({
        queryKey: ['analytics-apps-over-time', period],
        queryFn: async () => {
            const token = await getToken()
            return fetchApplicationsOverTime(token!, period)
        },
        staleTime: 5 * 60 * 1000,
    })

    // User registrations over time
    const { data: usersData, isLoading: usersLoading } = useQuery<{ success: boolean; data: TimeSeriesPoint[] }>({
        queryKey: ['analytics-user-regs', period],
        queryFn: async () => {
            const token = await getToken()
            return fetchUserRegistrations(token!, period)
        },
        staleTime: 5 * 60 * 1000,
    })

    // Scholarship performance (no period)
    const { data: perfData, isLoading: perfLoading } = useQuery<{ success: boolean; data: ScholarshipPerf[] }>({
        queryKey: ['analytics-scholarship-perf'],
        queryFn: async () => {
            const token = await getToken()
            return fetchScholarshipPerformance(token!)
        },
        staleTime: 5 * 60 * 1000,
    })

    // Application funnel (no period)
    const { data: funnelData, isLoading: funnelLoading } = useQuery<{ success: boolean; data: FunnelSlice[] }>({
        queryKey: ['analytics-funnel'],
        queryFn: async () => {
            const token = await getToken()
            return fetchApplicationFunnel(token!)
        },
        staleTime: 5 * 60 * 1000,
    })

    const apps = appsData?.data ?? []
    const users = usersData?.data ?? []
    const perf = perfData?.data ?? []
    const funnel = funnelData?.data ?? []

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <AdminSidebar />
                <SidebarInset className="flex-1">
                <Navbar showSidebarToggle={true} pageTitle="Analytics" />
                <div className="flex flex-1 flex-col gap-6 p-6 bg-gray-50 overflow-y-auto">
                    {/* Page header + period selector */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                            <p className="text-gray-600 mt-1">
                                Platform-wide trends and performance metrics
                            </p>
                        </div>

                        {/* Period selector — applies to time-series charts */}
                        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                            {PERIODS.map((p) => (
                                <button
                                    key={p.value}
                                    onClick={() => setPeriod(p.value)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                        period === p.value
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2×2 chart grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                        {/* ── Applications over time ─────────────────────── */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Applications Over Time</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {appsLoading ? (
                                    <ChartSkeleton />
                                ) : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <LineChart data={apps} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={formatDate}
                                                tick={{ fontSize: 11 }}
                                                interval={Math.max(Math.floor(apps.length / 6) - 1, 0)}
                                            />
                                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                            <Tooltip
                                                formatter={(v: number | undefined) => [v ?? 0, 'Applications']}
                                                labelFormatter={(l) => `Date: ${l}`}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="count"
                                                stroke="#4f46e5"
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={{ r: 4 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* ── User registrations over time ──────────────── */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">User Registrations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {usersLoading ? (
                                    <ChartSkeleton />
                                ) : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <AreaChart data={users} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={formatDate}
                                                tick={{ fontSize: 11 }}
                                                interval={Math.max(Math.floor(users.length / 6) - 1, 0)}
                                            />
                                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                            <Tooltip
                                                formatter={(v: number | undefined) => [v ?? 0, 'Registrations']}
                                                labelFormatter={(l) => `Date: ${l}`}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke="#10b981"
                                                strokeWidth={2}
                                                fill="url(#regGrad)"
                                                dot={false}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* ── Top scholarships by applications ──────────── */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Top Scholarships by Applications</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {perfLoading ? (
                                    <ChartSkeleton />
                                ) : perf.length === 0 ? (
                                    <div className="h-64 flex items-center justify-center text-sm text-gray-400">
                                        No scholarship data yet
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart
                                            layout="vertical"
                                            data={perf}
                                            margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                                            <YAxis
                                                type="category"
                                                dataKey="title"
                                                width={130}
                                                tick={{ fontSize: 10 }}
                                                tickFormatter={(v: string) =>
                                                    v.length > 20 ? v.slice(0, 19) + '…' : v
                                                }
                                            />
                                            <Tooltip
                                                formatter={(v: number | undefined, name: string | undefined) => [v ?? 0, name ?? '']}
                                            />
                                            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                                            <Bar dataKey="applications" name="Total" fill={BAR_COLOR} radius={[0, 3, 3, 0]} />
                                            <Bar dataKey="accepted" name="Accepted" fill="#10b981" radius={[0, 3, 3, 0]} />
                                            <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[0, 3, 3, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* ── Application status funnel ─────────────────── */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Application Status Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {funnelLoading ? (
                                    <ChartSkeleton />
                                ) : funnel.length === 0 ? (
                                    <div className="h-64 flex items-center justify-center text-sm text-gray-400">
                                        No application data yet
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie
                                                data={funnel}
                                                dataKey="count"
                                                nameKey="status"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={3}
                                            >
                                                {funnel.map((entry) => (
                                                    <Cell
                                                        key={entry.status}
                                                        fill={FUNNEL_COLORS[entry.status] ?? '#9ca3af'}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v: number | undefined, name: string | undefined) => [v ?? 0, name ?? '']} />
                                            <Legend
                                                iconType="circle"
                                                iconSize={10}
                                                wrapperStyle={{ fontSize: 11 }}
                                                formatter={(value) => value.replace(/_/g, ' ')}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
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

export default AdminAnalytics
