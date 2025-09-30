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
import { Loader2, Mail, Lock, User, Eye, EyeOff, Building, GraduationCap, ArrowLeft, CheckCircle } from 'lucide-react'

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
            navigate('/verify?status=pending&email=' + encodeURIComponent(form.email));
        },
        onError: (error: Error) => {
            setError(error.message);
        }
    });

    const validatePassword = (password: string) => {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
        };
        return requirements;
    };

    const passwordRequirements = validatePassword(form.password);
    const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

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

        if (!isPasswordValid) {
            setError('Password does not meet requirements');
            return;
        }

        setError(null);
        mutation.mutate({ fullname: trimmedFullname, email: trimmedEmail, password, role });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100/50 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left Side - Branding & Illustration */}
                <div className="hidden lg:flex flex-col items-center justify-center space-y-8">
                    <div className="text-center space-y-4">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
                                <GraduationCap className="h-7 w-7 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">ScholarSphere</h1>
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-800">Join Our Community</h2>
                        <p className="text-gray-600 max-w-md">
                            Start your scholarship journey today and unlock thousands of educational opportunities.
                        </p>

                        {/* Benefits */}
                        <div className="space-y-3 pt-6">
                            {[
                                "Access to 15,000+ verified scholarships",
                                "Real-time application tracking",
                                "Personalized recommendations",
                                "Expert guidance and support"
                            ].map((benefit, index) => (
                                <div key={index} className="flex items-center gap-3 text-left">
                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <span className="text-gray-700">{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-200/50 to-purple-200/50 rounded-3xl blur-xl"></div>
                        <img
                            src="/project-amico.png"
                            alt="Register illustration"
                            className="relative w-full max-w-lg h-auto rounded-3xl shadow-2xl"
                        />
                    </div>
                </div>

                {/* Right Side - Register Form */}
                <div className="w-full max-w-md mx-auto lg:mx-0">
                    {/* Mobile Header */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">ScholarSphere</h1>
                        </div>
                    </div>

                    <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
                        <CardHeader className="space-y-1 text-center pb-6">
                            <CardTitle className="text-2xl font-bold text-gray-900">Create Account</CardTitle>
                            <CardDescription className="text-gray-600">
                                Join thousands of students finding their perfect scholarships
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {error && (
                                <Alert variant="destructive" className="border-red-200 bg-red-50">
                                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Full Name Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="fullname" className="text-gray-700 font-medium">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <Input
                                            id="fullname"
                                            name="fullname"
                                            type="text"
                                            value={form.fullname}
                                            onChange={handleOnChange}
                                            placeholder="Enter your full name"
                                            className="pl-11 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={form.email}
                                            onChange={handleOnChange}
                                            placeholder="Enter your email"
                                            className="pl-11 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Role Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="role" className="text-gray-700 font-medium">I am a...</Label>
                                    <Select value={form.role} onValueChange={handleRoleChange}>
                                        <SelectTrigger className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500">
                                            <div className="flex items-center gap-2">
                                                {form.role === 'STUDENT' && <GraduationCap className="h-5 w-5 text-gray-400" />}
                                                {form.role === 'ORGANIZATION' && <Building className="h-5 w-5 text-gray-400" />}
                                                <SelectValue placeholder="Select your role" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="STUDENT">
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap className="h-5 w-5 text-indigo-600" />
                                                    <div>
                                                        <div className="font-medium">Student</div>
                                                        <div className="text-xs text-gray-500">Looking for scholarships</div>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="ORGANIZATION">
                                                <div className="flex items-center gap-2">
                                                    <Building className="h-5 w-5 text-indigo-600" />
                                                    <div>
                                                        <div className="font-medium">Organization</div>
                                                        <div className="text-xs text-gray-500">Offering scholarships</div>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            value={form.password}
                                            onChange={handleOnChange}
                                            placeholder="Create a strong password"
                                            className="pl-11 pr-11 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>

                                    {/* Password Requirements */}
                                    {form.password && (
                                        <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                                            <div className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className={`flex items-center gap-1 ${passwordRequirements.length ? 'text-green-600' : 'text-gray-400'}`}>
                                                    <CheckCircle className="h-3 w-3" />
                                                    8+ characters
                                                </div>
                                                <div className={`flex items-center gap-1 ${passwordRequirements.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                                                    <CheckCircle className="h-3 w-3" />
                                                    Uppercase letter
                                                </div>
                                                <div className={`flex items-center gap-1 ${passwordRequirements.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                                                    <CheckCircle className="h-3 w-3" />
                                                    Lowercase letter
                                                </div>
                                                <div className={`flex items-center gap-1 ${passwordRequirements.number ? 'text-green-600' : 'text-gray-400'}`}>
                                                    <CheckCircle className="h-3 w-3" />
                                                    Number
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={form.confirmPassword}
                                            onChange={handleOnChange}
                                            placeholder="Confirm your password"
                                            className="pl-11 pr-11 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {form.confirmPassword && (
                                        <div className={`text-xs flex items-center gap-1 ${form.password === form.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                                            <CheckCircle className="h-3 w-3" />
                                            {form.password === form.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-base"
                                    disabled={mutation.isPending || !isPasswordValid || form.password !== form.confirmPassword}
                                >
                                    {mutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Creating account...
                                        </>
                                    ) : (
                                        'Create Account'
                                    )}
                                </Button>

                                {/* Terms */}
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        By creating an account, you agree to our{' '}
                                        <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a>
                                        {' '}and{' '}
                                        <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>
                                    </p>
                                </div>

                                {/* Divider */}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-gray-200" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-gray-500">Already have an account?</span>
                                    </div>
                                </div>

                                {/* Sign In Link */}
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">
                                        <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline">
                                            Sign in to your account
                                        </Link>
                                    </p>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Back to Home */}
                    <div className="text-center mt-6">
                        <Link
                            to="/home"
                            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register