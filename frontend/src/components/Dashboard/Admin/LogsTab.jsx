import React, { useState, useMemo } from 'react';
import { printLogsPDF } from '../../../utils/reportPrinter';

export default function LogsTab({ logs }) {
    const [logSearch, setLogSearch] = useState('');
    const [logStatusFilter, setLogStatusFilter] = useState('All');

    // Filter logs based on local search and status state
    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const matchesSearch =
                log.plate.toLowerCase().includes(logSearch.toLowerCase()) ||
                log.driver.toLowerCase().includes(logSearch.toLowerCase()) ||
                log.zone.toLowerCase().includes(logSearch.toLowerCase());

            const matchesStatus =
                logStatusFilter === 'All' ||
                (logStatusFilter === 'Entered' && log.status === 'Entered') ||
                (logStatusFilter === 'Exited' && log.status === 'Exited');

            return matchesSearch && matchesStatus;
        });
    }, [logs, logSearch, logStatusFilter]);

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Vehicle Entry & Exit Audit</h1>
                    <p className="text-gray-500 mt-1">Audit log database containing arrival records, durations, and gate logs.</p>
                </div>
                <button
                    onClick={() => printLogsPDF(filteredLogs)}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 cursor-pointer transition"
                >
                    <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF Report
                </button>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        placeholder="Search by Plate (e.g. KDC), Driver name, or Parking zone..."
                        className="w-full bg-gray-100 border border-gray-200 text-gray-900 pl-4 pr-10 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                    <span className="absolute right-3.5 top-3.5 text-gray-400">
                        🔍
                    </span>
                </div>
                <select
                    value={logStatusFilter}
                    onChange={(e) => setLogStatusFilter(e.target.value)}
                    className="bg-gray-100 border border-gray-200 text-gray-900 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                    <option value="All">All Movements</option>
                    <option value="Entered">Currently Parked</option>
                    <option value="Exited">Exited Campus</option>
                </select>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
                            <th className="p-4">Reg Plate</th>
                            <th className="p-4">Driver Name</th>
                            <th className="p-4">Parked Location</th>
                            <th className="p-4">Gate Entry Time</th>
                            <th className="p-4">Gate Exit Time</th>
                            <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {filteredLogs.length > 0 ? (
                            filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-mono font-bold text-blue-400">{log.plate}</td>
                                    <td className="p-4 text-gray-800">{log.driver}</td>
                                    <td className="p-4 text-gray-700">{log.zone}</td>
                                    <td className="p-4 text-gray-500 font-mono">{log.entry}</td>
                                    <td className="p-4 text-gray-500 font-mono">{log.exit}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${log.status === 'Entered' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {log.status === 'Entered' ? 'On Campus' : 'Departed'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-400 font-medium">
                                    No logs found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
