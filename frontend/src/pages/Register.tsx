import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { registerUser, type RegisterData } from '../services/auth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Loader2, Mail, Lock, User, Eye, EyeOff, Building, GraduationCap } from 'lucide-react'

const Register = () => {
    const [form, setForm] = useState<{
        fullname: string;
        email: string;
        password: string;
        confirmPassword: string;
        role: string;
    }>({ fullname: '', email: '', password: '', confirmPassword: '', role: '' });

    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
    };

    const handleRoleChange = (value: string) => {
        setForm(prev => ({ ...prev, role: value }));
        if (error) setError(null);
    };

    const mutation = useMutation({
        mutationFn: (data: RegisterData) => registerUser(data),
        onSuccess: () => {
            setError(null);

            // Don't log the user in automatically after registration
            // Instead, redirect to email verification page
            navigate('/verify?status=pending&email=' + encodeURIComponent(form.email));
        },
        onError: (error: Error) => {
            setError(error.message);
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const { fullname, email, password, confirmPassword, role } = form;
        const trimmedFullname = fullname.trim();
        const trimmedEmail = email.trim();

        if (!trimmedFullname || !trimmedEmail || !password || !confirmPassword || !role) {
            setError('All fields are required');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setError(null);
        mutation.mutate({ fullname: trimmedFullname, email: trimmedEmail, password, role });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50/30 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Left Side - Illustration */}
                <div className="hidden lg:flex items-center justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-3xl blur-xl"></div>
                        <img
                            src="/project-amico.png"
                            alt="Register illustration"
                            className="relative w-full max-w-lg h-auto rounded-3xl shadow-2xl"
                        />
                    </div>
                </div>

                {/* Right Side - Register Form */}
                <div className="w-full max-w-md mx-auto lg:mx-0">
                    <Card className="border-0 shadow-2xl">
                        <CardHeader className="space-y-1 text-center pb-6">
                            <CardTitle className="text-3xl font-bold text-gray-900">Create Account</CardTitle>
                            <CardDescription className="text-gray-600">
                                Join thousands of students finding their perfect scholarships
                            </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="space-y-6">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Full Name Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="fullname">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="fullname"
                                            name="fullname"
                                            type="text"
                                            value={form.fullname}
                                            onChange={handleOnChange}
                                            placeholder="Enter your full name"
                                            className="pl-10 h-12"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={form.email}
                                            onChange={handleOnChange}
                                            placeholder="Enter your email"
                                            className="pl-10 h-12"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            value={form.password}
                                            onChange={handleOnChange}
                                            placeholder="Create a password"
                                            className="pl-10 pr-10 h-12"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={form.confirmPassword}
                                            onChange={handleOnChange}
                                            placeholder="Confirm your password"
                                            className="pl-10 pr-10 h-12"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Role Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="role">I am a...</Label>
                                    <Select value={form.role} onValueChange={handleRoleChange}>
                                        <SelectTrigger className="h-12">
                                            <div className="flex items-center gap-2">
                                                {form.role === 'STUDENT' && <GraduationCap className="h-4 w-4 text-gray-400" />}
                                                {form.role === 'ORGANIZATION' && <Building className="h-4 w-4 text-gray-400" />}
                                                <SelectValue placeholder="Select your role" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="STUDENT">
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap className="h-4 w-4" />
                                                    Student
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="ORGANIZATION">
                                                <div className="flex items-center gap-2">
                                                    <Building className="h-4 w-4" />
                                                    Organization
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white"
                                    disabled={mutation.isPending}
                                >
                                    {mutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating account...
                                        </>
                                    ) : (
                                        'Create Account'
                                    )}
                                </Button>

                                {/* Sign In Link */}
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">
                                        Already have an account?{' '}
                                        <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline">
                                            Sign in here
                                        </Link>
                                    </p>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default Register