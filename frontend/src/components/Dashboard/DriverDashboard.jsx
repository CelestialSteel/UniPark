import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ASSETS } from '../../constants/assets';

// Tabs
import DriverHomeTab from './Driver/DriverHomeTab';
import DriverZonesTab from './Driver/DriverZonesTab';
import DriverLogsTab from './Driver/DriverLogsTab';
import DriverProfileTab from './Driver/DriverProfileTab';

const NAV_ITEMS = [
    {
        id: 'home',
        label: 'Home Feed',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    },
    {
        id: 'zones',
        label: 'Parking Zones',
        icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
    },
    {
        id: 'logs',
        label: 'Activity Logs',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    },
];

export default function DriverDashboard({ defaultTab = 'home' }) {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const [activeTab, setActiveTab] = useState(defaultTab);
    const [toastMessage, setToastMessage] = useState('');
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    // Sync active tab if defaultTab prop changes (e.g. on direct router hits)
    useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab]);

    const triggerToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
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
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" fill="none" />
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
                        <span className="text-xl font-bold text-blue-700">UniPark</span>
                        <span className="ml-2 hidden sm:inline text-xs py-0.5 px-2 bg-blue-100 text-blue-700 rounded-full border border-blue-200 font-medium">
                            Driver Portal
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Notification Bell */}
                    <button
                        onClick={() => alert('Notifications: You have no unread parking alerts.')}
                        type="button"
                        className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:text-gray-700 transition hover:bg-slate-100 cursor-pointer"
                        title="Notifications"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
                        </svg>
                        <span className="absolute top-2.5 right-2.5 flex h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
                    </button>

                    {/* User Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-600 hover:text-gray-800 transition focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer overflow-hidden"
                            title="Profile Settings"
                        >
                            {user?.image ? (
                                <img src={user.image} alt="Driver Profile" className="h-full w-full rounded-full object-cover" />
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
                                                    {(user?.name || 'DR').split(' ').map(n => n[0]).join('')}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name || 'Alex Driver'}</p>
                                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-full">{user?.email || '12345'}</p>
                                        <span className="inline-flex mt-2 text-[10px] py-0.5 px-2.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 font-semibold uppercase tracking-wider">
                                            {user?.department || 'Faculty of IT'}
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

                    {/* Sidebar bottom: Profile & Support / Sign Out */}
                    <div className="mt-auto pt-6 border-t border-gray-200">
                        <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 mb-5 text-left">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Support</p>
                            <p className="mt-1 text-[11px] text-slate-500 leading-normal">
                                Facing issues with a zone? Contact security.
                            </p>
                            <button
                                type="button"
                                onClick={() => alert('Support ticket raised. Security patrol officer notified.')}
                                className="mt-3 w-full bg-white border border-slate-200 text-slate-700 rounded-lg py-2 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer shadow-xs"
                            >
                                Help Center
                            </button>
                        </div>

                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition cursor-pointer mb-1 ${activeTab === 'profile'
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
                        <DriverHomeTab
                            user={user}
                            setActiveTab={setActiveTab}
                        />
                    )}
                    {activeTab === 'zones' && (
                        <DriverZonesTab />
                    )}
                    {activeTab === 'logs' && (
                        <DriverLogsTab />
                    )}
                    {activeTab === 'profile' && (
                        <DriverProfileTab
                            triggerToast={triggerToast}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}
