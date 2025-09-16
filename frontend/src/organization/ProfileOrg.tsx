import React, { useState } from 'react';
import { useAuth } from '../AuthProvider/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '../components/ui/sidebar';
import OrgSidebar from '../components/orgSidebar';
import Navbar from '../components/Navbar';

interface OrganizationStats {
    totalScholarships: number;
    activeScholarships: number;
    totalApplications: number;
    archivedScholarships: number;
}

const ProfileOrg = () => {
    const { user, refetchUser } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        fullname: user?.fullname || '',
        email: user?.email || '',
    });
    const [isUpdating, setIsUpdating] = useState(false);

    // Fetch organization statistics
    const { data: stats, isLoading: statsLoading } = useQuery<OrganizationStats>({
        queryKey: ['organization-stats', user?.id],
        queryFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/organization/stats`, {
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }
            return response.json();
        },
        enabled: !!user?.id && user?.role === 'ORGANIZATION',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = async () => {
        if (!user) return;

        setIsUpdating(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/profile`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            await refetchUser();
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            // You might want to show a toast notification here
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            fullname: user?.fullname || '',
            email: user?.email || '',
        });
        setIsEditing(false);
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg text-gray-600">Loading profile...</div>
            </div>
        );
    }

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <OrgSidebar />

                <SidebarInset className="flex-1">
                    <Navbar showSidebarToggle={true} pageTitle="Organization Profile" />

                    <div className="flex flex-1 flex-col gap-6 p-6 bg-gray-50">
                        {/* Header */}
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">Organization Profile</h1>
                            <p className="text-gray-600">Manage your organization information and view statistics</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Profile Information */}
                            <div className="lg:col-span-2">
                                <Card className="border-0 shadow-lg">
                                    <CardHeader className="bg-indigo-600 text-white rounded-t-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-xl">Profile Information</CardTitle>
                                                <CardDescription className="text-indigo-100">
                                                    Update your organization details
                                                </CardDescription>
                                            </div>
                                            {!isEditing && (
                                                <Button
                                                    onClick={() => setIsEditing(true)}
                                                    variant="outline"
                                                    className="bg-white text-indigo-600 border-white hover:bg-indigo-50"
                                                >
                                                    Edit Profile
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        {/* Profile Avatar */}
                                        <div className="flex items-center space-x-4">
                                            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <span className="text-2xl font-bold text-indigo-600">
                                                    {user.fullname.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{user.fullname}</h3>
                                                <p className="text-gray-600 capitalize">{user.role.toLowerCase()}</p>
                                            </div>
                                        </div>

                                        {/* Form Fields */}
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Organization Name
                                                </label>
                                                {isEditing ? (
                                                    <Input
                                                        id="fullname"
                                                        name="fullname"
                                                        value={formData.fullname}
                                                        onChange={handleInputChange}
                                                        className="focus:ring-indigo-500 focus:border-indigo-500"
                                                        placeholder="Enter organization name"
                                                    />
                                                ) : (
                                                    <div className="p-3 bg-gray-50 rounded-md border">
                                                        <span className="text-gray-900">{user.fullname}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Email Address
                                                </label>
                                                {isEditing ? (
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        className="focus:ring-indigo-500 focus:border-indigo-500"
                                                        placeholder="Enter email address"
                                                    />
                                                ) : (
                                                    <div className="p-3 bg-gray-50 rounded-md border">
                                                        <span className="text-gray-900">{user.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        {isEditing && (
                                            <div className="flex space-x-3 pt-4">
                                                <Button
                                                    onClick={handleSave}
                                                    disabled={isUpdating}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                                >
                                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                                </Button>
                                                <Button
                                                    onClick={handleCancel}
                                                    variant="outline"
                                                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Statistics */}
                            <div className="space-y-6">
                                <Card className="border-0 shadow-lg">
                                    <CardHeader className="bg-white border-b border-gray-200">
                                        <CardTitle className="text-lg text-gray-900">Organization Statistics</CardTitle>
                                        <CardDescription className="text-gray-600">
                                            Overview of your activity
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {statsLoading ? (
                                            <div className="p-6 text-center text-gray-500">Loading statistics...</div>
                                        ) : (
                                            <div className="divide-y divide-gray-200">
                                                <div className="p-4 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Total Scholarships</p>
                                                        <p className="text-2xl font-bold text-indigo-600">{stats?.totalScholarships || 0}</p>
                                                    </div>
                                                </div>
                                                <div className="p-4 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Active Scholarships</p>
                                                        <p className="text-2xl font-bold text-green-600">{stats?.activeScholarships || 0}</p>
                                                    </div>
                                                </div>
                                                <div className="p-4 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Total Applications</p>
                                                        <p className="text-2xl font-bold text-blue-600">{stats?.totalApplications || 0}</p>
                                                    </div>
                                                </div>
                                                <div className="p-4 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Archived</p>
                                                        <p className="text-2xl font-bold text-gray-600">{stats?.archivedScholarships || 0}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Quick Actions */}
                                <Card className="border-0 shadow-lg">
                                    <CardHeader className="bg-white border-b border-gray-200">
                                        <CardTitle className="text-lg text-gray-900">Quick Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-3">
                                        <Button
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                            onClick={() => navigate('/organization/manage-scholar')}
                                        >
                                            Manage Scholarships
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                                            onClick={() => navigate('/organization/applications')}
                                        >
                                            View Applications
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                                            onClick={() => navigate('/organization/archive')}
                                        >
                                            View Archive
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
};

export default ProfileOrg;