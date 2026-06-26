import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// --- MOCK SEED DATA ---
const INITIAL_ZONES = [
    { id: '1', name: 'Phase 1 Lot', code: 'P1', total: 150, occupied: 112, reserved: 15, cordoned: 5, status: 'active' },
    { id: '2', name: 'Phase 2 Lot', code: 'P2', total: 120, occupied: 45, reserved: 5, cordoned: 0, status: 'active' },
    { id: '3', name: 'Siwaka Lot', code: 'SWK', total: 80, occupied: 74, reserved: 4, cordoned: 2, status: 'active' },
    { id: '4', name: 'Library Lot', code: 'LIB', total: 90, occupied: 86, reserved: 2, cordoned: 2, status: 'active' },
    { id: '5', name: 'Management Lot', code: 'MGT', total: 40, occupied: 15, reserved: 20, cordoned: 0, status: 'active' },
    { id: '6', name: 'Sports Complex Lot', code: 'SPC', total: 100, occupied: 12, reserved: 0, cordoned: 45, status: 'active' },
];

const INITIAL_RESERVATIONS = [
    { id: 'res-1', zone: 'Sports Complex Lot', event: 'Inter-University Rugby Match', date: '2026-06-25', spaces: 40, status: 'Approved' },
    { id: 'res-2', zone: 'Management Lot', event: 'University Council AGM', date: '2026-06-23', spaces: 15, status: 'Approved' },
    { id: 'res-3', zone: 'Library Lot', event: 'Guest Lecturer parking', date: '2026-06-24', spaces: 2, status: 'Pending' },
];

const INITIAL_LOGS = [
    { id: 'log-1', plate: 'KDC 456X', driver: 'Dalton Muindi', zone: 'Phase 1 Lot', entry: '2026-06-22 08:15 AM', exit: '--', status: 'Entered' },
    { id: 'log-2', plate: 'KBB 123A', driver: 'Griffin Sitati', zone: 'Library Lot', entry: '2026-06-22 07:30 AM', exit: '2026-06-22 11:45 AM', status: 'Exited' },
    { id: 'log-3', plate: 'KCA 789B', driver: 'Prof. Anthony Khajira', zone: 'Management Lot', entry: '2026-06-22 09:00 AM', exit: '--', status: 'Entered' },
    { id: 'log-4', plate: 'KDD 555Y', driver: 'Sharon Wambui', zone: 'Sports Complex Lot', entry: '2026-06-22 06:15 AM', exit: '2026-06-22 10:30 AM', status: 'Exited' },
    { id: 'log-5', plate: 'KAA 999Z', driver: 'David Ochieng', zone: 'Phase 2 Lot', entry: '2026-06-21 07:45 AM', exit: '--', status: 'Entered' }, // Overstaying
    { id: 'log-6', plate: 'KCC 888H', driver: 'Mercy Njoroge', zone: 'Siwaka Lot', entry: '2026-06-20 14:00 PM', exit: '--', status: 'Entered' }, // Overstaying
];

const INITIAL_ANNOUNCEMENTS = [
    { id: 'ann-1', title: 'Sports Complex Lot Cordoned', message: 'The Sports Complex Lot has been cordoned off (40 spaces) for preparation of the inter-university rugby cup match.', severity: 'medium', date: '2026-06-22' },
    { id: 'ann-2', title: 'Library Lot Maintenance', message: 'Avoid the library access lane due to tarmac cleaning activities.', severity: 'low', date: '2026-06-21' },
];

const REGISTERED_DRIVERS = [
    { plate: 'KDC 456X', name: 'Dalton Muindi', email: 'dalton.muindi@strathmore.edu', idNumber: '184066', phone: '+254 712 345678', department: 'Faculty of IT', role: 'Student' },
    { plate: 'KBB 123A', name: 'Griffin Sitati', email: 'griffin.sitati@strathmore.edu', idNumber: '191613', phone: '+254 722 987654', department: 'School of Computing', role: 'Student' },
    { plate: 'KCA 789B', name: 'Anthony Khajira', email: 'akhajira@strathmore.ac.ke', idNumber: 'SU-4009', phone: '+254 733 111222', department: 'Academic Staff', role: 'Faculty' },
    { plate: 'KAA 999Z', name: 'David Ochieng', email: 'dochieng@strathmore.edu', idNumber: '175560', phone: '+254 701 999888', department: 'Business School', role: 'Student' },
    { plate: 'KCC 888H', name: 'Mercy Njoroge', email: 'mnjoroge@strathmore.ac.ke', idNumber: 'SU-5034', phone: '+254 715 444333', department: 'Finance Office', role: 'Staff' },
];

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    // --- STATE ---
    const [activeTab, setActiveTab] = useState('overview');
    const [zones, setZones] = useState(INITIAL_ZONES);
    const [reservations, setReservations] = useState(INITIAL_RESERVATIONS);
    const [logs, setLogs] = useState(INITIAL_LOGS);
    const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS);
    const [overstayThreshold, setOverstayThreshold] = useState(1440); // 1 Day in minutes default

    // Search states
    const [logSearch, setLogSearch] = useState('');
    const [logStatusFilter, setLogStatusFilter] = useState('All');
    const [lookupPlate, setLookupPlate] = useState('');
    const [searchedDriver, setSearchedDriver] = useState(null);
    const [lookupError, setLookupError] = useState('');

    // Reservation modal form state
    const [isResModalOpen, setIsResModalOpen] = useState(false);
    const [newRes, setNewRes] = useState({ zone: 'Phase 1 Lot', event: '', date: '', spaces: 5 });

    // Announcement form state
    const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
    const [newAnn, setNewAnn] = useState({ title: '', message: '', severity: 'low' });

    // Success Alerts Toast
    const [toastMessage, setToastMessage] = useState('');

    const triggerToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };



    // --- DERIVED METRICS ---
    const metrics = useMemo(() => {
        const total = zones.reduce((sum, z) => sum + z.total, 0);
        const occupied = zones.reduce((sum, z) => sum + z.occupied, 0);
        const reserved = zones.reduce((sum, z) => sum + z.reserved, 0);
        const cordoned = zones.reduce((sum, z) => sum + z.cordoned, 0);
        const available = total - occupied - reserved - cordoned;
        const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
        return { total, occupied, reserved, cordoned, available, occupancyRate };
    }, [zones]);

    // Overstay flagging for vehicles parked longer than 12 hours
    // For mock evaluation, we identify KAA 999Z and KCC 888H as overstaying.
    const overstayLogs = useMemo(() => {
        return logs.filter(log => {
            if (log.status !== 'Entered') return false;
            // Let's mock overstay calculations:
            if (log.plate === 'KAA 999Z' && overstayThreshold <= 2000) return true; // Entered 29 hrs ago
            if (log.plate === 'KCC 888H' && overstayThreshold <= 4000) return true; // Entered 46 hrs ago
            return false;
        });
    }, [logs, overstayThreshold]);

    // Filtered logs
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = log.plate.toLowerCase().includes(logSearch.toLowerCase()) ||
                log.driver.toLowerCase().includes(logSearch.toLowerCase()) ||
                log.zone.toLowerCase().includes(logSearch.toLowerCase());
            const matchesStatus = logStatusFilter === 'All' || log.status === logStatusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [logs, logSearch, logStatusFilter]);

    // --- ACTIONS ---
    const handleAddReservation = (e) => {
        e.preventDefault();
        if (!newRes.event || !newRes.date || !newRes.spaces) {
            alert('Please fill out all fields.');
            return;
        }

        const selectedZone = zones.find(z => z.name === newRes.zone);
        if (selectedZone && (selectedZone.occupied + selectedZone.reserved + parseInt(newRes.spaces) > selectedZone.total)) {
            alert(`Error: Reserving ${newRes.spaces} spaces exceeds the capacity of ${newRes.zone}.`);
            return;
        }

        // Add to list
        const reservation = {
            id: `res-${Date.now()}`,
            zone: newRes.zone,
            event: newRes.event,
            date: newRes.date,
            spaces: parseInt(newRes.spaces),
            status: 'Approved'
        };
        setReservations([reservation, ...reservations]);

        // Cordon spaces in the selected Zone
        setZones(zones.map(z => {
            if (z.name === newRes.zone) {
                return { ...z, reserved: z.reserved + parseInt(newRes.spaces) };
            }
            return z;
        }));

        setIsResModalOpen(false);
        setNewRes({ zone: 'Phase 1 Lot', event: '', date: '', spaces: 5 });
        triggerToast('Event parking reservation successful.');
    };

    const handleCreateAnnouncement = (e) => {
        e.preventDefault();
        if (!newAnn.title || !newAnn.message) {
            alert('Please complete the fields');
            return;
        }
        const announcement = {
            id: `ann-${Date.now()}`,
            title: newAnn.title,
            message: newAnn.message,
            severity: newAnn.severity,
            date: new Date().toISOString().split('T')[0]
        };
        setAnnouncements([announcement, ...announcements]);
        setIsAnnModalOpen(false);
        setNewAnn({ title: '', message: '', severity: 'low' });
        triggerToast('Announcement published successfully.');
    };

    const handleDriverLookup = (e) => {
        e.preventDefault();
        setLookupError('');
        setSearchedDriver(null);

        const cleanPlate = lookupPlate.trim().toUpperCase();
        if (!cleanPlate) {
            setLookupError('Please enter a vehicle registration plate number.');
            return;
        }

        const driver = REGISTERED_DRIVERS.find(d => d.plate.replace(/\s+/g, '') === cleanPlate.replace(/\s+/g, ''));
        if (driver) {
            setSearchedDriver(driver);
        } else {
            setLookupError('No driver profiles found for registration number ' + cleanPlate);
        }
    };

    const handleCordonZoneToggle = (zoneId, spacesToCordon = 10) => {
        setZones(zones.map(z => {
            if (z.id === zoneId) {
                const isCordoned = z.cordoned > 0;
                return {
                    ...z,
                    cordoned: isCordoned ? 0 : Math.min(spacesToCordon, z.total - z.occupied - z.reserved)
                };
            }
            return z;
        }));
        triggerToast('Zone parking restriction status updated.');
    };

    // --- CSV DOWNLOAD HELPERS ---
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

    const handleDownloadLogs = () => triggerCSVDownload(
        'unipark_audit_logs.csv', logs,
        ['id', 'plate', 'driver', 'zone', 'entry', 'exit', 'status']
    );

    const handleDownloadReservations = () => triggerCSVDownload(
        'unipark_reservations.csv', reservations,
        ['id', 'zone', 'event', 'date', 'spaces', 'status']
    );

    const handleDownloadOverstays = () => triggerCSVDownload(
        'unipark_overstay_alerts.csv', overstayLogs,
        ['id', 'plate', 'driver', 'zone', 'entry', 'exit', 'status']
    );

    const handleDownloadZones = () => triggerCSVDownload(
        'unipark_zone_summary.csv', zones,
        ['id', 'name', 'code', 'total', 'occupied', 'reserved', 'cordoned', 'status']
    );

    // --- LOGOUT HANDLER ---
    const handleSignOut = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col antialiased">
            {/* Top Bar / Header */}
            <header className="border-b border-gray-200 bg-white/90 backdrop-blur-md backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-500/30">
                        P
                    </div>
                    <div>
                        <span className="text-xl font-bold text-blue-700 font-bold">
                            UniPark Admin
                        </span>
                        <span className="ml-2 hidden sm:inline text-xs py-0.5 px-2 bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                            Madaraka Campus Portal
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex text-right flex-col">
                        <span className="text-xs text-gray-500 font-medium">Logged in as</span>
                        <span className="text-sm font-semibold text-gray-800">{user?.email || 'admin@unipark.ac.ke'}</span>
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex-1 flex flex-col md:flex-row">
                {/* Sidebar Navigation */}
                <aside className="w-full md:w-64 border-r border-gray-200 bg-white px-4 py-6 flex flex-col gap-1.5 md:min-h-[calc(100vh-73px)]">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-3 mb-2">Controls</p>

                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition cursor-pointer ${activeTab === 'overview'
                            ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/10'
                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                    >
                        <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                        </svg>
                        <span>Live Dashboard</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('reservations')}
                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition cursor-pointer ${activeTab === 'reservations'
                            ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/10'
                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                    >
                        <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Event Reservations</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition cursor-pointer ${activeTab === 'logs'
                            ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/10'
                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                    >
                        <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <span>Vehicle Audit Logs</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('overstays')}
                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition cursor-pointer ${activeTab === 'overstays'
                            ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/10'
                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                    >
                        <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="flex-1">Overstay Alerts</span>
                        {overstayLogs.length > 0 && (
                            <span className="h-5 w-5 bg-amber-500 text-gray-900 text-xs font-bold flex items-center justify-center rounded-full">
                                {overstayLogs.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('announcements')}
                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition cursor-pointer ${activeTab === 'announcements'
                            ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/10'
                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                    >
                        <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                        <span>Announcements</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('lookup')}
                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition cursor-pointer ${activeTab === 'lookup'
                            ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/10'
                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                    >
                        <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>Driver Lookup</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition cursor-pointer ${activeTab === 'analytics'
                            ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/10'
                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                    >
                        <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Analytics &amp; Reports</span>
                    </button>

                    {/* Sidebar bottom: sign out */}
                    <div className="mt-auto pt-4 border-t border-gray-200">
                        <button
                            onClick={handleSignOut}
                            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition cursor-pointer"
                        >
                            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Sign Out</span>
                        </button>
                    </div>
                </aside>

                {/* Content Workspace */}
                <main className="flex-1 bg-gray-50 px-6 py-8 md:px-10 overflow-y-auto">
                    {/* Successful operation alert */}
                    {toastMessage && (
                        <div className="mb-6 p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 text-sm flex items-center gap-3 shadow-lg shadow-emerald-900/15 animate-bounce">
                            <span className="flex h-5 w-5 items-center justify-center bg-emerald-500 text-white rounded-full text-xs font-bold">✓</span>
                            <span>{toastMessage}</span>
                        </div>
                    )}

                    {/* TAB: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div>
                            {/* Dashboard Header */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                                <div>
                                    <h1 className="text-3xl font-extrabold tracking-tight">Overview & Live Status</h1>
                                    <p className="text-gray-500 mt-1">Real-time status of Strathmore parking slots.</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsResModalOpen(true)}
                                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 cursor-pointer"
                                    >
                                        + Reserve Spaces
                                    </button>
                                    <button
                                        onClick={() => setIsAnnModalOpen(true)}
                                        className="inline-flex items-center gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 border border-gray-300 cursor-pointer"
                                    >
                                        📢 Publish Announcement
                                    </button>
                                </div>
                            </div>

                            {/* KPI Metrics Widgets */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                                <div className="p-5 rounded-2xl bg-white border border-gray-200">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Lots</span>
                                    <span className="text-3xl font-bold text-gray-900 mt-2 block">{metrics.total}</span>
                                    <span className="text-[11px] text-gray-500 mt-1 block">Spaces in 6 campus zones</span>
                                </div>
                                <div className="p-5 rounded-2xl bg-white border border-gray-200">
                                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">Occupied Spots</span>
                                    <span className="text-3xl font-bold text-amber-400 mt-2 block">{metrics.occupied}</span>
                                    <span className="text-[11px] text-gray-500 mt-1 block">{metrics.occupancyRate}% general occupancy rate</span>
                                </div>
                                <div className="p-5 rounded-2xl bg-white border border-gray-200">
                                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">Reserved</span>
                                    <span className="text-3xl font-bold text-indigo-400 mt-2 block">{metrics.reserved}</span>
                                    <span className="text-[11px] text-gray-500 mt-1 block">Special event reserved spots</span>
                                </div>
                                <div className="p-5 rounded-2xl bg-white border border-gray-200">
                                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">Available Slots</span>
                                    <span className="text-3xl font-bold text-emerald-400 mt-2 block">{metrics.available}</span>
                                    <span className="text-[11px] text-gray-500 mt-1 block">Vacant vehicle parking bays</span>
                                </div>
                            </div>

                            {/* Zones Grid */}
                            <h2 className="text-xl font-bold text-gray-800 mb-5">Zones Occupancy Status</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {zones.map((zone) => {
                                    const totalTaken = zone.occupied + zone.reserved + zone.cordoned;
                                    const occupancyPercent = Math.min(100, Math.round((totalTaken / zone.total) * 100));

                                    // Status color matching logic
                                    let ringColor = 'stroke-emerald-500';
                                    let textColor = 'text-emerald-400';
                                    if (occupancyPercent >= 90) {
                                        ringColor = 'stroke-rose-500 animate-pulse';
                                        textColor = 'text-rose-400';
                                    } else if (occupancyPercent >= 70) {
                                        ringColor = 'stroke-amber-500';
                                        textColor = 'text-amber-400';
                                    }

                                    return (
                                        <div key={zone.id} className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col justify-between hover:border-gray-300 transition duration-300">
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <h3 className="font-bold text-gray-800 text-lg leading-tight">{zone.name}</h3>
                                                        <span className="text-xs text-gray-500 uppercase tracking-wider">CODE: {zone.code}</span>
                                                    </div>

                                                    {/* Radial Progress Ring */}
                                                    <div className="relative h-14 w-14 flex items-center justify-center">
                                                        <svg className="w-full h-full transform -rotate-90">
                                                            <circle cx="28" cy="28" r="22" className="stroke-gray-200" strokeWidth="4" fill="none" />
                                                            <circle
                                                                cx="28"
                                                                cy="28"
                                                                r="22"
                                                                className={ringColor}
                                                                strokeWidth="4"
                                                                fill="none"
                                                                strokeDasharray="138"
                                                                strokeDashoffset={138 - (138 * occupancyPercent) / 100}
                                                            />
                                                        </svg>
                                                        <span className="absolute text-[11px] font-bold text-gray-800">{occupancyPercent}%</span>
                                                    </div>
                                                </div>

                                                {/* Stats Breakdown */}
                                                <div className="space-y-2 mt-4">
                                                    <div className="flex justify-between text-xs text-gray-500">
                                                        <span>Occupied (Active Logs):</span>
                                                        <span className="font-semibold text-gray-800">{zone.occupied}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-gray-500">
                                                        <span>Reserved (Special events):</span>
                                                        <span className="font-semibold text-indigo-400">{zone.reserved}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-gray-500">
                                                        <span>Cordoned (Closed off):</span>
                                                        <span className="font-semibold text-rose-400">{zone.cordoned}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs border-t border-gray-200 pt-2 text-gray-700">
                                                        <span className="font-medium">Total Spaces:</span>
                                                        <span className="font-bold">{zone.total}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Zone Actions */}
                                            <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2">
                                                <button
                                                    onClick={() => handleCordonZoneToggle(zone.id, zone.name === 'Sports Complex Lot' ? 40 : 10)}
                                                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition cursor-pointer ${zone.cordoned > 0
                                                        ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-900/20'
                                                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {zone.cordoned > 0 ? '🔓 Release Spaces' : '🔒 Cordon Spot (10)'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setNewRes({ ...newRes, zone: zone.name });
                                                        setIsResModalOpen(true);
                                                    }}
                                                    className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition cursor-pointer"
                                                >
                                                    Book Lot
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* TAB: RESERVATIONS */}
                    {activeTab === 'reservations' && (
                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                                <div>
                                    <h1 className="text-3xl font-extrabold tracking-tight">Event Parking Reservations</h1>
                                    <p className="text-gray-500 mt-1">Configure closures and block bays for academic and administrative meetings.</p>
                                </div>
                                <button
                                    onClick={() => setIsResModalOpen(true)}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg cursor-pointer"
                                >
                                    + Add New Reservation
                                </button>
                            </div>

                            {/* Active Reservations Table */}
                            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
                                            <th className="p-4">Campus Zone</th>
                                            <th className="p-4">Purpose/Event</th>
                                            <th className="p-4">Date scheduled</th>
                                            <th className="p-4 text-center">Spaces Blocked</th>
                                            <th className="p-4">Approval Status</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {reservations.map((res) => (
                                            <tr key={res.id} className="hover:bg-gray-50 transition">
                                                <td className="p-4 font-semibold text-gray-800">{res.zone}</td>
                                                <td className="p-4 text-gray-700">{res.event}</td>
                                                <td className="p-4 text-gray-500">{res.date}</td>
                                                <td className="p-4 text-center text-gray-700 font-mono">{res.spaces} spots</td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${res.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {res.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => {
                                                            setReservations(reservations.filter(r => r.id !== res.id));
                                                            // Deduct from zones
                                                            setZones(zones.map(z => {
                                                                if (z.name === res.zone) {
                                                                    return { ...z, reserved: Math.max(0, z.reserved - res.spaces) };
                                                                }
                                                                return z;
                                                            }));
                                                            triggerToast('Reservation cancelled and spots released.');
                                                        }}
                                                        className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition cursor-pointer"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB: AUDIT LOGS */}
                    {activeTab === 'logs' && (
                        <div>
                            <div className="mb-8">
                                <h1 className="text-3xl font-extrabold tracking-tight">Vehicle Entry & Exit Audit</h1>
                                <p className="text-gray-500 mt-1">Audit log database containing arrival records, durations, and gate logs.</p>
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
                    )}

                    {/* TAB: OVERSTAY ALERTS */}
                    {activeTab === 'overstays' && (
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
                                                                // Mock dismissal
                                                                setLogs(logs.map(l => {
                                                                    if (l.id === log.id) {
                                                                        return { ...l, exit: new Date().toLocaleString() }; // Simulates checkout
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
                    )}

                    {/* TAB: ANNOUNCEMENTS */}
                    {activeTab === 'announcements' && (
                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                                <div>
                                    <h1 className="text-3xl font-extrabold tracking-tight">Institutional Announcements</h1>
                                    <p className="text-gray-500 mt-1">Draft announcements regarding lane closures or reserved parking lots.</p>
                                </div>
                                <button
                                    onClick={() => setIsAnnModalOpen(true)}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg cursor-pointer"
                                >
                                    + Compose Announcement
                                </button>
                            </div>

                            {/* Broadcast Announcements Feed */}
                            <div className="space-y-5">
                                {announcements.map((ann) => (
                                    <div key={ann.id} className="p-6 rounded-2xl border border-gray-200 bg-white flex flex-col justify-between hover:border-gray-300 transition">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-bold text-gray-800">{ann.title}</h3>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-full border ${ann.severity === 'high'
                                                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                                                        : ann.severity === 'medium'
                                                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                                                            : 'bg-blue-50 text-blue-600 border-blue-200'
                                                        }`}>
                                                        {ann.severity} Severity
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-400 mt-1 block">Broadcasted: {ann.date}</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setAnnouncements(announcements.filter(a => a.id !== ann.id));
                                                    triggerToast('Announcement removed.');
                                                }}
                                                className="text-xs text-gray-400 hover:text-rose-400 transition cursor-pointer"
                                            >
                                                Dismiss
                                            </button>
                                        </div>
                                        <p className="text-gray-700 text-sm leading-relaxed">{ann.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB: DRIVER LOOKUP */}
                    {activeTab === 'lookup' && (
                        <div>
                            <div className="mb-8">
                                <h1 className="text-3xl font-extrabold tracking-tight">Driver Profile Lookup</h1>
                                <p className="text-gray-500 mt-1">Retrieve institutional profiles and contact info by vehicle plate registration.</p>
                            </div>

                            {/* Search Form */}
                            <form onSubmit={handleDriverLookup} className="bg-gray-50 border border-gray-200 rounded-2xl p-6 max-w-2xl mb-8">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                    Registration Plate Number
                                </label>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text"
                                        value={lookupPlate}
                                        onChange={(e) => setLookupPlate(e.target.value)}
                                        placeholder="e.g. KDC 456X or KBB 123A"
                                        className="flex-1 bg-gray-100 border border-gray-200 text-gray-900 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono"
                                    />
                                    <button
                                        type="submit"
                                        className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg cursor-pointer"
                                    >
                                        Lookup Owner
                                    </button>
                                </div>
                                {lookupError && <p className="mt-3 text-xs text-rose-400 font-semibold">{lookupError}</p>}
                            </form>

                            {/* Results Profile Card */}
                            {searchedDriver && (
                                <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-2xl shadow-xl shadow-gray-200/60 relative overflow-hidden">
                                    <div className="absolute right-0 top-0 h-40 w-40 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

                                    <div className="flex flex-col sm:flex-row items-start gap-6">
                                        <div className="h-16 w-16 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center text-2xl font-bold text-blue-400 shadow-md">
                                            {searchedDriver.name.split(' ').map(n => n[0]).join('')}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h2 className="text-xl font-bold text-gray-900">{searchedDriver.name}</h2>
                                                <span className="text-[10px] py-0.5 px-2 bg-blue-100 text-blue-700 rounded-full border border-blue-200/40 font-bold uppercase">
                                                    {searchedDriver.role}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm">
                                                <div>
                                                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block">Institutional ID</span>
                                                    <span className="text-gray-700 font-medium">{searchedDriver.idNumber}</span>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block">Department / Faculty</span>
                                                    <span className="text-gray-700 font-medium">{searchedDriver.department}</span>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block">Email Address</span>
                                                    <a href={`mailto:${searchedDriver.email}`} className="text-blue-600 hover:text-blue-700 font-semibold hover:underline block">
                                                        {searchedDriver.email}
                                                    </a>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block">Phone Number</span>
                                                    <a href={`tel:${searchedDriver.phone}`} className="text-gray-700 hover:text-gray-800 font-medium block">
                                                        {searchedDriver.phone}
                                                    </a>
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-5 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                                                <span>Linked Reg Plate:</span>
                                                <span className="font-mono font-bold text-gray-800 text-sm bg-gray-100 px-3 py-1 rounded-lg border border-gray-300">
                                                    {searchedDriver.plate}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: ANALYTICS */}
                    {activeTab === 'analytics' && (
                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                                <div>
                                    <h1 className="text-3xl font-extrabold tracking-tight">Analytics &amp; Reports</h1>
                                    <p className="text-gray-500 mt-1">Download exportable CSV reports for all campus parking data.</p>
                                </div>
                            </div>

                            {/* Summary KPI row */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                                {[
                                    { label: 'Total Zones', value: zones.length, color: 'from-blue-600 to-indigo-600', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
                                    { label: 'Audit Log Entries', value: logs.length, color: 'from-emerald-600 to-teal-600', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                                    { label: 'Event Reservations', value: reservations.length, color: 'from-violet-600 to-purple-600', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                                    { label: 'Overstay Alerts', value: overstayLogs.length, color: 'from-amber-500 to-orange-600', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
                                ].map((kpi) => (
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
                                            <p className="text-xs text-gray-500 mt-0.5">All vehicle entry/exit events with plate, driver, zone &amp; timestamps.</p>
                                        </div>
                                        <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-300">.csv</span>
                                    </div>
                                    <div className="text-xs text-gray-400">{logs.length} records &bull; Columns: ID, Plate, Driver, Zone, Entry, Exit, Status</div>
                                    <button
                                        onClick={handleDownloadLogs}
                                        className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition cursor-pointer"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Download Audit Logs
                                    </button>
                                </div>

                                {/* Event Reservations */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 hover:border-violet-700/50 transition">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">Event Reservations</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">All event parking blocks with zone, date, spaces reserved &amp; approval status.</p>
                                        </div>
                                        <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-300">.csv</span>
                                    </div>
                                    <div className="text-xs text-gray-400">{reservations.length} records &bull; Columns: ID, Zone, Event, Date, Spaces, Status</div>
                                    <button
                                        onClick={handleDownloadReservations}
                                        className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-lg shadow-violet-600/20 transition cursor-pointer"
                                    >
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
                                    <button
                                        onClick={handleDownloadOverstays}
                                        className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-900 text-sm font-semibold shadow-lg shadow-amber-500/20 transition cursor-pointer"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Download Overstay Report
                                    </button>
                                </div>

                                {/* Zone Summary */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 hover:border-emerald-700/50 transition">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">Zone Capacity Summary</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">Full breakdown of all campus lots with occupancy, reserved &amp; cordoned figures.</p>
                                        </div>
                                        <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-300">.csv</span>
                                    </div>
                                    <div className="text-xs text-gray-400">{zones.length} zones &bull; Columns: ID, Name, Code, Total, Occupied, Reserved, Cordoned, Status</div>
                                    <button
                                        onClick={handleDownloadZones}
                                        className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                                    >
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
                                                    className={`h-full rounded-full transition-all duration-700 ${pctOccupied >= 90 ? 'bg-red-500' : pctOccupied >= 70 ? 'bg-amber-400' : 'bg-emerald-500'
                                                        }`}
                                                    style={{ width: `${pctOccupied}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* --- MODAL: RESERVE EVENT SPACES --- */}
            {isResModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsResModalOpen(false)} />
                    <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Block Parking Lot Spaces</h2>
                        <p className="text-xs text-gray-500 mb-6">Create a reservation for an upcoming event or administrative visitor.</p>

                        <form onSubmit={handleAddReservation} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Select Campus Lot</label>
                                <select
                                    value={newRes.zone}
                                    onChange={(e) => setNewRes({ ...newRes, zone: e.target.value })}
                                    className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                >
                                    {zones.map(z => <option key={z.id} value={z.name}>{z.name} (Max: {z.total})</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Event Name / Purpose</label>
                                <input
                                    type="text"
                                    required
                                    value={newRes.event}
                                    onChange={(e) => setNewRes({ ...newRes, event: e.target.value })}
                                    placeholder="e.g. Graduation Ceremony 2026"
                                    className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newRes.date}
                                        onChange={(e) => setNewRes({ ...newRes, date: e.target.value })}
                                        className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Bays Count</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="100"
                                        value={newRes.spaces}
                                        onChange={(e) => setNewRes({ ...newRes, spaces: e.target.value })}
                                        className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsResModalOpen(false)}
                                    className="flex-1 py-2.5 text-sm font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-100 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 cursor-pointer"
                                >
                                    Confirm Reservation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL: BROADCAST ANNOUNCEMENT --- */}
            {isAnnModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsAnnModalOpen(false)} />
                    <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Publish Announcement</h2>
                        <p className="text-xs text-gray-500 mb-6">Broadcast an important warning message or service alert to drivers.</p>

                        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Headline Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newAnn.title}
                                    onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                                    placeholder="e.g. Sports Lot Closed Today"
                                    className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Announcement Body</label>
                                <textarea
                                    required
                                    rows="4"
                                    value={newAnn.message}
                                    onChange={(e) => setNewAnn({ ...newAnn, message: e.target.value })}
                                    placeholder="Provide detailed instructions to campus parking lot users..."
                                    className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Alert Severity</label>
                                <select
                                    value={newAnn.severity}
                                    onChange={(e) => setNewAnn({ ...newAnn, severity: e.target.value })}
                                    className="w-full bg-gray-100 border border-gray-200 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                >
                                    <option value="low">Low (Standard update)</option>
                                    <option value="medium">Medium (Traffic warnings)</option>
                                    <option value="high">High (Immediate Action Required)</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAnnModalOpen(false)}
                                    className="flex-1 py-2.5 text-sm font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-100 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 cursor-pointer"
                                >
                                    Publish Alert
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


