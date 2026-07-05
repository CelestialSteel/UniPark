import React, { useEffect, useMemo, useState } from 'react';
import { uniparkApi } from '../../../utils/uniparkApi';

function formatEntryTime(iso) {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        return d.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

function durationSince(iso) {
    if (!iso) return '';
    const start = new Date(iso).getTime();
    const now = Date.now();
    const minutes = Math.max(Math.floor((now - start) / 60000), 0);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return `${hours}h ${rem}m`;
}

export default function LogExitTab() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [toast, setToast] = useState(null);
    const [tick, setTick] = useState(0); // forces re-render for the live duration counter

    // ---- Fetch active logs on mount ----
    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await uniparkApi.getActiveLogs(200);
            setLogs(data || []);
        } catch (err) {
            setError(err.message || 'Failed to load active logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    // Live "since X min" tick
    useEffect(() => {
        const handle = window.setInterval(() => setTick((t) => t + 1), 60000);
        return () => window.clearInterval(handle);
    }, []);

    const filteredLogs = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return logs;
        return logs.filter((log) => {
            const plate = (log.vehicle_registration || log.guest_registration || '').toLowerCase();
            const driver = (log.driver_name || log.guest_name || '').toLowerCase();
            const zone = (log.parking_zone_name || '').toLowerCase();
            return plate.includes(q) || driver.includes(q) || zone.includes(q);
        });
        // tick is included to force a re-render every minute
    }, [logs, searchQuery, tick]);

    const handleExit = async (log) => {
        const plate = log.vehicle_registration || log.guest_registration || log.id;
        if (!window.confirm(`Log outbound exit for ${plate}?`)) {
            return;
        }
        setBusyId(log.id);
        try {
            const payload = log.vehicle_registration
                ? { registration_number: log.vehicle_registration }
                : { guest_registration: log.guest_registration };
            const result = await uniparkApi.logVehicleExit(payload);
            setToast({
                kind: 'success',
                text: `Logged exit for ${result.vehicle_registration || result.guest_registration}.`,
            });
            await refresh();
            window.setTimeout(() => setToast(null), 3500);
        } catch (err) {
            setToast({ kind: 'error', text: err.message || 'Failed to log exit.' });
            window.setTimeout(() => setToast(null), 4500);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Log Vehicle Exit</h1>
                    <p className="text-gray-500 mt-1">Check-out vehicles departing from campus toll booths.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={refresh}
                        disabled={loading}
                        className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? 'Refreshing…' : 'Refresh'}
                    </button>
                    <div className="relative flex-1 sm:w-64">
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
            </div>

            {toast && (
                <div
                    className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold border ${toast.kind === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}
                >
                    {toast.text}
                </div>
            )}

            {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold">
                    {error}
                </div>
            )}

            {/* Main Content Grid / Card List */}
            {loading && logs.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-xs text-gray-500 text-sm">
                    Loading active vehicles…
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-xs">
                    <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <h3 className="text-lg font-bold text-gray-800">No Vehicles Parked</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {logs.length === 0
                            ? 'No vehicles are currently checked into campus.'
                            : 'No active checked-in vehicles match your filter criteria.'}
                    </p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLogs.map((log) => {
                        const plate = log.vehicle_registration || log.guest_registration || '—';
                        const driver = log.driver_name || log.guest_name || 'Visitor';
                        const isVisitor = !log.vehicle_registration;
                        return (
                            <div
                                key={log.id}
                                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition duration-200"
                            >
                                <div>
                                    {/* Card Header */}
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg font-mono font-bold text-base text-slate-800">
                                            {plate}
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
                                            <span className="font-semibold text-gray-800">{driver}</span>
                                        </div>
                                        {isVisitor && (
                                            <div className="flex justify-between border-b border-gray-50 pb-1.5">
                                                <span className="text-gray-400 font-medium text-xs">Group</span>
                                                <span className="font-semibold text-gray-800">
                                                    {log.guest_group || 'Guest Visitor'}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-b border-gray-50 pb-1.5">
                                            <span className="text-gray-400 font-medium text-xs">Assigned Zone</span>
                                            <span className="font-semibold text-gray-800">
                                                {log.parking_zone_name || '—'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between pb-0">
                                            <span className="text-gray-400 font-medium text-xs">Check-In Time</span>
                                            <span className="font-semibold text-gray-800 text-xs">
                                                {formatEntryTime(log.entry_time)}
                                                <span className="block text-[10px] text-gray-400 font-normal">
                                                    {durationSince(log.entry_time)} ago
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Log Checkout Button */}
                                <button
                                    onClick={() => handleExit(log)}
                                    disabled={busyId === log.id}
                                    className="w-full bg-slate-900 hover:bg-red-600 disabled:bg-slate-400 text-white rounded-xl py-3 font-semibold transition cursor-pointer flex items-center justify-center gap-2 group shadow-sm"
                                >
                                    <svg className="h-4 w-4 text-gray-400 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    {busyId === log.id ? 'Logging…' : 'Log Outbound Exit'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
