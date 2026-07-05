import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ASSETS } from '../../constants/assets';
import { uniparkApi } from '../../utils/uniparkApi';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError('Please enter a valid email address.');
            return;
        }

        setIsLoading(true);
        try {
            await uniparkApi.forgotPassword(email.trim().toLowerCase());
            setSubmitted(true);
        } catch (err) {
            // Show a generic message — never reveal whether the email exists
            setSubmitted(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{ backgroundImage: 'radial-gradient(circle at center, #1d4ed8 0%, #ffffff 72%)' }}
        >
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-8 w-full max-w-md border border-white/60">

                {/* Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center space-x-2 mb-6">
                        <img src={ASSETS.logo} alt="UniPark Logo" className="w-12 h-12 object-contain" />
                    </Link>
                    <h1 className="text-3xl font-bold text-blue-700">UniPark</h1>
                    <p className="text-gray-600 mt-2">Reset your password</p>
                </div>

                {submitted ? (
                    /* ── Success state ─────────────────────────────── */
                    <div className="text-center space-y-6">
                        <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">Check your inbox</h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                If <strong>{email}</strong> is registered, we've sent a password reset link.
                                The link expires in <strong>15 minutes</strong>.
                            </p>
                            <p className="text-xs text-gray-400 mt-3">
                                Don't see it? Check your spam folder or{' '}
                                <button
                                    onClick={() => { setSubmitted(false); setEmail(''); }}
                                    className="text-blue-600 hover:underline font-medium"
                                >
                                    try again
                                </button>.
                            </p>
                        </div>
                        <Link
                            to="/login"
                            className="inline-block w-full text-center py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            Back to Sign In
                        </Link>
                    </div>
                ) : (
                    /* ── Request form ──────────────────────────────── */
                    <>
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm" role="alert">
                                {error}
                            </div>
                        )}

                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Enter the email address associated with your account and we'll send you a link to reset your password.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            <div>
                                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="reset-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                    placeholder="you@strathmore.edu"
                                    disabled={isLoading}
                                    autoComplete="email"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-transparent text-black border border-black py-2 rounded-md hover:border-blue-700 hover:bg-blue-700 hover:text-white transition font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Sending…' : 'Send Reset Link'}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                                ← Back to Sign In
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
