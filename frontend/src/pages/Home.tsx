import StudentNavbar from '../components/studentNavbar'
import { Button } from '../components/ui/button'
import {
    GraduationCap,
    BookOpen,
    Users,
    Award,
    Target
} from 'lucide-react'

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

                        {/* CTA Button */}
                        <div>
                            <Button
                                size="lg"
                                className="bg-indigo-600 hover:bg-indigo-800 text-white px-8 py-4 rounded-xl text-lg font-medium"
                            >
                                Get Free Scholarships
                            </Button>
                        </div>
                    </div>

                    {/* Right Illustration */}
                    <div className="flex justify-center lg:justify-end">
                        <div className="relative">
                            {/* Main Figure */}
                            <div className="w-80 h-96 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-3xl flex items-center justify-center relative overflow-hidden">
                                {/* Person Silhouette */}
                                <div className="absolute bottom-0 right-8">
                                    <div className="w-32 h-48 bg-gray-800 rounded-t-full relative">
                                        {/* Head */}
                                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gray-800 rounded-full"></div>
                                        {/* Arms */}
                                        <div className="absolute top-8 -left-4 w-8 h-16 bg-gray-800 rounded-full transform rotate-12"></div>
                                        <div className="absolute top-12 -right-6 w-8 h-20 bg-gray-800 rounded-full transform -rotate-12"></div>
                                    </div>
                                </div>

                                {/* Floating Elements */}
                                <div className="absolute top-8 left-8 bg-white p-3 rounded-lg shadow-lg">
                                    <BookOpen className="h-6 w-6 text-indigo-600" />
                                </div>

                                <div className="absolute top-16 right-12 bg-white p-3 rounded-lg shadow-lg">
                                    <Award className="h-6 w-6 text-indigo-600" />
                                </div>

                                <div className="absolute bottom-32 left-12 bg-white p-3 rounded-lg shadow-lg">
                                    <Target className="h-6 w-6 text-indigo-600" />
                                </div>

                                {/* Progress Lines */}
                                <div className="absolute top-24 right-6 space-y-2">
                                    <div className="w-16 h-1 bg-indigo-600 rounded"></div>
                                    <div className="w-12 h-1 bg-indigo-400 rounded"></div>
                                    <div className="w-8 h-1 bg-indigo-300 rounded"></div>
                                </div>

                                {/* Checkmarks */}
                                <div className="absolute bottom-48 right-4 space-y-2">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <div className="w-3 h-3 text-white text-xs">✓</div>
                                    </div>
                                    <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                                        <div className="w-3 h-3 text-white text-xs">✓</div>
                                    </div>
                                </div>
                            </div>
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