import StudentNavbar from '../components/studentNavbar'
import { BookOpen, Users, Award, ArrowRight, Sparkles, GraduationCap, Search, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import React, { type ReactNode } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

// Animation variants
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

// Animated component wrapper (typed)
type AnimatedSectionProps = {
    children: ReactNode
    className?: string
}
const AnimatedSection: React.FC<AnimatedSectionProps> = ({ children, className = '' }) => {
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
}

const Home = () => {
    return (
        <div className="min-h-screen bg-white">
            <StudentNavbar />

            {/* Hero Section with Clean Design */}
            <section className="relative bg-gradient-to-br from-indigo-50 via-white to-indigo-50/30 py-20 lg:py-32">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <AnimatedSection className="space-y-8">
                            <motion.div variants={itemVariants}>
                                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 mb-6">
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Free Education Platform
                                </Badge>
                                
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                                    Find Your Perfect{' '}
                                    <span className="text-indigo-600">
                                        Scholarship
                                    </span>
                                </h1>
                                
                                <p className="text-xl text-gray-600 leading-relaxed mb-8">
                                    Discover thousands of scholarship opportunities tailored to your academic journey. 
                                    Apply with confidence and track your progress all in one place.
                                </p>
                                
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                        <Link to="/scholarship">
                                            <Search className="h-5 w-5 mr-2" />
                                            Browse Scholarships
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50">
                                        <Link to="/register">
                                            Get Started Free
                                        </Link>
                                    </Button>
                                </div>
                            </motion.div>
                        </AnimatedSection>

                        {/* Right Illustration */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="relative bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-3xl p-8 shadow-2xl">
                                <img
                                    src="/illustration.png"
                                    alt="Student success illustration"
                                    className="w-full h-auto rounded-2xl"
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section with Cards */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4 max-w-7xl">
                    <AnimatedSection className="text-center mb-16">
                        <motion.div variants={fadeInUp}>
                            <Badge variant="outline" className="mb-4">
                                Why Choose ScholarSphere?
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                Everything You Need to Succeed
                            </h2>
                            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                Our platform provides comprehensive tools and resources to help you find, 
                                apply for, and manage scholarship opportunities.
                            </p>
                        </motion.div>
                    </AnimatedSection>

                    <AnimatedSection className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Search,
                                title: "Smart Search",
                                description: "Advanced filtering and search capabilities to find scholarships that match your profile and interests.",
                                color: "bg-blue-50 text-blue-600"
                            },
                            {
                                icon: GraduationCap,
                                title: "Easy Applications",
                                description: "Streamlined application process with document management and progress tracking.",
                                color: "bg-indigo-50 text-indigo-600"
                            },
                            {
                                icon: TrendingUp,
                                title: "Track Progress",
                                description: "Real-time notifications and status updates on all your scholarship applications.",
                                color: "bg-purple-50 text-purple-600"
                            }
                        ].map((feature, index) => (
                            <motion.div key={index} variants={scaleIn}>
                                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                                    <CardHeader className="text-center pb-4">
                                        <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                            <feature.icon className="h-8 w-8" />
                                        </div>
                                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-center">
                                        <CardDescription className="text-base leading-relaxed">
                                            {feature.description}
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatedSection>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4 max-w-7xl">
                    <AnimatedSection>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                Trusted by Students Worldwide
                            </h2>
                            <p className="text-xl text-gray-600">
                                Join thousands of students who have found their perfect scholarship
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {[
                                { number: "10,000+", label: "Scholarships Available", icon: Award },
                                { number: "50,000+", label: "Students Helped", icon: Users },
                                { number: "$100M+", label: "Scholarships Awarded", icon: TrendingUp },
                                { number: "500+", label: "Partner Organizations", icon: BookOpen }
                            ].map((stat, index) => (
                                <motion.div key={index} variants={scaleIn}>
                                    <Card className="text-center border-0 shadow-lg">
                                        <CardContent className="pt-6">
                                            <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                                                <stat.icon className="h-6 w-6 text-indigo-600" />
                                            </div>
                                            <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                                            <div className="text-gray-600">{stat.label}</div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-indigo-600">
                <div className="container mx-auto px-4 max-w-7xl">
                    <AnimatedSection>
                        <div className="text-center">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Ready to Start Your Journey?
                            </h2>
                            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                                Join thousands of students who have already found their perfect scholarship opportunities.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-gray-50">
                                    <Link to="/scholarship">
                                        Browse Scholarships
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-indigo-600">
                                    <Link to="/register">
                                        Create Account
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </AnimatedSection>
                </div>
            </section>


            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <GraduationCap className="h-8 w-8 text-indigo-400" />
                                <span className="text-2xl font-bold">ScholarSphere</span>
                            </div>
                            <p className="text-gray-400 mb-4">
                                Empowering students worldwide to achieve their educational dreams through accessible scholarship opportunities.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Quick Links</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><Link to="/scholarship" className="hover:text-white transition-colors">Browse Scholarships</Link></li>
                                <li><Link to="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
                                <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Support</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 text-center">
                        <p className="text-gray-400">© 2025 ScholarSphere. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Home
