import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { registerUser, type RegisterData } from '../services/auth';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'react-hot-toast';

const schema = z
    .object({
        fullname: z.string().min(2, 'Full name required'),
        email: z.string().email('Valid email required'),
        role: z.enum(['STUDENT', 'ORGANIZATION']),
        password: z
            .string()
            .min(8, 'Must be at least 8 characters')
            .regex(/[A-Z]/, 'One uppercase letter required')
            .regex(/[a-z]/, 'One lowercase letter required')
            .regex(/\d/, 'One number required'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type FormValues = z.infer<typeof schema>

export default function Register() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const methods = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { fullname: '', email: '', password: '', confirmPassword: '', role: 'STUDENT' },
    });

    const { handleSubmit, watch, formState: { isSubmitting, errors } } = methods;

    const mutation = useMutation({
        mutationFn: (data: RegisterData) => registerUser(data),
        onSuccess: (_data, _vars) => {
            toast.success('Account created! Please verify your email.');
            // navigate to verify page with email from submitted vars is handled below
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const passwordValue = watch('password', '');

    const onSubmit = (values: FormValues) => {
        const { confirmPassword, ...data } = values;
        mutation.mutate(data);
        navigate('/verify?status=pending&email=' + encodeURIComponent(data.email));
    };

    return (
        <div className="min-h-screen w-full overflow-y-auto custom-scrollbar">
            <div className="min-h-screen flex">
                {/* Left - Registration Form */}
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
                        <div className="mb-10">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Create your account</h2>
                            <p className="text-sm text-gray-600">Join thousands of students finding scholarships and financial aid opportunities.</p>
                        </div>
                        <Form {...methods}>
                            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                                {Object.keys(errors).length > 0 && (
                                    <Alert variant="destructive">
                                        <AlertDescription className="text-sm text-center">Please fix the highlighted fields.</AlertDescription>
                                    </Alert>
                                )}

                                <FormField
                                    name="fullname"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="block text-sm text-gray-900 mb-1">Full Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter your full name"
                                                    disabled={isSubmitting}
                                                    className="mt-1"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="block text-sm text-gray-900 mb-1">Email Address</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    autoComplete="email"
                                                    placeholder="example@email.com"
                                                    disabled={isSubmitting}
                                                    className="mt-1"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="block text-sm text-gray-900 mb-1">I am a...</FormLabel>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Select your role" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="STUDENT">Student</SelectItem>
                                                        <SelectItem value="ORGANIZATION">Organization</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="block text-sm text-gray-900 mb-1">Password</FormLabel>
                                            <div className="relative">
                                                <FormControl>
                                                    <Input
                                                        type={showPassword ? 'text' : 'password'}
                                                        autoComplete="new-password"
                                                        placeholder="Create a strong password"
                                                        disabled={isSubmitting}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-2 text-gray-400"
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
                                            <FormMessage />

                                            {passwordValue && (
                                                <ul className="text-xs mt-2 p-2 rounded bg-gray-50 grid grid-cols-2 gap-2">
                                                    <li className={passwordValue.length >= 8 ? 'text-green-600' : 'text-gray-400'}>8+ characters</li>
                                                    <li className={/[A-Z]/.test(passwordValue) ? 'text-green-600' : 'text-gray-400'}>Uppercase letter</li>
                                                    <li className={/[a-z]/.test(passwordValue) ? 'text-green-600' : 'text-gray-400'}>Lowercase letter</li>
                                                    <li className={/\d/.test(passwordValue) ? 'text-green-600' : 'text-gray-400'}>Number</li>
                                                </ul>
                                            )}
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="block text-sm text-gray-900 mb-1">Confirm Password</FormLabel>
                                            <div className="relative">
                                                <FormControl>
                                                    <Input
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        autoComplete="new-password"
                                                        placeholder="Confirm your password"
                                                        disabled={isSubmitting}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-2 text-gray-400"
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
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-11 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
                                >
                                    {isSubmitting ? (
                                        <span>
                                            <svg className="inline-block mr-2 w-5 h-5 animate-spin" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                            </svg>
                                            Creating account...
                                        </span>
                                    ) : (
                                        'Create Account'
                                    )}
                                </Button>

                                <div className="text-xs text-gray-500 text-center pt-1">
                                    By creating an account, you agree to our{' '}
                                    <Link to="#" className="text-indigo-500 hover:underline">Terms of Service</Link>{' '}and{' '}
                                    <Link to="#" className="text-indigo-500 hover:underline">Privacy Policy</Link>.
                                </div>

                                <div className="mt-4 text-sm text-gray-600 text-center">
                                    Already have an account?{' '}
                                    <Link to="/login" className="text-indigo-600 hover:underline font-medium">
                                        Sign in
                                    </Link>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
                {/* Right - Abstract Image */}
                <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-12">
                    <img
                        src="/project-amico.png"
                        alt="Abstract background"
                        className="max-w-[500px] max-h-[80vh] mx-auto object-contain"
                    />
                </div>
            </div>
        </div>
    );
}
