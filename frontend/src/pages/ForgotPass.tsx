import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ForgotPass = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setEmail(e.target.value);
            if (error) setError(null);
        },
        [error]
    );

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError(null);
            setSuccess(false);

            const emailTrimmed = email.trim();
            if (!emailTrimmed) {
                setError("Email address is required");
                return;
            }
            if (!emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
                setError("Please enter a valid email address");
                return;
            }

            setIsLoading(true);
            try {
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailTrimmed, {
                    redirectTo: `${window.location.origin}/reset-password`,
                });

                if (resetError) throw resetError;
                
                setSuccess(true);
            } catch (err: any) {
                setError(err?.message || 'Failed to send password reset email');
            } finally {
                setIsLoading(false);
            }
        },
        [email]
    );

    return (
        <div className="min-h-screen w-full flex">
            {/* Left - Forgot Password Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white px-8 py-12">
                <div className="max-w-md w-full">
                    {/* Logo */}
                    <div className="col-start-1 flex items-center mb-8">
                        <Link to="/home" className="flex items-center gap-3 group select-none">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-sm sm:shadow-lg transition-all duration-300">
                                <img src="/graduation.png" alt="Scholarship illustration" className="w-full h-auto object-contain" loading="lazy" decoding="async" />
                            </div>
                            <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-gray-900">ScholarSphere</h1>
                        </Link>
                    </div>

                    {!success ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Reset Your Password</h2>
                                <p className="text-sm text-gray-600">
                                    Enter your email address and we'll send you a link to reset your password.
                                </p>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-sm text-gray-900 mb-1">
                                    Email Address
                                </label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={handleChange}
                                    placeholder="example@email.com"
                                    required
                                    disabled={isLoading}
                                    className="mt-1"
                                />
                            </div>

                            <Button 
                                type="submit" 
                                disabled={isLoading} 
                                className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="mr-2 w-5 h-5 animate-spin" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                                                <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite" />
                                                <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite" />
                                            </circle>
                                        </svg>
                                        Sending...
                                    </span>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </Button>

                            <p className="mt-4 text-center text-sm text-gray-600">
                                Remember your password?{' '}
                                <Link to="/login" className="text-blue-600 hover:underline font-medium">
                                    Sign in
                                </Link>
                            </p>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Check Your Email</h2>
                                <p className="text-sm text-gray-600">
                                    We've sent a password reset link to <strong>{email}</strong>
                                </p>
                            </div>

                            <div className="bg-green-50 border border-green-400 text-green-700 rounded-lg p-4">
                                <p className="text-sm">
                                    📧 Check your inbox and click the link to reset your password. 
                                    The link will expire in 1 hour.
                                </p>
                            </div>

                            <div className="text-sm text-gray-600 space-y-2">
                                <p>Didn't receive the email?</p>
                                <ul className="list-disc list-inside space-y-1 pl-2">
                                    <li>Check your spam or junk folder</li>
                                    <li>Make sure you entered the correct email</li>
                                    <li>Wait a few minutes for the email to arrive</li>
                                </ul>
                            </div>

                            <Button
                                onClick={() => {
                                    setSuccess(false);
                                    setEmail('');
                                    setError(null);
                                }}
                                className="w-full h-11 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold transition"
                            >
                                Try Another Email
                            </Button>

                            <p className="mt-4 text-center text-sm text-gray-600">
                                <Link to="/login" className="text-blue-600 hover:underline font-medium">
                                    Back to Sign In
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right - Illustration */}
            <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-blue-50 to-blue-50 p-12">
                <img
                    src="/project-amico.png"
                    alt="Password reset illustration"
                    className="max-w-[500px] max-h-[80vh] mx-auto object-contain"
                />
            </div>
        </div>
    );
};

export default ForgotPass;
