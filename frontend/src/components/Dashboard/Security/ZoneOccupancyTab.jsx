import React, { useState } from 'react';

export default function ZoneOccupancyTab({ zones, onUpdateOccupancy }) {
    // Keep local states for inputs of each zone
    const [overrideCounts, setOverrideCounts] = useState(
        zones.reduce((acc, zone) => {
            acc[zone.id] = zone.occupied;
            return acc;
        }, {})
    );

    const handleInputChange = (zoneId, val) => {
        const parsed = parseInt(val);
        setOverrideCounts(prev => ({
            ...prev,
            [zoneId]: isNaN(parsed) ? '' : parsed
        }));
    };

    const handleSave = (zoneId, maxCapacity) => {
        const count = overrideCounts[zoneId];
        if (count === '') {
            alert('Please input a valid occupancy number.');
            return;
        }

        if (count < 0) {
            alert('Occupancy cannot be less than zero.');
            return;
        }

        if (count > maxCapacity) {
            const confirmBig = window.confirm(
                `Warning: The physical count (${count}) exceeds the zone's max capacity (${maxCapacity}). Do you want to save anyway?`
            );
            if (!confirmBig) return;
        }

        onUpdateOccupancy(zoneId, count);
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Zone Occupancy Override</h1>
                <p className="text-gray-500 mt-1">
                    Manually adjust zone occupancy levels based on physical parking patrols and headcounts.
                </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-amber-800">Manual Synchronization Mode</h3>
                    <p className="text-xs text-amber-700 mt-1 leading-normal">
                        Use this panel when digital gate scans do not match actual ground counts (e.g. if a driver tailgated, 
                        or if barrier gates were temporarily set to manual override). Overwriting occupancy will set the count instantly.
                    </p>
                </div>
            </div>

            {/* Zones Overrides List */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Parking Lot Zone</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Code</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Capacity</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">System Occupancy</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Manual Ground Count</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Discrepancy</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {zones.map((zone) => {
                                const currentInput = overrideCounts[zone.id];
                                const discrepancy = currentInput !== '' ? currentInput - zone.occupied : 0;
                                const hasDiscrepancy = discrepancy !== 0;

                                return (
                                    <tr key={zone.id} className="hover:bg-slate-50/50 transition">
                                        <td className="px-6 py-4 font-bold text-slate-800 text-sm">
                                            {zone.name}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono font-bold text-gray-400 uppercase">
                                            {zone.code}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                                            {zone.total}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-700">
                                                {zone.occupied}
                                            </span>
                                            <span className="text-xs text-gray-400 block">spots loaded</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <input
                                                type="number"
                                                min="0"
                                                max={zone.total * 1.5}
                                                value={currentInput}
                                                onChange={(e) => handleInputChange(zone.id, e.target.value)}
                                                className="w-24 px-3 py-1.5 border border-gray-200 focus:border-blue-700 rounded-lg text-sm text-center font-bold focus:outline-none transition"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            {hasDiscrepancy ? (
                                                <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md ${
                                                    discrepancy > 0 
                                                        ? 'bg-red-50 text-red-700 border border-red-100' 
                                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                }`}>
                                                    {discrepancy > 0 ? `+${discrepancy}` : discrepancy}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 font-medium">In Sync</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button
                                                onClick={() => handleSave(zone.id, zone.total)}
                                                className={`px-4.5 py-2 text-xs font-bold rounded-lg cursor-pointer transition shadow-xs ${
                                                    hasDiscrepancy
                                                        ? 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-500/10'
                                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200'
                                                }`}
                                            >
                                                Apply Count
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
