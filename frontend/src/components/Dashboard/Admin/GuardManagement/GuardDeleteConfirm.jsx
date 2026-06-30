import React, { useState } from 'react';

export default function GuardDeleteConfirm({ isOpen, onClose, guard, onConfirm }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !guard) return null;

    const handleConfirm = async () => {
        setLoading(true);
        setError('');
        try {
            await onConfirm(guard.id);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to remove guard. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative z-10">

                {/* Warning icon */}
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-1">Remove Guard</h2>
                <p className="text-sm text-gray-500 mb-2">
                    You are about to remove <span className="font-semibold text-gray-800">{guard.name}</span> from the system.
                </p>
                <p className="text-xs text-gray-400 mb-6">
                    Their activity logs will be retained for audit purposes, but they will lose system access immediately.
                </p>

                {error && (
                    <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 py-2.5 text-sm font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 cursor-pointer disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/20 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {loading && (
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                        )}
                        {loading ? 'Removing...' : 'Remove Guard'}
                    </button>
                </div>
            </div>
        </div>
    );
}
