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
import { fetchAdminUsers, type AdminUser, type Pagination } from '../services/admin'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

const roleBadgeClass = (role: string) => {
    switch (role) {
        case 'STUDENT': return 'bg-blue-100 text-blue-700 border-0'
        case 'ORGANIZATION': return 'bg-green-100 text-green-700 border-0'
        case 'ADMIN': return 'bg-purple-100 text-purple-700 border-0'
        default: return 'bg-gray-100 text-gray-700 border-0'
    }
}

const AdminUsers = () => {
    const { getToken } = useAuth()
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('ALL')
    const [page, setPage] = useState(1)

    // Simple debounce via blur / enter press
    const handleSearchCommit = (value: string) => {
        setDebouncedSearch(value)
        setPage(1)
    }

    const handleRoleChange = (value: string) => {
        setRoleFilter(value)
        setPage(1)
    }

    const { data, isLoading } = useQuery<{ success: boolean; data: AdminUser[]; pagination: Pagination }>({
        queryKey: ['admin-users', page, roleFilter, debouncedSearch],
        queryFn: async () => {
            const token = await getToken()
            return fetchAdminUsers(token!, {
                page,
                limit: 20,
                role: roleFilter !== 'ALL' ? roleFilter : undefined,
                search: debouncedSearch || undefined,
            })
        },
        placeholderData: (prev) => prev,
    })

    const users = data?.data ?? []
    const pagination = data?.pagination

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <AdminSidebar />
                <SidebarInset className="flex-1">
                    <Navbar showSidebarToggle={true} pageTitle="User Management" />
                    <div className="flex flex-1 flex-col gap-6 p-6 bg-gray-50 overflow-y-auto">

                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                            <p className="text-gray-600">Browse and filter all registered users.</p>
                        </div>

                        <Card className="border-gray-200 bg-white shadow-lg">
                            <CardHeader className="pb-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <CardTitle className="text-xl text-gray-900">
                                        All Users
                                        {pagination && (
                                            <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-600">
                                                {pagination.totalCount} total
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    {/* Toolbar */}
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <div className="relative flex-1 sm:w-64">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                placeholder="Search by name or email..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                onBlur={(e) => handleSearchCommit(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearchCommit(search)}
                                                className="pl-9"
                                            />
                                        </div>
                                        <Select value={roleFilter} onValueChange={handleRoleChange}>
                                            <SelectTrigger className="w-40">
                                                <SelectValue placeholder="All roles" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">All roles</SelectItem>
                                                <SelectItem value="STUDENT">Student</SelectItem>
                                                <SelectItem value="ORGANIZATION">Organization</SelectItem>
                                                <SelectItem value="ADMIN">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Full Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : users.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                                                    No users found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            users.map((user) => (
                                                <TableRow key={user.id} className="hover:bg-gray-50">
                                                    <TableCell className="font-medium text-gray-900">{user.fullname}</TableCell>
                                                    <TableCell className="text-gray-600">{user.email}</TableCell>
                                                    <TableCell>
                                                        <Badge className={roleBadgeClass(user.role)}>{user.role}</Badge>
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

export default AdminUsers
