import React, { useState, useEffect } from 'react';
import { uniparkApi } from '../../../utils/uniparkApi';

export default function LookupTab({ initialPlate = '', initialDriver = null }) {
    const [lookupPlate, setLookupPlate] = useState(initialPlate);
    const [searchedDriver, setSearchedDriver] = useState(initialDriver);
    const [lookupError, setLookupError] = useState('');
    const [loading, setLoading] = useState(false);

    // If parent pre-fills a plate (from overstay tab), auto-search
    useEffect(() => {
        if (initialPlate && !initialDriver) {
            runSearch(initialPlate);
        }
    }, [initialPlate]);

    const runSearch = async (plate) => {
        const cleanPlate = (plate || '').trim().toUpperCase();
        if (!cleanPlate) {
            setLookupError('Please enter a vehicle registration plate number.');
            return;
        }

        setLoading(true);
        setLookupError('');
        setSearchedDriver(null);

        try {
            const results = await uniparkApi.lookupByPlate(cleanPlate);
            if (!results || results.length === 0) {
                setLookupError(`No drivers found for registration number ${cleanPlate}`);
            } else {
                setSearchedDriver(results[0]);
            }
        } catch (err) {
            setLookupError(`Lookup failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDriverLookup = (e) => {
        e.preventDefault();
        runSearch(lookupPlate);
    };

    return (
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
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg cursor-pointer transition"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Searching…
                            </>
                        ) : 'Lookup Owner'}
                    </button>
                </div>
                {lookupError && <p className="mt-3 text-xs text-rose-400 font-semibold">{lookupError}</p>}
            </form>

            {/* Results Profile Card */}
            {searchedDriver && (
                <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-2xl shadow-xl shadow-gray-200/60 relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-40 w-40 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="h-16 w-16 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center text-2xl font-bold text-blue-400 shadow-md shrink-0">
                            {(searchedDriver.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-xl font-bold text-gray-900">{searchedDriver.name || 'Unknown Driver'}</h2>
                                <span className="text-[10px] py-0.5 px-2 bg-blue-100 text-blue-700 rounded-full border border-blue-200/40 font-bold uppercase">
                                    {searchedDriver.idLabel || searchedDriver.role || 'Driver'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm">
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block">Institutional ID</span>
                                    <span className="text-gray-700 font-medium">{searchedDriver.idNumber || '—'}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block">Department / Faculty</span>
                                    <span className="text-gray-700 font-medium">{searchedDriver.department || '—'}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block">Email Address</span>
                                    <a href={`mailto:${searchedDriver.email}`} className="text-blue-600 hover:text-blue-700 font-semibold hover:underline block">
                                        {searchedDriver.email || '—'}
                                    </a>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block">Phone Number</span>
                                    <a href={`tel:${searchedDriver.phone}`} className="text-gray-700 hover:text-gray-800 font-medium block">
                                        {searchedDriver.phone || '—'}
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
    );
}
