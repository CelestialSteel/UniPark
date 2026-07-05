import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ASSETS } from '../../constants/assets';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, isLoading, error } = useAuth();
    const [role, setRole] = useState('driver');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');

        if (!email || !password) {
            setLocalError('Please fill in all fields');
            return;
        }

        try {
            const loggedInUser = await login(email, password, role);
            // Redirect based on role
            switch (loggedInUser.role) {
                case 'driver':
                    navigate('/dashboard/driver');
                    break;
                case 'guard':
                    navigate('/dashboard/guard');
                    break;
                case 'admin':
                    navigate('/dashboard/admin');
                    break;
                default:
                    navigate('/');
            }
        } catch (err) {
            setLocalError(err.message || 'Login failed');
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{
                backgroundImage: 'radial-gradient(circle at center, #1d4ed8 0%, #ffffff 72%)',
            }}
        >
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-8 w-full max-w-md border border-white/60">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center space-x-2 mb-6">
                        <img src={ASSETS.logo} alt="UniPark Logo" className="w-12 h-12 object-contain" />
                    </Link>
                    <h1 className="text-3xl font-bold text-blue-700">UniPark</h1>
                    <p className="text-gray-600 mt-2">Sign in to your account</p>
                </div>

                {/* Error Message */}
                {(localError || error) && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                        {localError || error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Role Selection */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                            Select Portal Role
                        </label>
                        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => { setRole('driver'); setEmail('12345'); setPassword('12345678'); }}
                                className={`py-1.5 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${role === 'driver'
                                        ? 'bg-white text-blue-700 shadow-xs'
                                        : 'text-gray-600 hover:text-slate-900'
                                    }`}
                            >
                                Driver
                            </button>
                            <button
                                type="button"
                                onClick={() => { setRole('guard'); setEmail('guard@unipark.ac.ke'); setPassword('Guard@2026'); }}
                                className={`py-1.5 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${role === 'guard'
                                        ? 'bg-white text-blue-700 shadow-xs'
                                        : 'text-gray-600 hover:text-slate-900'
                                    }`}
                            >
                                Security
                            </button>
                            <button
                                type="button"
                                onClick={() => { setRole('admin'); setEmail('admin@unipark.ac.ke'); setPassword('admin123'); }}
                                className={`py-1.5 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${role === 'admin'
                                        ? 'bg-white text-blue-700 shadow-xs'
                                        : 'text-gray-600 hover:text-slate-900'
                                    }`}
                            >
                                Admin
                            </button>
                        </div>
                    </div>

                    {/* Email Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email or ID
                        </label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="12345 or your@email.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-transparent text-black border border-black py-2 rounded-md hover:border-blue-700 hover:bg-blue-700 hover:text-white transition font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {/* Footer Links */}
                <div className="mt-6 space-y-2 text-center text-sm">
                    <p className="text-gray-500 text-xs">
                        Tip: Click any role tab above to pre-fill test credentials.
                    </p>
                    <p>
                        <a href="#forgot" className="text-primary hover:text-blue-700">
                            Forgot password?
                        </a>
                    </p>
                    <p className="text-gray-600">
                        New to UniPark?{' '}
                        <Link to="/signup" className="text-primary hover:text-blue-700 font-medium">
                            Register as Driver
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
