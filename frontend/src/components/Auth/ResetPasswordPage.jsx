import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ASSETS } from '../../constants/assets';
import { uniparkApi } from '../../utils/uniparkApi';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Redirect to login after success
    const handleSuccessRedirect = () => navigate('/login', { replace: true });

    const validate = () => {
        if (!password) return 'Please enter a new password.';
        if (password.length < 8) return 'Password must be at least 8 characters.';
        if (password !== confirmPassword) return 'Passwords do not match.';
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('Missing reset token. Please use the link from your email.');
            return;
        }

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        try {
            await uniparkApi.resetPassword(token, password);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Invalid or expired reset link. Please request a new one.');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Missing token guard ──────────────────────────────────────────────────
    if (!token) {
        return (
            <PageShell>
                <ErrorCard
                    title="Invalid reset link"
                    message="This password reset link is missing or malformed. Please request a new one."
                />
            </PageShell>
        );
    }

    // ── Success screen ───────────────────────────────────────────────────────
    if (success) {
        return (
            <PageShell>
                <div className="text-center space-y-6">
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Password updated!</h2>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Your password has been changed successfully.
                            You can now sign in with your new password.
                        </p>
                    </div>
                    <button
                        onClick={handleSuccessRedirect}
                        className="w-full bg-blue-700 text-white py-2 rounded-md font-medium hover:bg-blue-800 transition"
                    >
                        Go to Sign In
                    </button>
                </div>
            </PageShell>
        );
    }

    // ── Reset form ───────────────────────────────────────────────────────────
    const passwordStrength = (() => {
        if (!password) return null;
        const score = [
            password.length >= 8,
            /[A-Z]/.test(password),
            /[0-9]/.test(password),
            /[^A-Za-z0-9]/.test(password),
        ].filter(Boolean).length;
        if (score <= 1) return { label: 'Weak', color: 'bg-red-400', width: 'w-1/4' };
        if (score === 2) return { label: 'Fair', color: 'bg-amber-400', width: 'w-2/4' };
        if (score === 3) return { label: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
        return { label: 'Strong', color: 'bg-green-500', width: 'w-full' };
    })();

    return (
        <PageShell>
            <div className="text-center mb-8">
                <Link to="/" className="inline-flex items-center space-x-2 mb-6">
                    <img src={ASSETS.logo} alt="UniPark Logo" className="w-12 h-12 object-contain" />
                </Link>
                <h1 className="text-3xl font-bold text-blue-700">UniPark</h1>
                <p className="text-gray-600 mt-2">Choose a new password</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm" role="alert">
                    {error}
                    {error.toLowerCase().includes('expired') || error.toLowerCase().includes('invalid') ? (
                        <p className="mt-1">
                            <Link to="/forgot-password" className="font-semibold underline">
                                Request a new reset link →
                            </Link>
                        </p>
                    ) : null}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* New password */}
                <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                    </label>
                    <div className="relative">
                        <input
                            id="new-password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            placeholder="••••••••"
                            disabled={isLoading}
                            autoComplete="new-password"
                            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Strength meter */}
                    {passwordStrength && (
                        <div className="mt-2">
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.width}`} />
                            </div>
                            <p className={`text-xs mt-1 font-medium ${
                                passwordStrength.label === 'Weak' ? 'text-red-500' :
                                passwordStrength.label === 'Fair' ? 'text-amber-500' :
                                passwordStrength.label === 'Good' ? 'text-blue-500' : 'text-green-500'
                            }`}>
                                {passwordStrength.label}
                            </p>
                        </div>
                    )}
                </div>

                {/* Confirm password */}
                <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                    </label>
                    <input
                        id="confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                        placeholder="••••••••"
                        disabled={isLoading}
                        autoComplete="new-password"
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 disabled:bg-gray-50 ${
                            confirmPassword && password !== confirmPassword
                                ? 'border-red-400 focus:ring-red-300'
                                : 'border-gray-300 focus:ring-blue-500'
                        }`}
                    />
                    {confirmPassword && password !== confirmPassword && (
                        <p className="mt-1 text-xs text-red-500 font-medium">Passwords do not match.</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-transparent text-black border border-black py-2 rounded-md hover:border-blue-700 hover:bg-blue-700 hover:text-white transition font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Updating…' : 'Set New Password'}
                </button>
            </form>

            <div className="mt-6 text-center text-sm">
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    ← Back to Sign In
                </Link>
            </div>
        </PageShell>
    );
}

/** Shared page shell matching the login/signup card design */
function PageShell({ children }) {
    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{ backgroundImage: 'radial-gradient(circle at center, #1d4ed8 0%, #ffffff 72%)' }}
        >
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-8 w-full max-w-md border border-white/60">
                {children}
            </div>
        </div>
    );
}

/** Shown when token is missing from the URL */
function ErrorCard({ title, message }) {
    return (
        <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
            </div>
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
                <p className="text-sm text-gray-500">{message}</p>
            </div>
            <Link
                to="/forgot-password"
                className="inline-block w-full text-center py-2 bg-blue-700 text-white rounded-md font-medium hover:bg-blue-800 transition"
            >
                Request New Reset Link
            </Link>
        </div>
    );
}
