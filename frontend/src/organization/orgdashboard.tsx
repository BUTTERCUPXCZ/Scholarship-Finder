import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider/AuthProvider'
import {
    SidebarProvider,
    SidebarInset,
} from '../components/ui/sidebar'
import { Button } from '../components/ui/button'
import {
    Users,
    GraduationCap,
    DollarSign,
    TrendingUp,
    Plus,
    Eye,
    BarChart3,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle
} from 'lucide-react'
import OrgSidebar from '../components/orgSidebar'
import Navbar from '../components/Navbar'

const orgdashboard = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <OrgSidebar />

                <SidebarInset className="flex-1">
                    <Navbar showSidebarToggle={true} pageTitle="Dashboard" />

                    <div className="flex flex-1 flex-col gap-6 p-6">
                        {/* Welcome Header */}
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.fullname || user?.email || 'User'}!</h1>
                            <p className="text-gray-600">Here's what's happening with your scholarships today.</p>
                        </div>

                        {/* Key Metrics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-lg border shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Total Scholarships</p>
                                        <p className="text-3xl font-bold text-gray-900">12</p>
                                        <p className="text-sm text-green-600 mt-1">+2 this month</p>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-lg">
                                        <GraduationCap className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg border shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Active Applications</p>
                                        <p className="text-3xl font-bold text-gray-900">247</p>
                                        <p className="text-sm text-green-600 mt-1">+18 today</p>
                                    </div>
                                    <div className="bg-green-100 p-3 rounded-lg">
                                        <Users className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg border shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Total Budget</p>
                                        <p className="text-3xl font-bold text-gray-900">$485K</p>
                                        <p className="text-sm text-blue-600 mt-1">$120K allocated</p>
                                    </div>
                                    <div className="bg-yellow-100 p-3 rounded-lg">
                                        <DollarSign className="w-6 h-6 text-yellow-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg border shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                                        <p className="text-3xl font-bold text-gray-900">87%</p>
                                        <p className="text-sm text-green-600 mt-1">+5% from last month</p>
                                    </div>
                                    <div className="bg-purple-100 p-3 rounded-lg">
                                        <TrendingUp className="w-6 h-6 text-purple-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Button
                                    className="flex items-center gap-2 h-12 text-white"
                                    style={{ backgroundColor: '#4F39F6' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3D2DB8'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4F39F6'}
                                    onClick={() => navigate('/create-scholar')}
                                >
                                    <Plus className="w-4 h-4" />
                                    Create New Scholarship
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex items-center gap-2 h-12 border-2"
                                    style={{ borderColor: '#4F39F6', color: '#4F39F6' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#4F39F6'
                                        e.currentTarget.style.color = 'white'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                        e.currentTarget.style.color = '#4F39F6'
                                    }}
                                    onClick={() => navigate('/manage-scholarships')}
                                >
                                    <Eye className="w-4 h-4" />
                                    View Applications
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex items-center gap-2 h-12 border-2"
                                    style={{ borderColor: '#4F39F6', color: '#4F39F6' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#4F39F6'
                                        e.currentTarget.style.color = 'white'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                        e.currentTarget.style.color = '#4F39F6'
                                    }}
                                    onClick={() => navigate('/analytics')}
                                >
                                    <BarChart3 className="w-4 h-4" />
                                    View Analytics
                                </Button>
                            </div>
                        </div>

                        {/* Recent Activity & Analytics */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Activity */}
                            <div className="bg-white p-6 rounded-lg border shadow-sm">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-green-100 p-2 rounded-lg mt-1">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-900 font-medium">New application received</p>
                                            <p className="text-xs text-gray-600">Sarah Johnson applied for Engineering Excellence Scholarship</p>
                                            <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-100 p-2 rounded-lg mt-1">
                                            <Calendar className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-900 font-medium">Scholarship deadline updated</p>
                                            <p className="text-xs text-gray-600">Medical Research Scholarship deadline extended to Dec 15</p>
                                            <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="bg-yellow-100 p-2 rounded-lg mt-1">
                                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-900 font-medium">Review pending</p>
                                            <p className="text-xs text-gray-600">5 applications waiting for review in STEM Scholarship</p>
                                            <p className="text-xs text-gray-500 mt-1">3 hours ago</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="bg-purple-100 p-2 rounded-lg mt-1">
                                            <TrendingUp className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-900 font-medium">Monthly report generated</p>
                                            <p className="text-xs text-gray-600">November scholarship performance report is ready</p>
                                            <p className="text-xs text-gray-500 mt-1">5 hours ago</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Application Statistics */}
                            <div className="bg-white p-6 rounded-lg border shadow-sm">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Overview</h2>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600">Pending Review</span>
                                            <span className="text-sm font-medium text-gray-900">23</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600">Under Review</span>
                                            <span className="text-sm font-medium text-gray-900">45</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600">Approved</span>
                                            <span className="text-sm font-medium text-gray-900">156</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600">Rejected</span>
                                            <span className="text-sm font-medium text-gray-900">23</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-red-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Upcoming Deadlines */}
                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left text-sm font-medium text-gray-600 pb-3">Scholarship</th>
                                            <th className="text-left text-sm font-medium text-gray-600 pb-3">Applications</th>
                                            <th className="text-left text-sm font-medium text-gray-600 pb-3">Deadline</th>
                                            <th className="text-left text-sm font-medium text-gray-600 pb-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        <tr>
                                            <td className="py-3">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">Engineering Excellence</p>
                                                    <p className="text-xs text-gray-600">$5,000 award</p>
                                                </div>
                                            </td>
                                            <td className="py-3 text-sm text-gray-900">47</td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4 text-red-500" />
                                                    <span className="text-sm text-red-600">Dec 15, 2024</span>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                                    Closing Soon
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-3">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">Medical Research Grant</p>
                                                    <p className="text-xs text-gray-600">$10,000 award</p>
                                                </div>
                                            </td>
                                            <td className="py-3 text-sm text-gray-900">23</td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4 text-green-500" />
                                                    <span className="text-sm text-green-600">Jan 30, 2025</span>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                                    Active
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-3">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">Arts & Literature</p>
                                                    <p className="text-xs text-gray-600">$3,000 award</p>
                                                </div>
                                            </td>
                                            <td className="py-3 text-sm text-gray-900">89</td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4 text-blue-500" />
                                                    <span className="text-sm text-blue-600">Mar 15, 2025</span>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                    Active
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}

export default orgdashboard