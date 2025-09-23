import StudentNavbar from '../components/studentNavbar'

import { BookOpen, Users, Award } from 'lucide-react'
import { Link } from 'react-router-dom'

const Home = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            <StudentNavbar />

            {/* Hero Section */}
            <main className="container mx-auto px-4 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                    {/* Left Content */}
                    <div className="space-y-8">
                        {/* Main Heading */}
                        <div className="space-y-6">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                Practice your Skills and{' '}
                                <span className="text-indigo-600">achieve success</span>
                            </h1>

                            <div className="space-y-4 text-gray-600 text-lg">
                                <p>
                                    At ScholarFind, we believe that everyone deserves the opportunity to
                                    learn at no cost.
                                </p>
                                <p>
                                    We want to make education accessible to everyone, regardless of
                                    where you come from or your background
                                </p>
                            </div>
                        </div>

                        {/* CTA Link */}
                        <div>
                            <Link
                                to="/scholarship"
                                className="bg-indigo-600 hover:bg-indigo-800 text-white px-8 py-4 rounded-xl text-lg font-medium"
                            >
                                Get Free Scholarships
                            </Link>
                        </div>
                    </div>

                    {/* Right Illustration (replaced with provided image) */}
                    <div className="flex justify-center lg:justify-end">
                        <div className="relative">
                            <img
                                src="/illustration.png"
                                alt="student standing on books illustration"
                                className="w-64 sm:w-80 md:w-96 lg:w-[28rem] h-auto rounded-3xl shadow-lg object-contain"
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Section */}
            <section className="bg-gray-50 py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Why Choose ScholarFind?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            We're committed to breaking down financial barriers to education
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="bg-white p-8 rounded-2xl shadow-sm">
                            <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                                <BookOpen className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                Free Access
                            </h3>
                            <p className="text-gray-600">
                                Complete access to all scholarship opportunities at no cost. No hidden fees or premium plans.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm">
                            <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                                <Users className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                For Everyone
                            </h3>
                            <p className="text-gray-600">
                                Regardless of your background, financial situation, or academic level - everyone is welcome.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm">
                            <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                                <Award className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                Verified Opportunities
                            </h3>
                            <p className="text-gray-600">
                                All scholarships are verified and regularly updated to ensure legitimacy and relevance.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Home