import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset, verifyPasswordOtp, resetPassword } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            setForm(prev => ({ ...prev, [name]: value }));
            if (error) setError(null);
            if (success) setSuccess(null);
        },
        [error, success]
    );

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
        [form.verificationCode, form.email]
    );

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
                await resetPassword(form.email.trim(), form.verificationCode.trim(), newPassword);
                setSuccess('Password reset successfully! You can now login with your new password.');
                setForm({ email: '', verificationCode: '', newPassword: '', confirmPassword: '' });
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

    // Step renderers using Input and Alert from your login page with same palette and styles:

    const renderEmailStep = () => (
        <form onSubmit={handleEmailSubmit} className="space-y-6 w-full max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Forgot Password</h2>
            <p className="text-sm text-gray-600 mb-6">Enter your email to receive a verification code</p>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {success && (
                <div className="bg-green-50 border border-green-400 text-green-700 rounded p-3 text-center text-sm">
                    {success}
                </div>
            )}

            <div>
                <label htmlFor="email" className="block text-sm text-gray-700 mb-1">
                    Email Address
                </label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    required
                    disabled={isLoading}
                />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-11 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition">
                {isLoading ? 'Sending...' : 'Send Verification Code'}
            </Button>

            <p className="mt-4 text-center text-sm text-gray-600">
                Remembered your password?{' '}
                <Link to="/login" className="text-indigo-600 hover:underline">
                    Sign in
                </Link>
            </p>
        </form>
    );

    const renderVerificationStep = () => (
        <form onSubmit={handleVerificationSubmit} className="space-y-6 w-full max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Verify Your Email</h2>
            <p className="text-sm text-gray-600 mb-6">
                We sent a 6-digit verification code to <strong>{form.email}</strong>
            </p>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {success && (
                <div className="bg-green-50 border border-green-400 text-green-700 rounded p-3 text-center text-sm">
                    {success}
                </div>
            )}

            <div>
                <label htmlFor="verificationCode" className="block text-sm text-gray-700 mb-1">
                    Verification Code
                </label>
                <Input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={form.verificationCode}
                    onChange={handleChange}
                    placeholder="123456"
                    required
                    disabled={isLoading}
                    className="tracking-widest"
                />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-11 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition">
                {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>

            <p className="mt-4 text-center text-sm text-gray-600">
                Didn't receive the code?{' '}
                <button
                    onClick={() => {
                        setCurrentStep('email');
                        setError(null);
                        setSuccess(null);
                    }}
                    disabled={isLoading}
                    className="text-indigo-600 hover:underline"
                    type="button"
                >
                    Resend Code
                </button>
            </p>
        </form>
    );

    const renderPasswordResetStep = () => (
        <form onSubmit={handlePasswordResetSubmit} className="space-y-6 w-full max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Reset Password</h2>
            <p className="text-sm text-gray-600 mb-6">Create a new password for your account</p>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {success && (
                <div className="bg-green-50 border border-green-400 text-green-700 rounded p-3 text-center text-sm">
                    {success}
                </div>
            )}

            <div>
                <label htmlFor="newPassword" className="block text-sm text-gray-700 mb-1">
                    New Password
                </label>
                <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder="Enter new password"
                    minLength={8}
                    required
                    disabled={isLoading}
                />
            </div>

            <div>
                <label htmlFor="confirmPassword" className="block text-sm text-gray-700 mb-1">
                    Confirm Password
                </label>
                <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    minLength={8}
                    required
                    disabled={isLoading}
                />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-11 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition">
                {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
        </form>
    );

    return (
        <div className="min-h-screen w-full flex">
            {/* Left - Forgot Password Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white px-8 py-12">
                {currentStep === 'email' && renderEmailStep()}
                {currentStep === 'verification' && renderVerificationStep()}
                {currentStep === 'reset' && renderPasswordResetStep()}
            </div>

            {/* Right - Illustration */}
            <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-12">
                <img
                    src="/project-amico.png"
                    alt="Forgot password illustration"
                    className="max-w-[500px] max-h-[80vh] mx-auto object-contain"
                />
            </div>
        </div>
    );
};

export default ForgotPass;
