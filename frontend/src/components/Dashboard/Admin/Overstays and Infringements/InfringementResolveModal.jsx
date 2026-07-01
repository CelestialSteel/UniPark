import React, { useState } from 'react';

const SEVERITY_COLORS = {
    low: 'bg-blue-50 text-blue-700',
    medium: 'bg-amber-50 text-amber-700',
    high: 'bg-red-50 text-red-700',
};

export default function InfringementResolveModal({ isOpen, onClose, infringement, onResolve }) {
    const [status, setStatus] = useState('resolved');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !infringement) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!notes.trim()) { setError('Resolution notes are required.'); return; }
        setLoading(true);
        setError('');
        try {
            await onResolve(infringement.id, { status, resolution_notes: notes });
            setNotes('');
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to process infringement.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10">

                <h2 className="text-xl font-bold text-gray-900 mb-1">Process Infringement</h2>
                <p className="text-xs text-gray-500 mb-5">Review and update the status of this infringement report.</p>

                {/* Infringement summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-5 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">Vehicle</span>
                        <span className="text-sm font-bold text-gray-900">{infringement.vehicle_registration || infringement.vehicle_id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">Type</span>
                        <span className="text-sm text-gray-700">{infringement.infringement_type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">Severity</span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${SEVERITY_COLORS[infringement.severity] || 'bg-gray-100 text-gray-600'}`}>
                            {infringement.severity}
                        </span>
                    </div>
                    {infringement.fine_amount && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500">Fine</span>
                            <span className="text-sm font-semibold text-red-600">KES {infringement.fine_amount}</span>
                        </div>
                    )}
                    {infringement.description && (
                        <div className="pt-1 border-t border-gray-200">
                            <span className="text-xs text-gray-400">{infringement.description}</span>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Update Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                            <option value="under_review">Under Review</option>
                            <option value="resolved">Resolved</option>
                            <option value="dismissed">Dismissed</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Resolution Notes</label>
                        <textarea
                            required
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Describe the resolution or action taken..."
                            className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-2.5 text-sm font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 cursor-pointer disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {loading && (
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                            )}
                            {loading ? 'Processing...' : 'Confirm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
