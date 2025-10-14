import StudentNavbar from '../components/studentNavbar'
import { Users, ArrowRight, GraduationCap, Search, TrendingUp, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import React, { type ReactNode } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

// Animation variants - memoized to prevent recreation on every render
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
        }
    }
}

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6 }
    }
}

const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5 }
    }
}

// Animated component wrapper - memoized to prevent unnecessary re-renders
type AnimatedSectionProps = {
    children: ReactNode
    className?: string
}

const AnimatedSection: React.FC<AnimatedSectionProps> = React.memo(({ children, className = '' }) => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    })

    return (
        <motion.div
            ref={ref as any}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={containerVariants}
            className={className}
        >
            {children}
        </motion.div>
    )
})

AnimatedSection.displayName = 'AnimatedSection'

const Home = () => {
    return (
        <div className="h-screen bg-white flex flex-col">
            <StudentNavbar />

            <div className="flex-1 overflow-y-auto custom-scrollbar">{/* Hero Section */}
                {/* Responsive hero section with optimized spacing and typography */}
                <section className="relative bg-gradient-to-br from-indigo-50 via-white to-indigo-100/50 pt-4 sm:pt-6 lg:pt-8 pb-12 sm:pb-16 lg:pb-28 overflow-hidden">
                    <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
                            {/* Left Content */}
                            <AnimatedSection className="space-y-6 sm:space-y-8 text-center lg:text-left">
                                <motion.div variants={itemVariants}>

                                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4 sm:mb-6">
                                        Unlock Your{' '}
                                        <span className="text-indigo-600 relative">
                                            Future
                                            <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-2 sm:h-3 text-indigo-200" viewBox="0 0 100 12" fill="currentColor">
                                                <path d="M0 8c30-4 70-4 100 0v4H0z" />
                                            </svg>
                                        </span>{' '}
                                        with Scholarships
                                    </h1>

                                    <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-6 sm:mb-8 max-w-2xl mx-auto lg:mx-0">
                                        Discover thousands of scholarship opportunities, apply with ease, and track your progress.
                                        Your educational dreams are just one application away.
                                    </p>

                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                                        <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg">
                                            <Link to="/scholarship">
                                                <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                                Explore Scholarships
                                            </Link>
                                        </Button>
                                        <Button asChild variant="outline" size="lg" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg">
                                            <Link to="/register">
                                                Join Free Today
                                            </Link>
                                        </Button>
                                    </div>

                                    {/* Trust indicators */}
                                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 pt-6 sm:pt-8">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                            <span className="text-xs sm:text-sm text-gray-600">100% Free</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                            <span className="text-xs sm:text-sm text-gray-600">Verified Opportunities</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                            <span className="text-xs sm:text-sm text-gray-600">Instant Notifications</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatedSection>

                            {/* Right Illustration */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="relative order-first lg:order-last"
                            >
                                <div className="relative max-w-sm sm:max-w-md lg:max-w-full mx-auto">
                                    <img
                                        src="/freepik.png"
                                        alt="Student success illustration"
                                        className="relative w-full h-auto rounded-2xl sm:rounded-3xl"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-12 sm:py-16 lg:py-20 bg-white">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                        <AnimatedSection className="text-center mb-12 sm:mb-16">
                            <motion.div variants={fadeInUp}>
                                <Badge variant="outline" className="mb-3 sm:mb-4 border-indigo-200 text-indigo-600 text-xs sm:text-sm">
                                    Platform Features
                                </Badge>
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                                    Everything You Need in One Place
                                </h2>
                                <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
                                    Our comprehensive platform provides all the tools you need to discover,
                                    apply for, and manage scholarship opportunities effectively.
                                </p>
                            </motion.div>
                        </AnimatedSection>

                        <AnimatedSection className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                            {[
                                {
                                    icon: Search,
                                    title: "Smart Discovery",
                                    description: "AI-powered search and filtering to find scholarships perfectly matched to your academic profile and career goals.",
                                    color: "bg-blue-50 text-blue-600",
                                    borderColor: "border-blue-200"
                                },
                                {
                                    icon: GraduationCap,
                                    title: "Seamless Applications",
                                    description: "Streamlined application process with document management, auto-fill capabilities, and progress tracking.",
                                    color: "bg-indigo-50 text-indigo-600",
                                    borderColor: "border-indigo-200"
                                },
                                {
                                    icon: TrendingUp,
                                    title: "Real-time Updates",
                                    description: "Instant notifications about application status, new opportunities, and important deadlines.",
                                    color: "bg-purple-50 text-purple-600",
                                    borderColor: "border-purple-200"
                                }
                            ].map((feature, index) => (
                                <motion.div key={index} variants={scaleIn}>
                                    <Card className={`h-full border-2 ${feature.borderColor} hover:shadow-xl transition-all duration-300 group hover:border-indigo-300`}>
                                        <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6">
                                            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ${feature.color} flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                                <feature.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                                            </div>
                                            <CardTitle className="text-lg sm:text-xl text-gray-900">{feature.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-center px-4 sm:px-6">
                                            <CardDescription className="text-sm sm:text-base leading-relaxed text-gray-600">
                                                {feature.description}
                                            </CardDescription>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatedSection>
                    </div>
                </section>



                {/* How It Works Section */}
                <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-indigo-50 via-white to-indigo-100/50">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                        <AnimatedSection>
                            <div className="text-center mb-12 sm:mb-16">
                                <Badge variant="outline" className="mb-3 sm:mb-4 border-indigo-200 text-indigo-600 text-xs sm:text-sm">
                                    Simple Process
                                </Badge>
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                                    How ScholarSphere Works
                                </h2>
                                <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
                                    Get started in minutes and begin your scholarship journey today
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 relative">
                                {/* Connection lines for desktop */}
                                <div className="hidden lg:block absolute top-20 sm:top-24 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-indigo-200 to-indigo-300"></div>
                                {[
                                    {
                                        step: "01",
                                        title: "Create Your Profile",
                                        description: "Sign up and complete your academic profile to get personalized scholarship recommendations.",
                                        icon: Users
                                    },
                                    {
                                        step: "02",
                                        title: "Discover Opportunities",
                                        description: "Browse and search through thousands of verified scholarship opportunities that match your criteria.",
                                        icon: Search
                                    },
                                    {
                                        step: "03",
                                        title: "Apply & Track",
                                        description: "Submit applications with our streamlined process and track your progress in real-time.",
                                        icon: TrendingUp
                                    }
                                ].map((step, index) => (
                                    <motion.div key={index} variants={scaleIn} className="relative">
                                        <Card className="text-center border-2 border-indigo-100 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 relative z-10 bg-white h-full">
                                            <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                                                <div className="relative mx-auto mb-3 sm:mb-4">
                                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                                                        <step.icon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                                                    </div>
                                                    <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                                        <span className="text-xs sm:text-sm font-bold text-indigo-600">{step.step}</span>
                                                    </div>
                                                </div>
                                                <CardTitle className="text-lg sm:text-xl text-gray-900">{step.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="px-4 sm:px-6">
                                                <CardDescription className="text-sm sm:text-base leading-relaxed text-gray-600">
                                                    {step.description}
                                                </CardDescription>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </AnimatedSection>
                    </div>
                </section>


                {/* CTA Section */}
                <section className="py-12 sm:py-16 lg:py-20 bg-indigo-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-700"></div>
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative">
                        <AnimatedSection>
                            <div className="text-center">
                                <motion.div variants={fadeInUp}>
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                                        Start Your Scholarship Journey Today
                                    </h2>
                                    <p className="text-base sm:text-lg lg:text-xl text-indigo-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
                                        Join thousands of students who have already transformed their educational future.
                                        Your perfect scholarship is waiting.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                                        <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-gray-50 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg">
                                            <Link to="/scholarship">
                                                Browse Scholarships
                                                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                                            </Link>
                                        </Button>
                                        <Button asChild variant="outline" size="lg" className="border-white text-indigo-600 hover:bg-gray-200 hover:text-indigo-600 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg">
                                            <Link to="/Register">
                                                Create Free Account
                                            </Link>
                                        </Button>
                                    </div>
                                </motion.div>
                            </div>
                        </AnimatedSection>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-900 text-white py-12 sm:py-16">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
                            <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                                <div className="flex items-center gap-2 mb-4 sm:mb-6 justify-center sm:justify-start">
                                    <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-400" />
                                    <span className="text-xl sm:text-2xl font-bold">ScholarSphere</span>
                                </div>
                                <p className="text-gray-400 mb-4 sm:mb-6 leading-relaxed max-w-md text-center sm:text-left text-sm sm:text-base mx-auto sm:mx-0">
                                    Empowering students worldwide to achieve their educational dreams through
                                    accessible scholarship opportunities and comprehensive support.
                                </p>
                            </div>
                            <div className="text-center sm:text-left">
                                <h3 className="font-semibold mb-3 sm:mb-4 text-white text-sm sm:text-base">Quick Links</h3>
                                <ul className="space-y-2 sm:space-y-3 text-gray-400 text-sm sm:text-base">
                                    <li><Link to="/scholarship" className="hover:text-white transition-colors hover:underline">Browse Scholarships</Link></li>
                                    <li><Link to="/register" className="hover:text-white transition-colors hover:underline">Sign Up</Link></li>
                                    <li><Link to="/login" className="hover:text-white transition-colors hover:underline">Login</Link></li>
                                    <li><a href="#" className="hover:text-white transition-colors hover:underline">How It Works</a></li>
                                </ul>
                            </div>
                            <div className="text-center sm:text-left">
                                <h3 className="font-semibold mb-3 sm:mb-4 text-white text-sm sm:text-base">Support</h3>
                                <ul className="space-y-2 sm:space-y-3 text-gray-400 text-sm sm:text-base">
                                    <li><a href="#" className="hover:text-white transition-colors hover:underline">Help Center</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors hover:underline">Contact Support</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors hover:underline">Privacy Policy</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors hover:underline">Terms of Service</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-gray-800 pt-6 sm:pt-8 text-center">
                            <p className="text-gray-400 text-sm sm:text-base">
                                © 2025 ScholarSphere. All rights reserved. Made with ❤️ for students worldwide.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    )
}

export default Home