import React, { useEffect, useMemo, useState } from 'react';
import { uniparkApi } from '../../../utils/uniparkApi';

/**
 * Register Vehicle tab on the security dashboard.
 *
 * - "Registered Driver" mode: live lookup of the driver in the database
 *   by their admission / staff / faculty ID, then live link of the plate
 *   to that driver. The vehicle flows through to the driver's profile
 *   automatically because the API persists to the `vehicles` table.
 * - "Visitor" mode: unchanged mock-submit flow (out of scope for this
 *   change; visitors don't have a driver account to link to).
 */
export default function RegisterVehicleTab() {
    const [registrationMode, setRegistrationMode] = useState('registered'); // 'visitor' | 'registered'

    // Visitor form state (unchanged)
    const [visitorForm, setVisitorForm] = useState({
        plate: '',
        name: '',
        email: '',
        idNumber: '',
        phone: '',
        department: 'Faculty of IT',
        role: 'Student',
    });

    // Registered-driver form state
    const [registeredForm, setRegisteredForm] = useState({
        plate: '',
        admissionId: '',
    });

    // Driver lookup state
    const [lookupState, setLookupState] = useState({
        status: 'idle', // 'idle' | 'searching' | 'found' | 'notfound' | 'error'
        driver: null,
        error: '',
    });

    // Submit state
    const [isLinking, setIsLinking] = useState(false);
    const [linkError, setLinkError] = useState('');

    // Directory state
    const [searchQuery, setSearchQuery] = useState('');
    const [directory, setDirectory] = useState([]);
    const [isLoadingDirectory, setIsLoadingDirectory] = useState(true);
    const [directoryError, setDirectoryError] = useState('');

    // Toast (lifted from parent; this tab is self-contained)
    const [toastMessage, setToastMessage] = useState('');
    const triggerToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    // Initial directory load
    useEffect(() => {
        let isMounted = true;
        const loadDirectory = async () => {
            try {
                setIsLoadingDirectory(true);
                setDirectoryError('');
                const rows = await uniparkApi.getAllVehicles({ limit: 100 });
                if (isMounted) {
                    setDirectory(Array.isArray(rows) ? rows : []);
                }
            } catch (error) {
                if (isMounted) {
                    setDirectory([]);
                    setDirectoryError(error.message || 'Unable to load the authorized directory.');
                }
            } finally {
                if (isMounted) {
                    setIsLoadingDirectory(false);
                }
            }
        };
        loadDirectory();
        return () => {
            isMounted = false;
        };
    }, []);

    // Live driver lookup (debounced) when the admission number changes
    useEffect(() => {
        const raw = registeredForm.admissionId.trim();
        if (registrationMode !== 'registered' || raw.length < 3) {
            setLookupState({ status: 'idle', driver: null, error: '' });
            return;
        }

        let isMounted = true;
        setLookupState((prev) => ({ ...prev, status: 'searching', error: '' }));

        const handle = setTimeout(async () => {
            try {
                const driver = await uniparkApi.lookupDriverByAdmission(raw);
                if (isMounted) {
                    if (driver) {
                        setLookupState({ status: 'found', driver, error: '' });
                    } else {
                        setLookupState({ status: 'notfound', driver: null, error: '' });
                    }
                }
            } catch (err) {
                if (isMounted) {
                    const status = err?.status;
                    // 404 → "not found" is a soft state, not an error
                    if (status === 404) {
                        setLookupState({ status: 'notfound', driver: null, error: '' });
                    } else {
                        setLookupState({
                            status: 'error',
                            driver: null,
                            error: err.message || 'Unable to look up that admission number.',
                        });
                    }
                }
            }
        }, 400);

        return () => {
            isMounted = false;
            clearTimeout(handle);
        };
    }, [registeredForm.admissionId, registrationMode]);

    const handleModeSwitch = (mode) => {
        setRegistrationMode(mode);
        setLinkError('');
        setLookupState({ status: 'idle', driver: null, error: '' });
        setRegisteredForm({ plate: '', admissionId: '' });
        setVisitorForm({
            plate: '',
            name: '',
            email: '',
            idNumber: '',
            phone: '',
            department: 'Faculty of IT',
            role: 'Student',
        });
    };

    const handleRegisteredChange = (e) => {
        const { name, value } = e.target;
        setRegisteredForm((prev) => ({ ...prev, [name]: value.toUpperCase() }));
        if (linkError) {
            setLinkError('');
        }
    };

    const handleVisitorChange = (e) => {
        const { name, value } = e.target;
        setVisitorForm((prev) => ({ ...prev, [name]: value }));
    };

    const refreshDirectory = async () => {
        try {
            const rows = await uniparkApi.getAllVehicles({ limit: 100 });
            setDirectory(Array.isArray(rows) ? rows : []);
        } catch (err) {
            // Non-fatal: keep existing directory
        }
    };

    const handleLinkVehicle = async (e) => {
        e.preventDefault();
        setLinkError('');

        const plate = registeredForm.plate.trim().toUpperCase();
        const admissionId = registeredForm.admissionId.trim();

        if (!plate || !admissionId) {
            setLinkError('Please fill in both the License Plate and Admission Number.');
            return;
        }

        if (lookupState.status !== 'found' || !lookupState.driver) {
            setLinkError(
                lookupState.status === 'notfound'
                    ? 'No driver is registered with that Admission Number. Ask the driver to sign up first.'
                    : 'Please wait for the driver lookup to finish, or correct the Admission Number.',
            );
            return;
        }

        setIsLinking(true);
        try {
            const result = await uniparkApi.adminLinkVehicle({
                registration_number: plate,
                admission_id: admissionId,
            });

            triggerToast(
                `Vehicle ${plate} linked to ${lookupState.driver.name} (${lookupState.driver.id_label || 'Driver'}: ${admissionId}).`,
            );

            // Reset the form
            setRegisteredForm({ plate: '', admissionId: '' });
            setLookupState({ status: 'idle', driver: null, error: '' });

            // Refresh the directory so the new vehicle shows up immediately
            await refreshDirectory();
            void result; // shape already consumed via toast
        } catch (err) {
            setLinkError(err.message || 'Unable to link this vehicle.');
        } finally {
            setIsLinking(false);
        }
    };

    const handleVisitorSubmit = (e) => {
        e.preventDefault();
        if (!visitorForm.plate || !visitorForm.name || !visitorForm.phone) {
            alert('Please fill in all required fields (Plate, Driver Name, and Phone Number)');
            return;
        }
        triggerToast(`Visitor ${visitorForm.plate.toUpperCase()} registered at the gate.`);
        setVisitorForm({
            plate: '',
            name: '',
            email: '',
            idNumber: '',
            phone: '',
            department: 'Faculty of IT',
            role: 'Student',
        });
    };

    const filteredDirectory = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) {
            return directory;
        }
        return directory.filter((entry) => {
            return (
                (entry.plate || '').toLowerCase().includes(q) ||
                (entry.name || '').toLowerCase().includes(q) ||
                (entry.role || '').toLowerCase().includes(q) ||
                (entry.idNumber || '').toLowerCase().includes(q) ||
                (entry.department || '').toLowerCase().includes(q)
            );
        });
    }, [directory, searchQuery]);

    return (
        <div className="max-w-6xl mx-auto">
            {/* Toast */}
            {toastMessage && (
                <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 text-white px-5 py-3.5 shadow-2xl border border-slate-800 text-sm font-medium flex items-center gap-2 animate-bounce">
                    <svg className="h-5 w-5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" fill="none" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4" />
                    </svg>
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Register Vehicle & Driver</h1>
                <p className="text-gray-500 mt-1">
                    Enroll new vehicles, visitors, or students into the campus gate authorization system.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Registration Form (1/3 width) */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs h-fit">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-1.5">
                        <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Registration Form
                    </h2>

                    {/* Mode Toggle */}
                    <div className="flex rounded-xl border border-gray-200 overflow-hidden mb-5">
                        <button
                            type="button"
                            onClick={() => handleModeSwitch('registered')}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${registrationMode === 'registered'
                                ? 'bg-blue-700 text-white'
                                : 'bg-white text-gray-500 hover:bg-slate-50'
                                }`}
                        >
                            Registered Driver
                        </button>
                        <button
                            type="button"
                            onClick={() => handleModeSwitch('visitor')}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer border-l border-gray-200 ${registrationMode === 'visitor'
                                ? 'bg-blue-700 text-white'
                                : 'bg-white text-gray-500 hover:bg-slate-50'
                                }`}
                        >
                            Visitor
                        </button>
                    </div>

                    {registrationMode === 'registered' ? (
                        <form onSubmit={handleLinkVehicle} className="space-y-4" noValidate>
                            {/* Plate Number */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                    License Plate Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="plate"
                                    value={registeredForm.plate}
                                    onChange={handleRegisteredChange}
                                    placeholder="E.g., KDC 456X"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase"
                                    disabled={isLinking}
                                    required
                                />
                            </div>

                            {/* Admission / ID Number */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                    Admission Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="admissionId"
                                    value={registeredForm.admissionId}
                                    onChange={handleRegisteredChange}
                                    placeholder="E.g., 184066 or SU-4009"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    disabled={isLinking}
                                    required
                                />
                                <LookupStatus state={lookupState} />
                            </div>

                            {linkError && (
                                <p className="text-xs text-red-600 font-medium" role="alert">
                                    {linkError}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isLinking || lookupState.status !== 'found'}
                                className="w-full bg-blue-700 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 text-white rounded-xl py-3 font-semibold shadow-md shadow-blue-500/15 hover:shadow-lg transition"
                            >
                                {isLinking ? 'Linking…' : 'Link Vehicle'}
                            </button>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                The vehicle will appear on the driver's profile as soon as the link succeeds.
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={handleVisitorSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                    License Plate Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="plate"
                                    value={visitorForm.plate}
                                    onChange={handleVisitorChange}
                                    placeholder="E.g., KDC 456X"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                    ID Number
                                </label>
                                <input
                                    type="text"
                                    name="idNumber"
                                    value={visitorForm.idNumber}
                                    onChange={handleVisitorChange}
                                    placeholder="E.g., 184066 or SU-4009"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                    Driver Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={visitorForm.name}
                                    onChange={handleVisitorChange}
                                    placeholder="E.g., Dalton Muindi"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={visitorForm.phone}
                                    onChange={handleVisitorChange}
                                    placeholder="E.g., +254 712 345678"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={visitorForm.email}
                                    onChange={handleVisitorChange}
                                    placeholder="E.g., name@strathmore.edu"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-3 font-semibold shadow-md shadow-blue-500/15 hover:shadow-lg transition cursor-pointer"
                            >
                                Submit Registration
                            </button>
                        </form>
                    )}
                </div>

                {/* Directory / Search (2/3 width) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Authorized Directory</h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {isLoadingDirectory
                                    ? 'Loading…'
                                    : `${directory.length} active vehicle${directory.length === 1 ? '' : 's'} on file`}
                            </p>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search plate, name, ID, or role..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm bg-white"
                            />
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-gray-200">
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">License Plate</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Driver & Contact</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">ID / Register</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Department</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Role</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isLoadingDirectory ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-400">
                                                Loading authorized directory…
                                            </td>
                                        </tr>
                                    ) : directoryError ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-10 text-center text-sm text-red-600">
                                                {directoryError}
                                            </td>
                                        </tr>
                                    ) : filteredDirectory.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-400">
                                                {directory.length === 0
                                                    ? 'No vehicles are linked yet. Use the form to link a driver\'s first vehicle.'
                                                    : 'No registered vehicles found matching search.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDirectory.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-slate-50/50 transition">
                                                <td className="px-6 py-4 font-bold text-slate-800 text-sm tracking-tight">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <span className="px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200 font-mono">
                                                            {entry.plate}
                                                        </span>
                                                        {entry.is_primary && (
                                                            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                                                Primary
                                                            </span>
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="text-sm font-semibold text-gray-800">{entry.name}</div>
                                                    <div className="text-xs text-gray-400">{entry.phone || entry.email || '—'}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-500">
                                                    <div>{entry.idNumber}</div>
                                                    <div className="text-[10px] uppercase tracking-wider text-gray-400 mt-0.5">
                                                        {entry.idLabel}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                    {entry.department || '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${entry.role === 'Student' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        entry.role === 'Lecturer' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                            entry.role === 'Staff' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                'bg-slate-100 text-slate-700 border-slate-200'
                                                        }`}>
                                                        {entry.role}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Sub-component: live driver-lookup status shown under the admission number.
 */
function LookupStatus({ state }) {
    if (state.status === 'idle') {
        return null;
    }
    if (state.status === 'searching') {
        return (
            <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gray-300 animate-pulse" />
                Checking the database…
            </p>
        );
    }
    if (state.status === 'notfound') {
        return (
            <p className="mt-1.5 text-xs text-red-600 font-medium" role="alert">
                No driver found with that Admission Number. They must sign up first.
            </p>
        );
    }
    if (state.status === 'error') {
        return (
            <p className="mt-1.5 text-xs text-red-600 font-medium" role="alert">
                {state.error || 'Lookup failed.'}
            </p>
        );
    }
    if (state.status === 'found' && state.driver) {
        const d = state.driver;
        return (
            <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                <div className="flex items-center gap-1.5 font-semibold">
                    <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    Driver found: {d.name}
                </div>
                <div className="mt-0.5 text-emerald-700/80">
                    {d.id_label} ID {d.admission_id} · {d.email}
                </div>
            </div>
        );
    }
    return null;
}
