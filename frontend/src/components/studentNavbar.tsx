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
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from './ui/sheet'
import {
    ChevronDown,
    LogOut,
    User,
    FileText,
    Menu
} from 'lucide-react'
import NotificationBell from './NotificationBell'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

const StudentNavbar = () => {
    const [mobileOpen, setMobileOpen] = useState(false)
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const getUserDisplayName = () => {
        return user?.fullname || user?.email || 'User'
    }

    const getUserInitial = () => {
        const name = getUserDisplayName()
        return name.charAt(0).toUpperCase()
    }

    // Navigation links matching the BuildNation design
    const navigationLinks = [
        { href: '/home', label: 'Home' },
        { href: '/scholarship', label: 'Scholarships' },
    ]

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-3 items-center h-16">

                    {/* Left: Logo & Brand */}
                    <div className="flex items-center justify-start">
                        <Link to="/home" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-sm sm:shadow-lg transition-all duration-300">
                                    <img src="/graduation.png" alt="Scholarship illustration" className="w-full h-auto object-contain" loading="lazy" decoding="async" />
                                </div>
                                <div className="text-indigo-600 font-bold text-lg">
                                    Scholar<span className="text-gray-800">Sphere</span>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Center: Navigation Links */}
                    <div className="flex items-center justify-center">
                        <div className="hidden lg:flex items-center space-x-8">
                            {navigationLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    to={link.href}
                                    className={cn(
                                        "text-sm font-medium transition-colors hover:text-indigo-600",
                                        window.location.pathname === link.href
                                            ? "text-indigo-600"
                                            : "text-gray-700"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}

                        </div>
                    </div>

                    {/* Right: User Actions */}
                    <div className="flex items-center justify-end gap-4">

                        {/* Notification Bell for logged in users */}
                        {user && (
                            <div className="hidden sm:block">
                                <NotificationBell />
                            </div>
                        )}

                        {/* Desktop User Menu or Login */}
                        <div className="hidden lg:block">
                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="flex items-center gap-2 h-10 px-3 hover:bg-gray-50 rounded-lg"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                                                {getUserInitial()}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                                                {getUserDisplayName()}
                                            </span>
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <div className="flex items-center gap-3 p-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                                                {getUserInitial()}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="text-sm font-medium">{getUserDisplayName()}</div>
                                                <div className="text-xs text-gray-500">{user?.email}</div>
                                            </div>
                                        </div>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link to="/profile" className="flex items-center">
                                                <User className="h-4 w-4 mr-2" />
                                                Profile
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/my-applications" className="flex items-center">
                                                <FileText className="h-4 w-4 mr-2" />
                                                My Applications
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Log out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button
                                    onClick={() => navigate('/login')}
                                    className="bg-indigo-600 hover:bg-indigo-900 text-white h-10 px-6 rounded-lg text-sm font-medium"
                                >
                                    Log In
                                </Button>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="lg:hidden w-10 h-10 p-0 hover:bg-gray-50 rounded-lg"
                                >
                                    <Menu className="h-5 w-5 text-gray-600" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px]">
                                <SheetHeader className="text-left pb-6">
                                    <SheetTitle className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                                            <img
                                                src="/graduation.png"
                                                alt="ScholarSphere"
                                                className="w-4 h-4 object-contain filter brightness-0 invert"
                                            />
                                        </div>
                                        ScholarSphere
                                    </SheetTitle>
                                </SheetHeader>

                                <div className="space-y-6">
                                    {/* User Profile Section */}
                                    {user && (
                                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-lg">
                                                {getUserInitial()}
                                            </div>
                                            <div>
                                                <div className="font-medium">{getUserDisplayName()}</div>
                                                <div className="text-sm text-gray-500">{user?.email}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Navigation Links */}
                                    <div className="space-y-1">
                                        {navigationLinks.map((link) => (
                                            <Link
                                                key={link.href}
                                                to={link.href}
                                                onClick={() => setMobileOpen(false)}
                                                className={cn(
                                                    "block px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                                    window.location.pathname === link.href
                                                        ? "bg-blue-50 text-blue-600"
                                                        : "text-gray-700 hover:bg-gray-50"
                                                )}
                                            >
                                                {link.label}
                                            </Link>
                                        ))}

                                        {/* Additional mobile menu items */}
                                        {user && (
                                            <>
                                                <Link
                                                    to="/my-applications"
                                                    onClick={() => setMobileOpen(false)}
                                                    className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                                >
                                                    My Applications
                                                </Link>
                                                <Link
                                                    to="/profile"
                                                    onClick={() => setMobileOpen(false)}
                                                    className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                                >
                                                    Profile
                                                </Link>
                                            </>
                                        )}
                                    </div>

                                    {/* Auth Actions */}
                                    <div className="pt-4 border-t">
                                        {user ? (
                                            <Button
                                                onClick={() => {
                                                    handleLogout()
                                                    setMobileOpen(false)
                                                }}
                                                variant="outline"
                                                className="w-full justify-center text-red-600 border-red-200 hover:bg-red-50"
                                            >
                                                <LogOut className="w-4 h-4 mr-2" />
                                                Log out
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => {
                                                    navigate('/login')
                                                    setMobileOpen(false)
                                                }}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                Log In
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default StudentNavbar