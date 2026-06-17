import { Link } from 'react-router-dom';
import { ASSETS } from '../../constants/assets';

export default function Footer() {
    return (
        <footer className="bg-dark text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex justify-between items-center mb-8">
                    <Link to="/" className="flex items-center space-x-2">
                        <img src={ASSETS.logo} alt="UniPark Logo" className="w-6 h-6 object-contain" />
                        <span className="text-lg font-bold text-primary">UniPark</span>
                    </Link>
                    <div className="flex space-x-6">
                        <a href="#privacy" className="text-gray-400 hover:text-primary transition">
                            Privacy Policy
                        </a>
                        <a href="#terms" className="text-gray-400 hover:text-primary transition">
                            Terms of Service
                        </a>
                        <a href="#accessibility" className="text-gray-400 hover:text-primary transition">
                            Accessibility
                        </a>
                        <a href="#help" className="text-gray-400 hover:text-primary transition">
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
