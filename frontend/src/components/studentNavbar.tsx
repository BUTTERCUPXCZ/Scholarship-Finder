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
import { ChevronDown, LogOut, User, FileText, MessageCircle, GraduationCap } from 'lucide-react'
import NotificationBell from './NotificationBell'
import { Button } from './ui/button'

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
        <nav className="flex items-center justify-between px-6 md:px-16 lg:px-24 xl:px-32 py-4 border-b border-gray-200 bg-white relative transition-all shadow-sm">
            <Link to="/home" className="flex items-center gap-3 group select-none">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight group-hover:scale-105 transition-transform duration-200">
                    ScholarSphere
                </h1>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden sm:flex items-center gap-8">
                <Link to="/home" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">
                    Home
                </Link>
                <Link to="/scholarship" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">
                    Scholarships
                </Link>

                {/* Chat Link (visible only when user is logged in) */}
                {user && (
                    <Link to="/chat" className="text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2 font-medium">
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
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-sm font-medium text-indigo-600">
                                    {getUserDisplayName().charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium">{getUserDisplayName()}</span>
                                <ChevronDown className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 border-gray-200 shadow-xl">
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
                    <Button
                        onClick={() => navigate('/login')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        Login
                    </Button>
                )}
            </div>

            <button onClick={() => setOpen(!open)} aria-label="Menu" className="sm:hidden">
                <svg width="21" height="15" viewBox="0 0 21 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="21" height="1.5" rx=".75" fill="#4F39F6" />
                    <rect x="8" y="6" width="13" height="1.5" rx=".75" fill="#4F39F6" />
                    <rect x="6" y="13" width="15" height="1.5" rx=".75" fill="#4F39F6" />
                </svg>
            </button>

            {/* Mobile Menu */}
            <div className={`${open ? 'flex' : 'hidden'} absolute top-[60px] left-0 w-full bg-white shadow-lg py-4 flex-col items-start gap-2 px-5 text-sm md:hidden border-t border-gray-200`}>
                <Link to="/home" className="block py-2 text-gray-700 hover:text-indigo-600 transition-colors font-medium">
                    Home
                </Link>
                <Link to="/scholarship" className="block py-2 text-gray-700 hover:text-indigo-600 transition-colors font-medium">
                    Scholarships
                </Link>

                {/* Mobile User Section */}
                <div className="w-full mt-2">
                    {user ? (
                        <>
                            <Link to="/chat" className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-lg transition-colors">
                                <MessageCircle className="h-4 w-4" />
                                Messages
                            </Link>
                            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-lg mb-2 border border-indigo-100">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium bg-indigo-600">
                                    {getUserDisplayName().charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{getUserDisplayName()}</span>
                            </div>
                            <Link to="/profile" className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-lg transition-colors">
                                <User className="h-4 w-4" />
                                Profile
                            </Link>
                            <Link to="/my-applications" className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-lg transition-colors">
                                <FileText className="h-4 w-4" />
                                My Applications
                            </Link>
                            <button
                                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4" />
                                Log out
                            </button>
                        </>
                    ) : (
                        <Button
                            onClick={() => navigate('/login')}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                        >
                            Login
                        </Button>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default StudentNavbar