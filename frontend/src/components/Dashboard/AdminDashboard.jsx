import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
    const [zones, setZones] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [logs, setLogs] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [overstayThreshold, setOverstayThreshold] = useState(1440);
    const [loading, setLoading] = useState(true);

    // Lookup cross-tab navigation state
    const [lookupPlate, setLookupPlate] = useState('');
    const [searchedDriver, setSearchedDriver] = useState(null);

    // Toast state
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success'); // 'success' | 'error'
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const pollIntervalRef = useRef(null);

    // ── Helpers ──────────────────────────────────────────────────────────────

    const formatDateTime = (value) => {
        if (!value) return '--';
        // Backend now serialises every event-time as an ISO string with
        // an explicit UTC offset ("...+00:00"). If a value arrives
        // without a marker we treat it as UTC so it never gets parsed
        // in the browser's local zone (the cause of the previous
        // "3 hours behind" bug).
        let iso = String(value);
        if (!/(Z|[+-]\d{2}:?\d{2})$/.test(iso)) {
            iso = iso + 'Z';
        }
        const date = new Date(iso);
        return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
    };

    const formatDuration = (minutes) => {
        if (minutes == null || Number.isNaN(Number(minutes))) return 'Extended';
        const totalMinutes = Math.max(0, Math.round(Number(minutes)));
        const hours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;
        if (hours === 0) return `${remainingMinutes}m`;
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

    const mapAlert = (alert) => ({
        id: String(alert.id),
        title: alert.alert_type,
        message: alert.message,
        severity: alert.severity || 'low',
        date: alert.created_at ? new Date(alert.created_at).toISOString().split('T')[0] : '--',
        zoneId: String(alert.parking_zone_id),
        isActive: alert.is_active,
    });

    const triggerToast = useCallback((msg, type = 'success') => {
        setToastMessage(msg);
        setToastType(type);
        setTimeout(() => setToastMessage(''), 4000);
    }, []);

    // ── Data Fetching ────────────────────────────────────────────────────────

    const loadLiveData = useCallback(async () => {
        try {
            const [zoneOccupancy, vehicleLogs] = await Promise.all([
                uniparkApi.getZoneOccupancy(),
                uniparkApi.getVehicleLogs(),
            ]);
            setZones(zoneOccupancy.map(mapZone));
            setLogs(vehicleLogs.map(mapLog));
        } catch (err) {
            console.warn('Live data refresh failed:', err.message);
        }
    }, []);

    const loadAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [zoneOccupancy, vehicleLogs, spaceReservations, activeAlerts] = await Promise.all([
                uniparkApi.getZoneOccupancy(),
                uniparkApi.getVehicleLogs(),
                uniparkApi.getReservations().catch(() => []),
                uniparkApi.getAlerts().catch(() => []),
            ]);

            setZones(zoneOccupancy.map(mapZone));
            setLogs(vehicleLogs.map(mapLog));
            setReservations(spaceReservations);
            setAnnouncements(activeAlerts.filter(a => a.is_active).map(mapAlert));
        } catch (err) {
            console.warn('Dashboard data load failed:', err.message);
            triggerToast('Some data could not be loaded from the server.', 'error');
        } finally {
            setLoading(false);
        }
    }, [triggerToast]);

    // Initial load
    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    // 30-second polling for live zones + logs
    useEffect(() => {
        pollIntervalRef.current = setInterval(loadLiveData, 30000);
        return () => clearInterval(pollIntervalRef.current);
    }, [loadLiveData]);

    // ── Derived State ─────────────────────────────────────────────────────────

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
            return { ...log, duration: formatDuration(elapsedMinutes) };
        });
    }, [logs, overstayThreshold]);

    // ── Action Handlers ──────────────────────────────────────────────────────

    const handleCordonZoneToggle = async (zoneId) => {
        const zone = zones.find(z => z.id === zoneId);
        if (!zone) return;
        const isCordoned = zone.cordoned > 0;
        try {
            if (isCordoned) {
                await uniparkApi.releaseZone(zoneId);
                triggerToast(`${zone.name} — spaces released successfully.`);
            } else {
                await uniparkApi.cordonZone(zoneId);
                triggerToast(`${zone.name} — zone cordoned off.`);
            }
            await loadLiveData();
        } catch (err) {
            triggerToast(`Failed: ${err.message}`, 'error');
        }
    };

    const handleAddReservation = async (resData) => {
        // Find zone ID from zone name
        const zone = zones.find(z => z.name === resData.zone);
        if (!zone) {
            triggerToast('Zone not found.', 'error');
            return;
        }
        try {
            const result = await uniparkApi.bulkReserveZone(zone.id, {
                eventName: resData.event,
                numSpaces: parseInt(resData.spaces) || 5,
                eventDate: resData.date,
            });
            setReservations(prev => [result, ...prev]);
            await loadLiveData();
            triggerToast('Event parking reservation successful.');
        } catch (err) {
            triggerToast(`Reservation failed: ${err.message}`, 'error');
        }
    };

    const handleDeleteReservation = async (res) => {
        // If we have space_ids, cancel each space
        if (res.space_ids && res.space_ids.length > 0) {
            try {
                await Promise.all(res.space_ids.map(id => uniparkApi.cancelReservation(id)));
                setReservations(prev => prev.filter(r => r.id !== res.id));
                await loadLiveData();
                triggerToast('Reservation cancelled and spots released.');
            } catch (err) {
                triggerToast(`Cancel failed: ${err.message}`, 'error');
            }
        } else if (res.id && !res.id.startsWith('res-')) {
            // Single space ID from the reservations list
            try {
                await uniparkApi.cancelReservation(res.id);
                setReservations(prev => prev.filter(r => r.id !== res.id));
                await loadLiveData();
                triggerToast('Reservation cancelled and spot released.');
            } catch (err) {
                triggerToast(`Cancel failed: ${err.message}`, 'error');
            }
        } else {
            // Optimistic remove if no backend ID
            setReservations(prev => prev.filter(r => r.id !== res.id));
            triggerToast('Reservation removed.');
        }
    };

    const handleCreateAnnouncement = async (annData) => {
        if (zones.length === 0) {
            triggerToast('No zones available — please ensure parking zones are set up.', 'error');
            return;
        }
        const targetZoneId = zones[0].id;
        try {
            const result = await uniparkApi.createAlert({
                parking_zone_id: targetZoneId,
                alert_type: annData.title,
                message: annData.message,
                severity: annData.severity || 'low',
                zone_context: 'All Zones',
            });
            setAnnouncements(prev => [mapAlert(result), ...prev]);
            triggerToast('Institution-wide announcement published.');
        } catch (err) {
            triggerToast(`Failed to publish: ${err.message}`, 'error');
        }
    };

    const handleDismissAnnouncement = async (ann) => {
        try {
            await uniparkApi.resolveAlert(ann.id, 'Dismissed by admin');
            setAnnouncements(prev => prev.filter(a => a.id !== ann.id));
            triggerToast('Announcement dismissed.');
        } catch (err) {
            // Optimistic remove even on error
            setAnnouncements(prev => prev.filter(a => a.id !== ann.id));
            triggerToast('Announcement removed.');
        }
    };

    const handleDismissOverstay = async (plate) => {
        try {
            await uniparkApi.logVehicleExit({ vehicle_registration: plate });
            setLogs(prev => prev.map(log =>
                log.plate === plate
                    ? { ...log, status: 'Exited', exit: new Date().toLocaleString() }
                    : log
            ));
            triggerToast('Overstay dismissed — vehicle marked as exited.');
        } catch (err) {
            // Fallback: optimistic local update
            setLogs(prev => prev.map(log =>
                log.plate === plate
                    ? { ...log, status: 'Exited', exit: new Date().toLocaleString() }
                    : log
            ));
            triggerToast('Overstay alert dismissed.');
        }
    };

    const handleSignOut = () => {
        logout();
        navigate('/login');
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col antialiased">
            {/* Top Bar */}
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
                    {/* Live refresh indicator */}
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        Live • 30s refresh
                    </div>

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
                {/* Sidebar */}
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

                    {/* Sidebar bottom */}
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

                {/* Content */}
                <main className="flex-1 bg-gray-50 px-6 py-8 md:px-10 overflow-y-auto">
                    {/* Toast notification */}
                    {toastMessage && (
                        <div className={`mb-6 p-4 rounded-xl border text-sm flex items-center gap-3 shadow-lg animate-bounce ${toastType === 'error'
                            ? 'border-rose-300 bg-rose-50 text-rose-700 shadow-rose-900/15'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-emerald-900/15'
                            }`}>
                            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-white text-xs font-bold ${toastType === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                                {toastType === 'error' ? '!' : '✓'}
                            </span>
                            <span>{toastMessage}</span>
                        </div>
                    )}

                    {/* Loading skeleton */}
                    {loading && (
                        <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
                            <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span className="text-sm font-medium">Loading dashboard data…</span>
                        </div>
                    )}

                    {!loading && (
                        <>
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
                                    onAddReservation={handleAddReservation}
                                    onDeleteReservation={handleDeleteReservation}
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
                                    onDismiss={handleDismissOverstay}
                                    triggerToast={triggerToast}
                                />
                            )}

                            {activeTab === 'announcements' && (
                                <AnnouncementsTab
                                    announcements={announcements}
                                    setAnnouncements={setAnnouncements}
                                    zones={zones}
                                    onCreateAnnouncement={handleCreateAnnouncement}
                                    onDismissAnnouncement={handleDismissAnnouncement}
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
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
