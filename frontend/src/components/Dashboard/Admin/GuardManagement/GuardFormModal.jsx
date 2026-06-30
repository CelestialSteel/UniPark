import React, { useState, useEffect } from 'react';

const ZONES = ['Phase 1', 'Phase 2', 'Business School', 'Sports Complex'];
const SHIFTS = ['Day (6AM-2PM)', 'Evening (2PM-10PM)', 'Night (10PM-6AM)'];

const emptyForm = {
    name: '',
    email: '',
    phone: '',
    shift: SHIFTS[0],
    zone: ZONES[0],
};

export default function GuardFormModal({ isOpen, onClose, guardData, onSave, mode }) {
    // mode: 'add' | 'edit'
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (mode === 'edit' && guardData) {
            setForm({
                name: guardData.name || '',
                email: guardData.email || '',
                phone: guardData.phone || '',
                shift: guardData.shift || SHIFTS[0],
                zone: guardData.zone || ZONES[0],
            });
        } else {
            setForm(emptyForm);
        }
        setError('');
    }, [isOpen, mode, guardData]);

    if (!isOpen) return null;

    const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await onSave(form);
            onClose();
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isAdd = mode === 'add';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10">

                <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {isAdd ? 'Add Security Guard' : 'Update Guard Details'}
                </h2>
                <p className="text-xs text-gray-500 mb-6">
                    {isAdd
                        ? 'Fill in the details to register a new guard. They will receive login credentials via email.'
                        : 'Edit the details for this security guard.'}
                </p>

                {error && (
                    <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="e.g. John Otieno"
                            className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="e.g. j.otieno@strathmore.edu"
                            className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            required
                            value={form.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="e.g. 0712 345 678"
                            className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>

                    {/* Shift + Zone side by side */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Shift</label>
                            <select
                                value={form.shift}
                                onChange={(e) => handleChange('shift', e.target.value)}
                                className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                            >
                                {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Assigned Zone</label>
                            <select
                                value={form.zone}
                                onChange={(e) => handleChange('zone', e.target.value)}
                                className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                            >
                                {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
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
                            {loading ? 'Saving...' : isAdd ? 'Add Guard' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
