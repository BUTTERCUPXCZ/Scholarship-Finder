import React, { useCallback, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { loginUser, type LoginData } from '../services/auth';
import { useAuth } from '../AuthProvider/AuthProvider';
import { toast } from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

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
        <div className="flex min-h-screen w-full overflow-hidden">
            {/* Left Side - Image (hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-12">
                <img
                    className="max-w-[500px] max-h-[80vh] mx-auto object-contain"
                    src="/project-amico.png"
                    alt="Login Illustration"
                />
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-white">
                <div className="w-full flex flex-col items-center space-y-8">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-bold text-gray-900">Sign In</CardTitle>
                            <CardDescription className="text-gray-600">
                                Enter your credentials to access your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="w-full rounded-md bg-red-50 p-3">
                                        <p className="text-sm font-medium text-red-800 text-center">{error}</p>
                                    </div>
                                )}

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-gray-700">
                                        Email Address
                                    </label>
                                    <div className="flex items-center w-full bg-transparent border border-gray-300/60 h-12 rounded-full overflow-hidden pl-6 gap-2">
                                        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z" fill="#6B7280" />
                                        </svg>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="Enter your email address"
                                            className="bg-transparent text-gray-500/80 placeholder-gray-500/80 outline-none text-sm w-full h-full"
                                            required
                                            disabled={mutation.isPending}
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <div className="flex items-center w-full bg-transparent border border-gray-300/60 h-12 rounded-full overflow-hidden pl-6 gap-2">
                                        <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280" />
                                        </svg>
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            value={form.password}
                                            onChange={handleChange}
                                            placeholder="Enter your password"
                                            className="bg-transparent text-gray-500/80 placeholder-gray-500/80 outline-none text-sm w-full h-full"
                                            required
                                            disabled={mutation.isPending}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="pr-4 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? (
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M8 2c3.136 0 5.578 2.078 7.328 4.672a.665.665 0 0 1 0 .656C13.578 9.922 11.136 12 8 12c-3.136 0-5.578-2.078-7.328-4.672a.665.665 0 0 1 0-.656C2.422 4.078 4.864 2 8 2zm0 1.333c-2.53 0-4.578 1.613-6.172 3.828a.665.665 0 0 0 0 .672c1.594 2.215 3.642 3.828 6.172 3.828 2.53 0 4.578-1.613 6.172-3.828a.665.665 0 0 0 0-.672C12.578 4.946 10.53 3.333 8 3.333zm0 2.667a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" fill="currentColor" />
                                                </svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M2.28 2.22a.75.75 0 0 0-1.06 1.06l1.945 1.946C1.542 6.422 0 8 0 8s3 5.333 8 5.333a7.6 7.6 0 0 0 2.72-.5l2.28 2.28a.75.75 0 1 0 1.06-1.062l-10-10zm4.438 4.438a2.5 2.5 0 0 0 3.522 3.522l-3.522-3.522z" fill="currentColor" />
                                                    <path d="M5.525 3.22a2.5 2.5 0 0 1 3.255 3.255l.782.782A7.6 7.6 0 0 1 8 2.667C3 2.667 0 8 0 8s.939 1.333 2.667 2.667l.78-.78C2.16 8.78 1.333 7.556 1.333 7.556s.78-1.445 2.667-2.666l1.525-1.67z" fill="currentColor" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Remember Me & Forgot Password */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="remember"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            disabled={mutation.isPending}
                                        />
                                        <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                                            Remember me
                                        </label>
                                    </div>
                                    <Link
                                        to="/forgot-password"
                                        className="text-sm text-indigo-500 hover:text-indigo-600 hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="w-full h-11 rounded-full text-white bg-indigo-500 hover:bg-indigo-600 hover:shadow-lg transition-all duration-200"
                                    disabled={mutation.isPending}
                                >
                                    {mutation.isPending ? (
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="40 120" fill="none" />
                                            </svg>
                                            <span>Signing in...</span>
                                        </div>
                                    ) : (
                                        'Sign In'
                                    )}
                                </Button>

                                {/* Sign Up Link */}
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">
                                        Don't have an account?{' '}
                                        <Link
                                            to="/register"
                                            className="text-indigo-500 hover:text-indigo-600 hover:underline"
                                        >
                                            Create free account
                                        </Link>
                                    </p>
                                </div>

                                {/* Back to Home */}
                                <div className="text-center pt-4">
                                    <Link
                                        to="/home"
                                        className="text-sm text-indigo-500 hover:text-indigo-600 hover:underline"
                                    >
                                        Back to Home
                                    </Link>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default Login;