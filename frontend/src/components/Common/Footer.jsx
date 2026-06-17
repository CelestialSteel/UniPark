import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-dark text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex justify-between items-center mb-8">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold">UniPark</span>
                    </Link>
                    <div className="flex space-x-6">
                        <a href="#privacy" className="text-gray-400 hover:text-white transition">
                            Privacy Policy
                        </a>
                        <a href="#terms" className="text-gray-400 hover:text-white transition">
                            Terms of Service
                        </a>
                        <a href="#accessibility" className="text-gray-400 hover:text-white transition">
                            Accessibility
                        </a>
                        <a href="#help" className="text-gray-400 hover:text-white transition">
                            Help Center
                        </a>
                    </div>
                </div>
                <div className="border-t border-gray-700 pt-8">
                    <p className="text-gray-400 text-sm">
                        © 2026 UniPark Infrastructure Systems. All rights reserved.
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                        Powered by University Facilities & Logistics Division
                    </p>
                </div>
            </div>
        </footer>
    );
}
