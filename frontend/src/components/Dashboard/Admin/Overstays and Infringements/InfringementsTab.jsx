import React, { useState } from 'react';
import InfringementResolveModal from './InfringementResolveModal';
import { useEffect } from 'react';
import { uniparkApi } from '../../../../utils/uniparkApi';
import { printInfringementsPDF } from '../../../../utils/reportPrinter';

// ── Mock data — remove once FastAPI is connected ───────────────────────────────
const MOCK_INFRINGEMENTS = [
    {
        id: 'inf-1',
        vehicle_registration: 'KAA 999Z',
        driver_name: 'David Ochieng',
        infringement_type: 'Unauthorized Parking',
        description: 'Vehicle parked in a reserved faculty slot without a permit.',
        severity: 'high',
        fine_amount: 1500,
        parking_zone: 'Management Lot',
        reported_by: 'Guard Otieno',
        reported_at: '2026-06-30 08:22',
        status: 'reported',
    },
    {
        id: 'inf-2',
        vehicle_registration: 'KCC 888H',
        driver_name: 'Mercy Njoroge',
        infringement_type: 'Overstay',
        description: 'Vehicle exceeded maximum parking duration by 6 hours.',
        severity: 'medium',
        fine_amount: 500,
        parking_zone: 'Siwaka Lot',
        reported_by: 'Guard Mwangi',
        reported_at: '2026-06-29 14:05',
        status: 'under_review',
    },
    {
        id: 'inf-3',
        vehicle_registration: 'KBB 123A',
        driver_name: 'Griffin Sitati',
        infringement_type: 'Wrong Zone',
        description: 'Student vehicle parked in staff-only zone.',
        severity: 'low',
        fine_amount: 300,
        parking_zone: 'Library Lot',
        reported_by: 'Guard Kamau',
        reported_at: '2026-06-28 11:30',
        status: 'resolved',
    },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
    reported:     'bg-red-50 text-red-700',
    under_review: 'bg-amber-50 text-amber-700',
    resolved:     'bg-green-50 text-green-700',
    dismissed:    'bg-gray-100 text-gray-500',
};

const SEVERITY_STYLES = {
    low:    'bg-blue-50 text-blue-700',
    medium: 'bg-amber-50 text-amber-700',
    high:   'bg-red-50 text-red-700',
};

const STATUS_FILTERS = ['all', 'reported', 'under_review', 'resolved', 'dismissed'];

const labelFor = (s) => s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

// ── Component ──────────────────────────────────────────────────────────────────
export default function InfringementsTab({ triggerToast }) {
    const [infringements, setInfringements] = useState(MOCK_INFRINGEMENTS);
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadInfringements = async () => {
            try {
                const items = await uniparkApi.getInfringements();
                if (!isMounted) return;

                setInfringements(items.map((inf) => ({
                    id: inf.id,
                    vehicle_registration: inf.vehicle_registration || 'Unknown',
                    driver_name: inf.driver_name || 'Unknown Driver',
                    infringement_type: inf.infringement_type,
                    description: inf.description,
                    severity: inf.severity,
                    fine_amount: inf.fine_amount,
                    parking_zone: inf.parking_zone_name || inf.parking_zone_code || 'Unknown Zone',
                    reported_by: 'Backend API',
                    reported_at: new Date(inf.reported_at).toLocaleString(),
                    status: inf.status,
                    resolution_notes: inf.resolution_notes,
                })));
            } catch (error) {
                console.warn('Using infringement seed data until backend is available:', error);
            }
        };

        loadInfringements();

        return () => {
            isMounted = false;
        };
    }, []);

    const openResolve = (inf) => { setSelected(inf); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setSelected(null); };

    // Swap with real API call when ready:
    // PATCH /api/infringements/{id}  →  { status, resolution_notes }
    const handleResolve = async (id, payload) => {
        try {
            const updated = await uniparkApi.updateInfringement(id, payload);
            setInfringements((prev) =>
                prev.map((inf) =>
                    inf.id === id
                        ? {
                            ...inf,
                            status: updated.status,
                            resolution_notes: updated.resolution_notes,
                            processed_at: updated.processed_at,
                        }
                        : inf
                )
            );
            triggerToast(`Infringement ${payload.status.replace('_', ' ')} successfully.`);
        } catch (error) {
            triggerToast(error.message || 'Failed to update infringement.');
            throw error;
        }
    };

    const filtered = infringements.filter((inf) => {
        const matchesStatus = statusFilter === 'all' || inf.status === statusFilter;
        const matchesSearch = [inf.vehicle_registration, inf.driver_name, inf.infringement_type, inf.parking_zone]
            .some((v) => v?.toLowerCase().includes(search.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    const handleDownloadPDF = () => {
        printInfringementsPDF(filtered);
        triggerToast('Infringements PDF generated successfully.');
    };

    const pendingCount = infringements.filter((i) => ['reported', 'under_review'].includes(i.status)).length;

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Infringements</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {pendingCount > 0
                            ? `${pendingCount} infringement${pendingCount > 1 ? 's' : ''} pending review`
                            : 'All infringements resolved'}
                    </p>
                </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={filtered.length === 0}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 disabled:text-blue-700 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download PDF Report
                        </button>
                        <input
                            type="text"
                            placeholder="Search plate, driver, type, zone…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 w-64"
                        />
                    </div>
            </div>

            {/* Status filter pills */}
            <div className="flex gap-2 flex-wrap">
                {STATUS_FILTERS.map((f) => {
                    const count = f === 'all'
                        ? infringements.length
                        : infringements.filter((i) => i.status === f).length;
                    return (
                        <button
                            key={f}
                            onClick={() => setStatusFilter(f)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                statusFilter === f
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                            }`}
                        >
                            {labelFor(f)}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                statusFilter === f ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {filtered.length === 0 ? (
                    <div className="p-12 text-center text-sm text-gray-400">
                        No infringements match the current filter.
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                {['Vehicle', 'Driver', 'Type', 'Zone', 'Severity', 'Fine (KES)', 'Reported', 'Status', ''].map((h) => (
                                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((inf) => (
                                <tr key={inf.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-4 font-bold text-gray-900 whitespace-nowrap">{inf.vehicle_registration}</td>
                                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{inf.driver_name}</td>
                                    <td className="px-5 py-4 text-gray-700">{inf.infringement_type}</td>
                                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{inf.parking_zone}</td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${SEVERITY_STYLES[inf.severity] || 'bg-gray-100 text-gray-500'}`}>
                                            {inf.severity}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-gray-800">{inf.fine_amount?.toLocaleString() ?? '—'}</td>
                                    <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">{inf.reported_at}</td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[inf.status] || 'bg-gray-100 text-gray-500'}`}>
                                            {labelFor(inf.status)}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        {['reported', 'under_review'].includes(inf.status) && (
                                            <button
                                                onClick={() => openResolve(inf)}
                                                className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer whitespace-nowrap"
                                            >
                                                Process
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <InfringementResolveModal
                isOpen={modalOpen}
                onClose={closeModal}
                infringement={selected}
                onResolve={handleResolve}
            />
        </div>
    );
}
