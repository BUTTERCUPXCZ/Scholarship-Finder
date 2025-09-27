import StudentNavbar from '../components/studentNavbar'
import { BookOpen, Users, Award, ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import React, { type ReactNode } from 'react'

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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
            <StudentNavbar />

            {/* Hero Section */}
            {/* Make hero fill viewport minus navbar (approx 64px) so it fits in screen */}
            <main className="container mx-auto px-4">
                <div className="min-h-[calc(100vh-64px)] flex items-center">
                    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
                        {/* Left Content */}
                        <AnimatedSection className="space-y-6">
                            <motion.div variants={itemVariants} className="space-y-6">
                                {/* Badge */}
                                <motion.div
                                    variants={itemVariants}
                                    className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Free Education Platform
                                </motion.div>

                                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                    Practice your Skills and{' '}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                                        achieve success
                                    </span>
                                </h1>

                                <div className="space-y-3 text-gray-600 text-base md:text-lg">
                                    <motion.p variants={itemVariants}>
                                        At ScholarFind, we believe that everyone deserves the opportunity to
                                        learn at no cost.
                                    </motion.p>
                                    <motion.p variants={itemVariants}>
                                        We want to make education accessible to everyone, regardless of
                                        where you come from or your background
                                    </motion.p>
                                </div>
                            </motion.div>

                            {/* CTA Link */}
                            <motion.div variants={itemVariants}>
                                <Link
                                    to="/scholarship"
                                    className="group relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl text-base md:text-lg font-medium inline-flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                >
                                    Get Free Scholarships
                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </motion.div>
                        </AnimatedSection>

                        {/* Right Illustration */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="flex justify-center lg:justify-end pt-4 lg:pt-0"
                        >
                            <div className="relative">
                                <motion.div
                                    animate={{
                                        y: [0, -10, 0],
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                    }}
                                    className="absolute -inset-4 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-3xl blur-xl"
                                />
                                <img
                                    src="/illustration.png"
                                    alt="student standing on books illustration"
                                    className="relative w-56 sm:w-72 md:w-80 lg:w-[24rem] xl:w-[28rem] h-auto rounded-3xl shadow-2xl object-contain z-10"
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

            {/* Features Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <AnimatedSection className="text-center mb-16">
                        <motion.div variants={fadeInUp}>
                            <div className="inline-flex items-center gap-2 text-indigo-600 mb-4">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                Why Choose ScholarFind?
                            </h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                We're committed to breaking down financial barriers to education
                            </p>
                        </motion.div>
                    </AnimatedSection>

                    <AnimatedSection className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            {
                                icon: BookOpen,
                                title: "Free Access",
                                description: "Complete access to all scholarship opportunities at no cost. No hidden fees or premium plans."
                            },
                            {
                                icon: Users,
                                title: "For Everyone",
                                description: "Regardless of your background, financial situation, or academic level - everyone is welcome."
                            },
                            {
                                icon: Award,
                                title: "Verified Opportunities",
                                description: "All scholarships are verified and regularly updated to ensure legitimacy and relevance."
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                variants={scaleIn}
                                whileHover={{
                                    y: -5,
                                    transition: { duration: 0.2 }
                                }}
                                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group"
                            >
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <feature.icon className="h-7 w-7 text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </AnimatedSection>
                </div>
            </section>



            {/* Footer */}
            <footer className="mt-20 bg-white border-t border-gray-100">
                <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center  gap-3">
                        <span className="text-sm text-gray-500 text-center">© ScholarSphere 2025 — All rights reserved</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Home
