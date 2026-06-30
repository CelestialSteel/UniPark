import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ASSETS } from '../../constants/assets';

// Tabs
import GuardHomeTab from './Security/GuardHomeTab';
import RegisterVehicleTab from './Security/RegisterVehicleTab';
import LogEntryTab from './Security/LogEntryTab';
import LogExitTab from './Security/LogExitTab';
import ZoneOccupancyTab from './Security/ZoneOccupancyTab';
import ProfileTab from './Security/ProfileTab';
import ContactDriverTab from './Security/ContactDriverTab';

// --- INITIAL MOCK DATA ---
const INITIAL_ZONES = [
    { id: '1', name: 'Phase 1 Lot', code: 'P1', total: 150, occupied: 112, reserved: 15, cordoned: 5, status: 'active' },
    { id: '2', name: 'Phase 2 Lot', code: 'P2', total: 120, occupied: 45, reserved: 5, cordoned: 0, status: 'active' },
    { id: '3', name: 'Siwaka Lot', code: 'SWK', total: 80, occupied: 74, reserved: 4, cordoned: 2, status: 'active' },
    { id: '4', name: 'Library Lot', code: 'LIB', total: 90, occupied: 86, reserved: 2, cordoned: 2, status: 'active' },
    { id: '5', name: 'Management Lot', code: 'MGT', total: 40, occupied: 15, reserved: 20, cordoned: 0, status: 'active' },
    { id: '6', name: 'Sports Complex Lot', code: 'SPC', total: 100, occupied: 12, reserved: 0, cordoned: 45, status: 'active' },
];

const REGISTERED_DRIVERS = [
    { plate: 'KDC 456X', name: 'Dalton Muindi', email: 'dalton.muindi@strathmore.edu', idNumber: '184066', phone: '+254 712 345678', department: 'Faculty of IT', role: 'Student' },
    { plate: 'KBB 123A', name: 'Griffin Sitati', email: 'griffin.sitati@strathmore.edu', idNumber: '191613', phone: '+254 722 987654', department: 'School of Computing', role: 'Student' },
    { plate: 'KCA 789B', name: 'Anthony Khajira', email: 'akhajira@strathmore.ac.ke', idNumber: 'SU-4009', phone: '+254 733 111222', department: 'Academic Staff', role: 'Faculty' },
    { plate: 'KAA 999Z', name: 'David Ochieng', email: 'dochieng@strathmore.edu', idNumber: '175560', phone: '+254 701 999888', department: 'Business School', role: 'Student' },
    { plate: 'KCC 888H', name: 'Mercy Njoroge', email: 'mnjoroge@strathmore.ac.ke', idNumber: 'SU-5034', phone: '+254 715 444333', department: 'Finance Office', role: 'Staff' },
];

const INITIAL_LOGS = [
    { id: 'log-1', plate: 'KDC 456X', driver: 'Dalton Muindi', zone: 'Phase 1 Lot', entry: '2026-06-30 08:15 AM', exit: '--', status: 'Entered' },
    { id: 'log-2', plate: 'KBB 123A', driver: 'Griffin Sitati', zone: 'Library Lot', entry: '2026-06-30 07:30 AM', exit: '2026-06-30 11:45 AM', status: 'Exited' },
    { id: 'log-3', plate: 'KCA 789B', driver: 'Anthony Khajira', zone: 'Management Lot', entry: '2026-06-30 09:00 AM', exit: '--', status: 'Entered' },
    { id: 'log-4', plate: 'KDD 555Y', driver: 'Sharon Wambui', zone: 'Sports Complex Lot', entry: '2026-06-30 06:15 AM', exit: '2026-06-30 10:30 AM', status: 'Exited' },
    { id: 'log-5', plate: 'KAA 999Z', driver: 'David Ochieng', zone: 'Phase 2 Lot', entry: '2026-06-30 07:45 AM', exit: '--', status: 'Entered' },
    { id: 'log-6', plate: 'KCC 888H', driver: 'Mercy Njoroge', zone: 'Siwaka Lot', entry: '2026-06-30 14:00 PM', exit: '--', status: 'Entered' },
];

const NAV_ITEMS = [
    {
        id: 'home',
        label: 'Dashboard Home',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    },
    {
        id: 'register',
        label: 'Register Vehicle',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
        id: 'entry',
        label: 'Log Vehicle Entry',
        icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',
    },
    {
        id: 'exit',
        label: 'Log Vehicle Exit',
        icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
    },
    {
        id: 'occupancy',
        label: 'Zone Occupancy',
        icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    },
    {
        id: 'contact',
        label: 'Contact Driver',
        icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    },
];

export default function SecurityDashboard() {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    // --- STATE ---
    const [activeTab, setActiveTab] = useState('home');
    const [zones, setZones] = useState(INITIAL_ZONES);
    const [registeredDrivers, setRegisteredDrivers] = useState(REGISTERED_DRIVERS);
    const [logs, setLogs] = useState(INITIAL_LOGS);

    // Toast notifications
    const [toastMessage, setToastMessage] = useState('');
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const triggerToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    // --- SHARED METRICS ---
    const metrics = useMemo(() => {
        const total = zones.reduce((sum, z) => sum + z.total, 0);
        const occupied = zones.reduce((sum, z) => sum + z.occupied, 0);
        const reserved = zones.reduce((sum, z) => sum + z.reserved, 0);
        const cordoned = zones.reduce((sum, z) => sum + z.cordoned, 0);
        const available = total - occupied - reserved - cordoned;
        const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

        const parkedNow = logs.filter(l => l.status === 'Entered').length;
        const entriesToday = logs.filter(l => l.entry && l.entry.startsWith('2026-06-30')).length;
        const exitsToday = logs.filter(l => l.exit && l.exit !== '--' && l.exit.startsWith('2026-06-30')).length;

        return { total, occupied, reserved, cordoned, available, occupancyRate, parkedNow, entriesToday, exitsToday };
    }, [zones, logs]);

    // --- ACTION HANDLERS ---
    const handleRegisterVehicle = (newDriver) => {
        // Prevent duplicate plate
        if (registeredDrivers.some(d => d.plate.toUpperCase() === newDriver.plate.toUpperCase())) {
            triggerToast(`Plate number ${newDriver.plate.toUpperCase()} is already registered.`);
            return false;
        }
        setRegisteredDrivers([newDriver, ...registeredDrivers]);
        triggerToast(`Vehicle ${newDriver.plate.toUpperCase()} registered successfully.`);
        return true;
    };

    const handleLogEntry = (plate, zoneName, driverName, role, dept) => {
        // Increment zone occupancy if capacity allows
        let updated = false;
        const updatedZones = zones.map(z => {
            if (z.name === zoneName) {
                if (z.occupied >= z.total) {
                    triggerToast(`Warning: ${z.name} is currently full.`);
                }
                updated = true;
                return { ...z, occupied: z.occupied + 1 };
            }
            return z;
        });

        if (!updated) {
            triggerToast(`Error: Zone ${zoneName} not found.`);
            return false;
        }

        setZones(updatedZones);

        // Add log entry
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        const newLog = {
            id: `log-${Date.now()}`,
            plate: plate.toUpperCase(),
            driver: driverName || 'Guest Visitor',
            zone: zoneName,
            entry: `${dateStr} ${timeStr}`,
            exit: '--',
            status: 'Entered'
        };

        setLogs([newLog, ...logs]);
        triggerToast(`Entry logged for ${plate.toUpperCase()} at ${zoneName}.`);
        return true;
    };

    const handleLogExit = (logId) => {
        const targetLog = logs.find(l => l.id === logId);
        if (!targetLog) return;

        // Decrement zone occupancy
        const updatedZones = zones.map(z => {
            if (z.name === targetLog.zone) {
                return { ...z, occupied: Math.max(0, z.occupied - 1) };
            }
            return z;
        });

        setZones(updatedZones);

        // Update log status
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        const updatedLogs = logs.map(l => {
            if (l.id === logId) {
                return {
                    ...l,
                    exit: `${dateStr} ${timeStr}`,
                    status: 'Exited'
                };
            }
            return l;
        });

        setLogs(updatedLogs);
        triggerToast(`Exit logged for ${targetLog.plate}.`);
    };

    const handleManualOccupancyUpdate = (zoneId, newOccupancy) => {
        const updatedZones = zones.map(z => {
            if (z.id === zoneId) {
                return { ...z, occupied: Math.min(z.total, Math.max(0, newOccupancy)) };
            }
            return z;
        });
        setZones(updatedZones);
        triggerToast(`Occupancy updated manually for zone.`);
    };

    const handleSignOut = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col antialiased">
            {/* Toast Box */}
            {toastMessage && (
                <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 text-white px-5 py-3.5 shadow-2xl border border-slate-800 text-sm font-medium flex items-center gap-2 animate-bounce">
                    <svg className="h-5 w-5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4" />
                    </svg>
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Top Bar / Header */}
            <header className="border-b border-gray-200 bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <div className="UniPark-Logo">
                        <img src={ASSETS.logo} alt="UniPark Logo" className="h-6 w-auto" />
                    </div>
                    <div>
                        <span className="text-xl font-bold text-blue-700">UniPark Security</span>
                        <span className="ml-2 hidden sm:inline text-xs py-0.5 px-2 bg-blue-100 text-blue-700 rounded-full border border-blue-200 font-medium">
                            Main Gate Command
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Active Guards Info badge */}
                    <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 font-medium">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Gate Portal Online
                    </span>

                    {/* User Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-600 hover:text-gray-800 transition focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer overflow-hidden"
                            title="Profile Settings"
                        >
                            {user?.image ? (
                                <img src={user.image} alt="Security Profile" className="h-full w-full rounded-full object-cover" />
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
                                                    {(user?.name || 'SG').split(' ').map(n => n[0]).join('')}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name || 'Officer Guard'}</p>
                                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-full">{user?.email || 'guard@unipark.ac.ke'}</p>
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
                                ? 'bg-blue-700 text-white font-semibold shadow-md shadow-blue-700/10'
                                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                                }`}
                        >
                            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon} />
                            </svg>
                            <span className="flex-1">{item.label}</span>
                        </button>
                    ))}

                    {/* Sidebar bottom: Profile & Sign Out */}
                    <div className="mt-auto pt-4 border-t border-gray-200 space-y-1">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition cursor-pointer ${activeTab === 'profile'
                                ? 'bg-blue-700 text-white font-semibold shadow-md shadow-blue-700/10'
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
                            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition cursor-pointer"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Sign Out</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
                    {activeTab === 'home' && (
                        <GuardHomeTab
                            zones={zones}
                            metrics={metrics}
                            logs={logs}
                            setActiveTab={setActiveTab}
                        />
                    )}
                    {activeTab === 'register' && (
                        <RegisterVehicleTab
                            registeredDrivers={registeredDrivers}
                            onRegister={handleRegisterVehicle}
                        />
                    )}
                    {activeTab === 'entry' && (
                        <LogEntryTab
                            zones={zones}
                            registeredDrivers={registeredDrivers}
                            onLogEntry={handleLogEntry}
                        />
                    )}
                    {activeTab === 'exit' && (
                        <LogExitTab
                            logs={logs}
                            onLogExit={handleLogExit}
                        />
                    )}
                    {activeTab === 'occupancy' && (
                        <ZoneOccupancyTab
                            zones={zones}
                            onUpdateOccupancy={handleManualOccupancyUpdate}
                        />
                    )}
                    {activeTab === 'profile' && (
                        <ProfileTab
                            triggerToast={triggerToast}
                        />
                    )}
                    {activeTab === 'contact' && (
                        <ContactDriverTab
                            registeredDrivers={registeredDrivers}
                            triggerToast={triggerToast}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}
