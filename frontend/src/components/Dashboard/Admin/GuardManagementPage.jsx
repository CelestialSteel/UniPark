import React, { useState, useEffect } from 'react';
import GuardFormModal from './GuardManagement/GuardFormModal';
import GuardDeleteConfirm from './GuardManagement/GuardDeleteConfirm';
import GuardStatusBadge from './GuardManagement/GuardStatusBadge';

import { uniparkApi } from '../../../utils/uniparkApi';

// ── Main component ─────────────────────────────────────────────────────────────
export default function GuardManagementPage() {
    const [guards, setGuards] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const [activeTab, setActiveTab] = useState('guards'); // 'guards' | 'activity'
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'delete' | null
    const [selectedGuard, setSelectedGuard] = useState(null);

    const fetchGuards = async () => {
        setLoading(true);
        try {
            const data = await uniparkApi.getGuards();
            const mapped = data.map(g => ({
                id: String(g.id),   // normalise to plain UUID string – backend path param is UUID type
                name: `${g.first_name} ${g.last_name}`,
                email: g.email,
                phone: g.phone_number || '',
                shift: 'Day (6AM-2PM)', // Shift metadata isn't stored in DB model yet, defaults to Day
                zone: 'Phase 1',       // Assigned zone metadata defaults to Phase 1
            }));
            setGuards(mapped);
        } catch (error) {
            console.error('Error fetching guards:', error);
        } finally {
            setLoading(false);
        }
    };

    // ── Fetch guards on mount ──────────────────────────────────────────────────
    useEffect(() => {
        fetchGuards();
    }, []);

    // ── Handlers ───────────────────────────────────────────────────────────────
    const openAdd = () => { setSelectedGuard(null); setModalMode('add'); };
    const openEdit = (guard) => { setSelectedGuard(guard); setModalMode('edit'); };
    const openDelete = (guard) => { setSelectedGuard(guard); setModalMode('delete'); };
    const closeModal = () => { setModalMode(null); setSelectedGuard(null); };

    const handleSave = async (formData) => {
        const spaceIdx = formData.name.indexOf(' ');
        const firstName = spaceIdx !== -1 ? formData.name.substring(0, spaceIdx) : formData.name;
        const lastName = spaceIdx !== -1 ? formData.name.substring(spaceIdx + 1) : '';

        if (modalMode === 'add') {
            await uniparkApi.addGuard({
                email: formData.email,
                password: 'SecurityGuard123!', // Default temporary password
                first_name: firstName || 'Guard',
                last_name: lastName || 'Officer',
                phone_number: formData.phone
            });
        } else if (modalMode === 'edit') {
            await uniparkApi.updateGuard(selectedGuard.id, {
                first_name: firstName,
                last_name: lastName,
                phone_number: formData.phone
            });
        }
        await fetchGuards();
    };

    const handleDelete = async (id) => {
        await uniparkApi.deleteGuard(id);
        await fetchGuards();
    };

    // ── Filtered lists ─────────────────────────────────────────────────────────
    const filteredGuards = guards.filter((g) =>
        [g.name, g.email, g.zone, g.shift].some((v) =>
            v?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    const filteredLogs = logs.filter((l) =>
        [l.guard_name, l.action].some((v) =>
            v?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Security Guards</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {guards.length} guard{guards.length !== 1 ? 's' : ''} registered
                        </p>
                    </div>
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Guard
                    </button>
                </div>

                {/* Tabs + Search */}
                <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                        {['guards', 'activity'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${activeTab === tab
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab === 'guards' ? 'All Guards' : 'Activity Log'}
                            </button>
                        ))}
                    </div>

                    <input
                        type="text"
                        placeholder={activeTab === 'guards' ? 'Search by name, zone, shift…' : 'Search logs…'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 w-64"
                    />
                </div>

                {/* Guards Table */}
                {activeTab === 'guards' && (
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        {loading ? (
                            <div className="p-12 text-center text-sm text-gray-400">Loading guards…</div>
                        ) : filteredGuards.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-sm text-gray-500">No guards found.</p>
                                <button onClick={openAdd} className="mt-3 text-sm text-blue-600 font-semibold hover:underline cursor-pointer">
                                    Add the first guard →
                                </button>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50">
                                        {['Name', 'Email', 'Phone', 'Zone', 'Shift', 'Status', ''].map((h) => (
                                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredGuards.map((guard) => (
                                        <tr key={guard.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-4 font-semibold text-gray-900">{guard.name}</td>
                                            <td className="px-5 py-4 text-gray-500">{guard.email}</td>
                                            <td className="px-5 py-4 text-gray-500">{guard.phone}</td>
                                            <td className="px-5 py-4">
                                                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                                                    {guard.zone}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">{guard.shift}</td>
                                            <td className="px-5 py-4">
                                                <GuardStatusBadge shift={guard.shift} compact />
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <button
                                                        onClick={() => openEdit(guard)}
                                                        className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => openDelete(guard)}
                                                        className="px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Activity Log Table */}
                {activeTab === 'activity' && (
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        {filteredLogs.length === 0 ? (
                            <div className="p-12 text-center text-sm text-gray-400">No activity logs found.</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50">
                                        {['Guard', 'Action', 'Timestamp'].map((h) => (
                                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-4 font-semibold text-gray-900">{log.guard_name}</td>
                                            <td className="px-5 py-4 text-gray-600">{log.action}</td>
                                            <td className="px-5 py-4 text-gray-400 text-xs">{log.timestamp}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <GuardFormModal
                isOpen={modalMode === 'add' || modalMode === 'edit'}
                onClose={closeModal}
                guardData={selectedGuard}
                onSave={handleSave}
                mode={modalMode}
            />
            <GuardDeleteConfirm
                isOpen={modalMode === 'delete'}
                onClose={closeModal}
                guard={selectedGuard}
                onConfirm={handleDelete}
            />
        </div>
    );
}
