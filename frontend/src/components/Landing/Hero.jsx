import { Link } from 'react-router-dom';
import { ASSETS } from '../../constants/assets';

export default function Hero() {
    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-8">
                        {/* Badge */}
                        

                        {/* Heading */}
                        <div className="space-y-4">
                            <h1 className="text-5xl font-bold text-dark">
                                Welcome to <span className="text-primary">UniPark</span>
                            </h1>
                            <p className="text-xl text-gray-600 leading-relaxed">
                                Streamline your campus commute with real-time parking intelligence. Whether you're a student, faculty, or security staff, UniPark provides the precision you need to navigate our grounds efficiently.
                            </p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex space-x-4">
                            <Link
                                to="#zones"
                                className="bg-primary text-white px-8 py-3 rounded-md hover:bg-blue-700 transition font-medium inline-flex items-center space-x-2"
                            >
                                <span>Explore Zones</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                            <button className="border-2 border-primary text-primary px-8 py-3 rounded-md hover:bg-blue-50 transition font-medium">
                                Learn More
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
                            <div>
                                <p className="text-3xl font-bold text-dark">-</p>
                                <p className="text-gray-600 text-sm">Active Spots</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-dark">-</p>
                                <p className="text-gray-600 text-sm">Campus Zones</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-dark">-</p>
                                <p className="text-gray-600 text-sm">Uptime</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Image */}
                    <div className="relative">
                        <div className="rounded-2xl overflow-hidden shadow-2xl">
                            <img
                                src={ASSETS.parkingLot}
                                alt="Parking lot with available spaces"
                                className="w-full h-96 object-cover"
                            />
                            {/* Overlay Card */}
                            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                    </svg>
                                    <span className="font-semibold text-dark">Main Lot A</span>
                                    <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded">LIVE</span>
                                </div>
                                <p className="text-sm text-gray-600"> - spots currently available</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
