import { Link } from 'react-router-dom';
import { ASSETS } from '../../constants/assets';

export default function Header() {
    return (
        <header className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <img src={ASSETS.logo} alt="UniPark Logo" className="w-8 h-8 object-contain" />
                        <span className="text-xl font-bold text-primary">UniPark</span>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex items-center space-x-8">
                        <a href="#about" className="text-gray-600 hover:text-primary transition">
                            About
                        </a>
                        <a href="#contact" className="text-gray-600 hover:text-primary transition">
                            Contact
                        </a>
                        <Link
                            to="/login"
                            className="login-button px-6 py-2 rounded-md font-medium"
                        >
                            Login
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}
