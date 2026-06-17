import { Link } from 'react-router-dom';

export default function Header() {
    return (
        <header className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                            </svg>
                        </div>
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
