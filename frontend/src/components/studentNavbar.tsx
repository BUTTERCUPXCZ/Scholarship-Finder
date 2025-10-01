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
import { ChevronDown, LogOut, User, FileText } from 'lucide-react'
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
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="container mx-auto px-4 sm:px-6 md:px-16 lg:px-24 xl:px-32">
                <div className="grid grid-cols-3 items-center gap-4 py-2 sm:py-3">
                    {/* Left: Logo */}
                    <div className="col-start-1 flex items-center">
                        <Link to="/home" className="flex items-center gap-3 group select-none">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-sm sm:shadow-lg transition-all duration-300">
                                <img src="/graduation.png" alt="Scholarship illustration" className="w-full h-auto object-contain" />
                            </div>
                            <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-gray-900">ScholarSphere</h1>
                        </Link>
                    </div>

                    {/* Center: Navigation (centered) */}
                    <div className="col-start-2 flex justify-center">
                        <div className="hidden md:flex items-center gap-8">
                            <Link to="/home" className="text-gray-700 hover:text-indigo-600 font-medium text-sm md:text-base">Home</Link>
                            <Link to="/scholarship" className="text-gray-700 hover:text-indigo-600 font-medium text-sm md:text-base">Scholarships</Link>

                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="col-start-3 flex justify-end items-center gap-4">
                        {/* show notification on all sizes (excluded from mobile menu per request) */}
                        {user && <NotificationBell />}

                        {/* desktop dropdown only visible on md+; mobile will use links inside the mobile menu */}
                        <div className="hidden md:block">
                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg transition-all duration-300">
                                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs sm:text-sm font-medium text-indigo-600">
                                                {getUserDisplayName().charAt(0).toUpperCase()}
                                            </div>
                                            {/* hide full name on very small screens to keep layout clean */}
                                            <span className="hidden xs:block text-xs sm:text-sm font-medium truncate max-w-[8rem]">{getUserDisplayName()}</span>
                                            <ChevronDown className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 sm:w-56 border-gray-200 shadow-xl">
                                        <DropdownMenuItem asChild>
                                            <Link to="/profile" className="flex items-center">
                                                <User className="h-4 w-4 mr-2" /> Profile
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/my-applications" className="flex items-center">
                                                <FileText className="h-4 w-4 mr-2" /> My Applications
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                            <LogOut className="h-4 w-4 mr-2" /> Log out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button onClick={() => navigate('/login')} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg sm:rounded-xl px-3 py-1 sm:px-4 sm:py-2 text-sm">Login</Button>
                            )}
                        </div>

                        {/* mobile hamburger - visible on small screens */}
                        <button
                            onClick={() => setOpen(!open)}
                            aria-label={open ? 'Close menu' : 'Open menu'}
                            aria-expanded={open}
                            aria-controls="student-mobile-menu"
                            className="md:hidden p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                        >
                            <svg width="21" height="15" viewBox="0 0 21 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <rect width="21" height="1.5" rx=".75" fill="#4F39F6" />
                                <rect x="8" y="6" width="13" height="1.5" rx=".75" fill="#4F39F6" />
                                <rect x="6" y="13" width="15" height="1.5" rx=".75" fill="#4F39F6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div
                id="student-mobile-menu"
                role="region"
                aria-hidden={!open}
                className={`${open ? 'flex' : 'hidden'} md:hidden absolute left-0 right-0 top-full bg-white border-t border-gray-200 shadow-lg py-3 transition-transform origin-top`}
                style={{ transformOrigin: 'top' }}
            >
                <div className="px-4 w-full">
                    <Link to="/home" className="block py-2 text-gray-700 hover:text-indigo-600">Home</Link>
                    <Link to="/scholarship" className="block py-2 text-gray-700 hover:text-indigo-600">Scholarships</Link>

                    {/* Notifications and account actions for mobile */}
                    <div className="mt-3 border-t border-gray-100 pt-3">
                        {user ? (
                            <>
                                <div className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-3">
                                        <div className="text-sm font-medium">{getUserDisplayName()}</div>
                                    </div>
                                </div>

                                <Link to="/profile" className="flex items-center gap-2 py-2 text-gray-700"><User className="h-4 w-4" /> Profile</Link>
                                <Link to="/my-applications" className="flex items-center gap-2 py-2 text-gray-700"><FileText className="h-4 w-4" /> My Applications</Link>
                                <button onClick={handleLogout} className="w-full text-left py-2 text-red-600">Log out</button>
                            </>
                        ) : (
                            <Button onClick={() => navigate('/login')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">Login</Button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default StudentNavbar