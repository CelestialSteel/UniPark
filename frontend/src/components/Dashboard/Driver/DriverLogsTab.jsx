import React, { useState, useMemo, useEffect } from 'react';
import { uniparkApi } from '../../../utils/uniparkApi';

function formatClock(dateValue) {
    if (!dateValue) {
        return 'N/A';
    }

    return new Date(dateValue).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(dateValue) {
    if (!dateValue) {
        return 'Today';
    }

    return new Date(dateValue).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatDuration(minutes) {
    if (minutes === null || minutes === undefined || Number.isNaN(Number(minutes))) {
        return '0m';
    }

    const totalMinutes = Math.max(0, Number(minutes));
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    if (hours === 0) {
        return `${remainingMinutes}m`;
    }

    return `${hours}h ${remainingMinutes}m`;
}

function toDisplayLog(log) {
    const entryDate = log.entry_time ? new Date(log.entry_time) : null;
    const exitDate = log.exit_time ? new Date(log.exit_time) : null;
    const isActive = !exitDate && log.status === 'entered';
    const durationMinutes = isActive && entryDate
        ? Math.max(0, Math.round((Date.now() - entryDate.getTime()) / 60000))
        : log.duration_minutes;

    return {
        id: String(log.id),
        status: isActive ? 'Active Now' : log.status === 'denied' ? 'Violation' : 'Completed',
        zone: log.parking_zone_name || log.parking_zone_code || 'Campus Zone',
        location: log.parking_zone_code || log.parking_zone_name || 'Campus Zone',
        timeDetails: {
            main: isActive
                ? `In: ${formatClock(entryDate)}`
                : exitDate
                    ? `${formatClock(entryDate)} - ${formatClock(exitDate)}`
                    : formatDateLabel(entryDate),
            sub: isActive
                ? `${formatDuration(durationMinutes)} elapsed`
                : `${formatDuration(durationMinutes)} total`,
            isElapsed: isActive,
            entry: formatClock(entryDate),
            exit: exitDate ? formatClock(exitDate) : null,
            date: formatDateLabel(entryDate),
        },
        vehicle: log.vehicle_registration || 'Linked Vehicle',
        plate: log.vehicle_registration || 'N/A',
        entryTimestamp: entryDate ? entryDate.getTime() : null,
    };
}

export default function DriverLogsTab() {
    const [logs, setLogs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Active Now', 'Completed', 'Violation'
    const [timeFilter, setTimeFilter] = useState('Last 30 Days'); // 'Last 30 Days', 'Last 7 Days', 'Today'
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showTimeDropdown, setShowTimeDropdown] = useState(false);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);
    const [logsError, setLogsError] = useState('');

    // Modal State
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const loadLogs = async () => {
            try {
                setIsLoadingLogs(true);
                setLogsError('');

                const response = await uniparkApi.getDriverLogs({ limit: 50 });
                if (isMounted) {
                    setLogs(response.map(toDisplayLog));
                }
            } catch (error) {
                if (isMounted) {
                    setLogs([]);
                    setLogsError(error.message || 'Unable to load your parking logs right now.');
                }
            } finally {
                if (isMounted) {
                    setIsLoadingLogs(false);
                }
            }
        };

        loadLogs();

        return () => {
            isMounted = false;
        };
    }, []);

    // Filter and search logic
    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const matchesSearch =
                log.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.plate.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'All' || log.status === statusFilter;

            let matchesTime = true;
            if (log.entryTimestamp) {
                const now = Date.now();
                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);

                if (timeFilter === 'Today') {
                    matchesTime = log.entryTimestamp >= startOfToday.getTime();
                } else if (timeFilter === 'Last 7 Days') {
                    matchesTime = log.entryTimestamp >= now - 7 * 24 * 60 * 60 * 1000;
                } else if (timeFilter === 'Last 30 Days') {
                    matchesTime = log.entryTimestamp >= now - 30 * 24 * 60 * 60 * 1000;
                }
            }

            return matchesSearch && matchesStatus && matchesTime;
        });
    }, [logs, searchQuery, statusFilter, timeFilter]);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Parking Logs</h1>
                <p className="mt-1 text-xs text-slate-500">Track and review your parking history at Strathmore Campus.</p>
            </div>

            {isLoadingLogs && (
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-xs">
                    Loading your parking logs...
                </div>
            )}

            {logsError && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800 shadow-xs">
                    {logsError}
                </div>
            )}

            {/* Search and Filters panel */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[280px]">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                        <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Search by vehicle, zone, or plate..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-xs"
                    />
                </div>

                {/* Filter by Status Button */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowFilterDropdown(!showFilterDropdown);
                            setShowTimeDropdown(false);
                        }}
                        className={`flex items-center gap-2 px-3.5 py-2 border rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs ${
                            statusFilter !== 'All' 
                                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        <svg className="h-4.5 w-4.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v3.2a1 1 0 01-.293.707L12 11.414V17a1 1 0 01-.447.894l-2 1.333a1 1 0 01-1.553-.894V11.414L3.293 7.907A1 1 0 013 7.2V4z" />
                        </svg>
                        <span>Status: {statusFilter}</span>
                    </button>
                    {showFilterDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-1">
                            {['All', 'Active Now', 'Completed', 'Violation'].map((st) => (
                                <button
                                    key={st}
                                    onClick={() => {
                                        setStatusFilter(st);
                                        setShowFilterDropdown(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 cursor-pointer ${
                                        statusFilter === st ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Date Filter Button */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowTimeDropdown(!showTimeDropdown);
                            setShowFilterDropdown(false);
                        }}
                        className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs"
                    >
                        <svg className="h-4.5 w-4.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{timeFilter}</span>
                    </button>
                    {showTimeDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-1">
                            {['Today', 'Last 7 Days', 'Last 30 Days'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => {
                                        setTimeFilter(t);
                                        setShowTimeDropdown(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 cursor-pointer ${
                                        timeFilter === t ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Export Button */}
                <button 
                    onClick={() => alert('Logs downloaded successfully as PDF!')}
                    className="flex items-center justify-center p-2 bg-blue-700 border border-blue-700 rounded-xl text-white hover:bg-blue-800 transition cursor-pointer shadow-xs"
                    aria-label="Export Logs"
                >
                    <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </button>
            </div>

            {/* Logs Table Card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Zone & Location</th>
                                <th className="px-6 py-4">Time Details</th>
                                <th className="px-6 py-4">Vehicle</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/40 transition">
                                        {/* Status */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.status === 'Active Now' && (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-700 border border-green-200/60">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                                    Active Now
                                                </span>
                                            )}
                                            {item.status === 'Completed' && (
                                                <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-bold text-slate-600 border border-slate-200/50">
                                                    Completed
                                                </span>
                                            )}
                                            {item.status === 'Violation' && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-200/60">
                                                    Overstayed
                                                </span>
                                            )}
                                        </td>

                                        {/* Zone & Location */}
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{item.zone}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{item.location}</p>
                                            </div>
                                        </td>

                                        {/* Time Details */}
                                        <td className="px-6 py-4">
                                            <div>
                                                {item.status === 'Violation' ? (
                                                    <p className="text-sm font-semibold text-red-600">{item.timeDetails.main}</p>
                                                ) : (
                                                    <p className="text-sm text-slate-800">{item.timeDetails.main}</p>
                                                )}
                                                <p className={`text-xs mt-0.5 ${
                                                    item.timeDetails.isElapsed 
                                                        ? 'text-blue-600 italic font-semibold' 
                                                        : 'text-slate-500'
                                                }`}>
                                                    {item.timeDetails.sub}
                                                </p>
                                            </div>
                                        </td>

                                        {/* Vehicle */}
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{item.vehicle}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 font-mono">{item.plate}</p>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <button 
                                                onClick={() => setSelectedLog(item)}
                                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-sm">
                                        No logs found matching filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-wrap items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 gap-4 text-xs font-semibold text-slate-500">
                    <span>Showing 1-{filteredLogs.length} of {filteredLogs.length} entries</span>
                    <div className="flex items-center gap-1">
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer text-slate-400">
                            ‹
                        </button>
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white shadow-xs font-bold">
                            1
                        </button>
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer text-slate-400">
                            ›
                        </button>
                    </div>
                </div>
            </div>

            {/* Parking Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setSelectedLog(null)} />
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden relative z-10 p-6 animate-in fade-in zoom-in duration-150">
                        <button 
                            onClick={() => setSelectedLog(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h3 className="text-lg font-bold text-slate-800 mb-4">Parking Session Details</h3>
                        <div className="space-y-3.5 text-xs text-slate-600">
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-gray-400 font-medium">Session Status</span>
                                <span className={`font-semibold ${selectedLog.status === 'Active Now' ? 'text-green-600' : 'text-slate-800'}`}>
                                    {selectedLog.status}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-gray-400 font-medium">Parking Zone</span>
                                <span className="font-semibold text-slate-855">{selectedLog.zone}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-gray-400 font-medium">Location Area</span>
                                <span className="font-semibold text-slate-855">{selectedLog.location}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-gray-400 font-medium">Vehicle Permitted</span>
                                <span className="font-semibold text-slate-855">{selectedLog.vehicle}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-gray-400 font-medium">License Plate</span>
                                <span className="font-mono font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{selectedLog.plate}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-gray-400 font-medium">Entry Timestamp</span>
                                <span className="font-semibold text-slate-800">{selectedLog.timeDetails.entry || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-gray-400 font-medium">Exit Timestamp</span>
                                <span className="font-semibold text-slate-800">{selectedLog.timeDetails.exit || 'N/A (Active Now)'}</span>
                            </div>
                           
                        </div>

                        <button 
                            onClick={() => setSelectedLog(null)}
                            className="mt-6 w-full bg-slate-900 text-white rounded-xl py-2.5 text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}