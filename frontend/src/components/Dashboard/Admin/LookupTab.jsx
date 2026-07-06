import React, { useState, useEffect, useMemo } from 'react';
import { uniparkApi } from '../../../utils/uniparkApi';

// ── Tiny render helpers ─────────────────────────────────────────────────────
// These prevent `undefined` / `null` from leaking into the UI. Anything that
// is missing, empty, or null falls back to a friendly em-dash.
const placeholder = (value) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string' && value.trim() === '') return '—';
    return value;
};

const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined) return '—';
    const total = Math.max(0, Math.round(Number(minutes)));
    if (!Number.isFinite(total)) return '—';
    const hours = Math.floor(total / 60);
    const remainingMinutes = total % 60;
    if (hours === 0) return `${remainingMinutes}m`;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
};

const initialsOf = (name) => {
    if (!name || typeof name !== 'string') return '?';
    return name
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || '?';
};

// ── Status pill colours ─────────────────────────────────────────────────────
const statusTone = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    entered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    exited: 'bg-gray-100 text-gray-500 border-gray-200',
    suspended: 'bg-rose-100 text-rose-700 border-rose-200',
};

function StatusBadge({ children, tone = 'active' }) {
    const cls = statusTone[tone] || statusTone.active;
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cls}`}>
            {children}
        </span>
    );
}

// ── Subcomponents ───────────────────────────────────────────────────────────
function Field({ label, children }) {
    return (
        <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {label}
            </span>
            <span className="block text-sm font-medium text-gray-800 mt-0.5 break-words">
                {children}
            </span>
        </div>
    );
}

function VehicleRow({ vehicle, status }) {
    const makeModel = [vehicle.make, vehicle.model].filter(Boolean).join(' ');
    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-5 py-3 align-top">
                <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900">
                        {placeholder(vehicle.registration_number)}
                    </span>
                    {vehicle.is_primary && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                            Primary
                        </span>
                    )}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                    {placeholder(makeModel)}
                    {vehicle.color ? ` • ${placeholder(vehicle.color)}` : ''}
                    {vehicle.vehicle_type ? ` • ${placeholder(vehicle.vehicle_type)}` : ''}
                </div>
            </td>
            <td className="px-5 py-3 align-top">
                {status?.is_parked ? (
                    <StatusBadge tone="active">On Campus</StatusBadge>
                ) : (
                    <StatusBadge tone="exited">Off Campus</StatusBadge>
                )}
            </td>
            <td className="px-5 py-3 align-top text-xs text-gray-600">
                {status?.is_parked ? (
                    <div>
                        <div className="font-semibold text-gray-800">
                            {placeholder(status.parking_zone_name)}
                        </div>
                        <div className="text-[11px] text-gray-500">
                            Entered {formatDateTime(status.entry_time)}
                        </div>
                    </div>
                ) : (
                    <span className="text-gray-400">—</span>
                )}
            </td>
            <td className="px-5 py-3 align-top text-xs text-gray-600 font-mono">
                {status?.is_parked ? formatDuration(status.elapsed_minutes) : '—'}
            </td>
        </tr>
    );
}

function HistoryRow({ log }) {
    const entered = log.status === 'entered';
    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-5 py-3 align-top font-mono text-sm font-bold text-gray-900">
                {placeholder(log.vehicle_registration)}
            </td>
            <td className="px-5 py-3 align-top">
                <span className="text-xs font-semibold text-blue-700">
                    {placeholder(log.parking_zone_name)}
                </span>
            </td>
            <td className="px-5 py-3 align-top text-xs text-gray-600 font-mono">
                {formatDateTime(log.entry_time)}
            </td>
            <td className="px-5 py-3 align-top text-xs text-gray-600 font-mono">
                {formatDateTime(log.exit_time)}
            </td>
            <td className="px-5 py-3 align-top text-xs text-gray-600 font-mono">
                {formatDuration(log.duration_minutes)}
            </td>
            <td className="px-5 py-3 align-top">
                {entered ? (
                    <StatusBadge tone="active">On Campus</StatusBadge>
                ) : (
                    <StatusBadge tone="exited">Exited</StatusBadge>
                )}
            </td>
        </tr>
    );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function LookupTab({ initialPlate = '', initialDriver = null }) {
    const [lookupPlate, setLookupPlate] = useState(initialPlate);
    const [driver, setDriver] = useState(initialDriver);
    const [lookupError, setLookupError] = useState('');
    const [loading, setLoading] = useState(false);

    // When the parent pre-fills a plate (e.g. Overstays → Lookup deep link),
    // fire the search automatically. We deliberately compare the *string*
    // value so that the same plate passed twice does not re-fire the call.
    useEffect(() => {
        if (initialPlate && !initialDriver) {
            runSearch(initialPlate);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const runSearch = async (plate) => {
        const cleanPlate = (plate || '').trim().toUpperCase();
        if (!cleanPlate) {
            setLookupError('Please enter a vehicle registration plate number.');
            return;
        }

        setLoading(true);
        setLookupError('');
        setDriver(null);

        try {
            const result = await uniparkApi.lookupByPlate(cleanPlate);
            if (!result) {
                setLookupError(`No driver found for plate ${cleanPlate}.`);
            } else {
                setDriver(result);
            }
        } catch (err) {
            setLookupError(err.message || 'Lookup failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDriverLookup = (e) => {
        e.preventDefault();
        runSearch(lookupPlate);
    };

    // Build a quick plate → current-parking-status map so we can render
    // the "On Campus" column for every vehicle in a single pass.
    const statusByPlate = useMemo(() => {
        const map = new Map();
        if (!driver) return map;
        for (const status of driver.current_parking || []) {
            if (status?.registration_number) {
                map.set(status.registration_number, status);
            }
        }
        return map;
    }, [driver]);

    const activeVehicleCount = useMemo(
        () => (driver?.vehicles || []).filter((v) => v.is_active).length,
        [driver],
    );

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight">Driver Profile Lookup</h1>
                <p className="text-gray-500 mt-1">
                    Search by any vehicle registration plate to view the driver's full profile,
                    their linked vehicles, current parking status, and recent activity.
                </p>
            </div>

            {/* Search form */}
            <form
                onSubmit={handleDriverLookup}
                className="bg-gray-50 border border-gray-200 rounded-2xl p-6 max-w-2xl mb-8"
            >
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
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg cursor-pointer transition"
                    >
                        {loading ? (
                            <>
                                <svg
                                    className="animate-spin h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                Searching…
                            </>
                        ) : (
                            'Lookup Driver'
                        )}
                    </button>
                </div>
                {lookupError && (
                    <p className="mt-3 text-xs text-rose-400 font-semibold">{lookupError}</p>
                )}
            </form>

            {/* Results */}
            {driver && (
                <div className="space-y-6 max-w-4xl">
                    {/* Profile card */}
                    <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl shadow-gray-200/60 relative overflow-hidden">
                        <div className="absolute right-0 top-0 h-40 w-40 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex flex-col sm:flex-row items-start gap-6 relative">
                            <div className="h-16 w-16 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center text-2xl font-bold text-blue-400 shadow-md shrink-0">
                                {initialsOf(driver.name)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {placeholder(driver.name)}
                                    </h2>
                                    {driver.id_label && (
                                        <StatusBadge tone="active">
                                            {driver.id_label}
                                        </StatusBadge>
                                    )}
                                    {!driver.is_active && (
                                        <StatusBadge tone="suspended">Suspended</StatusBadge>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                    <Field label="Institutional ID">
                                        {placeholder(driver.id_number)}
                                    </Field>
                                    <Field label="Department / Faculty">
                                        {placeholder(driver.department)}
                                    </Field>
                                    <Field label="Email Address">
                                        {driver.email ? (
                                            <a
                                                href={`mailto:${driver.email}`}
                                                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline break-all"
                                            >
                                                {driver.email}
                                            </a>
                                        ) : (
                                            '—'
                                        )}
                                    </Field>
                                    <Field label="Phone Number">
                                        {driver.phone ? (
                                            <a
                                                href={`tel:${driver.phone}`}
                                                className="text-gray-800 hover:text-gray-900"
                                            >
                                                {driver.phone}
                                            </a>
                                        ) : (
                                            '—'
                                        )}
                                    </Field>
                                    <Field label="License Number">
                                        {placeholder(driver.license_number)}
                                    </Field>
                                    <Field label="License Expiry">
                                        {formatDateTime(driver.license_expiry)}
                                    </Field>
                                </div>

                                <div className="mt-6 pt-5 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                                    <span>
                                        {activeVehicleCount} active vehicle
                                        {activeVehicleCount === 1 ? '' : 's'} registered
                                    </span>
                                    <span className="font-mono text-[11px] text-gray-400">
                                        Driver ID: {placeholder(driver.driver_id)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vehicles table */}
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                                Linked Vehicles
                            </h3>
                            <span className="text-xs text-gray-500">
                                {(driver.vehicles || []).length} total
                            </span>
                        </div>
                        {(driver.vehicles || []).length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-400">
                                No vehicles linked to this driver.
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold">
                                        <th className="px-5 py-3">Registration</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Zone</th>
                                        <th className="px-5 py-3">Duration</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {driver.vehicles.map((vehicle) => (
                                        <VehicleRow
                                            key={vehicle.id}
                                            vehicle={vehicle}
                                            status={statusByPlate.get(
                                                vehicle.registration_number,
                                            )}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Recent history */}
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                                Recent Parking History
                            </h3>
                            <span className="text-xs text-gray-500">
                                Last {(driver.recent_history || []).length} entries
                            </span>
                        </div>
                        {(driver.recent_history || []).length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-400">
                                No parking history recorded for this driver.
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold">
                                        <th className="px-5 py-3">Plate</th>
                                        <th className="px-5 py-3">Zone</th>
                                        <th className="px-5 py-3">Entry</th>
                                        <th className="px-5 py-3">Exit</th>
                                        <th className="px-5 py-3">Duration</th>
                                        <th className="px-5 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {driver.recent_history.map((log) => (
                                        <HistoryRow key={log.id} log={log} />
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
