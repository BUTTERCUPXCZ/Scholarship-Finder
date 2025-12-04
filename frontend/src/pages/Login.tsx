import React, { useCallback, useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthProvider/AuthProvider';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

type LoginData = { email: string; password: string };



const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
    const [form, setForm] = useState<LoginData>({ email: '', password: '' });
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
    const [isEmailNotVerified, setIsEmailNotVerified] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const from = location.state?.from?.pathname || null;

    // Memoized validation to prevent unnecessary re-renders
    const validation = useMemo(() => {
        const errors: { email?: string; password?: string } = {};

        if (form.email && !EMAIL_REGEX.test(form.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (form.password && form.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        return {
            errors,
            isValid: !errors.email && !errors.password && form.email && form.password
        };
    }, [form.email, form.password]);

    const mutation = useMutation({
        mutationFn: async (credentials: LoginData) => {
            // Sign in with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password,
            });

            if (authError) throw authError;
            if (!authData.user || !authData.session) throw new Error('Login failed');

            // Check if email is verified
            if (!authData.user.email_confirmed_at) {
                throw new Error('EMAIL_NOT_VERIFIED: Please verify your email before logging in.');
            }

            // Get user profile from backend (also syncs verification status)
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${authData.session.access_token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }

            const userData = await response.json();
            return { 
                user: userData.user || userData, 
                session: authData.session,
                token: authData.session.access_token 
            };
        },
        onSuccess: async (data) => {
            setError(null);
            setFieldErrors({});
            setIsEmailNotVerified(false);

            // Store token for API calls
            localStorage.setItem('token', data.token);

            // Store session
            login(data.user);

            await new Promise(resolve => setTimeout(resolve, 100));
            let redirectPath = from;
            if (!redirectPath) {
                const role = data?.user?.role?.toString?.() ?? '';
                redirectPath = role === 'ORGANIZATION' ? '/orgdashboard' : '/scholarship';
            }
            navigate(redirectPath, { replace: true });
        },
        onError: (error: Error) => {
            const err: any = error;
            const serverMsg = err?.response?.data?.message || err?.message || String(err);

            // Check if email is not verified
            if (/EMAIL_NOT_VERIFIED|not verified|verify your email/i.test(serverMsg)) {
                setIsEmailNotVerified(true);
                setError('Please verify your email before logging in. Check your inbox for the verification link.');
                return;
            }

            // Reset email verification flag for other errors
            setIsEmailNotVerified(false);

            // Handle specific error types for better UX
            if (serverMsg.toLowerCase().includes('email')) {
                setFieldErrors({ email: 'Email not found or invalid' });
            } else if (serverMsg.toLowerCase().includes('password')) {
                setFieldErrors({ password: 'Incorrect password' });
            } else if (serverMsg.toLowerCase().includes('credentials')) {
                setError('Invalid email or password. Please check your credentials.');
            } else {
                setError(serverMsg);
            }

            if (!/EMAIL_NOT_VERIFIED|not verified/i.test(serverMsg)) {
                toast.error(serverMsg);
            }
        },
        // Add retry configuration for better resilience
        retry: (failureCount, error: any) => {
            // Only retry on network errors, not authentication errors
            const isAuthError = error?.response?.status === 401 || error?.response?.status === 403;
            return !isAuthError && failureCount < 2;
        },
        retryDelay: 1000, // 1 second delay between retries
    });

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            setForm(prev => ({ ...prev, [name]: value }));

            // Clear errors when user starts typing
            if (error) setError(null);
            if (isEmailNotVerified) setIsEmailNotVerified(false);
            if (fieldErrors[name as keyof typeof fieldErrors]) {
                setFieldErrors(prev => ({ ...prev, [name]: undefined }));
            }
        },
        [error, fieldErrors, isEmailNotVerified]
    );

    const handleSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError(null);
            setFieldErrors({});

            const email = form.email.trim();
            const password = form.password;

            // Enhanced client-side validation
            if (!email) {
                setFieldErrors({ email: 'Email is required' });
                return;
            }

            if (!EMAIL_REGEX.test(email)) {
                setFieldErrors({ email: 'Please enter a valid email address' });
                return;
            }

            if (!password) {
                setFieldErrors({ password: 'Password is required' });
                return;
            }

            if (password.length < 6) {
                setFieldErrors({ password: 'Password must be at least 6 characters' });
                return;
            }

            mutation.mutate({ email, password });
        },
        [form, mutation]
    );

    // Auto-dismiss loading toast on completion
    React.useEffect(() => {
        if (!mutation.isPending) {
            toast.dismiss('login-toast');
        }
    }, [mutation.isPending]);

    return (
        <div className="min-h-screen w-full flex">
            {/* Left - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white px-8 py-12">
                <div className="max-w-md w-full">
                    {/* Left: Logo */}
                    <div className="col-start-1 flex items-center">
                        <Link to="/home" className="flex items-center gap-3 group select-none">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-sm sm:shadow-lg transition-all duration-300">
                                <img src="/graduation.png" alt="Scholarship illustration" className="w-full h-auto object-contain" loading="lazy" decoding="async" />
                            </div>
                            <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-gray-900">ScholarSphere</h1>
                        </Link>
                    </div>
                    <div className="mb-10">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Start your College journey</h2>
                        <p className="text-sm text-gray-600">Access thousands of scholarships and financial aid opportunities.</p>
                    </div>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription className="text-sm">
                                    {error}
                                    {isEmailNotVerified && (
                                        <div className="mt-2">
                                            <Link 
                                                to={`/register-success?email=${encodeURIComponent(form.email)}`}
                                                className="text-sm font-medium underline hover:no-underline"
                                            >
                                                Resend verification email
                                            </Link>
                                        </div>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm text-gray-900 mb-1">
                                Email
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="example@email.com"
                                required
                                disabled={mutation.isPending}
                                className={`mt-1 ${fieldErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                            />
                            {fieldErrors.email && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm text-gray-900 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    required
                                    disabled={mutation.isPending}
                                    className={fieldErrors.password ? 'border-red-500 focus:border-red-500' : ''}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
                                    disabled={mutation.isPending}
                                >
                                    {showPassword ? (
                                        <span aria-label="Hide password">🙈</span>
                                    ) : (
                                        <span aria-label="Show password">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" id="Eye" className="w-5 h-5">
                                                <path fill="none" d="M0 0h48v48H0z"></path>
                                                <path d="M24 9C14 9 5.46 15.22 2 24c3.46 8.78 12 15 22 15 10.01 0 18.54-6.22 22-15-3.46-8.78-11.99-15-22-15zm0 25c-5.52 0-10-4.48-10-10s4.48-10 10-10 10 4.48 10 10-4.48 10-10 10zm0-16c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" fill="#7f8c8d" className="color000000 svgShape"></path>
                                            </svg>
                                        </span>
                                    )}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                            )}

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="remember"
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        disabled={mutation.isPending}
                                    />
                                    <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                                        Remember me
                                    </label>
                                </div>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-blue-500 hover:text-blue-600 hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={mutation.isPending || !validation.isValid}
                            className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold transition"
                        >
                            {mutation.isPending ? (
                                <span className="flex items-center justify-center">
                                    <svg className="mr-2 w-5 h-5 animate-spin" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                                            <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite" />
                                            <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite" />
                                        </circle>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </Button>

                        <div className="mt-4 text-sm text-gray-600 text-center">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-blue-600 hover:underline font-medium">
                                Sign up
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
            {/* Right - Abstract Image */}
            <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-blue-50 to-blue-50 p-12">
                <img
                    src="/project-amico.png"
                    alt="Abstract background"
                    className="max-w-[500px] max-h-[80vh] mx-auto object-contain"
                />
            </div>
        </div>
    );
};

export default Login;