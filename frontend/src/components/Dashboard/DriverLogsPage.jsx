import { useState, useMemo } from 'react';
import Sidebar from './Sidebar';
import { Link } from 'react-router-dom';

// Predefined mock logs data matching the user's request with specified zones
const INITIAL_LOGS = [
    {
        id: 'log-1',
        status: 'Active Now',
        zone: 'Front library',
        location: 'Phase 1 Area',
        timeDetails: {
            main: 'In: 08:45 AM',
            sub: '2h 15m elapsed',
            isElapsed: true,
            entry: '08:45 AM',
            exit: null,
            date: 'Today'
        },
        vehicle: 'Tesla Model 3',
        plate: 'ABC-1234',
        fineAmount: 0,
        fee: 0,
    },
    {
        id: 'log-2',
        status: 'Completed',
        zone: 'MSB parking',
        location: 'Management Science Building',
        timeDetails: {
            main: '09:00 AM - 11:30 AM',
            sub: '2h 30m total',
            isElapsed: false,
            entry: '09:00 AM',
            exit: '11:30 AM',
            date: 'Today'
        },
        vehicle: 'Toyota Camry',
        plate: 'XYZ-9876',
        fineAmount: 0,
        fee: 150, // in KES
    },
    {
        id: 'log-3',
        status: 'Violation',
        zone: 'Phase 1 parking',
        location: 'Main Campus Area',
        timeDetails: {
            main: 'Overstayed',
            sub: 'Expired: 01:15 PM',
            isElapsed: false,
            entry: '05:15 AM',
            exit: '01:15 PM (Expired)',
            date: 'Today'
        },
        vehicle: 'Honda Civic',
        plate: 'LMN-5544',
        fineAmount: 500, // 500 KES fine
        fee: 200,
    },
    {
        id: 'log-4',
        status: 'Completed',
        zone: 'Front library',
        location: 'Phase 1 Area',
        timeDetails: {
            main: 'Yesterday, 02:45 PM',
            sub: '45m total',
            isElapsed: false,
            entry: '02:45 PM',
            exit: '03:30 PM',
            date: 'Yesterday'
        },
        vehicle: 'Ford F-150',
        plate: 'TRK-2211',
        fineAmount: 0,
        fee: 100,
    },
    {
        id: 'log-5',
        status: 'Completed',
        zone: 'MSB parking',
        location: 'Management Science Building',
        timeDetails: {
            main: 'Jun 24, 10:15 AM - 01:30 PM',
            sub: '3h 15m total',
            isElapsed: false,
            entry: '10:15 AM',
            exit: '01:30 PM',
            date: 'Jun 24, 2026'
        },
        vehicle: 'Toyota Camry',
        plate: 'XYZ-9876',
        fineAmount: 0,
        fee: 200,
    },
    {
        id: 'log-6',
        status: 'Completed',
        zone: 'Phase 1 parking',
        location: 'Main Campus Area',
        timeDetails: {
            main: 'Jun 23, 07:30 AM - 12:00 PM',
            sub: '4h 30m total',
            isElapsed: false,
            entry: '07:30 AM',
            exit: '12:00 PM',
            date: 'Jun 23, 2026'
        },
        vehicle: 'Honda Civic',
        plate: 'LMN-5544',
        fineAmount: 0,
        fee: 250,
    }
];

export default function DriverLogsPage() {
    const [logs, setLogs] = useState(INITIAL_LOGS);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Active Now', 'Completed', 'Violation'
    const [timeFilter, setTimeFilter] = useState('Last 30 Days'); // 'Last 30 Days', 'Last 7 Days', 'Today'
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showTimeDropdown, setShowTimeDropdown] = useState(false);

    // Modal State
    const [selectedLog, setSelectedLog] = useState(null);
    const [modalType, setModalType] = useState(''); // 'details', 'receipt', 'payment'
    const [isPaying, setIsPaying] = useState(false);
    const [paymentPhone, setPaymentPhone] = useState('');
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    // Filter and search logic
    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            // Search match
            const matchesSearch =
                log.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.plate.toLowerCase().includes(searchQuery.toLowerCase());

            // Status match
            const matchesStatus = statusFilter === 'All' || log.status === statusFilter;

            // Time filter match
            let matchesTime = true;
            if (timeFilter === 'Today') {
                matchesTime = log.timeDetails.date === 'Today';
            } else if (timeFilter === 'Last 7 Days') {
                matchesTime = log.timeDetails.date === 'Today' || log.timeDetails.date === 'Yesterday';
            }

            return matchesSearch && matchesStatus && matchesTime;
        });
    }, [logs, searchQuery, statusFilter, timeFilter]);

    // Handle M-Pesa payment submission
    const handlePayFine = (e) => {
        e.preventDefault();
        if (!paymentPhone) return;

        setIsPaying(true);
        // Simulate STK push
        setTimeout(() => {
            setIsPaying(false);
            setPaymentSuccess(true);

            // After short delay, update the log item to completed/resolved violation
            setTimeout(() => {
                setLogs((prevLogs) =>
                    prevLogs.map((item) => {
                        if (item.id === selectedLog.id) {
                            return {
                                ...item,
                                status: 'Completed',
                                fineAmount: 0,
                                timeDetails: {
                                    ...item.timeDetails,
                                    main: 'Paid & Completed Today',
                                    sub: 'resolved'
                                }
                            };
                        }
                        return item;
                    })
                );
                closeModal();
            }, 1500);
        }, 2000);
    };

    const openModal = (log, type) => {
        setSelectedLog(log);
        setModalType(type);
        setPaymentSuccess(false);
        setPaymentPhone('');
    };

    const closeModal = () => {
        setSelectedLog(null);
        setModalType('');
    };

    return (
        <div className="min-h-screen bg-[#f4f7fb] text-slate-900 font-sans">
            <div className="flex min-h-screen">
                {/* Sidebar */}
                <Sidebar activePage="logs" />

                {/* Main Content */}
                <main className="flex-1 px-6 py-6 sm:px-8 lg:px-10">
                    <div className="mx-auto max-w-6xl">
                        {/* Header */}
                        <header className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">Parking Logs</h1>
                                <p className="mt-1 text-sm text-slate-600">Track and review your parking history at Strathmore Campus.</p>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Notification Bell */}
                                <button type="button" className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 cursor-pointer">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
                                    </svg>
                                    <span className="absolute top-2 right-2.5 flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#f4f7fb]" />
                                </button>
                                {/* User avatar */}
                                <Link to="/dashboard/driver/profile" className="h-9 w-9 overflow-hidden rounded-md border border-slate-200 bg-slate-100 shadow-sm cursor-pointer hover:opacity-85 transition">
                                    <img src="https://i.pravatar.cc/80?img=12" alt="User avatar" className="h-full w-full object-cover" />
                                </Link>
                            </div>
                        </header>

                        {/* Search and Filters panel */}
                        <div className="mb-6 flex flex-wrap items-center gap-3">
                            {/* Search Input */}
                            <div className="relative flex-1 min-w-[280px]">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search by vehicle, zone, or plate..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition shadow-sm"
                                />
                            </div>

                            {/* Filter by Status Button */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setShowFilterDropdown(!showFilterDropdown);
                                        setShowTimeDropdown(false);
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition cursor-pointer shadow-sm ${
                                        statusFilter !== 'All' 
                                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v3.2a1 1 0 01-.293.707L12 11.414V17a1 1 0 01-.447.894l-2 1.333a1 1 0 01-1.553-.894V11.414L3.293 7.907A1 1 0 013 7.2V4z" />
                                    </svg>
                                    <span>Status: {statusFilter}</span>
                                </button>
                                {showFilterDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
                                        {['All', 'Active Now', 'Completed', 'Violation'].map((st) => (
                                            <button
                                                key={st}
                                                onClick={() => {
                                                    setStatusFilter(st);
                                                    setShowFilterDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 cursor-pointer ${
                                                    statusFilter === st ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'
                                                }`}
                                            >
                                                {st}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Date Filter Button */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setShowTimeDropdown(!showTimeDropdown);
                                        setShowFilterDropdown(false);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-sm"
                                >
                                    <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>{timeFilter}</span>
                                </button>
                                {showTimeDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
                                        {['Today', 'Last 7 Days', 'Last 30 Days'].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => {
                                                    setTimeFilter(t);
                                                    setShowTimeDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 cursor-pointer ${
                                                    timeFilter === t ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'
                                                }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Export / Download Button */}
                            <button 
                                onClick={() => alert('Logs downloaded successfully in CSV/PDF format!')}
                                className="flex items-center justify-center p-2 bg-blue-600 border border-blue-600 rounded-lg text-white hover:bg-blue-700 transition cursor-pointer shadow-sm"
                                aria-label="Export Logs"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>
                        </div>

                        {/* Logs Table Card */}
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Zone & Location</th>
                                            <th className="px-6 py-4">Time Details</th>
                                            <th className="px-6 py-4">Vehicle</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredLogs.length > 0 ? (
                                            filteredLogs.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                                    {/* Status */}
                                                    <td className="px-6 py-4.5 whitespace-nowrap">
                                                        {item.status === 'Active Now' && (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 border border-green-200/60">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                                Active Now
                                                            </span>
                                                        )}
                                                        {item.status === 'Completed' && (
                                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200/50">
                                                                Completed
                                                            </span>
                                                        )}
                                                        {item.status === 'Violation' && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 border border-red-200/60">
                                                                <svg className="h-3 w-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                </svg>
                                                                Violation
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Zone & Location */}
                                                    <td className="px-6 py-4.5">
                                                        <div>
                                                            <p className="font-semibold text-slate-800 text-sm">{item.zone}</p>
                                                            <p className="text-xs text-slate-500 mt-0.5">{item.location}</p>
                                                        </div>
                                                    </td>

                                                    {/* Time Details */}
                                                    <td className="px-6 py-4.5">
                                                        <div>
                                                            {item.status === 'Violation' ? (
                                                                <p className="text-sm font-semibold text-red-600">{item.timeDetails.main}</p>
                                                            ) : (
                                                                <p className="text-sm text-slate-800">{item.timeDetails.main}</p>
                                                            )}
                                                            <p className={`text-xs mt-0.5 ${
                                                                item.timeDetails.isElapsed 
                                                                    ? 'text-blue-600 italic font-semibold' 
                                                                    : 'text-slate-500'
                                                            }`}>
                                                                {item.timeDetails.sub}
                                                            </p>
                                                        </div>
                                                    </td>

                                                    {/* Vehicle */}
                                                    <td className="px-6 py-4.5">
                                                        <div>
                                                            <p className="font-semibold text-slate-800 text-sm">{item.vehicle}</p>
                                                            <p className="text-xs text-slate-500 mt-0.5">{item.plate}</p>
                                                        </div>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-6 py-4.5 text-right whitespace-nowrap">
                                                        {item.status === 'Active Now' && (
                                                            <button 
                                                                onClick={() => openModal(item, 'details')}
                                                                className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                                            >
                                                                Details
                                                            </button>
                                                        )}
                                                        {item.status === 'Completed' && (
                                                            <div className="flex justify-end gap-3.5">
                                                                <button 
                                                                    onClick={() => openModal(item, 'details')}
                                                                    className="text-sm font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                                                                >
                                                                    Details
                                                                </button>
                                                                <button 
                                                                    onClick={() => openModal(item, 'receipt')}
                                                                    className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                                                                >
                                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                    </svg>
                                                                    <span>Receipt</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                        {item.status === 'Violation' && (
                                                            <div className="flex items-center justify-end gap-3.5">
                                                                <button 
                                                                    onClick={() => openModal(item, 'details')}
                                                                    className="text-sm font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                                                                >
                                                                    Details
                                                                </button>
                                                                <button 
                                                                    onClick={() => openModal(item, 'payment')}
                                                                    className="bg-red-700 text-white rounded-lg px-4 py-1.5 text-xs font-semibold hover:bg-red-800 transition cursor-pointer shadow"
                                                                >
                                                                    Pay Now
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                                    No logs found matching your filters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination matching mockup */}
                            <div className="flex flex-wrap items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 gap-4 text-xs font-semibold text-slate-500">
                                <span>Showing 1-{filteredLogs.length} of {filteredLogs.length} entries</span>
                                
                                <div className="flex items-center gap-1">
                                    <button className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer text-slate-400">
                                        ‹
                                    </button>
                                    <button className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm font-bold">
                                        1
                                    </button>
                                    <button className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer">
                                        2
                                    </button>
                                    <button className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer">
                                        3
                                    </button>
                                    <span className="px-1 text-slate-400">...</span>
                                    <button className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer">
                                        25
                                    </button>
                                    <button className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer text-slate-400">
                                        ›
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* MODAL SYSTEM */}
            {selectedLog && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal} />
                    
                    {/* Modal Box */}
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden relative z-10 animate-in fade-in zoom-in duration-200">
                        
                        {/* Close button */}
                        <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1.5 rounded-full hover:bg-slate-100">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Details Modal */}
                        {modalType === 'details' && (
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-slate-900 mb-4">Parking Details</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-sm text-slate-500 font-medium">Status</span>
                                        <span className={`text-sm font-semibold ${selectedLog.status === 'Active Now' ? 'text-green-600' : 'text-slate-700'}`}>
                                            {selectedLog.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-sm text-slate-500 font-medium">Parking Zone</span>
                                        <span className="text-sm font-semibold text-slate-800">{selectedLog.zone}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-sm text-slate-500 font-medium">Location</span>
                                        <span className="text-sm font-semibold text-slate-800">{selectedLog.location}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-sm text-slate-500 font-medium">Vehicle</span>
                                        <span className="text-sm font-semibold text-slate-800">{selectedLog.vehicle}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-sm text-slate-500 font-medium">Plate Number</span>
                                        <span className="text-sm font-mono font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{selectedLog.plate}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-sm text-slate-500 font-medium">Arrival Time</span>
                                        <span className="text-sm font-semibold text-slate-800">{selectedLog.timeDetails.entry}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-sm text-slate-500 font-medium">Exit Time</span>
                                        <span className="text-sm font-semibold text-slate-800">{selectedLog.timeDetails.exit || 'N/A (Active Session)'}</span>
                                    </div>
                                </div>
                                <button onClick={closeModal} className="mt-6 w-full bg-slate-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-slate-800 transition cursor-pointer">
                                    Close Details
                                </button>
                            </div>
                        )}

                        {/* Receipt Modal */}
                        {modalType === 'receipt' && (
                            <div className="p-6">
                                <div className="text-center mb-6">
                                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700 text-xl font-bold mb-2">P</div>
                                    <h4 className="text-base font-bold text-slate-900">Strathmore University</h4>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">UniPark Parking Receipt</p>
                                </div>
                                <div className="border-y border-dashed border-slate-200 py-4 my-4 space-y-2.5 font-mono text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Receipt ID</span>
                                        <span className="font-semibold text-slate-800">REC-{(selectedLog.id).toUpperCase()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Date</span>
                                        <span className="font-semibold text-slate-800">{selectedLog.timeDetails.date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Zone</span>
                                        <span className="font-semibold text-slate-800">{selectedLog.zone}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Vehicle</span>
                                        <span className="font-semibold text-slate-800">{selectedLog.vehicle} ({selectedLog.plate})</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">In</span>
                                        <span className="font-semibold text-slate-800">{selectedLog.timeDetails.entry}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Out</span>
                                        <span className="font-semibold text-slate-800">{selectedLog.timeDetails.exit}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-dashed border-slate-200 pt-2.5 text-sm">
                                        <span className="font-bold text-slate-800">Total Fee</span>
                                        <span className="font-bold text-blue-700">KES {selectedLog.fee}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => { alert('Receipt print triggered!'); closeModal(); }} 
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg py-2.5 text-xs font-semibold transition cursor-pointer"
                                    >
                                        Print
                                    </button>
                                    <button 
                                        onClick={() => { alert('Downloading receipt PDF...'); closeModal(); }}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-xs font-semibold transition cursor-pointer shadow-sm"
                                    >
                                        Download PDF
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Payment Modal */}
                        {modalType === 'payment' && (
                            <div className="p-6">
                                <div className="text-center mb-6">
                                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 text-xl font-bold mb-2">!</div>
                                    <h4 className="text-lg font-bold text-slate-900">Resolve Parking Violation</h4>
                                    <p className="text-xs text-slate-500">Overstay violation fine in {selectedLog.zone}</p>
                                </div>
                                
                                {paymentSuccess ? (
                                    <div className="text-center py-6 space-y-3">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600 text-2xl font-bold animate-bounce">
                                            ✓
                                        </div>
                                        <h5 className="text-base font-bold text-slate-800">Payment Initiated</h5>
                                        <p className="text-xs text-slate-500 px-4">
                                            Please check your phone for the M-Pesa push prompt. Complete the payment by entering your PIN.
                                        </p>
                                    </div>
                                ) : (
                                    <form onSubmit={handlePayFine} className="space-y-4">
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                                            <div className="flex justify-between text-xs text-slate-500 font-medium">
                                                <span>Standard Parking Fee:</span>
                                                <span>KES {selectedLog.fee}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-red-600 font-bold">
                                                <span>Overstay Fine:</span>
                                                <span>KES {selectedLog.fineAmount}</span>
                                            </div>
                                            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-800">
                                                <span>Total Amount Due:</span>
                                                <span>KES {selectedLog.fee + selectedLog.fineAmount}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-2">
                                                Enter M-PESA Phone Number
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 font-semibold text-sm">
                                                    +254
                                                </span>
                                                <input
                                                    type="tel"
                                                    required
                                                    placeholder="712345678"
                                                    value={paymentPhone}
                                                    onChange={(e) => setPaymentPhone(e.target.value.replace(/\D/g, ''))}
                                                    className="w-full pl-14 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                                                />
                                            </div>
                                        </div>

                                        <button 
                                            type="submit"
                                            disabled={isPaying}
                                            className="w-full bg-red-700 hover:bg-red-800 text-white rounded-lg py-2.5 text-sm font-semibold transition cursor-pointer shadow disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isPaying ? 'Connecting to M-Pesa...' : 'Pay with M-Pesa STK'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
