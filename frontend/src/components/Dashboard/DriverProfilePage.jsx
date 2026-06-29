import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

function Panel({ title, icon, children, className = '' }) {
    return (
        <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
            <div className="flex items-center gap-2 px-6 pt-6">
                <span className="flex h-5 w-5 items-center justify-center text-blue-700">{icon}</span>
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            </div>
            <div className="px-6 pb-6 pt-5">{children}</div>
        </section>
    );
}

function Field({ label, value, readOnly = false, options = null }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
            {options ? (
                <select
                    defaultValue={value}
                    className="w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                    {options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    defaultValue={value}
                    readOnly={readOnly}
                    className={`w-full rounded-md border px-4 py-2.5 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-blue-100 ${readOnly ? 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500' : 'border-slate-300 bg-white text-slate-800 focus:border-blue-600'
                        }`}
                />
            )}
        </label>
    );
}

function ToggleRow({ title, description, enabled = false }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-4">
            <div>
                <p className="text-sm font-medium text-slate-900">{title}</p>
                <p className="mt-1 text-xs text-slate-500">{description}</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" defaultChecked={enabled} />
                <div className="peer h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-blue-600 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
            </label>
        </div>
    );
}

function SectionLabel({ children }) {
    return <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{children}</p>;
}

function AvatarBadge() {
    return (
        <div className="relative mx-auto flex h-18 w-18 items-center justify-center rounded-2xl border border-slate-300 bg-slate-100 shadow-sm">
            <svg className="h-8 w-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 21a8 8 0 10-16 0" />
                <circle cx="12" cy="8" r="4" strokeWidth="2" />
            </svg>
            <button
                type="button"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow"
                aria-label="Edit profile picture"
            >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.862 3.487a2.1 2.1 0 113 3L7.5 18.85 3 20l1.15-4.5 12.712-12.013z" />
                </svg>
            </button>
        </div>
    );
}

export default function DriverProfilePage() {
    return (
        <div className="min-h-screen bg-[#f6f8fc] text-slate-900">
            <div className="flex min-h-screen">
                <Sidebar activePage="profile" />

                <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <header className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h1 className="text-3xl font-semibold text-slate-900">User Profile</h1>
                                    <p className="mt-1 text-sm text-slate-600">Manage your campus parking identity and security settings.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9" /></svg>
                                </button>
                                <div className="h-9 w-9 overflow-hidden rounded-md border border-slate-200 bg-slate-100 shadow-sm">
                                    <img src="https://i.pravatar.cc/80?img=12" alt="User avatar" className="h-full w-full object-cover" />
                                </div>
                            </div>
                        </header>

                        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_215px]">
                            <div className="space-y-6">
                                <Panel
                                    title="Personal Information"
                                    icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4 9 5.567 9 7.5 10.343 11 12 11z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 20a6 6 0 1112 0" /></svg>}
                                    className="relative"
                                >
                                    <div className="mb-6 flex justify-center">
                                        <AvatarBadge />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Field label="Full Name" value="Dr. Julian Sterling" />
                                        <Field label="University ID" value="UP-882941-X" readOnly />
                                        <Field label="Phone Number" value="+1 (555) 012-3456" />
                                        <Field label="Email Address" value="j.sterling@university.edu" />
                                        <div className="md:col-span-2 md:max-w-[48%]">
                                            <Field label="Department" value="Faculty of Engineering" options={['Faculty of Engineering', 'Business School', 'College of Arts']} />
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button type="button" className="rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-800">
                                            Save Changes
                                        </button>
                                    </div>
                                </Panel>

                                <Panel
                                    title="Change Password"
                                    icon={<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11v2m-6 2a2 2 0 012-2h8a2 2 0 012 2v4H6v-4z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11V8a5 5 0 1110 0v3" /></svg>}
                                >
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="md:col-span-2">
                                            <Field label="Current Password" value="********" />
                                        </div>
                                        <Field label="New Password" value="********" />
                                        <Field label="Confirm New Password" value="********" />
                                    </div>

                                    <div className="mt-5 flex items-center justify-end gap-5">
                                        <button type="button" className="text-sm font-medium text-blue-700 hover:text-blue-800">
                                            Cancel
                                        </button>
                                        <button type="button" className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-800">
                                            Update Password
                                        </button>
                                    </div>
                                </Panel>
                            </div>

                            <div className="space-y-6">
                                <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
                                    <SectionLabel>Notification Settings</SectionLabel>
                                    <div className="space-y-3">
                                        <label className="flex items-start gap-3 text-sm text-slate-800">
                                            <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500" />
                                            <span>Parking Expiration Alerts</span>
                                        </label>
                                        <label className="flex items-start gap-3 text-sm text-slate-800">
                                            <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500" />
                                            <span>Zone Occupancy Updates</span>
                                        </label>
                                        <label className="flex items-start gap-3 text-sm text-slate-800">
                                            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500" />
                                            <span>University Events & Closures</span>
                                        </label>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-5 shadow-sm">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-blue-700">Account Status</p>
                                            <div className="mt-4 space-y-2 text-sm text-slate-700">
                                                <div className="flex justify-between gap-4">
                                                    <span>Member Since</span>
                                                    <span className="font-medium text-slate-900">Sept 2021</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span>Last Login</span>
                                                    <span className="font-medium text-slate-900">2 hours ago</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="rounded bg-blue-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700">Verified</span>
                                    </div>
                                </section>
                            </div>
                        </section>

                        <section className="mt-8 flex items-start justify-between gap-4 border-t border-slate-200 pt-6">
                            <div>
                                <p className="text-sm font-semibold text-red-600">Account Management</p>
                                <p className="mt-1 text-sm text-slate-600">Removing your account will revoke all active parking permits.</p>
                            </div>
                            <button type="button" className="rounded-lg border border-red-400 px-5 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50">
                                Request Account Deletion
                            </button>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}