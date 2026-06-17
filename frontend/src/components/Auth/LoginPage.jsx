import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

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
            await login(email, password, role);
            // Redirect based on role
            switch (role) {
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
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                            </svg>
                        </div>
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
                    {/* <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            I am a:
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="driver">Driver (Student/Staff)</option>
                            <option value="guard">Security Guard</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div> */}

                    {/* Email Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email or ID
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
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
                        className="w-full bg-transparent text-black border border-black py-2 rounded-md hover:border-blue-700 hover:bg-blue-700 hover:text-white transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {/* Footer Links */}
                <div className="mt-6 space-y-2 text-center text-sm">
                    <p>
                        <a href="#forgot" className="text-primary hover:text-blue-700">
                            Forgot password?
                        </a>
                    </p>
                    <p className="text-gray-600">
                        New to UniPark?{' '}
                        <a href="#register" className="text-primary hover:text-blue-700 font-medium">
                            Register as Driver
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
