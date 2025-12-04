import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

const RegisterSuccess = () => {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';
    const [isResending, setIsResending] = useState(false);

    const handleResendEmail = async () => {
        if (!email) {
            toast.error('Email address is missing');
            return;
        }

        setIsResending(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: `${window.location.origin}/login`,
                }
            });

            if (error) throw error;
            
            toast.success('Verification email sent! Please check your inbox.');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to resend email');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex">
            {/* Left - Success Message */}
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

                    <div className="space-y-6">
                        {/* Success Icon */}
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
                                Account Created Successfully!
                            </h2>
                            <p className="text-sm text-gray-600 text-center">
                                We've sent a verification email to:
                            </p>
                            <p className="text-base font-semibold text-gray-900 text-center mt-2">
                                {email}
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-blue-900 mb-2">
                                📧 Next Steps:
                            </h3>
                            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                                <li>Check your email inbox</li>
                                <li>Click the verification link in the email</li>
                                <li>Return here to log in</li>
                            </ol>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="text-xs text-gray-600 mb-2">
                                <strong>Didn't receive the email?</strong>
                            </p>
                            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside pl-2 mb-3">
                                <li>Check your spam or junk folder</li>
                                <li>Make sure you entered the correct email</li>
                                <li>Wait a few minutes for the email to arrive</li>
                                <li>The verification link expires in 1 hour</li>
                            </ul>
                            <Button 
                                onClick={handleResendEmail}
                                disabled={isResending || !email}
                                variant="outline"
                                className="w-full h-9 rounded-lg border-gray-300 hover:bg-gray-100 text-sm font-medium"
                            >
                                {isResending ? 'Sending...' : 'Resend Verification Email'}
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <Link to="/login" className="block">
                                <Button className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition">
                                    Go to Login
                                </Button>
                            </Link>
                            
                            <p className="text-center text-sm text-gray-600">
                                Need help?{' '}
                                <Link to="/contact" className="text-blue-600 hover:underline font-medium">
                                    Contact Support
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right - Illustration */}
            <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-blue-50 to-blue-50 p-12">
                <img
                    src="/project-amico.png"
                    alt="Success illustration"
                    className="max-w-[500px] max-h-[80vh] mx-auto object-contain"
                />
            </div>
        </div>
    );
};

export default RegisterSuccess;
