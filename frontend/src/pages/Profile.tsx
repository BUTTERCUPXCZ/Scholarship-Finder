import { useState } from 'react'
import { useAuth } from '../AuthProvider/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import StudentNavbar from '../components/studentNavbar'
import {
    User,
    Mail,
    Calendar,
    Award,
    Edit3,
    Save,
    X,
    GraduationCap,
    MapPin,
    Phone,
    Camera,
    CheckCircle,
    Clock,
    XCircle
} from 'lucide-react'

const Profile = () => {
    const { user } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [profileData, setProfileData] = useState({
        fullname: user?.fullname || '',
        email: user?.email || '',
        phone: '',
        location: '',
        university: '',
        major: '',
        graduationYear: '',
        gpa: '',
        bio: ''
    })

    const handleInputChange = (field: string, value: string) => {
        setProfileData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSave = () => {
        // TODO: Implement save functionality with API call
        console.log('Saving profile data:', profileData)
        setIsEditing(false)
    }

    const handleCancel = () => {
        setProfileData({
            fullname: user?.fullname || '',
            email: user?.email || '',
            phone: '',
            location: '',
            university: '',
            major: '',
            graduationYear: '',
            gpa: '',
            bio: ''
        })
        setIsEditing(false)
    }

    if (!user) {
        return (
            <>
                <StudentNavbar />
                <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                    <div className="container mx-auto px-4 py-16">
                        <Card className="max-w-md mx-auto shadow-lg">
                            <CardContent className="p-8 text-center">
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-8 h-8 text-indigo-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Required</h2>
                                <p className="text-gray-600">Please log in to view your profile.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <StudentNavbar />
            <div className="min-h-screen">
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900 mb-2">Profile Settings</h1>
                                <p className="text-gray-600 text-lg">Manage your personal information and academic details</p>
                            </div>
                            {!isEditing ? (
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    <Edit3 className="w-5 h-5 mr-2" />
                                    Edit Profile
                                </Button>
                            ) : (
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleSave}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        <Save className="w-5 h-5 mr-2" />
                                        Save Changes
                                    </Button>
                                    <Button
                                        onClick={handleCancel}
                                        variant="outline"
                                        className="border-gray-300 hover:bg-gray-50 px-6 py-3 rounded-lg transition-all duration-200"
                                    >
                                        <X className="w-5 h-5 mr-2" />
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Profile Sidebar */}
                        <div className="lg:col-span-4">
                            <Card className=" border-0 bg-white/80 backdrop-blur-sm border border-gray-300">
                                <CardContent className="p-8">
                                    {/* Profile Photo Section */}
                                    <div className="text-center mb-6">
                                        <div className="relative inline-block">
                                            <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                                                <span className="text-4xl font-bold text-white">
                                                    {user.fullname ? user.fullname.charAt(0).toUpperCase() : 'U'}
                                                </span>
                                            </div>
                                            <button className="absolute bottom-2 right-2 w-10 h-10 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 hover:scale-105">
                                                <Camera className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.fullname}</h2>
                                        <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 px-3 py-1">
                                            {user.role}
                                        </Badge>
                                    </div>

                                    {/* Quick Info */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <Mail className="w-5 h-5 text-indigo-600" />
                                            <div>
                                                <p className="text-sm text-gray-600">Email</p>
                                                <p className="font-medium text-gray-900">{user.email}</p>
                                            </div>
                                        </div>
                                        {profileData.phone && (
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <Phone className="w-5 h-5 text-indigo-600" />
                                                <div>
                                                    <p className="text-sm text-gray-600">Phone</p>
                                                    <p className="font-medium text-gray-900">{profileData.phone}</p>
                                                </div>
                                            </div>
                                        )}
                                        {profileData.location && (
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <MapPin className="w-5 h-5 text-indigo-600" />
                                                <div>
                                                    <p className="text-sm text-gray-600">Location</p>
                                                    <p className="font-medium text-gray-900">{profileData.location}</p>
                                                </div>
                                            </div>
                                        )}
                                        {user.createdAt && (
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <Calendar className="w-5 h-5 text-indigo-600" />
                                                <div>
                                                    <p className="text-sm text-gray-600">Member Since</p>
                                                    <p className="font-medium text-gray-900">{new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-8 space-y-8">
                            {/* Personal Information */}
                            <Card className="border border-gray-300 bg-white/80 backdrop-blur-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-3 text-xl">
                                        Personal Information
                                    </CardTitle>
                                    <CardDescription className="text-gray-600">
                                        Your basic personal details and contact information
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Full Name</label>
                                            {isEditing ? (
                                                <Input
                                                    value={profileData.fullname}
                                                    onChange={(e) => handleInputChange('fullname', e.target.value)}
                                                    placeholder="Enter your full name"
                                                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                                                />
                                            ) : (
                                                <div className="p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-gray-900">{profileData.fullname || 'Not provided'}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Email Address</label>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-gray-900">{user.email}</p>
                                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                                            {isEditing ? (
                                                <Input
                                                    value={profileData.phone}
                                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                                    placeholder="Enter your phone number"
                                                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                                                />
                                            ) : (
                                                <div className="p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-gray-900">{profileData.phone || 'Not provided'}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Location</label>
                                            {isEditing ? (
                                                <Input
                                                    value={profileData.location}
                                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                                    placeholder="Enter your location"
                                                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                                                />
                                            ) : (
                                                <div className="p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-gray-900">{profileData.location || 'Not provided'}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Bio</label>
                                        {isEditing ? (
                                            <textarea
                                                className="flex min-h-[120px] w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none placeholder:text-gray-400"
                                                value={profileData.bio}
                                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                                placeholder="Tell us about yourself, your interests, goals, and what you hope to achieve..."
                                            />
                                        ) : (
                                            <div className="p-4 bg-gray-50 rounded-lg min-h-[120px]">
                                                <p className="text-gray-900">{profileData.bio || 'No bio provided yet. Add a brief description about yourself!'}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>


                            {/* Scholarship Activity */}
                            <Card className="border border-gray-300 bg-white/80 backdrop-blur-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-3 text-xl">

                                        Scholarship Activity
                                    </CardTitle>
                                    <CardDescription className="text-gray-600">
                                        Track your scholarship application progress
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Award className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <p className="text-3xl font-bold text-blue-600 mb-1">0</p>
                                            <p className="text-sm text-gray-600 font-medium">Total Applications</p>
                                        </div>
                                        <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <CheckCircle className="w-6 h-6 text-green-600" />
                                            </div>
                                            <p className="text-3xl font-bold text-green-600 mb-1">0</p>
                                            <p className="text-sm text-gray-600 font-medium">Approved</p>
                                        </div>
                                        <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl">
                                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Clock className="w-6 h-6 text-yellow-600" />
                                            </div>
                                            <p className="text-3xl font-bold text-yellow-600 mb-1">0</p>
                                            <p className="text-sm text-gray-600 font-medium">Pending</p>
                                        </div>
                                        <div className="text-center p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl">
                                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <XCircle className="w-6 h-6 text-red-600" />
                                            </div>
                                            <p className="text-3xl font-bold text-red-600 mb-1">0</p>
                                            <p className="text-sm text-gray-600 font-medium">Rejected</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Profile