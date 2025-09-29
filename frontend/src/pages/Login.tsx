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
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';

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

            // Use AuthProvider login method to update context (no token needed with cookies)
            login(data.user);

            // Small delay to ensure cookie is set before navigation
            await new Promise(resolve => setTimeout(resolve, 100));

            // Determine where to redirect
            let redirectPath = from;
            if (!redirectPath) {
                // Role-based redirect: STUDENT -> /home, ORGANIZATION -> /orgdashboard
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

    // ✅ useCallback prevents re-creating this function on every render
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            setForm((prev) => ({ ...prev, [name]: value }));
        },
        []
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

            // ✅ Pass trimmed data for consistency
            mutation.mutate({ email, password });
        },
        [form, mutation]
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50/30 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Left Side - Illustration */}
                <div className="hidden lg:flex items-center justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-3xl blur-xl"></div>
                        <img
                            src="/project-amico.png"
                            alt="Login illustration"
                            className="relative w-full max-w-lg h-auto rounded-3xl shadow-2xl"
                        />
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full max-w-md mx-auto lg:mx-0">
                    <Card className="border-0 shadow-2xl">
                        <CardHeader className="space-y-1 text-center pb-6">
                            <CardTitle className="text-3xl font-bold text-gray-900">Welcome Back</CardTitle>
                            <CardDescription className="text-gray-600">
                                Sign in to your account to continue your scholarship journey
                            </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="space-y-6">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
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
                                            onChange={handleChange}
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
                                            onChange={handleChange}
                                            placeholder="Enter your password"
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

                                {/* Remember Me & Forgot Password */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            id="remember" 
                                            checked={rememberMe}
                                            onCheckedChange={setRememberMe}
                                        />
                                        <Label htmlFor="remember" className="text-sm text-gray-600">
                                            Remember me
                                        </Label>
                                    </div>
                                    <Link 
                                        to="/forgot-password" 
                                        className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
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
                                            Signing in...
                                        </>
                                    ) : (
                                        'Sign In'
                                    )}
                                </Button>

                                {/* Sign Up Link */}
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">
                                        Don't have an account?{' '}
                                        <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline">
                                            Sign up for free
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

export default Login