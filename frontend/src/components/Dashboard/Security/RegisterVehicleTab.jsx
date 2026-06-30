import React, { useState } from 'react';

export default function RegisterVehicleTab({ registeredDrivers, onRegister }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [form, setForm] = useState({
        plate: '',
        name: '',
        email: '',
        idNumber: '',
        phone: '',
        department: 'Faculty of IT',
        role: 'Student',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Simple validations
        if (!form.plate || !form.name || !form.phone) {
            alert('Please fill in all required fields (Plate, Driver Name, and Phone Number)');
            return;
        }

        const success = onRegister({
            ...form,
            plate: form.plate.toUpperCase().trim(),
            name: form.name.trim(),
            email: form.email.trim() || `${form.name.toLowerCase().replace(/\s+/g, '')}@unipark.ac.ke`,
            idNumber: form.idNumber.trim() || 'N/A'
        });

        if (success) {
            // Reset form
            setForm({
                plate: '',
                name: '',
                email: '',
                idNumber: '',
                phone: '',
                department: 'Faculty of IT',
                role: 'Student',
            });
        }
    };

    // Filter registered drivers
    const filteredDrivers = registeredDrivers.filter(driver => 
        driver.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Register Vehicle & Driver</h1>
                <p className="text-gray-500 mt-1">Enroll new vehicles, visitors, or students into the campus gate authorization system.</p>
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

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Plate Number */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                License Plate Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="plate"
                                value={form.plate}
                                onChange={handleChange}
                                placeholder="E.g., KDC 456X"
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase"
                                required
                            />
                        </div>

                        {/* Driver Name */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Driver Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="E.g., Dalton Muindi"
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                required
                            />
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="E.g., +254 712 345678"
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                required
                            />
                        </div>

                        {/* ID Number / Reg Number */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                ID / Student Reg Number
                            </label>
                            <input
                                type="text"
                                name="idNumber"
                                value={form.idNumber}
                                onChange={handleChange}
                                placeholder="E.g., 184066 or SU-4009"
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        {/* Email Address */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="E.g., name@strathmore.edu"
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        {/* Role selection & Department */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                    Driver Role
                                </label>
                                <select
                                    name="role"
                                    value={form.role}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white"
                                >
                                    <option value="Student">Student</option>
                                    <option value="Faculty">Faculty</option>
                                    <option value="Staff">Staff</option>
                                    <option value="Visitor">Visitor</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                    Department
                                </label>
                                <select
                                    name="department"
                                    value={form.department}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white"
                                >
                                    <option value="Faculty of IT">Faculty of IT</option>
                                    <option value="School of Computing">School of Computing</option>
                                    <option value="Business School">Business School</option>
                                    <option value="Finance Office">Finance Office</option>
                                    <option value="Academic Staff">Academic Staff</option>
                                    <option value="Guest Visitor">Guest/Visitor</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-3 font-semibold shadow-md shadow-blue-500/15 hover:shadow-lg transition cursor-pointer"
                        >
                            Submit Registration
                        </button>
                    </form>
                </div>

                {/* Directory / Search (2/3 width) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-xl font-bold text-gray-800">Authorized Directory</h2>
                        
                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search plate, name, or role..."
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
                                    {filteredDrivers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-400">
                                                No registered vehicles found matching search.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDrivers.map((driver, index) => (
                                            <tr key={driver.plate + index} className="hover:bg-slate-50/50 transition">
                                                <td className="px-6 py-4 font-bold text-slate-800 text-sm tracking-tight">
                                                    <span className="px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200 font-mono">
                                                        {driver.plate}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="text-sm font-semibold text-gray-800">{driver.name}</div>
                                                    <div className="text-xs text-gray-400">{driver.phone}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-500">
                                                    {driver.idNumber}
                                                </td>
                                                <td className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                    {driver.department}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                        driver.role === 'Student' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        driver.role === 'Faculty' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                        driver.role === 'Staff' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-slate-100 text-slate-700 border-slate-200'
                                                    }`}>
                                                        {driver.role}
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
