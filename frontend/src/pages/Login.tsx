import React, { useCallback, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { loginUser, type LoginData } from '../services/auth';
import { useAuth } from '../AuthProvider/AuthProvider';
import { toast } from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Checkbox } from '../components/ui/checkbox';
import { Loader2, Mail, Lock, Eye, EyeOff, GraduationCap, ArrowLeft } from 'lucide-react';

const Login = () => {
    const [form, setForm] = useState<LoginData>({ email: "", password: "" });
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    // Get the intended destination from location state, or use role-based default
    const from = location.state?.from?.pathname || null;

    const mutation = useMutation({
        mutationFn: loginUser,
        onSuccess: async (data) => {
            setError(null);

            // Use AuthProvider login method to update context
            login(data.user);

            // Small delay to ensure cookie is set before navigation
            await new Promise(resolve => setTimeout(resolve, 100));

            // Determine where to redirect
            let redirectPath = from;
            if (!redirectPath) {
                const role = data?.user?.role?.toString?.() ?? '';
                redirectPath = role === 'ORGANIZATION' ? '/orgdashboard' : '/home';
            }

            navigate(redirectPath, { replace: true });
        },
        onError: (error: Error) => {
            setError(error.message);
            const err: any = error;
            const serverMsg = err?.response?.data?.message || err?.message || String(err);

            const notVerified = serverMsg === 'EMAIL_NOT_VERIFIED' || / not verified/i.test(serverMsg) || /email.*verify/i.test(serverMsg);

            if (notVerified) {
                return null
            } else {
                toast.error(serverMsg);
            }
            setError(serverMsg);
        },
    });

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            setForm((prev) => ({ ...prev, [name]: value }));
            if (error) setError(null);
        },
        [error]
    );

    const handleSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError(null);

            const email = form.email.trim();
            const password = form.password;

            if (!email || !password) {
                setError("Email and password are required");
                return;
            }

            mutation.mutate({ email, password });
        },
        [form, mutation]
    );

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
                        <h2 className="text-2xl font-semibold text-gray-800">Welcome Back!</h2>
                        <p className="text-gray-600 max-w-md">
                            Continue your scholarship journey and discover new opportunities waiting for you.
                        </p>
                    </div>
                    
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-200/50 to-purple-200/50 rounded-3xl blur-xl"></div>
                        <img
                            src="/project-amico.png"
                            alt="Login illustration"
                            className="relative w-full max-w-lg h-auto rounded-3xl shadow-2xl"
                        />
                    </div>
                </div>

                {/* Right Side - Login Form */}
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

                    <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
                        <CardHeader className="space-y-1 text-center pb-6">
                            <CardTitle className="text-2xl font-bold text-gray-900">Sign In</CardTitle>
                            <CardDescription className="text-gray-600">
                                Enter your credentials to access your account
                            </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="space-y-6">
                            {error && (
                                <Alert variant="destructive" className="border-red-200 bg-red-50">
                                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
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
                                            onChange={handleChange}
                                            placeholder="Enter your email"
                                            className="pl-11 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        />
                                    </div>
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
                                            onChange={handleChange}
                                            placeholder="Enter your password"
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
                                </div>

                                {/* Remember Me & Forgot Password */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            id="remember" 
                                            checked={rememberMe}
                                            onCheckedChange={setRememberMe}
                                            className="border-gray-300"
                                        />
                                        <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                                            Remember me
                                        </Label>
                                    </div>
                                    <Link 
                                        to="/forgot-password" 
                                        className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-base"
                                    disabled={mutation.isPending}
                                >
                                    {mutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        'Sign In'
                                    )}
                                </Button>

                                {/* Divider */}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-gray-200" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-gray-500">New to ScholarSphere?</span>
                                    </div>
                                </div>

                                {/* Sign Up Link */}
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">
                                        Don't have an account?{' '}
                                        <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline">
                                            Create free account
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

export default Login