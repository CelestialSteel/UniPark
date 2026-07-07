import React from 'react';

export default function PublishAnnouncementModal({ isOpen, onClose, newAnn, setNewAnn, onSubmit, submitting }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Publish Announcement</h2>
                <p className="text-xs text-gray-500 mb-6">Broadcast an important warning message or service alert to drivers.</p>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Headline Title</label>
                        <input
                            type="text"
                            required
                            value={newAnn.title}
                            onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                            placeholder="e.g. Sports Lot Closed Today"
                            className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Announcement Body</label>
                        <textarea
                            required
                            rows="4"
                            value={newAnn.message}
                            onChange={(e) => setNewAnn({ ...newAnn, message: e.target.value })}
                            placeholder="Provide detailed instructions to campus parking lot users..."
                            className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Target Audience</label>
                        <select
                            value={newAnn.zoneId || 'all'}
                            onChange={(e) => setNewAnn({ ...newAnn, zoneId: e.target.value })}
                            className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                            <option value="all">All Zones (Institution-wide)</option>
                            {zones.map(z => (
                                <option key={z.id} value={z.id}>📍 {z.name}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-[11px] text-gray-400">
                            {(!newAnn.zoneId || newAnn.zoneId === 'all')
                                ? 'All registered drivers will be notified.'
                                : `Only drivers currently in ${zones.find(z => z.id === newAnn.zoneId)?.name || 'the selected zone'} will be notified.`}
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Alert Severity</label>
                        <select
                            value={newAnn.severity}
                            onChange={(e) => setNewAnn({ ...newAnn, severity: e.target.value })}
                            className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                            <option value="low">Low (Standard update)</option>
                            <option value="medium">Medium (Traffic warnings)</option>
                            <option value="high">High (Immediate Action Required)</option>
                        </select>
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
                            disabled={submitting}
                            className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-60"
                        >
                            {submitting ? 'Publishing…' : 'Publish Alert'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
