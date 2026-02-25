import { useState } from 'react'
import { useAuth } from '../AuthProvider/AuthProvider'
import { useQuery } from '@tanstack/react-query'
import { SidebarProvider, SidebarInset } from '../components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Skeleton } from '../components/ui/skeleton'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../components/ui/table'
import AdminSidebar from '../components/adminSidebar'
import Navbar from '../components/Navbar'
import { fetchAuditLogs, type AuditLogEntry, type Pagination } from '../services/admin'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

const AUDIT_ACTIONS = [
    'USER_REGISTER', 'USER_LOGIN', 'USER_LOGOUT',
    'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_COMPLETE',
    'EMAIL_VERIFICATION_RESEND', 'SESSION_REFRESH',
    'MFA_RECOVERY_CODES_GENERATED', 'MFA_RECOVERY_CODE_USED', 'MFA_UNENROLLED', 'MFA_STATUS_CHECKED',
    'PROFILE_UPDATED',
    'SCHOLARSHIP_CREATED', 'SCHOLARSHIP_UPDATED', 'SCHOLARSHIP_DELETED',
    'SCHOLARSHIP_ARCHIVED', 'SCHOLARSHIP_RESTORED', 'ARCHIVED_SCHOLARSHIP_DELETED',
    'APPLICATION_SUBMITTED', 'APPLICATION_WITHDRAWN', 'APPLICATION_STATUS_UPDATED',
    'FILE_UPLOADED',
]

const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const AdminAuditLogs = () => {
    const { getToken } = useAuth()
    const [action, setAction] = useState('')
    const [status, setStatus] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [page, setPage] = useState(1)

    const handleClearFilters = () => {
        setAction('')
        setStatus('')
        setStartDate('')
        setEndDate('')
        setPage(1)
    }

    const hasFilters = action || status || startDate || endDate

    const { data, isLoading } = useQuery<{
        success: boolean;
        data: AuditLogEntry[];
        pagination: Pagination
    }>({
        queryKey: ['admin-audit-logs', page, action, status, startDate, endDate],
        queryFn: async () => {
            const token = await getToken()
            return fetchAuditLogs(token!, {
                page,
                limit: 20,
                action: action || undefined,
                status: status || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            })
        },
        placeholderData: (prev) => prev,
    })

    const logs = data?.data ?? []
    const pagination = data?.pagination

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <AdminSidebar />
                <SidebarInset className="flex-1">
                    <Navbar showSidebarToggle={true} pageTitle="Audit Logs" />
                    <div className="flex flex-1 flex-col gap-6 p-6 bg-gray-50 overflow-y-auto">

                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                            <p className="text-gray-600">Persistent record of all security-sensitive actions.</p>
                        </div>

                        <Card className="border-gray-200 bg-white shadow-lg">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl text-gray-900">
                                    Event Log
                                    {pagination && (
                                        <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-600">
                                            {pagination.totalCount} entries
                                        </Badge>
                                    )}
                                </CardTitle>

                                {/* Filters */}
                                <div className="flex flex-wrap items-end gap-3 pt-2">
                                    <Select value={action} onValueChange={(v) => { setAction(v === 'ALL' ? '' : v); setPage(1) }}>
                                        <SelectTrigger className="w-52">
                                            <SelectValue placeholder="All actions" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All actions</SelectItem>
                                            {AUDIT_ACTIONS.map((a) => (
                                                <SelectItem key={a} value={a}>{a}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={status} onValueChange={(v) => { setStatus(v === 'ALL' ? '' : v); setPage(1) }}>
                                        <SelectTrigger className="w-36">
                                            <SelectValue placeholder="All statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All statuses</SelectItem>
                                            <SelectItem value="SUCCESS">Success</SelectItem>
                                            <SelectItem value="FAILURE">Failure</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-600 whitespace-nowrap">From</label>
                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
                                            className="w-40"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-600 whitespace-nowrap">To</label>
                                        <Input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
                                            className="w-40"
                                        />
                                    </div>

                                    {hasFilters && (
                                        <Button variant="outline" size="sm" onClick={handleClearFilters}>
                                            <X className="w-4 h-4 mr-1" />
                                            Clear filters
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Action</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>IP Address</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Resource</TableHead>
                                            <TableHead>When</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            Array.from({ length: 8 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    {Array.from({ length: 6 }).map((_, j) => (
                                                        <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : logs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                                    No audit log entries found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            logs.map((log) => (
                                                <TableRow key={log.id} className="hover:bg-gray-50">
                                                    <TableCell>
                                                        <Badge variant="secondary" className="text-xs font-mono">
                                                            {log.action}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs text-gray-600">
                                                        {log.userId
                                                            ? `${log.userId.slice(0, 8)}…`
                                                            : <span className="text-gray-400 italic">System</span>
                                                        }
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs text-gray-600">
                                                        {log.ipAddress}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={
                                                            log.status === 'SUCCESS'
                                                                ? 'bg-green-100 text-green-700 border-0 text-xs'
                                                                : 'bg-red-100 text-red-700 border-0 text-xs'
                                                        }>
                                                            {log.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-gray-600">
                                                        {log.resource ?? <span className="text-gray-400">—</span>}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                                                        {getTimeAgo(log.createdAt)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                {pagination && pagination.totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-sm text-gray-500">
                                            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage((p) => p - 1)}
                                                disabled={!pagination.hasPrev}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage((p) => p + 1)}
                                                disabled={!pagination.hasNext}
                                            >
                                                Next
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}

export default AdminAuditLogs
