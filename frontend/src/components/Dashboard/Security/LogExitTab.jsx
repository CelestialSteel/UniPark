import React, { useState } from 'react';

export default function LogExitTab({ logs, onLogExit }) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter active logs (currently entered / parked inside campus)
    const activeLogs = logs.filter(log => log.status === 'Entered');

    const filteredActiveLogs = activeLogs.filter(log => 
        log.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.zone.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Log Vehicle Exit</h1>
                    <p className="text-gray-500 mt-1">Check-out vehicles departing from campus toll booths.</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Search active plate, zone, name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm bg-white"
                    />
                </div>
            </div>

            {/* Main Content Grid / Card List */}
            {filteredActiveLogs.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-xs">
                    <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <h3 className="text-lg font-bold text-gray-800">No Vehicles Parked</h3>
                    <p className="text-sm text-gray-500 mt-1">There are no active checked-in vehicles matching your filter criteria.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredActiveLogs.map((log) => (
                        <div 
                            key={log.id} 
                            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition duration-200"
                        >
                            <div>
                                {/* Card Header */}
                                <div className="flex justify-between items-center mb-4">
                                    <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg font-mono font-bold text-base text-slate-800">
                                        {log.plate}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 font-semibold uppercase tracking-wider">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        Parked
                                    </span>
                                </div>

                                {/* Details list */}
                                <div className="space-y-2 text-sm text-slate-600 mb-6">
                                    <div className="flex justify-between border-b border-gray-50 pb-1.5">
                                        <span className="text-gray-400 font-medium text-xs">Driver Name</span>
                                        <span className="font-semibold text-gray-800">{log.driver}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-50 pb-1.5">
                                        <span className="text-gray-400 font-medium text-xs">Assigned Zone</span>
                                        <span className="font-semibold text-gray-800">{log.zone}</span>
                                    </div>
                                    <div className="flex justify-between pb-0">
                                        <span className="text-gray-400 font-medium text-xs">Check-In Time</span>
                                        <span className="font-semibold text-gray-800 text-xs">{log.entry}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Log Checkout Button */}
                            <button
                                onClick={() => onLogExit(log.id)}
                                className="w-full bg-slate-900 hover:bg-red-600 text-white rounded-xl py-3 font-semibold transition cursor-pointer flex items-center justify-center gap-2 group shadow-sm"
                            >
                                <svg className="h-4.5 w-4.5 text-gray-400 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Log Outbound Exit
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
