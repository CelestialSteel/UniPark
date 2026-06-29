import React from 'react';

export default function ReserveSpacesModal({ isOpen, onClose, zones, newRes, setNewRes, onSubmit }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Block Parking Lot Spaces</h2>
                <p className="text-xs text-gray-500 mb-6">Create a reservation for an upcoming event or administrative visitor.</p>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Select Campus Lot</label>
                        <select
                            value={newRes.zone}
                            onChange={(e) => setNewRes({ ...newRes, zone: e.target.value })}
                            className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                            {zones.map(z => <option key={z.id} value={z.name}>{z.name} (Max: {z.total})</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Event Name / Purpose</label>
                        <input
                            type="text"
                            required
                            value={newRes.event}
                            onChange={(e) => setNewRes({ ...newRes, event: e.target.value })}
                            placeholder="e.g. Graduation Ceremony 2026"
                            className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
                            <input
                                type="date"
                                required
                                value={newRes.date}
                                onChange={(e) => setNewRes({ ...newRes, date: e.target.value })}
                                className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Bays Count</label>
                            <input
                                type="number"
                                required
                                min="1"
                                max="100"
                                value={newRes.spaces}
                                onChange={(e) => setNewRes({ ...newRes, spaces: parseInt(e.target.value) || 1 })}
                                className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 text-sm font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 cursor-pointer"
                        >
                            Confirm Reservation
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
