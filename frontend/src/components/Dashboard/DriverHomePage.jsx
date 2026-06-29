import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

const recentActivities = [
    { zone: 'Engineering Lab ', date: 'Jun 15, 2025', duration: '04:22:00', status: 'COMPLETED' },
    { zone: 'Library West', date: 'Jun 15, 2025', duration: '02:15:00', status: 'COMPLETED' },
    { zone: 'Student Union', date: 'Jun 10, 2025', duration: '00:45:00', status: 'EXPIRED' },
];

function StatBox({ label, value }) {
    return (
        <div className="rounded-lg bg-slate-50 px-4 py-3 shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
        </div>
    );
}

function formatClock(date) {
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    }).format(date);
}

export default function DriverHomePage() {
    const [currentTime, setCurrentTime] = useState(() => new Date());

    useEffect(() => {
        const timerId = window.setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => window.clearInterval(timerId);
    }, []);

    return (
        <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
            <div className="flex min-h-screen">
                <Sidebar activePage="home" />

                <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-4xl font-semibold text-slate-900">Welcome back, Alex</h1>
                                <p className="mt-2 text-slate-600">Your campus parking status is currently active.</p>
                            </div>

                            <div className="flex items-center gap-3 rounded-full bg-transparent px-2 py-1 text-right">
                                <div className="text-sm">
                                    <p className="text-slate-700">{formatClock(currentTime).split(', ').slice(0, 2).join(', ')}</p>
                                    <p className="text-blue-700">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</p>
                                </div>
                                <Link 
                                    to="/dashboard/driver/profile" 
                                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 transition duration-150 ease-in-out cursor-pointer"
                                    aria-label="View Profile"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="8" r="4" fill="none" strokeWidth="2" /></svg>
                                </Link>
                            </div>
                        </header>

                        <section className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
                            <div className="rounded-2xl border border-blue-700 bg-white p-6 shadow-sm">
                                <div className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-blue-700">
                                    <span className="h-2 w-2 rounded-full bg-blue-700" /> Current Session
                                </div>
                                <h2 className="text-2xl font-medium text-slate-900">Zone B-42: Library Lot</h2>

                                <div className="mt-6 grid gap-4 md:grid-cols-[repeat(3,minmax(0,1fr))_auto] md:items-center">
                                    <StatBox label="Vehicle" value="ABC-1234 (Tesla M3)" />
                                    <StatBox label="Arrival" value="08:15 AM" />
                                    <StatBox label="Duration" value="01:27:12" />

                                    <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-4 font-medium text-white shadow-lg transition hover:bg-blue-800 md:self-center">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l7 7-7 7-7-7 7-7z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v13" /></svg>
                                        Find My Car
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="text-lg font-medium text-slate-900">Quick Actions</h2>
                                <div className="mt-5 space-y-4">
                                    <button type="button" className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-4 text-left transition hover:bg-slate-100">
                                        <span className="flex items-center gap-3 text-slate-800">
                                            <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4V20M17 8l4 4-4 4M7 8l-4 4 4 4" /></svg>
                                            Find Parking
                                        </span>
                                        <span className="text-slate-400">›</span>
                                    </button>
                                    <button type="button" className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-4 text-left transition hover:bg-slate-100">
                                        <span className="flex items-center gap-3 text-slate-800">
                                            <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v8M8 12h8" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h16v16H4z" /></svg>
                                            Register Vehicle
                                        </span>
                                        <span className="text-slate-400">›</span>
                                    </button>
                                </div>
                                <div className="mt-6 border-t border-slate-200 pt-4">
                                    <Link to="#" className="text-sm font-medium text-blue-700 hover:text-blue-800">
                                        View Permit Details ↗
                                    </Link>
                                </div>
                            </div>
                        </section>

                        <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                                    <h2 className="text-xl font-medium text-slate-900">Recent Activity</h2>
                                    <span className="text-slate-500">⋮</span>
                                </div>

                                <div className="overflow-hidden">
                                    <div className="grid grid-cols-4 gap-4 border-b border-slate-200 px-6 py-4 text-sm text-slate-600">
                                        <span>Zone</span>
                                        <span>Date</span>
                                        <span>Duration</span>
                                        <span>Status</span>
                                    </div>
                                    {recentActivities.map((item) => (
                                        <div key={`${item.zone}-${item.date}`} className="grid grid-cols-4 gap-4 border-b border-slate-200 px-6 py-5 text-sm text-slate-700 last:border-b-0">
                                            <span>{item.zone}</span>
                                            <span>{item.date}</span>
                                            <span>{item.duration}</span>
                                            <span>
                                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${item.status === 'EXPIRED' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-slate-600'}`}>
                                                    {item.status}
                                                </span>
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-slate-200 px-6 py-4 text-center">
                                    <Link to="#" className="text-sm font-medium text-blue-700 hover:text-blue-800">
                                        View Full History
                                    </Link>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="relative min-h-[380px] bg-gradient-to-br from-slate-600 via-slate-500 to-slate-700 p-5 text-white">
                                    <div className="absolute right-4 top-4 rounded-full bg-white px-4 py-1 text-xs font-medium text-slate-900 shadow">
                                        GPS: ACTIVE
                                    </div>

                                    <div className="mt-40 max-w-xs">
                                        <h3 className="text-lg font-medium">Live Availability</h3>
                                        <p className="mt-3 text-sm leading-6 text-slate-100/90">
                                            View real-time space occupancy across campus.
                                        </p>
                                        <button type="button" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow transition hover:bg-slate-100">
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" /></svg>
                                            Open Interactive Map
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}