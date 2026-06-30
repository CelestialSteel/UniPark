import React from 'react';

export default function GuardHomeTab({ zones, metrics, logs, setActiveTab }) {
    // Get last 5 logs for the recent activity stream
    const recentLogs = logs.slice(0, 5);

    return (
        <div>
            {/* Page Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Security Gate Overview</h1>
                    <p className="text-gray-500 mt-1">Real-time gate statistics and campus zone headcounts.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setActiveTab('entry')}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 px-4.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition cursor-pointer"
                    >
                        <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        Log Entry
                    </button>
                    <button
                        onClick={() => setActiveTab('exit')}
                        className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-gray-50 px-4.5 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 shadow-xs transition cursor-pointer"
                    >
                        Log Exit
                    </button>
                </div>
            </div>

            {/* KPI Metrics Widgets */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between">
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Parked on Campus</span>
                        <span className="text-3xl font-extrabold text-blue-700 mt-2 block">{metrics.parkedNow}</span>
                    </div>
                    <span className="text-[11px] text-gray-500 mt-3 block">Active vehicles currently inside</span>
                </div>
                
                <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between">
                    <div>
                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider block">Available Slots</span>
                        <span className="text-3xl font-extrabold text-emerald-600 mt-2 block">{metrics.available}</span>
                    </div>
                    <span className="text-[11px] text-gray-500 mt-3 block">Total vacant spaces remaining</span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between">
                    <div>
                        <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block">Logged Entries Today</span>
                        <span className="text-3xl font-extrabold text-amber-600 mt-2 block">{metrics.entriesToday}</span>
                    </div>
                    <span className="text-[11px] text-gray-500 mt-3 block">Total inbound check-ins today</span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Logged Exits Today</span>
                        <span className="text-3xl font-extrabold text-slate-700 mt-2 block">{metrics.exitsToday}</span>
                    </div>
                    <span className="text-[11px] text-gray-500 mt-3 block">Total outbound check-outs today</span>
                </div>
            </div>

            {/* Two-Column Grid: Zones & Recent Logs */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Zones Column (2/3 width) */}
                <div className="lg:col-span-2 space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800">Zone Occupancy Status</h2>
                        <button 
                            onClick={() => setActiveTab('occupancy')}
                            className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                        >
                            Update Manually
                            <span>&rarr;</span>
                        </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                        {zones.map((zone) => {
                            const totalOccupied = zone.occupied + zone.reserved + zone.cordoned;
                            const occupancyPercent = Math.min(100, Math.round((totalOccupied / zone.total) * 100));

                            // Define status color based on fullness
                            let barColor = 'bg-emerald-500';
                            let textColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
                            if (occupancyPercent >= 90) {
                                barColor = 'bg-red-500';
                                textColor = 'text-red-700 bg-red-50 border-red-100';
                            } else if (occupancyPercent >= 70) {
                                barColor = 'bg-amber-500';
                                textColor = 'text-amber-700 bg-amber-50 border-amber-100';
                            }

                            return (
                                <div key={zone.id} className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col justify-between hover:shadow-md transition duration-200">
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-bold text-gray-800 leading-tight">{zone.name}</h3>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">CODE: {zone.code}</span>
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${textColor}`}>
                                                {occupancyPercent}% FULL
                                            </span>
                                        </div>

                                        {/* Status Row */}
                                        <div className="grid grid-cols-3 gap-2 my-4 text-center">
                                            <div className="bg-slate-50 p-2 rounded-xl">
                                                <span className="text-[10px] text-slate-400 block font-medium">Occupied</span>
                                                <span className="text-sm font-bold text-slate-800">{zone.occupied}</span>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded-xl">
                                                <span className="text-[10px] text-slate-400 block font-medium">Reserved</span>
                                                <span className="text-sm font-bold text-slate-800">{zone.reserved}</span>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded-xl">
                                                <span className="text-[10px] text-slate-400 block font-medium">Cordoned</span>
                                                <span className="text-sm font-bold text-slate-800">{zone.cordoned}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-2">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>{totalOccupied} / {zone.total} Spots</span>
                                            <span>{zone.total - totalOccupied} vacant</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                                                style={{ width: `${occupancyPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Activity Column (1/3 width) */}
                <div className="space-y-5">
                    <h2 className="text-xl font-bold text-gray-800">Recent Gate Activity</h2>

                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs divide-y divide-gray-100">
                        {recentLogs.length === 0 ? (
                            <p className="text-sm text-gray-400 py-4 text-center">No recent traffic logs.</p>
                        ) : (
                            recentLogs.map((log) => {
                                const isEntry = log.status === 'Entered';
                                return (
                                    <div key={log.id} className="py-3.5 first:pt-0 last:pb-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-slate-800 text-sm tracking-tight">{log.plate}</span>
                                                    <span className="text-[11px] text-gray-500 font-medium">({log.driver})</span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    Zone: <span className="font-medium text-slate-700">{log.zone}</span>
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                    isEntry 
                                                        ? 'bg-blue-50 text-blue-700 border-blue-100' 
                                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                                }`}>
                                                    {isEntry ? 'ENTRY' : 'EXIT'}
                                                </span>
                                                <p className="text-[10px] text-gray-400 mt-1 font-medium">
                                                    {isEntry ? log.entry.split(' ')[1] + ' ' + log.entry.split(' ')[2] : log.exit.split(' ')[1] + ' ' + log.exit.split(' ')[2]}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Quick Helper Tips */}
                    <div className="rounded-2xl bg-blue-50/50 border border-blue-100 p-5">
                        <h4 className="text-sm font-bold text-blue-800 flex items-center gap-1.5 mb-1.5">
                            <svg className="h-4 w-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Security Instructions
                        </h4>
                        <ul className="text-xs text-blue-700 space-y-1.5 list-disc list-inside">
                            <li>All visitors must have their license plates registered before logging entries.</li>
                            <li>Verify driver identities against student or faculty IDs upon check-in.</li>
                            <li>Perform regular physical headcounts to keep manual occupancy synced.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
