import { useState } from 'react'
import { useAuth } from '../AuthProvider/AuthProvider'
import { useNavigate, Link } from 'react-router-dom'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { ChevronDown, LogOut, User, FileText, Bell, MessageCircle } from 'lucide-react'
import NotificationBell from './NotificationBell'

const StudentNavbar = () => {
    const [open, setOpen] = useState(false)
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const getUserDisplayName = () => {
        return user?.fullname || user?.email || 'User'
    }


    return (
        <nav className="flex items-center justify-between px-6 md:px-16 lg:px-24 xl:px-32 py-4 border-b border-gray-300 bg-white relative transition-all">

            <Link to="/home" className="flex items-center gap-2 group select-none">
                {/* Graduation Cap SVG */}
                <span className="inline-flex items-center justify-center">
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g>
                            <path d="M18 6L33 13.5L18 21L3 13.5L18 6Z" fill="#4F39F6" />
                            <path d="M6 15.5V22C6 24.2091 11.3726 26 18 26C24.6274 26 30 24.2091 30 22V15.5" stroke="#4F39F6" strokeWidth="2" strokeLinejoin="round" />
                            <circle cx="33" cy="13.5" r="1.5" fill="#FFD700" />
                        </g>
                    </svg>
                </span>
                <h1 className=" md:text-2xl font-extrabold text-gray-900 tracking-tight group-hover:scale-105 transition-transform duration-200">
                    ScholarSpere
                </h1>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden sm:flex items-center gap-8">
                <Link to="/home" className="text-gray-700 hover:text-indigo-600 transition-colors">
                    Home
                </Link>
                <Link to="/scholarship" className="text-gray-700 hover:text-indigo-600 transition-colors">
                    Scholarship
                </Link>

                {/* Chat Link (visible only when user is logged in) */}
                {user && (
                    <Link to="/chat" className="text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>Messages</span>
                    </Link>
                )}

                {/* Notification Bell (visible only when user is logged in) */}
                {user && (
                    <NotificationBell />
                )}

                {/* User Dropdown or Login Button */}
                {user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 text-white rounded-full cursor-pointer transition"
                            style={{ backgroundColor: '#4F39F6' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3D2DB8'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4F39F6'}
                        >
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-sm font-medium"
                                style={{ color: '#4F39F6' }}
                            >
                                {getUserDisplayName().charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm">{getUserDisplayName()}</span>
                            <ChevronDown className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem className="cursor-pointer" asChild>
                                <Link to="/profile" className="flex items-center">
                                    <User className="h-4 w-4 mr-2" />
                                    <span>Profile</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" asChild>
                                <Link to="/my-applications" className="flex items-center">
                                    <FileText className="h-4 w-4 mr-2" />
                                    <span>My Applications</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer text-red-600 focus:text-red-600"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <button onClick={() => navigate('/login')} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
                        Login
                    </button>
                )}
            </div>

            <button onClick={() => setOpen(!open)} aria-label="Menu" className="sm:hidden">
                {/* Menu Icon SVG */}
                <svg width="21" height="15" viewBox="0 0 21 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="21" height="1.5" rx=".75" fill="#426287" />
                    <rect x="8" y="6" width="13" height="1.5" rx=".75" fill="#426287" />
                    <rect x="6" y="13" width="15" height="1.5" rx=".75" fill="#426287" />
                </svg>
            </button>

            {/* Mobile Menu */}
            <div className={`${open ? 'flex' : 'hidden'} absolute top-[60px] left-0 w-full bg-white shadow-md py-4 flex-col items-start gap-2 px-5 text-sm md:hidden`}>
                <Link to="/home" className="block py-2 text-gray-700 hover:text-indigo-600 transition-colors">
                    Home
                </Link>
                <Link to="/scholarship" className="block py-2 text-gray-700 hover:text-indigo-600 transition-colors">
                    Scholarship
                </Link>

                {/* Mobile User Section */}
                <div className="w-full mt-2">
                    {user ? (
                        <>
                            <Link to="/chat" className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded">
                                <MessageCircle className="h-4 w-4" />
                                Messages
                            </Link>
                            <Link to="/notifications" className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded">
                                <div className="relative">
                                    <Bell className="h-4 w-4" />
                                    <span className="absolute -top-1 -right-2 inline-flex items-center justify-center px-1 text-xs font-medium leading-none text-white bg-red-600 rounded-full">0</span>
                                </div>
                                Notifications
                            </Link>
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg mb-2">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                    style={{ backgroundColor: '#4F39F6' }}
                                >
                                    {getUserDisplayName().charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium">{getUserDisplayName()}</span>
                            </div>
                            <Link to="/profile" className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded">
                                <User className="h-4 w-4" />
                                Profile
                            </Link>
                            <Link to="/my-applications" className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded">
                                <FileText className="h-4 w-4" />
                                My Applications
                            </Link>
                            <button
                                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4" />
                                Log out
                            </button>
                        </>
                    ) : (
                        <button onClick={() => navigate('/login')} className="w-full text-left px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
                            Login
                        </button>
                    )}
                </div>
            </div>

        </nav>
    )
}

export default StudentNavbar