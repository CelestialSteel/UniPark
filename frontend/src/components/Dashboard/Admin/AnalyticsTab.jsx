import React from 'react';
import { printAnalyticsPDF } from '../../../utils/reportPrinter';

export default function AnalyticsTab({ zones, logs, reservations, overstayLogs, triggerToast }) {

    const triggerCSVDownload = (filename, rows, headers) => {
        const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const csv = [headers.map(escape).join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
        triggerToast(`${filename} downloaded successfully.`);
    };

    const handleDownloadLogs = () => triggerCSVDownload('unipark_audit_logs.csv', logs, ['id', 'plate', 'driver', 'zone', 'entry', 'exit', 'status']);
    const handleDownloadReservations = () => triggerCSVDownload('unipark_reservations.csv', reservations, ['id', 'zone', 'event', 'date', 'spaces', 'status']);
    const handleDownloadOverstays = () => triggerCSVDownload('unipark_overstay_alerts.csv', overstayLogs, ['id', 'plate', 'driver', 'zone', 'entry', 'exit', 'status']);
    const handleDownloadZones = () => triggerCSVDownload('unipark_zone_summary.csv', zones, ['id', 'name', 'code', 'total', 'occupied', 'reserved', 'cordoned', 'status']);

    const kpis = [
        { label: 'Total Zones', value: zones.length, color: 'from-blue-600 to-indigo-600', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
        { label: 'Audit Log Entries', value: logs.length, color: 'from-emerald-600 to-teal-600', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
        { label: 'Event Reservations', value: reservations.length, color: 'from-violet-600 to-purple-600', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { label: 'Overstay Alerts', value: overstayLogs.length, color: 'from-amber-500 to-orange-600', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    ];

    const metrics = React.useMemo(() => {
        const total = zones.reduce((sum, z) => sum + z.total, 0);
        const occupied = zones.reduce((sum, z) => sum + z.occupied, 0);
        const reserved = zones.reduce((sum, z) => sum + z.reserved, 0);
        const cordoned = zones.reduce((sum, z) => sum + z.cordoned, 0);
        const available = total - occupied - reserved - cordoned;
        const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
        return { total, occupied, reserved, cordoned, available, occupancyRate };
    }, [zones]);

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Analytics & Reports</h1>
                    <p className="text-gray-500 mt-1">Download exportable CSV reports for all campus parking data.</p>
                </div>
                <button
                    onClick={() => printAnalyticsPDF(metrics, zones)}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 cursor-pointer transition"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export PDF Report
                </button>
            </div>

            {/* Summary KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-2">
                        <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-lg mb-1`}>
                            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={kpi.icon} />
                            </svg>
                        </div>
                        <span className="text-3xl font-extrabold text-gray-900">{kpi.value}</span>
                        <span className="text-xs text-gray-500 font-medium">{kpi.label}</span>
                    </div>
                ))}
            </div>

            {/* Download Cards */}
            <h2 className="text-base font-bold text-gray-700 mb-4 uppercase tracking-wider">Download Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Vehicle Audit Logs */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 hover:border-blue-700/50 transition">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Vehicle Audit Logs</h3>
                            <p className="text-xs text-gray-500 mt-0.5">All vehicle entry/exit events with plate, driver, zone & timestamps.</p>
                        </div>
                        <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-300">.csv</span>
                    </div>
                    <div className="text-xs text-gray-400">{logs.length} records &bull; Columns: ID, Plate, Driver, Zone, Entry, Exit, Status</div>
                    <button onClick={handleDownloadLogs} className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition cursor-pointer">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download Audit Logs
                    </button>
                </div>

                {/* Event Reservations */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 hover:border-violet-700/50 transition">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Event Reservations</h3>
                            <p className="text-xs text-gray-500 mt-0.5">All event parking blocks with zone, date, spaces reserved & approval status.</p>
                        </div>
                        <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-300">.csv</span>
                    </div>
                    <div className="text-xs text-gray-400">{reservations.length} records &bull; Columns: ID, Zone, Event, Date, Spaces, Status</div>
                    <button onClick={handleDownloadReservations} className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-lg shadow-violet-600/20 transition cursor-pointer">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download Reservations
                    </button>
                </div>

                {/* Overstay Alerts */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 hover:border-amber-700/50 transition">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Overstay Alerts</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Vehicles flagged for exceeding the 24-hour campus parking limit.</p>
                        </div>
                        <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-300">.csv</span>
                    </div>
                    <div className="text-xs text-gray-400">{overstayLogs.length} records &bull; Columns: ID, Plate, Driver, Zone, Entry, Exit, Status</div>
                    <button onClick={handleDownloadOverstays} className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-900 text-sm font-semibold shadow-lg shadow-amber-500/20 transition cursor-pointer">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download Overstay Report
                    </button>
                </div>

                {/* Zone Summary */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 hover:border-emerald-700/50 transition">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Zone Capacity Summary</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Full breakdown of all campus lots with occupancy, reserved & cordoned figures.</p>
                        </div>
                        <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-300">.csv</span>
                    </div>
                    <div className="text-xs text-gray-400">{zones.length} zones &bull; Columns: ID, Name, Code, Total, Occupied, Reserved, Cordoned, Status</div>
                    <button onClick={handleDownloadZones} className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/20 transition cursor-pointer">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download Zone Summary
                    </button>
                </div>
            </div>

            {/* Zone Occupancy Visual */}
            <h2 className="text-base font-bold text-gray-700 mt-10 mb-4 uppercase tracking-wider">Zone Occupancy Breakdown</h2>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
                {zones.map(z => {
                    const available = z.total - z.occupied - z.reserved - z.cordoned;
                    const pctOccupied = Math.round((z.occupied / z.total) * 100);
                    return (
                        <div key={z.id}>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-semibold text-gray-800">{z.name}</span>
                                <span className="text-xs text-gray-500">{z.occupied}/{z.total} occupied &bull; {available < 0 ? 0 : available} free</span>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${pctOccupied >= 90 ? 'bg-red-500' : pctOccupied >= 70 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                    style={{ width: `${pctOccupied}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
