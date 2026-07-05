import React, { useState } from 'react';
import ReserveSpacesModal from './ReserveSpacesModal';

export default function ReservationsTab({ reservations, zones, onAddReservation, onDeleteReservation, triggerToast }) {
    const [isResModalOpen, setIsResModalOpen] = useState(false);
    const [newRes, setNewRes] = useState({ zone: zones[0]?.name || '', event: '', date: '', spaces: 5 });
    const [submitting, setSubmitting] = useState(false);

    const handleResSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onAddReservation(newRes);
            setIsResModalOpen(false);
            setNewRes({ zone: zones[0]?.name || '', event: '', date: '', spaces: 5 });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (res) => {
        await onDeleteReservation(res);
    };

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Event Parking Reservations</h1>
                    <p className="text-gray-500 mt-1">Configure closures and block bays for academic and administrative meetings.</p>
                </div>
                <button
                    onClick={() => setIsResModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg cursor-pointer"
                >
                    + Add New Reservation
                </button>
            </div>

            {/* Active Reservations Table */}
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                {reservations.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <p className="font-medium text-gray-500">No active reservations</p>
                        <p className="text-sm mt-1">Create a reservation to block spaces for an event.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
                                <th className="p-4">Campus Zone</th>
                                <th className="p-4">Purpose/Event</th>
                                <th className="p-4">Date Scheduled</th>
                                <th className="p-4 text-center">Spaces Blocked</th>
                                <th className="p-4">Approval Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {reservations.map((res) => (
                                <tr key={res.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-semibold text-gray-800">{res.zone}</td>
                                    <td className="p-4 text-gray-700">{res.event}</td>
                                    <td className="p-4 text-gray-500">{res.date || '--'}</td>
                                    <td className="p-4 text-center text-gray-700 font-mono">{res.spaces} spots</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${res.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {res.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleDelete(res)}
                                            className="text-xs font-semibold text-rose-400 hover:text-rose-600 transition cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <ReserveSpacesModal
                isOpen={isResModalOpen}
                onClose={() => setIsResModalOpen(false)}
                zones={zones}
                newRes={newRes}
                setNewRes={setNewRes}
                onSubmit={handleResSubmit}
                submitting={submitting}
            />
        </div>
    );
}
