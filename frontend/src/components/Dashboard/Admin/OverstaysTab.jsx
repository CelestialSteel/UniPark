import React, { useState } from 'react';

export default function OverstaysTab({ overstayLogs, overstayThreshold, setOverstayThreshold, setLogs, logs, setActiveTab, setLookupPlate, setSearchedDriver, REGISTERED_DRIVERS, triggerToast }) {
    return (
        <div>
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Overstay Alerts Manager</h1>
                    <p className="text-gray-500 mt-1">Detect vehicles exceeding their maximum permissible daily duration.</p>
                </div>

                {/* Config threshold panel */}
                <div className="bg-gray-100 border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400">Overstay Limit</label>
                        <select
                            value={overstayThreshold}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setOverstayThreshold(val);
                                triggerToast(`Overstay trigger set to ${val === 1440 ? '1 Day (24 hrs)' : val === 480 ? '8 Hours' : '3 Days'}`);
                            }}
                            className="bg-transparent text-gray-700 font-semibold text-sm border-none focus:outline-none pr-6 cursor-pointer mt-1"
                        >
                            <option value={480}>8 Hours</option>
                            <option value={1440}>1 Day (24 Hours)</option>
                            <option value={4320}>3 Days (72 Hours)</option>
                        </select>
                    </div>
                    <div className="h-10 w-0.5 bg-gray-100" />
                    <div className="text-center">
                        <span className="block text-[10px] uppercase font-bold text-gray-400">Alerts</span>
                        <span className="text-sm font-bold text-amber-500">{overstayLogs.length} Active</span>
                    </div>
                </div>
            </div>

            {/* Flagged logs */}
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden mb-6">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
                            <th className="p-4">Reg Plate</th>
                            <th className="p-4">Driver Name</th>
                            <th className="p-4">Location Cordoned</th>
                            <th className="p-4">Entry Timestamp</th>
                            <th className="p-4">Status / Alert</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {overstayLogs.length > 0 ? (
                            overstayLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-mono font-bold text-rose-400">{log.plate}</td>
                                    <td className="p-4 text-gray-800">{log.driver}</td>
                                    <td className="p-4 text-gray-700">{log.zone}</td>
                                    <td className="p-4 text-gray-500 font-mono">{log.entry}</td>
                                    <td className="p-4">
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-600 animate-pulse border border-rose-200">
                                            OVERSTAYED
                                        </span>
                                    </td>
                                    <td className="p-4 text-right flex gap-3 justify-end">
                                        <button
                                            onClick={() => {
                                                const cleanPlate = log.plate.toUpperCase();
                                                setLookupPlate(cleanPlate);
                                                const driver = REGISTERED_DRIVERS.find(d => d.plate === cleanPlate);
                                                setSearchedDriver(driver || null);
                                                setActiveTab('lookup');
                                            }}
                                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition cursor-pointer"
                                        >
                                            Retrieve Details
                                        </button>
                                        <button
                                            onClick={() => {
                                                setLogs(logs.map(l => {
                                                    if (l.id === log.id) {
                                                        return { ...l, exit: new Date().toLocaleString() };
                                                    }
                                                    return l;
                                                }));
                                                triggerToast('Cleared vehicle flag from alerts.');
                                            }}
                                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition cursor-pointer"
                                        >
                                            Force Clear
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-400 font-medium">
                                    No vehicles are currently exceeding the {overstayThreshold / 60} hrs overstay threshold.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
