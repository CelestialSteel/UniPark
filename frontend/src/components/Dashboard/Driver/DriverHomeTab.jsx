import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function getAccessToken() {
    try {
        const rawTokens = localStorage.getItem('unipark_auth_tokens');
        if (!rawTokens) {
            return null;
        }

        const parsedTokens = JSON.parse(rawTokens);
        return parsedTokens.access_token || null;
    } catch {
        return null;
    }
}

function StatBox({ label, value }) {
    return (
        <div className="rounded-xl bg-slate-50 px-4 py-3 shadow-xs border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
        </div>
    );
}

export default function DriverHomeTab({ user, setActiveTab }) {
    const [duration, setDuration] = useState('01:27:12');
    const [driverProfile, setDriverProfile] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [profileError, setProfileError] = useState('');

    // Simulate ticking parking duration
    useEffect(() => {
        const interval = setInterval(() => {
            const parts = duration.split(':').map(Number);
            let h = parts[0], m = parts[1], s = parts[2];
            s++;
            if (s >= 60) {
                s = 0;
                m++;
                if (m >= 60) {
                    m = 0;
                    h++;
                }
            }
            const pad = (n) => String(n).padStart(2, '0');
            setDuration(`${pad(h)}:${pad(m)}:${pad(s)}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [duration]);

    useEffect(() => {
        const accessToken = getAccessToken();

        if (!accessToken) {
            setIsLoadingProfile(false);
            setDriverProfile(null);
            return;
        }

        let isMounted = true;

        const loadDriverProfile = async () => {
            try {
                setIsLoadingProfile(true);
                setProfileError('');

                const response = await fetch(`${API_BASE_URL}/api/v1/drivers/profile`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Unable to load driver profile');
                }

                const profile = await response.json();
                if (isMounted) {
                    setDriverProfile(profile);
                }
            } catch {
                if (isMounted) {
                    setDriverProfile(null);
                    setProfileError('Vehicle status is unavailable right now.');
                }
            } finally {
                if (isMounted) {
                    setIsLoadingProfile(false);
                }
            }
        };

        loadDriverProfile();

        return () => {
            isMounted = false;
        };
    }, []);

    const activeVehicleCount = driverProfile?.active_vehicles ?? 0;
    const hasLinkedVehicle = activeVehicleCount > 0;

    const recentActivities = [
        { zone: 'Front Library', date: 'Jun 30, 2026', duration: '04:22:00', status: 'COMPLETED' },
        { zone: 'MSB Parking', date: 'Jun 28, 2026', duration: '02:15:00', status: 'COMPLETED' },
        { zone: 'Sports Complex Lot', date: 'Jun 25, 2026', duration: '08:45:00', status: 'OVERSTAY' },
    ];

    return (
        <div className="space-y-6">
            {/* Header section with driver welcome banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                        Welcome back, {user?.name?.split(' ')[0] || 'Alex'}
                    </h1>
                    <p className="text-gray-500 mt-1">Your Strathmore parking permit is currently active.</p>
                </div>
            </div>

            {/* Active Parking Session */}
            {isLoadingProfile ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-semibold text-slate-700">Loading your vehicle status...</p>
                </div>
            ) : hasLinkedVehicle ? (
                <div className="rounded-2xl border-2 border-blue-700 bg-white p-6 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
                        <span className="h-2 w-2 rounded-full bg-blue-700 animate-pulse" />
                        Current Active Session
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Vehicle linked successfully</h2>

                    <div className="mt-6 grid gap-4 md:grid-cols-[repeat(3,minmax(0,1fr))_auto] md:items-center">
                        <StatBox label="Linked Vehicles" value={`${activeVehicleCount} active`} />
                        <StatBox label="Checked In At" value="Available after entry log" />
                        <StatBox label="Current Duration" value={duration} />

                        <button
                            onClick={() => alert('Car locator beacon triggered! GPS coordinates sent to your device.')}
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-500/15 transition cursor-pointer md:self-center"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Find My Car
                        </button>
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <span className="h-2 w-2 rounded-full bg-slate-400" />
                        No linked vehicle found
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">You do not have a vehicle linked to your account yet.</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Vehicle details will stay hidden until you link a car in the database.
                    </p>
                    {profileError && (
                        <p className="mt-3 text-sm text-amber-700">{profileError}</p>
                    )}
                    <div className="mt-5 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => setActiveTab('profile')}
                            className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
                        >
                            Go to Profile
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('zones')}
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            Browse Parking Zones
                        </button>
                    </div>
                </div>
            )}

            {/* Two Column details list */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Quick actions (2/3 width) */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">Quick Tools</h3>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <button
                            onClick={() => setActiveTab('zones')}
                            className="flex items-center justify-between p-4.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition text-left cursor-pointer"
                        >
                            <span className="flex items-center gap-3 font-semibold text-slate-700 text-sm">
                                <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                Find Parking Lot
                            </span>
                            <span className="text-slate-400 text-base font-bold">&rsaquo;</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('logs')}
                            className="flex items-center justify-between p-4.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition text-left cursor-pointer"
                        >
                            <span className="flex items-center gap-3 font-semibold text-slate-700 text-sm">
                                <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                View Entry/Exit Logs
                            </span>
                            <span className="text-slate-400 text-base font-bold">&rsaquo;</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('profile')}
                            className="flex items-center justify-between p-4.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition text-left cursor-pointer"
                        >
                            <span className="flex items-center gap-3 font-semibold text-slate-700 text-sm">
                                <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Profile Settings
                            </span>
                            <span className="text-slate-400 text-base font-bold">&rsaquo;</span>
                        </button>

                        <button
                            onClick={() => alert('Support ticket raised. Security patrol officer notified.')}
                            className="flex items-center justify-between p-4.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition text-left cursor-pointer"
                        >
                            <span className="flex items-center gap-3 font-semibold text-slate-700 text-sm">
                                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Report Parking Issue
                            </span>
                            <span className="text-slate-400 text-base font-bold">&rsaquo;</span>
                        </button>
                    </div>
                </div>

                {/* Recent Activities (1/3 width) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>

                    <div className="space-y-3.5 divide-y divide-slate-50">
                        {recentActivities.map((act, index) => (
                            <div key={index} className="pt-3 first:pt-0 flex justify-between items-center text-xs">
                                <div>
                                    <h4 className="font-bold text-slate-800">{act.zone}</h4>
                                    <p className="text-gray-400 font-medium mt-0.5">{act.date} &bull; {act.duration}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded font-bold border text-[9px] ${act.status === 'COMPLETED'
                                        ? 'bg-slate-50 border-slate-200 text-slate-500'
                                        : 'bg-red-50 border-red-100 text-red-700'
                                    }`}>
                                    {act.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
