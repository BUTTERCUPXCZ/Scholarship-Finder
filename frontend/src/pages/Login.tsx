import React, { useCallback, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { loginUser, type LoginData } from '../services/auth';
import { useAuth } from '../AuthProvider/AuthProvider';

const Login = () => {
    const [form, setForm] = useState<LoginData>({ email: "", password: "" });
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    // Get the intended destination from location state, or use role-based default
    const from = location.state?.from?.pathname || null;

    const mutation = useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            setError(null);

            // Use AuthProvider login method to update context and localStorage
            login(data.user, data.token);

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
        <div className="flex min-h-screen w-full overflow-hidden">
            <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-12">
                <img
                    className="max-w-[500px] max-h-[80vh] mx-auto object-contain"
                    src="/project-amico.png"
                    alt="leftSideImage"
                />
            </div>

            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900">Sign in</h2>
                        <p className="mt-2 text-sm text-gray-600">Welcome back! Please sign in to continue</p>
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
                            <p className="w-full text-nowrap text-sm text-gray-500/90">or sign in with email</p>
                            <div className="w-full h-px bg-gray-300/90"></div>
                        </div>

                        <div className="flex items-center w-full bg-transparent border border-gray-300/60 h-12 rounded-full overflow-hidden pl-6 gap-2">
                            <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z" fill="#6B7280" />
                            </svg>
                            <input
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                type="email"
                                placeholder="Email address"
                                className="bg-transparent text-gray-500/80 placeholder-gray-500/80 outline-none text-sm w-full h-full"
                                required
                            />
                        </div>

                        <div className="flex items-center mt-6 w-full bg-transparent border border-gray-300/60 h-12 rounded-full overflow-hidden pl-6 gap-2">
                            <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280" />
                            </svg>
                            <input
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                type="password"
                                placeholder="Password"
                                className="bg-transparent text-gray-500/80 placeholder-gray-500/80 outline-none text-sm w-full h-full"
                                required
                            />
                        </div>

                        <div className="w-full flex items-center justify-between mt-8 text-gray-500/80">
                            <div className="flex items-center gap-2">
                                <input className="h-5" type="checkbox" id="checkbox" />
                                <label className="text-sm" htmlFor="checkbox">Remember me</label>
                            </div>
                            <Link className="text-sm underline" to="/forgot-password">Forgot password?</Link>
                        </div>

                        <button
                            type="submit"
                            className="mt-8 w-full h-11 rounded-full text-white bg-indigo-500 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    <span>Logging in...</span>
                                </>
                            ) : (
                                'Login'
                            )}
                        </button>

                        <p className="text-gray-500/90 text-sm mt-4">
                            Don't have an account?
                            <Link className="text-indigo-400 hover:underline ml-1" to="/register">Sign up</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login