import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider/AuthProvider'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { SidebarTrigger } from './ui/sidebar'
import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'

interface NavbarProps {
    showSidebarToggle?: boolean
    pageTitle?: string
}

const Navbar = ({ showSidebarToggle = false, pageTitle }: NavbarProps) => {
    const [open, setOpen] = useState(false)
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            // logout may be async
            await logout()
        } catch (err) {
            // ignore logout errors but log for debugging
            // eslint-disable-next-line no-console
            console.error('Logout error', err)
        }
        navigate('/login')
        setOpen(false)
    }

    const handleProfileClick = () => {
        // Route to the appropriate profile page depending on role
        if (user?.role === 'ORGANIZATION') {
            navigate('/Profile-organization')
        } else {
            navigate('/profile')
        }
        setOpen(false)
    }

    const handleSettingsClick = () => {
        // Default settings route; can be adjusted if organization has a separate settings page
        if (user?.role === 'ORGANIZATION') {
            navigate('/organization/settings')
        } else {
            navigate('/settings')
        }
        setOpen(false)
    }

    const getUserDisplayName = () => {
        return user?.fullname || user?.email || 'User'
    }
    return (
        <nav className={`flex items-center gap-2 border-b border-gray-300 bg-white relative transition-all ${showSidebarToggle ? 'h-16 shrink-0 px-4 justify-between' : 'justify-between px-6 md:px-16 lg:px-24 xl:px-32 py-4'}`}>
            {/* Left side - Sidebar Toggle or Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {showSidebarToggle && (
                    <SidebarTrigger className="" />
                )}

                {!showSidebarToggle && (
                    <Link to="https://prebuiltui.com">
                        <svg width="157" height="40" viewBox="0 0 157 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M47.904 28.28q-1.54 0-2.744-.644a5.1 5.1 0 0 1-1.904-1.82q-.672-1.148-.672-2.604v-3.864q0-1.456.7-2.604a4.9 4.9 0 0 1 1.904-1.792q1.204-.672 2.716-.672 1.82 0 3.276.952a6.44 6.44 0 0 1 2.324 2.52q.868 1.567.868 3.556 0 1.96-.868 3.556a6.5 6.5 0 0 1-2.324 2.492q-1.456.924-3.276.924m-7.196 5.32V14.56h3.08v3.612l-.532 3.276.532 3.248V33.6zm6.692-8.232q1.12 0 1.96-.504a3.6 3.6 0 0 0 1.344-1.456q.504-.924.504-2.128t-.504-2.128a3.43 3.43 0 0 0-1.344-1.428q-.84-.532-1.96-.532t-1.988.532a3.43 3.43 0 0 0-1.344 1.428q-.476.924-.476 2.128t.476 2.128a3.6 3.6 0 0 0 1.344 1.456q.868.504 1.988.504M56.95 28V14.56h3.08V28zm3.08-7.476-1.064-.532q0-2.548 1.12-4.116 1.148-1.596 3.444-1.596 1.008 0 1.82.364.812.365 1.512 1.176l-2.016 2.072a2.1 2.1 0 0 0-.812-.56 3 3 0 0 0-1.036-.168q-1.287 0-2.128.812-.84.811-.84 2.548m14.156 7.756q-2.016 0-3.64-.896a7 7 0 0 1-2.548-2.52q-.924-1.596-.924-3.584t.924-3.556a6.87 6.87 0 0 1 2.492-2.52q1.596-.924 3.528-.924 1.876 0 3.304.868a6.05 6.05 0 0 1 2.268 2.38q.84 1.512.84 3.444 0 .336-.056.7a7 7 0 0 1-.112.756H69.23v-2.52h9.436l-1.148 1.008q-.056-1.232-.476-2.072a3 3 0 0 0-1.204-1.288q-.756-.448-1.876-.448-1.176 0-2.044.504a3.43 3.43 0 0 0-1.344 1.428q-.476.896-.476 2.156t.504 2.212 1.428 1.484q.924.504 2.128.504 1.037 0 1.904-.364a4 4 0 0 0 1.512-1.064l1.96 1.988a6.3 6.3 0 0 1-2.38 1.736 7.6 7.6 0 0 1-2.968.588m15.91 0q-1.54 0-2.745-.644a5.1 5.1 0 0 1-1.904-1.82q-.672-1.148-.672-2.604v-3.864q0-1.456.7-2.604a4.9 4.9 0 0 1 1.904-1.792q1.204-.672 2.716-.672 1.821 0 3.276.952a6.44 6.44 0 0 1 2.324 2.52q.869 1.567.868 3.556 0 1.96-.868 3.556a6.5 6.5 0 0 1-2.324 2.492q-1.455.924-3.276.924M82.898 28V7.84h3.08v10.024l-.532 3.248.532 3.276V28zm6.692-2.632q1.12 0 1.96-.504a3.6 3.6 0 0 0 1.344-1.456q.504-.924.504-2.128t-.504-2.128a3.43 3.43 0 0 0-1.344-1.428q-.84-.532-1.96-.532t-1.988.532a3.43 3.43 0 0 0-1.344 1.428q-.476.924-.476 2.128.001 1.204.476 2.128a3.6 3.6 0 0 0 1.344 1.456q.87.504 1.988.504m15.067 2.912q-1.708 0-3.052-.756a5.5 5.5 0 0 1-2.072-2.072q-.728-1.344-.728-3.08V14.56h3.08v7.672q0 .98.308 1.68.336.672.952 1.036.644.364 1.512.364 1.344 0 2.044-.784.728-.812.728-2.296V14.56h3.08v7.812q0 1.764-.756 3.108a5.3 5.3 0 0 1-2.044 2.072q-1.317.728-3.052.728m8.976-.28V14.56h3.08V28zm1.54-15.904q-.783 0-1.316-.532-.504-.532-.504-1.316t.504-1.316a1.8 1.8 0 0 1 1.316-.532q.813 0 1.316.532t.504 1.316q0 .784-.504 1.316t-1.316.532M120.169 28V7.84h3.08V28zm8.552 0V8.96h3.08V28zm-3.22-10.64v-2.8h9.52v2.8zm17.274 10.92q-1.708 0-3.052-.756a5.5 5.5 0 0 1-2.072-2.072q-.728-1.344-.728-3.08V14.56h3.08v7.672q0 .98.308 1.68.336.672.952 1.036.643.364 1.512.364 1.344 0 2.044-.784.728-.812.728-2.296V14.56h3.08v7.812q0 1.764-.756 3.108a5.3 5.3 0 0 1-2.044 2.072q-1.317.728-3.052.728m8.977-.28V14.56h3.08V28zm1.54-15.904q-.785 0-1.316-.532-.504-.532-.504-1.316t.504-1.316a1.8 1.8 0 0 1 1.316-.532q.812 0 1.316.532t.504 1.316-.504 1.316-1.316.532" fill="#000" />
                            <path d="m8.75 11.3 6.75 3.884 6.75-3.885M8.75 34.58v-7.755L2 22.939m27 0-6.75 3.885v7.754M2.405 15.408 15.5 22.954l13.095-7.546M15.5 38V22.939M29 28.915V16.962a2.98 2.98 0 0 0-1.5-2.585L17 8.4a3.01 3.01 0 0 0-3 0L3.5 14.377A3 3 0 0 0 2 16.962v11.953A2.98 2.98 0 0 0 3.5 31.5L14 37.477a3.01 3.01 0 0 0 3 0L27.5 31.5a3 3 0 0 0 1.5-2.585" stroke="#4F39F6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </Link>
                )}
            </div>

            {/* Center section - Page title for sidebar mode */}
            {showSidebarToggle && pageTitle && (
                <div className="flex flex-1">
                    <span className="text-muted-foreground text-sm font-medium">{pageTitle}</span>
                </div>
            )}

            {/* Desktop Menu - only show when not in sidebar mode */}
            {!showSidebarToggle && (
                <div className="hidden sm:flex items-center gap-8">
                    <Link to="/">Home</Link>
                    <Link to="/">Scholarships</Link>
                </div>
            )}

            {/* Right side - User actions */}
            <div className="flex items-center gap-4 flex-shrink-0">
                {/* Notification Bell - only show in sidebar mode */}
                {showSidebarToggle && (
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Bell className="size-5 text-gray-600" />
                    </button>
                )}

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
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
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
                        className="cursor-pointer px-8 py-2 text-white rounded-full transition"
                        style={{ backgroundColor: '#4F39F6' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3D2DB8'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4F39F6'}
                        onClick={() => navigate('/login')}
                    >
                        Login
                    </button>
                )}
            </div>

            {/* Mobile Hamburger - only show when not in sidebar mode */}
            {!showSidebarToggle && (
                <button onClick={() => open ? setOpen(false) : setOpen(true)} aria-label="Menu" className="sm:hidden">
                    <svg width="21" height="15" viewBox="0 0 21 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="21" height="1.5" rx=".75" fill="#426287" />
                        <rect x="8" y="6" width="13" height="1.5" rx=".75" fill="#426287" />
                        <rect x="6" y="13" width="15" height="1.5" rx=".75" fill="#426287" />
                    </svg>
                </button>
            )}

            {/* Mobile Menu - only show when not in sidebar mode */}
            {!showSidebarToggle && (
                <div className={`${open ? 'flex' : 'hidden'} absolute top-[60px] left-0 w-full bg-white shadow-md py-4 flex-col items-start gap-2 px-5 text-sm md:hidden`}>
                    <Link to="/" className="block">Home</Link>
                    <Link to="/" className="block">Scholarships</Link>
                    {user ? (
                        <div className="w-full mt-2">
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg mb-2">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                    style={{ backgroundColor: '#4F39F6' }}
                                >
                                    {getUserDisplayName().charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium">{getUserDisplayName()}</span>
                            </div>
                            <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded" onClick={handleProfileClick}>
                                Profile
                            </button>
                            <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded" onClick={handleSettingsClick}>
                                Settings
                            </button>
                            <button
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                                onClick={handleLogout}
                            >
                                Log out
                            </button>
                        </div>
                    ) : (
                        <button
                            className="cursor-pointer px-6 py-2 mt-2 text-white rounded-full text-sm transition"
                            style={{ backgroundColor: '#4F39F6' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0677f0ff'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0677f0ff'}
                            onClick={() => navigate('/login')}
                        >
                            Login
                        </button>
                    )}
                </div>
            )}
        </nav>
    )
}

export default Navbar