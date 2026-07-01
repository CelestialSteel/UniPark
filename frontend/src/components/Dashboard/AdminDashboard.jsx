import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ASSETS } from '../../constants/assets';

// Tab components
import OverviewTab from './Admin/OverviewTab';
import ReservationsTab from './Admin/ReservationsTab';
import LogsTab from './Admin/LogsTab';
import OverstaysTab from './Admin/OverstaysTab';
import AnnouncementsTab from './Admin/AnnouncementsTab';
import LookupTab from './Admin/LookupTab';
import AnalyticsTab from './Admin/AnalyticsTab';
import ProfileTab from './Admin/ProfileTab';
import GuardManagementPage from './Admin/GuardManagementPage';
import { uniparkApi } from '../../utils/uniparkApi';

// --- MOCK SEED DATA ---
const INITIAL_ZONES = [
    { id: '1', name: 'Phase 1 Lot', code: 'P1', total: 150, occupied: 112, reserved: 15, cordoned: 5, status: 'active' },
    { id: '2', name: 'Phase 2 Lot', code: 'P2', total: 120, occupied: 45, reserved: 5, cordoned: 0, status: 'active' },
    { id: '3', name: 'Oval Building Lot', code: 'Oval', total: 15, occupied: 10, reserved: 3, cordoned: 0, status: 'active' },
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
    { id: 'log-5', plate: 'KAA 999Z', driver: 'David Ochieng', zone: 'Phase 2 Lot', entry: '2026-06-21 07:45 AM', exit: '--', status: 'Entered' },
    { id: 'log-6', plate: 'KCC 888H', driver: 'Mercy Njoroge', zone: 'Oval Building Lot', entry: '2026-06-20 14:00 PM', exit: '--', status: 'Entered' },
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

// Sidebar navigation items config
const NAV_ITEMS = [
    {
        id: 'overview', label: 'Live Dashboard',
        icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z',
    },
    {
        id: 'reservations', label: 'Event Reservations',
        icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
        id: 'security-guards', label: 'Security Guards',
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
        id: 'logs', label: 'Vehicle Audit Logs',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    },
    {
        id: 'overstays', label: 'Overstay Alerts', badge: true,
        icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    },
    {
        id: 'announcements', label: 'Announcements',
        icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
    },
    {
        id: 'lookup', label: 'Driver Lookup',
        icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    },
    {
        id: 'analytics', label: 'Analytics & Reports',
        icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },

];

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    // --- SHARED STATE ---
    const [activeTab, setActiveTab] = useState('overview');
    const [zones, setZones] = useState(INITIAL_ZONES);
    const [reservations, setReservations] = useState(INITIAL_RESERVATIONS);
    const [logs, setLogs] = useState(INITIAL_LOGS);
    const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS);
    const [overstayThreshold, setOverstayThreshold] = useState(1440);

    // Lookup cross-tab navigation state (passed down to OverstaysTab)
    const [lookupPlate, setLookupPlate] = useState('');
    const [searchedDriver, setSearchedDriver] = useState(null);

    // Toast state
    const [toastMessage, setToastMessage] = useState('');
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const formatDateTime = (value) => {
        if (!value) return '--';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
    };

    const formatDuration = (minutes) => {
        if (minutes == null || Number.isNaN(Number(minutes))) return 'Extended';
        const totalMinutes = Math.max(0, Math.round(Number(minutes)));
        const hours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;
        if (hours === 0) {
            return `${remainingMinutes}m`;
        }
        return `${hours}h ${remainingMinutes}m`;
    };

    const mapZone = (zone) => ({
        id: zone.zone_id,
        name: zone.zone_name,
        code: zone.zone_code,
        total: zone.total_spaces,
        occupied: zone.occupied_spaces,
        reserved: zone.reserved_spaces,
        cordoned: zone.cordoned_spaces,
        status: zone.occupancy_percentage >= 90 ? 'critical' : zone.occupancy_percentage >= 70 ? 'warning' : 'active',
    });

    const mapLog = (log) => ({
        id: log.id,
        plate: log.vehicle_registration || 'Unknown',
        driver: log.driver_name || 'Unknown Driver',
        zone: log.parking_zone_name || log.parking_zone_code || 'Unknown Zone',
        entry: formatDateTime(log.entry_time),
        exit: formatDateTime(log.exit_time),
        status: log.status === 'exited' ? 'Exited' : 'Entered',
        durationMinutes: log.duration_minutes,
        duration: formatDuration(log.duration_minutes),
        entryTimeValue: log.entry_time,
    });

    const triggerToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    useEffect(() => {
        let isMounted = true;

        const loadDashboardData = async () => {
            try {
                const [zoneOccupancy, vehicleLogs] = await Promise.all([
                    uniparkApi.getZoneOccupancy(),
                    uniparkApi.getVehicleLogs(),
                ]);

                if (!isMounted) return;

                setZones(zoneOccupancy.map(mapZone));
                setLogs(vehicleLogs.map(mapLog));
            } catch (error) {
                console.warn('Using dashboard seed data until backend is available:', error);
            }
        };

        loadDashboardData();

        return () => {
            isMounted = false;
        };
    }, []);

    // --- DERIVED STATE ---
    const metrics = useMemo(() => {
        const total = zones.reduce((sum, z) => sum + z.total, 0);
        const occupied = zones.reduce((sum, z) => sum + z.occupied, 0);
        const reserved = zones.reduce((sum, z) => sum + z.reserved, 0);
        const cordoned = zones.reduce((sum, z) => sum + z.cordoned, 0);
        const available = total - occupied - reserved - cordoned;
        const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
        return { total, occupied, reserved, cordoned, available, occupancyRate };
    }, [zones]);

    const overstayLogs = useMemo(() => {
        return logs.filter((log) => {
            if (log.status !== 'Entered') return false;

            const entryTimestamp = Date.parse(log.entryTimeValue || log.entry);
            if (Number.isNaN(entryTimestamp)) return false;

            const elapsedMinutes = Math.max(0, Math.floor((Date.now() - entryTimestamp) / 60000));
            return elapsedMinutes >= overstayThreshold;
        }).map((log) => {
            const entryTimestamp = Date.parse(log.entryTimeValue || log.entry);
            const elapsedMinutes = Number.isNaN(entryTimestamp)
                ? log.durationMinutes ?? overstayThreshold
                : Math.max(0, Math.floor((Date.now() - entryTimestamp) / 60000));

            return {
                ...log,
                duration: formatDuration(elapsedMinutes),
            };
        });
    }, [logs, overstayThreshold]);

    const handleCordonZoneToggle = (zoneId, spacesToCordon = 10) => {
        setZones(zones.map(z => {
            if (z.id === zoneId) {
                const isCordoned = z.cordoned > 0;
                return { ...z, cordoned: isCordoned ? 0 : Math.min(spacesToCordon, z.total - z.occupied - z.reserved) };
            }
            return z;
        }));
        triggerToast('Zone parking restriction status updated.');
    };

    const handleAddReservation = (resData) => {
        const reservation = {
            id: `res-${Date.now()}`,
            zone: resData.zone,
            event: resData.event,
            date: resData.date,
            spaces: parseInt(resData.spaces),
            status: 'Approved',
        };
        setReservations([reservation, ...reservations]);
        setZones(zones.map(z => {
            if (z.name === resData.zone) return { ...z, reserved: z.reserved + parseInt(resData.spaces) };
            return z;
        }));
        triggerToast('Event parking reservation successful.');
    };

    const handleUpdateGuard = (guardData) => {
        // Add logic here to update the guard data
        console.log(guardData);
        triggerToast('Guard details updated successfully.');
    };

    const handleCreateAnnouncement = (annData) => {
        const announcement = {
            id: `ann-${Date.now()}`,
            title: annData.title,
            message: annData.message,
            severity: annData.severity,
            date: new Date().toISOString().split('T')[0],
        };
        setAnnouncements([announcement, ...announcements]);
        triggerToast('Announcement published successfully.');
    };

    const handleSignOut = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col antialiased">
            {/* Top Bar / Header */}
            <header className="border-b border-gray-200 bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <div className="UniPark-Logo">
                        <img src={ASSETS.logo} alt="UniPark Logo" className="h-6 w-auto" />
                    </div>
                    <div>
                        <span className="text-xl font-bold text-blue-700">UniPark Admin</span>
                        <span className="ml-2 hidden sm:inline text-xs py-0.5 px-2 bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                            Madaraka Campus Portal
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* User Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-600 hover:text-gray-800 transition focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer overflow-hidden"
                            title="Profile Settings"
                        >
                            {user?.image ? (
                                <img src={user.image} alt="Admin Profile" className="h-full w-full rounded-full object-cover" />
                            ) : (
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            )}
                        </button>

                        {isProfileMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsProfileMenuOpen(false)} />
                                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-gray-200 shadow-xl py-2 z-50">
                                    <div className="px-4 py-3 border-b border-gray-100 flex flex-col items-center text-center">
                                        <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 border-2 border-blue-100 flex items-center justify-center mb-2">
                                            {user?.image ? (
                                                <img src={user.image} alt="Profile" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-xl font-bold text-blue-600">
                                                    {(user?.name || 'AA').split(' ').map(n => n[0]).join('')}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name || 'Admin Administrator'}</p>
                                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-full">{user?.email || 'admin@unipark.ac.ke'}</p>
                                        <span className="inline-flex mt-2 text-[10px] py-0.5 px-2.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 font-semibold uppercase tracking-wider">
                                            {user?.department || 'Security Command Centre'}
                                        </span>
                                    </div>
                                    <div className="p-1">
                                        <button
                                            onClick={() => { setIsProfileMenuOpen(false); setActiveTab('profile'); }}
                                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition cursor-pointer font-medium"
                                        >
                                            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Manage Profile
                                        </button>
                                        <button
                                            onClick={() => { setIsProfileMenuOpen(false); handleSignOut(); }}
                                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition cursor-pointer font-medium border-t border-gray-100 mt-1"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex-1 flex flex-col md:flex-row">
                {/* Sidebar Navigation */}
                <aside className="w-full md:w-64 border-r border-gray-200 bg-white px-4 py-6 flex flex-col gap-1.5 md:min-h-[calc(100vh-73px)]">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-3 mb-2">Controls</p>

                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition cursor-pointer ${activeTab === item.id
                                ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/10'
                                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                                }`}
                        >
                            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon} />
                            </svg>
                            <span className="flex-1">{item.label}</span>
                            {item.badge && overstayLogs.length > 0 && (
                                <span className="h-5 w-5 bg-amber-500 text-gray-900 text-xs font-bold flex items-center justify-center rounded-full">
                                    {overstayLogs.length}
                                </span>
                            )}
                        </button>
                    ))}

                    {/* Sidebar bottom: Profile & Sign Out */}
                    <div className="mt-auto pt-4 border-t border-gray-200 space-y-1">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition cursor-pointer ${activeTab === 'profile'
                                ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/10'
                                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                                }`}
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Profile Settings</span>
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition cursor-pointer"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Sign Out</span>
                        </button>
                    </div>
                </aside>

                {/* Content Workspace */}
                <main className="flex-1 bg-gray-50 px-6 py-8 md:px-10 overflow-y-auto">
                    {/* Success toast */}
                    {toastMessage && (
                        <div className="mb-6 p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 text-sm flex items-center gap-3 shadow-lg shadow-emerald-900/15 animate-bounce">
                            <span className="flex h-5 w-5 items-center justify-center bg-emerald-500 text-white rounded-full text-xs font-bold">✓</span>
                            <span>{toastMessage}</span>
                        </div>
                    )}

                    {activeTab === 'overview' && (
                        <OverviewTab
                            zones={zones}
                            metrics={metrics}
                            handleCordonZoneToggle={handleCordonZoneToggle}
                            onAddReservation={handleAddReservation}
                            onCreateAnnouncement={handleCreateAnnouncement}
                        />
                    )}

                    {activeTab === 'reservations' && (
                        <ReservationsTab
                            reservations={reservations}
                            setReservations={setReservations}
                            zones={zones}
                            setZones={setZones}
                            triggerToast={triggerToast}
                        />
                    )}
                    {activeTab === 'security-guards' && (
                        <GuardManagementPage />
                    )}

                    {activeTab === 'logs' && (
                        <LogsTab logs={logs} />
                    )}

                    {activeTab === 'overstays' && (
                        <OverstaysTab
                            overstayLogs={overstayLogs}
                            overstayThreshold={overstayThreshold}
                            setOverstayThreshold={setOverstayThreshold}
                            setLogs={setLogs}
                            logs={logs}
                            setActiveTab={setActiveTab}
                            setLookupPlate={setLookupPlate}
                            setSearchedDriver={setSearchedDriver}
                            REGISTERED_DRIVERS={REGISTERED_DRIVERS}
                            triggerToast={triggerToast}
                        />
                    )}

                    {activeTab === 'announcements' && (
                        <AnnouncementsTab
                            announcements={announcements}
                            setAnnouncements={setAnnouncements}
                            triggerToast={triggerToast}
                        />
                    )}

                    {activeTab === 'lookup' && (
                        <LookupTab
                            initialPlate={lookupPlate}
                            initialDriver={searchedDriver}
                        />
                    )}

                    {activeTab === 'analytics' && (
                        <AnalyticsTab
                            zones={zones}
                            logs={logs}
                            reservations={reservations}
                            overstayLogs={overstayLogs}
                            triggerToast={triggerToast}
                        />
                    )}

                    {activeTab === 'profile' && (
                        <ProfileTab triggerToast={triggerToast} />
                    )}
                </main>
            </div>
        </div>
    );
}
