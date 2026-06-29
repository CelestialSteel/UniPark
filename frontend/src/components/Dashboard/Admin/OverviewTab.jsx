import React, { useState } from 'react';
import ReserveSpacesModal from './ReserveSpacesModal';
import PublishAnnouncementModal from './PublishAnnouncementModal';

export default function OverviewTab({ zones, metrics, handleCordonZoneToggle, onAddReservation, onCreateAnnouncement }) {
    const [isResModalOpen, setIsResModalOpen] = useState(false);
    const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
    const [newRes, setNewRes] = useState({ zone: zones[0]?.name || 'Phase 1 Lot', event: '', date: '', spaces: 5 });
    const [newAnn, setNewAnn] = useState({ title: '', message: '', severity: 'low' });

    const handleResSubmit = (e) => {
        e.preventDefault();
        onAddReservation(newRes);
        setIsResModalOpen(false);
        setNewRes({ zone: zones[0]?.name || 'Phase 1 Lot', event: '', date: '', spaces: 5 });
    };

    const handleAnnSubmit = (e) => {
        e.preventDefault();
        onCreateAnnouncement(newAnn);
        setIsAnnModalOpen(false);
        setNewAnn({ title: '', message: '', severity: 'low' });
    };

    return (
        <div>
            {/* Dashboard Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Overview & Live Status</h1>
                    <p className="text-gray-500 mt-1">Real-time status of Strathmore parking slots.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsResModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 cursor-pointer"
                    >
                        + Reserve Spaces
                    </button>
                    <button
                        onClick={() => setIsAnnModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 border border-gray-300 cursor-pointer"
                    >
                        📢 Publish Announcement
                    </button>
                </div>
            </div>

            {/* KPI Metrics Widgets */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="p-5 rounded-2xl bg-white border border-gray-200">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Lots</span>
                    <span className="text-3xl font-bold text-gray-900 mt-2 block">{metrics.total}</span>
                    <span className="text-[11px] text-gray-500 mt-1 block">Spaces in 6 campus zones</span>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-gray-200">
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">Occupied Spots</span>
                    <span className="text-3xl font-bold text-amber-400 mt-2 block">{metrics.occupied}</span>
                    <span className="text-[11px] text-gray-500 mt-1 block">{metrics.occupancyRate}% general occupancy rate</span>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-gray-200">
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">Reserved</span>
                    <span className="text-3xl font-bold text-indigo-400 mt-2 block">{metrics.reserved}</span>
                    <span className="text-[11px] text-gray-500 mt-1 block">Special event reserved spots</span>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-gray-200">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">Available Slots</span>
                    <span className="text-3xl font-bold text-emerald-400 mt-2 block">{metrics.available}</span>
                    <span className="text-[11px] text-gray-500 mt-1 block">Vacant vehicle parking bays</span>
                </div>
            </div>

            {/* Zones Grid */}
            <h2 className="text-xl font-bold text-gray-800 mb-5">Zones Occupancy Status</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {zones.map((zone) => {
                    const totalTaken = zone.occupied + zone.reserved + zone.cordoned;
                    const occupancyPercent = Math.min(100, Math.round((totalTaken / zone.total) * 100));

                    // Status color matching logic
                    let ringColor = 'stroke-emerald-500';
                    if (occupancyPercent >= 90) {
                        ringColor = 'stroke-rose-500 animate-pulse';
                    } else if (occupancyPercent >= 70) {
                        ringColor = 'stroke-amber-500';
                    }

                    return (
                        <div key={zone.id} className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col justify-between hover:border-gray-300 transition duration-300">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg leading-tight">{zone.name}</h3>
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">CODE: {zone.code}</span>
                                    </div>

                                    {/* Radial Progress Ring */}
                                    <div className="relative h-14 w-14 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="28" cy="28" r="22" className="stroke-gray-200" strokeWidth="4" fill="none" />
                                            <circle
                                                cx="28"
                                                cy="28"
                                                r="22"
                                                className={ringColor}
                                                strokeWidth="4"
                                                fill="none"
                                                strokeDasharray="138"
                                                strokeDashoffset={138 - (138 * occupancyPercent) / 100}
                                            />
                                        </svg>
                                        <span className="absolute text-[11px] font-bold text-gray-800">{occupancyPercent}%</span>
                                    </div>
                                </div>

                                {/* Stats Breakdown */}
                                <div className="space-y-2 mt-4">
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Occupied (Active Logs):</span>
                                        <span className="font-semibold text-gray-800">{zone.occupied}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Reserved (Special events):</span>
                                        <span className="font-semibold text-indigo-400">{zone.reserved}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Cordoned (Closed off):</span>
                                        <span className="font-semibold text-rose-400">{zone.cordoned}</span>
                                    </div>
                                    <div className="flex justify-between text-xs border-t border-gray-200 pt-2 text-gray-700">
                                        <span className="font-medium">Total Spaces:</span>
                                        <span className="font-bold">{zone.total}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Zone Actions */}
                            <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2">
                                <button
                                    onClick={() => handleCordonZoneToggle(zone.id, zone.name === 'Sports Complex Lot' ? 40 : 10)}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition cursor-pointer ${zone.cordoned > 0
                                        ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-900/20'
                                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                        }`}
                                >
                                    {zone.cordoned > 0 ? '🔓 Release Spaces' : '🔒 Cordon Spot (10)'}
                                </button>
                                <button
                                    onClick={() => {
                                        setNewRes({ zone: zone.name, event: '', date: '', spaces: 5 });
                                        setIsResModalOpen(true);
                                    }}
                                    className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition cursor-pointer"
                                >
                                    Book Lot
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <ReserveSpacesModal
                isOpen={isResModalOpen}
                onClose={() => setIsResModalOpen(false)}
                zones={zones}
                newRes={newRes}
                setNewRes={setNewRes}
                onSubmit={handleResSubmit}
            />

            <PublishAnnouncementModal
                isOpen={isAnnModalOpen}
                onClose={() => setIsAnnModalOpen(false)}
                newAnn={newAnn}
                setNewAnn={setNewAnn}
                onSubmit={handleAnnSubmit}
            />
        </div>
    );
}
