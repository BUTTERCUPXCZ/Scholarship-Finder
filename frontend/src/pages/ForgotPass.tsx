import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset, verifyPasswordOtp, resetPassword } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


// Types for the form steps
type ForgotPasswordStep = 'email' | 'verification' | 'reset';

interface ForgotPasswordForm {
    email: string;
    verificationCode: string;
    newPassword: string;
    confirmPassword: string;
}

const ForgotPass = () => {
    const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>('email');
    const [form, setForm] = useState<ForgotPasswordForm>({
        email: '',
        verificationCode: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Handle form input changes
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            setForm((prev) => ({ ...prev, [name]: value }));
            // Clear error when user starts typing
            if (error) setError(null);
            if (success) setSuccess(null);
        },
        [error, success]
    );

    // Handle email submission
    const handleEmailSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError(null);
            setSuccess(null);

            const email = form.email.trim();
            if (!email) {
                setError("Email address is required");
                return;
            }

            if (!email.includes('@') || !email.includes('.')) {
                setError("Please enter a valid email address");
                return;
            }

            setIsLoading(true);
            try {
                await requestPasswordReset(email);
                setSuccess(`Verification code sent to ${email}`);
                setCurrentStep('verification');
            } catch (err: any) {
                setError(err?.message || 'Failed to send verification code');
            } finally {
                setIsLoading(false);
            }
        },
        [form.email]
    );

    // Handle verification code submission
    const handleVerificationSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError(null);
            setSuccess(null);

            const code = form.verificationCode.trim();
            if (!code) {
                setError("Verification code is required");
                return;
            }

            if (code.length !== 6) {
                setError("Verification code must be 6 digits");
                return;
            }

            setIsLoading(true);
            try {
                await verifyPasswordOtp(form.email.trim(), code);
                setSuccess('Code verified successfully');
                setCurrentStep('reset');
            } catch (err: any) {
                setError(err?.message || 'Failed to verify code');
            } finally {
                setIsLoading(false);
            }
        },
        [form.verificationCode]
    );

    // Handle password reset submission
    const handlePasswordResetSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError(null);
            setSuccess(null);

            const { newPassword, confirmPassword } = form;

            if (!newPassword || !confirmPassword) {
                setError("Both password fields are required");
                return;
            }

            if (newPassword.length < 8) {
                setError("Password must be at least 8 characters long");
                return;
            }

            if (newPassword !== confirmPassword) {
                setError("Passwords do not match");
                return;
            }

            setIsLoading(true);
            try {
                await resetPassword(form.email.trim(), form.verificationCode.trim(), form.newPassword);
                setSuccess('Password reset successfully! You can now login with your new password.');
                // Reset form
                setForm({
                    email: '',
                    verificationCode: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                // Redirect to login after a short delay
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } catch (err: any) {
                setError(err?.message || 'Failed to reset password');
            } finally {
                setIsLoading(false);
            }
        },
        [form]
    );

    // Render email step
    const renderEmailStep = () => (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">Forgot Password</CardTitle>
                <CardDescription className="text-gray-600">
                    Enter your email address and we'll send you a verification code to reset your password
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleEmailSubmit} className="space-y-6">
                    {error && (
                        <div className="w-full rounded-md bg-red-50 p-3">
                            <p className="text-sm font-medium text-red-800 text-center">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="w-full rounded-md bg-green-50 p-3">
                            <p className="text-sm font-medium text-green-800 text-center">{success}</p>
                        </div>
                    )}

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
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 rounded-full text-white bg-indigo-500 hover:bg-indigo-600 hover:shadow-lg transition-all duration-200"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="40 120" fill="none" />
                                </svg>
                                <span>Sending Code...</span>
                            </div>
                        ) : (
                            'Send Verification Code'
                        )}
                    </Button>

                    <div className="text-center">
                        <Link
                            to="/login"
                            className="text-sm text-indigo-500 hover:text-indigo-600 hover:underline"
                        >
                            Back to Login
                        </Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    );

    // Render verification step
    const renderVerificationStep = () => (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">Verify Your Email</CardTitle>
                <CardDescription className="text-gray-600">
                    We sent a 6-digit verification code to <strong>{form.email}</strong>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleVerificationSubmit} className="space-y-6">
                    {error && (
                        <div className="w-full rounded-md bg-red-50 p-3">
                            <p className="text-sm font-medium text-red-800 text-center">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="w-full rounded-md bg-green-50 p-3">
                            <p className="text-sm font-medium text-green-800 text-center">{success}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="verificationCode" className="text-sm font-medium text-gray-700">
                            Verification Code
                        </label>
                        <div className="flex items-center w-full bg-transparent border border-gray-300/60 h-12 rounded-full overflow-hidden pl-6 gap-2">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm3.5 5L7 9.5 4.5 7l1-1L7 7.5l3.5-3.5 1 1z" fill="#6B7280" />
                            </svg>
                            <input
                                id="verificationCode"
                                name="verificationCode"
                                type="text"
                                value={form.verificationCode}
                                onChange={handleChange}
                                placeholder="Enter 6-digit code"
                                className="bg-transparent text-gray-500/80 placeholder-gray-500/80 outline-none text-sm w-full h-full tracking-widest"
                                maxLength={6}
                                pattern="[0-9]{6}"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 rounded-full text-white bg-indigo-500 hover:bg-indigo-600 hover:shadow-lg transition-all duration-200"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="40 120" fill="none" />
                                </svg>
                                <span>Verifying...</span>
                            </div>
                        ) : (
                            'Verify Code'
                        )}
                    </Button>

                    <div className="flex flex-col items-center space-y-2 text-sm text-gray-600">
                        <p>Didn't receive the code?</p>
                        <button
                            type="button"
                            className="text-indigo-500 hover:text-indigo-600 hover:underline"
                            onClick={() => {
                                setCurrentStep('email');
                                setError(null);
                                setSuccess(null);
                            }}
                            disabled={isLoading}
                        >
                            Send New Code
                        </button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );

    // Render password reset step
    const renderPasswordResetStep = () => (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">Reset Password</CardTitle>
                <CardDescription className="text-gray-600">
                    Create a new password for your account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handlePasswordResetSubmit} className="space-y-6">
                    {error && (
                        <div className="w-full rounded-md bg-red-50 p-3">
                            <p className="text-sm font-medium text-red-800 text-center">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="w-full rounded-md bg-green-50 p-3">
                            <p className="text-sm font-medium text-green-800 text-center">{success}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                            New Password
                        </label>
                        <div className="flex items-center w-full bg-transparent border border-gray-300/60 h-12 rounded-full overflow-hidden pl-6 gap-2">
                            <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280" />
                            </svg>
                            <input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                value={form.newPassword}
                                onChange={handleChange}
                                placeholder="Enter new password"
                                className="bg-transparent text-gray-500/80 placeholder-gray-500/80 outline-none text-sm w-full h-full"
                                minLength={8}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                            Confirm Password
                        </label>
                        <div className="flex items-center w-full bg-transparent border border-gray-300/60 h-12 rounded-full overflow-hidden pl-6 gap-2">
                            <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280" />
                            </svg>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm new password"
                                className="bg-transparent text-gray-500/80 placeholder-gray-500/80 outline-none text-sm w-full h-full"
                                minLength={8}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="text-sm text-gray-500">
                        <p>Password requirements:</p>
                        <ul className="mt-1 space-y-1">
                            <li className={`flex items-center gap-2 ${form.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                                <span className="text-xs">•</span>
                                At least 8 characters long
                            </li>
                            <li className={`flex items-center gap-2 ${form.newPassword === form.confirmPassword && form.newPassword ? 'text-green-600' : 'text-gray-400'}`}>
                                <span className="text-xs">•</span>
                                Passwords match
                            </li>
                        </ul>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 rounded-full text-white bg-indigo-500 hover:bg-indigo-600 hover:shadow-lg transition-all duration-200"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="40 120" fill="none" />
                                </svg>
                                <span>Resetting Password...</span>
                            </div>
                        ) : (
                            'Reset Password'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );

    return (
        <div className="flex min-h-screen w-full overflow-hidden">
            {/* Left Side - Image (hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-12">
                <img
                    className="max-w-[500px] max-h-[80vh] mx-auto object-contain"
                    src="/project-amico.png"
                    alt="Password Reset Illustration"
                />
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-white">
                <div className="w-full flex flex-col items-center space-y-8">
                    {/* Render current step */}
                    {currentStep === 'email' && renderEmailStep()}
                    {currentStep === 'verification' && renderVerificationStep()}
                    {currentStep === 'reset' && renderPasswordResetStep()}
                </div>
            </div>
        </div>
    );
};

export default ForgotPass;