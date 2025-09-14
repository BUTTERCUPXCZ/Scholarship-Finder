import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider/AuthProvider'
import {
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
} from '../components/ui/sidebar'
import { Separator } from '../components/ui/separator'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { Bell } from 'lucide-react'
import OrgSidebar from '../components/orgSidebar'
import { useQuery } from '@tanstack/react-query'

const Analytics = () => {
    const navigate = useNavigate()
    const { logout } = useAuth()

    // Fetch user data from localStorage using useQuery
    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => {
            const authData = localStorage.getItem('auth')
            if (authData) {
                try {
                    const parsed = JSON.parse(authData)
                    return parsed.user as { fullname?: string; email?: string } | null
                } catch (error) {
                    console.error('Error parsing auth data:', error)
                    return null
                }
            }
            return null
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    })

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const getUserDisplayName = () => {
        return user?.fullname || user?.email || 'User'
    }
    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <OrgSidebar />

                <SidebarInset className="flex-1">
                    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Dashboard</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Notification Bell */}
                            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <Bell className="size-5 text-gray-600" />
                            </button>

                            {/* User Dropdown */}
                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 transition text-white rounded-full cursor-pointer">
                                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-indigo-500 text-sm font-medium">
                                            {getUserDisplayName().charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm">{getUserDisplayName()}</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuItem className="cursor-pointer">
                                            <span>Profile</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer">
                                            <span>Settings</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="cursor-pointer text-red-600 focus:text-red-600"
                                            onClick={handleLogout}
                                        >
                                            <span>Log out</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <button
                                    className="cursor-pointer px-8 py-2 bg-indigo-500 hover:bg-indigo-600 transition text-white rounded-full"
                                    onClick={() => navigate('/login')}
                                >
                                    Login
                                </button>
                            )}
                        </div>
                    </header>

                    <div className="flex flex-1 flex-col gap-4 p-4">
                        <h1>Analytics</h1>

                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}

export default Analytics