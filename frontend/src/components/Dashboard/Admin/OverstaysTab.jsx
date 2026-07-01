import React, { useState } from 'react';
import InfringementsTab from './Overstays and Infringements/InfringementsTab';
import { printOverstayPDF as generateOverstayPDF } from '../../../utils/reportPrinter';

// ── OverstaysTab now owns both Overstay Alerts and Infringements ───────────────
export default function OverstaysTab({
    overstayLogs,
    overstayThreshold,
    setOverstayThreshold,
    setLogs,
    logs,
    setActiveTab,
    setLookupPlate,
    setSearchedDriver,
    REGISTERED_DRIVERS,
    triggerToast,
}) {
    const [subTab, setSubTab] = useState('overstays'); // 'overstays' | 'infringements'

    const handleDownloadOverstayPDF = () => {
        generateOverstayPDF(overstayLogs);
        triggerToast('Overstay PDF generated successfully');
    };

    const handleDismiss = (plateToRemove) => {
        setLogs(logs.map(log =>
            log.plate === plateToRemove ? { ...log, status: 'Exited', exit: new Date().toLocaleString() } : log
        ));
        triggerToast('Overstay alert dismissed — vehicle marked as exited.');
    };

    const handleLookup = (plate) => {
        const driver = REGISTERED_DRIVERS.find(d => d.plate === plate);
        setLookupPlate(plate);
        setSearchedDriver(driver || null);
        setActiveTab('lookup');
    };

    return (
        <div className="space-y-6">

            {/* Sub-tab switcher */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                {[
                    { id: 'overstays', label: 'Overstay Alerts', count: overstayLogs.length },
                    { id: 'infringements', label: 'Infringements' },
                ].map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setSubTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-lg transition cursor-pointer ${subTab === t.id
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {t.label}
                        {t.count > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${subTab === t.id ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'
                                }`}>
                                {t.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Overstay Alerts */}
            {subTab === 'overstays' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Overstay Alerts</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {overstayLogs.length > 0
                                    ? `${overstayLogs.length} vehicle${overstayLogs.length > 1 ? 's' : ''} exceeding the parking threshold`
                                    : 'No overstay alerts at this time'}
                            </p>
                        </div>

                            <button
                                onClick={handleDownloadOverstayPDF}
                                disabled={overstayLogs.length === 0}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 disabled:text-blue-700 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download PDF Report
                            </button>

                        {/* Threshold control */}
                        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
                            <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Alert threshold</label>
                            <select
                                value={overstayThreshold}
                                onChange={(e) => setOverstayThreshold(Number(e.target.value))}
                                className="bg-transparent text-sm font-semibold text-gray-800 focus:outline-none cursor-pointer"
                            >
                                <option value={60}>1 hour</option>
                                <option value={240}>4 hours</option>
                                <option value={480}>8 hours</option>
                                <option value={1440}>24 hours</option>
                                <option value={2880}>48 hours</option>
                                <option value={4000}>72+ hours</option>
                            </select>
                        </div>
                    </div>

                    {overstayLogs.length === 0 ? (
                        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-sm font-semibold text-gray-700">All clear</p>
                            <p className="text-xs text-gray-400 mt-1">No vehicles are exceeding the current threshold.</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50">
                                        {['Plate', 'Driver', 'Zone', 'Entry Time', 'Duration', ''].map((h) => (
                                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {overstayLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-4 font-bold text-gray-900">{log.plate}</td>
                                            <td className="px-5 py-4 text-gray-600">{log.driver}</td>
                                            <td className="px-5 py-4">
                                                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                                                    {log.zone}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-gray-500 text-xs">{log.entry}</td>
                                            <td className="px-5 py-4">
                                                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full">
                                                    {log.duration || 'Extended'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <button
                                                        onClick={() => handleLookup(log.plate)}
                                                        className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer"
                                                    >
                                                        Lookup
                                                    </button>
                                                    <button
                                                        onClick={() => handleDismiss(log.plate)}
                                                        className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer"
                                                    >
                                                        Dismiss
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Infringements */}
            {subTab === 'infringements' && (
                <InfringementsTab triggerToast={triggerToast} />
            )}
        </div>
    );
}
