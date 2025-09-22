import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { registerUser, type RegisterData } from '../services/auth'
import { useAuth } from '../AuthProvider/AuthProvider'



const Register = () => {
    const [form, setForm] = useState<{
        fullname: string;
        email: string;
        password: string;
        confirmPassword: string;
        role: string;
    }>({ fullname: '', email: '', password: '', confirmPassword: '', role: '' });

    const [error, setError] = useState<string | null>(null);
    // ✅ Use Set for O(1) lookups/removals
    const [errorFields, setErrorFields] = useState<Set<string>>(new Set());
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));

        // ✅ O(1) lookup + delete
        if (errorFields.has(name)) {
            setErrorFields(prev => {
                const newSet = new Set(prev);
                newSet.delete(name);
                return newSet;
            });
            if (errorFields.size <= 1) setError(null);
        }
    };

    const handleRoleSelect = (role: 'STUDENT' | 'ORGANIZATION') => {
        setForm(prev => ({ ...prev, role }));

        if (errorFields.has('role')) {
            setErrorFields(prev => {
                const newSet = new Set(prev);
                newSet.delete('role');
                return newSet;
            });
            if (errorFields.size <= 1) setError(null);
        }
    };

    const mutation = useMutation({
        mutationFn: (data: RegisterData) => registerUser(data),
        onSuccess: (data) => {
            setError(null);

            // Use AuthProvider login method (no token needed with cookies)
            login(data.user);

            // Role-based redirect after registration
            const role = data?.user?.role?.toString?.() ?? '';
            if (role === 'ORGANIZATION') {
                navigate('/login');
            } else {
                navigate('/login');
            }
        },
        onError: (error: Error) => {
            setError(error.message);
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const { fullname, email, password, confirmPassword, role } = form;
        const trimmedFullname = fullname.trim();
        const trimmedEmail = email.trim();

        // ✅ Single-pass validation
        const missing = Object.entries({
            fullname: trimmedFullname,
            email: trimmedEmail,
            password,
            confirmPassword,
            role
        })
            .filter(([_, value]) => !value)
            .map(([key]) => key);

        if (missing.length > 0) {
            setError('All fields are required');
            setErrorFields(new Set(missing));
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setErrorFields(new Set(['password', 'confirmPassword']));
            return;
        }

        setError(null);
        setErrorFields(new Set());
        mutation.mutate({ fullname: trimmedFullname, email: trimmedEmail, password, role });
    };

    return (
        <div className="flex min-h-screen w-full overflow-hidden">
            <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-12">
                <img className="max-w-[500px] max-h-[80vh] mx-auto object-contain" src="/project-amico.png" alt="leftSideImage" />
            </div>

            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900">Sign up</h2>
                        <p className="mt-2 text-sm text-gray-600">Create your account to get started</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {error && (
                            <div className="w-full mt-4 rounded-md bg-red-50 p-3">
                                <p className="text-sm font-medium text-red-800 text-center">{error}</p>
                            </div>
                        )}

                        <button type="button" className="w-full mt-8 bg-gray-500/10 flex items-center justify-center h-12 rounded-full px-6 gap-3">
                            <span className="text-sm text-gray-700">Google</span>
                            <img className="h-6 w-6" src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/googleLogo.svg" alt="googleLogo" />
                        </button>

                        <div className="flex items-center gap-4 w-full my-5">
                            <div className="w-full h-px bg-gray-300/90"></div>
                            <p className="w-full text-nowrap text-sm text-gray-500/90">or sign up with email</p>
                            <div className="w-full h-px bg-gray-300/90"></div>
                        </div>

                        {/* Full Name Input */}
                        <div className={`flex items-center w-full bg-transparent border ${errorFields.has('fullname') ? 'border-red-500' : 'border-gray-300/60'} h-12 rounded-full overflow-hidden pl-6 gap-2`}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8ZM8 10C5.33333 10 0 11.3333 0 14V16H16V14C16 11.3333 10.6667 10 8 10Z" fill="#6B7280" />
                            </svg>
                            <input
                                name="fullname"
                                value={form.fullname}
                                onChange={handleOnChange}
                                type="text"
                                placeholder="Full Name"
                                className="bg-transparent text-gray-500/80 placeholder-gray-500/80 outline-none text-sm w-full h-full"
                                required
                            />
                        </div>

                        {/* Email Input */}
                        <div className={`flex items-center mt-6 w-full bg-transparent border ${errorFields.has('email') ? 'border-red-500' : 'border-gray-300/60'} h-12 rounded-full overflow-hidden pl-6 gap-2`}>
                            <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z" fill="#6B7280" />
                            </svg>
                            <input
                                name="email"
                                value={form.email}
                                onChange={handleOnChange}
                                type="email"
                                placeholder="Email address"
                                className="bg-transparent text-gray-500/80 placeholder-gray-500/80 outline-none text-sm w-full h-full"
                                required
                            />
                        </div>

                        {/* Password Input */}
                        <div className={`flex items-center mt-6 w-full bg-transparent border ${errorFields.has('password') ? 'border-red-500' : 'border-gray-300/60'} h-12 rounded-full overflow-hidden pl-6 gap-2`}>
                            <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280" />
                            </svg>
                            <input
                                name="password"
                                value={form.password}
                                onChange={handleOnChange}
                                type="password"
                                placeholder="Password"
                                className="bg-transparent text-gray-500/80 placeholder-gray-500/80 outline-none text-sm w-full h-full"
                                required
                            />
                        </div>

                        {/* Confirm Password Input */}
                        <div className={`flex items-center mt-6 w-full bg-transparent border ${errorFields.has('confirmPassword') ? 'border-red-500' : 'border-gray-300/60'} h-12 rounded-full overflow-hidden pl-6 gap-2`}>
                            <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280" />
                            </svg>
                            <input
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleOnChange}
                                type="password"
                                placeholder="Confirm Password"
                                className="bg-transparent text-gray-500/80 placeholder-gray-500/80 outline-none text-sm w-full h-full"
                                required
                            />
                        </div>

                        {/* Role Selection */}
                        <div className="w-full mt-6">
                            <p className="text-sm text-gray-500/90 mb-3">Select your role:</p>
                            <div className="flex gap-2 w-full">
                                <button
                                    type="button"
                                    onClick={() => handleRoleSelect('STUDENT')}
                                    className={`flex-1 h-12 rounded-full px-6 text-sm font-medium transition-all ${form.role === 'STUDENT'
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20'
                                        } ${errorFields.has('role') ? 'ring-2 ring-red-500' : ''}`}
                                >
                                    Student
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRoleSelect('ORGANIZATION')}
                                    className={`flex-1 h-12 rounded-full px-6 text-sm font-medium transition-all ${form.role === 'ORGANIZATION'
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20'
                                        } ${errorFields.has('role') ? 'ring-2 ring-red-500' : ''}`}
                                >
                                    Organization
                                </button>
                            </div>
                            {errorFields.has('role') && (
                                <p className="mt-2 text-xs text-red-500 text-center">Please select a role</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full h-11 rounded-full text-white bg-indigo-500 hover:opacity-90 transition-opacity disabled:opacity-50"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? 'Creating Account...' : 'Register'}
                        </button>

                        <p className="text-gray-500/90 text-sm mt-4">
                            Already have an account?
                            <Link className="text-indigo-400 hover:underline ml-1" to="/login">Sign in</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Register