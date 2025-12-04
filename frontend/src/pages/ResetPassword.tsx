import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'react-hot-toast';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        // Check if we have the recovery token in the URL
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        
        if (!tokenHash || type !== 'recovery') {
            setError('Invalid or expired reset link. Please request a new one.');
        }
    }, [searchParams]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError(null);

            if (!newPassword || !confirmPassword) {
                setError('Both password fields are required');
                return;
            }

            if (newPassword.length < 8) {
                setError('Password must be at least 8 characters long');
                return;
            }

            if (!/[A-Z]/.test(newPassword)) {
                setError('Password must contain at least one uppercase letter');
                return;
            }

            if (!/[a-z]/.test(newPassword)) {
                setError('Password must contain at least one lowercase letter');
                return;
            }

            if (!/\d/.test(newPassword)) {
                setError('Password must contain at least one number');
                return;
            }

            if (newPassword !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }

            setIsLoading(true);
            try {
                // Update password using Supabase
                const { error: updateError } = await supabase.auth.updateUser({
                    password: newPassword
                });

                if (updateError) throw updateError;

                toast.success('Password reset successfully!');
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            } catch (err: any) {
                setError(err?.message || 'Failed to reset password');
            } finally {
                setIsLoading(false);
            }
        },
        [newPassword, confirmPassword, navigate]
    );

    return (
        <div className="min-h-screen w-full flex">
            {/* Left - Reset Password Form */}
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

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Create New Password</h2>
                            <p className="text-sm text-gray-600">
                                Enter a strong password to secure your account.
                            </p>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div>
                            <label htmlFor="newPassword" className="block text-sm text-gray-900 mb-1">
                                New Password
                            </label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    placeholder="Enter new password"
                                    required
                                    disabled={isLoading}
                                    className="mt-1"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                    disabled={isLoading}
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
                            
                            {newPassword && (
                                <ul className="text-xs mt-2 p-2 rounded bg-gray-50 grid grid-cols-2 gap-2">
                                    <li className={newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                                        ✓ 8+ characters
                                    </li>
                                    <li className={/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>
                                        ✓ Uppercase letter
                                    </li>
                                    <li className={/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>
                                        ✓ Lowercase letter
                                    </li>
                                    <li className={/\d/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}>
                                        ✓ Number
                                    </li>
                                </ul>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm text-gray-900 mb-1">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    placeholder="Confirm your new password"
                                    required
                                    disabled={isLoading}
                                    className="mt-1"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                    disabled={isLoading}
                                >
                                    {showConfirmPassword ? (
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
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold transition"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="mr-2 w-5 h-5 animate-spin" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                                            <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite" />
                                            <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite" />
                                        </circle>
                                    </svg>
                                    Resetting Password...
                                </span>
                            ) : (
                                'Reset Password'
                            )}
                        </Button>

                        <p className="mt-4 text-center text-sm text-gray-600">
                            Remember your password?{' '}
                            <Link to="/login" className="text-blue-600 hover:underline font-medium">
                                Sign in
                            </Link>
                        </p>
                    </form>
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

export default ResetPassword;
