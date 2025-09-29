import { useState, useEffect } from 'react'
import { useAuth } from '../AuthProvider/AuthProvider'
import { updateUserProfile } from '../services/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import StudentNavbar from '../components/studentNavbar'
import toast from 'react-hot-toast'
import {
    User,
    Mail,
    Calendar,
    Edit3,
    Save,
    X,
    MapPin,
    Phone,
    Camera,
    GraduationCap,
    BookOpen,
    Award,
    Settings
} from 'lucide-react'

const Profile = () => {
    const { user, refetchUser } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
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

    // Sync form data with user data changes
    useEffect(() => {
        if (user) {
            setProfileData(prev => ({
                ...prev,
                fullname: user.fullname || '',
                email: user.email || ''
            }));
        }
    }, [user]);

    const handleInputChange = (field: string, value: string) => {
        setProfileData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSave = async () => {
        if (!profileData.fullname.trim() || !profileData.email.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        try {
            const response = await updateUserProfile({
                fullname: profileData.fullname.trim(),
                email: profileData.email.trim()
            });

            if (response.success) {
                toast.success('Profile updated successfully!');
                refetchUser();
                setIsEditing(false);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
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
                <div className="min-h-screen bg-gray-50">
                    <div className="container mx-auto px-4 py-16">
                        <Card className="max-w-md mx-auto border-gray-200 shadow-lg">
                            <CardContent className="p-8 text-center">
                                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
                                <p className="text-gray-600">Manage your personal information and preferences</p>
                            </div>
                            {!isEditing ? (
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    <Edit3 className="w-4 w-4 mr-2" />
                                    Edit Profile
                                </Button>
                            ) : (
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleSave}
                                        disabled={isLoading}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        <Save className="w-4 w-4 mr-2" />
                                        {isLoading ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Button
                                        onClick={handleCancel}
                                        disabled={isLoading}
                                        variant="outline"
                                        className="border-gray-200"
                                    >
                                        <X className="w-4 w-4 mr-2" />
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Profile Sidebar */}
                        <div className="lg:col-span-4">
                            <Card className="border-gray-200 bg-white shadow-lg">
                                <CardContent className="p-8">
                                    {/* Profile Photo Section */}
                                    <div className="text-center mb-8">
                                        <div className="relative inline-block">
                                            <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                                                <span className="text-4xl font-bold text-white">
                                                    {user.fullname ? user.fullname.charAt(0).toUpperCase() : 'U'}
                                                </span>
                                            </div>
                                            <button className="absolute bottom-2 right-2 w-10 h-10 bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center justify-center text-white shadow-lg transition-all duration-200 hover:scale-105">
                                                <Camera className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{user.fullname}</h2>
                                        <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1">
                                            <GraduationCap className="w-4 h-4 mr-1" />
                                            {user.role}
                                        </Badge>
                                    </div>

                                    <Separator className="mb-6" />

                                    {/* Quick Info */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                <Mail className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-700">Email</p>
                                                <p className="text-sm text-gray-900 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        
                                        {profileData.phone && (
                                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                    <Phone className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-700">Phone</p>
                                                    <p className="text-sm text-gray-900">{profileData.phone}</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {profileData.location && (
                                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                    <MapPin className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-700">Location</p>
                                                    <p className="text-sm text-gray-900">{profileData.location}</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {user.createdAt && (
                                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                    <Calendar className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-700">Member Since</p>
                                                    <p className="text-sm text-gray-900">
                                                        {new Date(user.createdAt).toLocaleDateString('en-US', { 
                                                            year: 'numeric', 
                                                            month: 'long' 
                                                        })}
                                                    </p>
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
                            <Card className="border-gray-200 bg-white shadow-lg">
                                <CardHeader className="pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <User className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl text-gray-900">Personal Information</CardTitle>
                                            <CardDescription className="text-gray-600">
                                                Your basic personal details and contact information
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Full Name *</Label>
                                            {isEditing ? (
                                                <Input
                                                    value={profileData.fullname}
                                                    onChange={(e) => handleInputChange('fullname', e.target.value)}
                                                    placeholder="Enter your full name"
                                                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                                />
                                            ) : (
                                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    <p className="text-gray-900">{profileData.fullname || 'Not provided'}</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <p className="text-gray-900">{user.email}</p>
                                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                                            {isEditing ? (
                                                <Input
                                                    value={profileData.phone}
                                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                                    placeholder="Enter your phone number"
                                                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                                />
                                            ) : (
                                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    <p className="text-gray-900">{profileData.phone || 'Not provided'}</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Location</Label>
                                            {isEditing ? (
                                                <Input
                                                    value={profileData.location}
                                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                                    placeholder="Enter your location"
                                                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                                />
                                            ) : (
                                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    <p className="text-gray-900">{profileData.location || 'Not provided'}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">Bio</Label>
                                        {isEditing ? (
                                            <Textarea
                                                value={profileData.bio}
                                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                                placeholder="Tell us about yourself, your interests, goals, and what you hope to achieve..."
                                                className="min-h-[120px] border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                        ) : (
                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 min-h-[120px]">
                                                <p className="text-gray-900">
                                                    {profileData.bio || 'No bio provided yet. Add a brief description about yourself!'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Academic Information */}
                            <Card className="border-gray-200 bg-white shadow-lg">
                                <CardHeader className="pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <BookOpen className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl text-gray-900">Academic Information</CardTitle>
                                            <CardDescription className="text-gray-600">
                                                Your educational background and academic achievements
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">University/College</Label>
                                            {isEditing ? (
                                                <Input
                                                    value={profileData.university}
                                                    onChange={(e) => handleInputChange('university', e.target.value)}
                                                    placeholder="Enter your university"
                                                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                                />
                                            ) : (
                                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    <p className="text-gray-900">{profileData.university || 'Not provided'}</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Major/Field of Study</Label>
                                            {isEditing ? (
                                                <Input
                                                    value={profileData.major}
                                                    onChange={(e) => handleInputChange('major', e.target.value)}
                                                    placeholder="Enter your major"
                                                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                                />
                                            ) : (
                                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    <p className="text-gray-900">{profileData.major || 'Not provided'}</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Expected Graduation</Label>
                                            {isEditing ? (
                                                <Input
                                                    value={profileData.graduationYear}
                                                    onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                                                    placeholder="e.g., 2025"
                                                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                                />
                                            ) : (
                                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    <p className="text-gray-900">{profileData.graduationYear || 'Not provided'}</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">GPA</Label>
                                            {isEditing ? (
                                                <Input
                                                    value={profileData.gpa}
                                                    onChange={(e) => handleInputChange('gpa', e.target.value)}
                                                    placeholder="e.g., 3.8"
                                                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                                />
                                            ) : (
                                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    <p className="text-gray-900">{profileData.gpa || 'Not provided'}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Stats */}
                            <Card className="border-gray-200 bg-white shadow-lg">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <Award className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <CardTitle className="text-lg text-gray-900">Quick Stats</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                            <div className="text-2xl font-bold text-indigo-600">0</div>
                                            <div className="text-sm text-gray-600">Applications</div>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                                            <div className="text-2xl font-bold text-green-600">0</div>
                                            <div className="text-sm text-gray-600">Accepted</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-8 space-y-8">
                            {/* Account Settings */}
                            <Card className="border-gray-200 bg-white shadow-lg">
                                <CardHeader className="pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <Settings className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl text-gray-900">Account Settings</CardTitle>
                                            <CardDescription className="text-gray-600">
                                                Manage your account preferences and security settings
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="p-4 border border-gray-200 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                                                    <p className="text-sm text-gray-600">Receive updates about your applications</p>
                                                </div>
                                                <Button variant="outline" size="sm" className="border-gray-200">
                                                    Configure
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="p-4 border border-gray-200 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">Privacy Settings</h4>
                                                    <p className="text-sm text-gray-600">Control who can see your profile</p>
                                                </div>
                                                <Button variant="outline" size="sm" className="border-gray-200">
                                                    Manage
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="p-4 border border-gray-200 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">Password & Security</h4>
                                                    <p className="text-sm text-gray-600">Update your password and security preferences</p>
                                                </div>
                                                <Button variant="outline" size="sm" className="border-gray-200">
                                                    Update
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent Activity */}
                            <Card className="border-gray-200 bg-white shadow-lg">
                                <CardHeader className="pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl text-gray-900">Recent Activity</CardTitle>
                                            <CardDescription className="text-gray-600">
                                                Your latest scholarship applications and updates
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Award className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Yet</h3>
                                        <p className="text-gray-600 mb-6">
                                            Start applying for scholarships to see your activity here
                                        </p>
                                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                            Browse Scholarships
                                        </Button>
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