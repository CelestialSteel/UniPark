import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { uniparkApi } from '../../../utils/uniparkApi';

function Panel({ title, icon, children, className = '' }) {
    return (
        <section className={`rounded-2xl border border-slate-200 bg-white shadow-xs ${className}`}>
            <div className="flex items-center gap-2 px-6 pt-6">
                <span className="flex h-5 w-5 items-center justify-center text-blue-700">{icon}</span>
                <h2 className="text-base font-bold text-slate-800">{title}</h2>
            </div>
            <div className="px-6 pb-6 pt-4">{children}</div>
        </section>
    );
}

function Field({ label, value, name, readOnly = false, options = null, onChange }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
            {options ? (
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    disabled={readOnly}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-xs outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                    {options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type="text"
                    name={name}
                    value={value}
                    onChange={onChange}
                    readOnly={readOnly}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm shadow-xs outline-none transition focus:ring-2 focus:ring-blue-100 ${readOnly
                        ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                        : 'border-slate-200 bg-white text-slate-850 focus:border-blue-600'
                        }`}
                />
            )}
        </label>
    );
}

export default function DriverProfileTab({ triggerToast }) {
    const { user, updateProfile } = useAuth();
    const unlinkReasons = [
        'Car was sold',
        'Car was involved in accident',
        'Car belongs to someone else',
        'Other',
    ];

    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        phone: '',
        department: 'Faculty of IT',
        idNumber: '',
        idLabel: 'Student ID',
    });

    const [passwordForm, setPasswordForm] = useState({
        current: '',
        new: '',
        confirm: '',
    });
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [vehicles, setVehicles] = useState([]);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
    const [vehiclesError, setVehiclesError] = useState('');
    const [vehicleToUnlink, setVehicleToUnlink] = useState(null);
    const [unlinkStep, setUnlinkStep] = useState('confirm');
    const [unlinkReason, setUnlinkReason] = useState('Car was sold');
    const [otherReason, setOtherReason] = useState('');
    const [isUnlinkingVehicle, setIsUnlinkingVehicle] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadProfile = async () => {
            try {
                setIsLoadingProfile(true);
                setProfileError('');

                const profile = await uniparkApi.getDriverProfile();
                if (!isMounted) {
                    return;
                }

                setProfileForm({
                    name: profile.name || user?.name || 'Alex Driver',
                    email: profile.email || user?.email || '12345',
                    phone: profile.phone || user?.phone || '+254 712 345678',
                    department: profile.department || user?.department || 'Faculty of IT',
                    idNumber: profile.student_id || profile.faculty_id || profile.staff_id || '',
                    idLabel: profile.faculty_id ? 'Lecturer ID' : profile.staff_id ? 'Staff ID' : 'Student ID',
                });
            } catch (error) {
                if (isMounted) {
                    setProfileError(error.message || 'Unable to load profile details right now.');
                }
            } finally {
                if (isMounted) {
                    setIsLoadingProfile(false);
                }
            }
        };

        loadProfile();

        return () => {
            isMounted = false;
        };
    }, [user]);

    useEffect(() => {
        let isMounted = true;

        const loadVehicles = async () => {
            try {
                setIsLoadingVehicles(true);
                setVehiclesError('');

                const linkedVehicles = await uniparkApi.getDriverVehicles();
                if (!isMounted) {
                    return;
                }

                const activeVehicles = linkedVehicles.filter((vehicle) => vehicle.is_active);
                setVehicles(activeVehicles);
            } catch (error) {
                if (isMounted) {
                    setVehicles([]);
                    setVehiclesError(error.message || 'Unable to load linked vehicles right now.');
                }
            } finally {
                if (isMounted) {
                    setIsLoadingVehicles(false);
                }
            }
        };

        loadVehicles();

        return () => {
            isMounted = false;
        };
    }, []);

    const closeUnlinkModal = () => {
        setVehicleToUnlink(null);
        setUnlinkStep('confirm');
        setUnlinkReason('Car was sold');
        setOtherReason('');
        setIsUnlinkingVehicle(false);
    };

    const openUnlinkModal = (vehicle) => {
        setVehicleToUnlink(vehicle);
        setUnlinkStep('confirm');
        setUnlinkReason('Car was sold');
        setOtherReason('');
    };

    const handleConfirmUnlinkReason = async () => {
        if (!vehicleToUnlink) {
            return;
        }

        const reasonText = unlinkReason === 'Other' ? otherReason.trim() : unlinkReason;
        if (!reasonText) {
            triggerToast('Please provide a reason to continue.');
            return;
        }

        try {
            setIsUnlinkingVehicle(true);
            await uniparkApi.unlinkDriverVehicle(vehicleToUnlink.id, {
                reason: unlinkReason,
                details: unlinkReason === 'Other' ? reasonText : null,
            });

            setVehicles((prev) => prev.filter((vehicle) => vehicle.id !== vehicleToUnlink.id));
            triggerToast(`Vehicle unlinked. Reason: ${reasonText}`);
            closeUnlinkModal();
        } catch (error) {
            triggerToast(error.message || 'Unable to unlink this vehicle.');
            setIsUnlinkingVehicle(false);
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileForm(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();

        const [firstName, ...lastNameParts] = profileForm.name.trim().split(/\s+/);

        try {
            setIsSavingProfile(true);
            const updatedProfile = await uniparkApi.updateDriverProfile({
                first_name: firstName,
                last_name: lastNameParts.join(' ') || firstName,
                phone_number: profileForm.phone,
                department: profileForm.department,
            });

            updateProfile({
                name: updatedProfile.name,
                email: updatedProfile.email,
                phone: updatedProfile.phone || profileForm.phone,
                department: updatedProfile.department || profileForm.department,
            });
            triggerToast('Profile information saved successfully!');
        } catch (error) {
            triggerToast(error.message || 'Unable to save profile changes.');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (passwordForm.new !== passwordForm.confirm) {
            alert('Passwords do not match!');
            return;
        }

        try {
            setIsUpdatingPassword(true);
            await uniparkApi.updateDriverPassword({
                current_password: passwordForm.current,
                new_password: passwordForm.new,
            });

            triggerToast('Password updated successfully!');
            setPasswordForm({ current: '', new: '', confirm: '' });
        } catch (error) {
            triggerToast(error.message || 'Unable to update password.');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateProfile({ image: reader.result });
                triggerToast('Profile image updated successfully!');
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">User Profile</h1>
                <p className="mt-1 text-xs text-slate-500">Manage your campus parking identity and security settings.</p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
                {/* Left Forms column */}
                <div className="space-y-6">
                    {/* Personal Info */}
                    <Panel
                        title="Personal Information"
                        icon={<svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                    >
                        {isLoadingProfile ? (
                            <p className="mb-6 text-sm text-slate-500">Loading profile details...</p>
                        ) : null}
                        {profileError && (
                            <p className="mb-6 text-sm text-amber-700">{profileError}</p>
                        )}
                        {/* Avatar Badge */}
                        <div className="mb-6 flex justify-center">
                            <div className="relative group w-24 h-24 rounded-full overflow-hidden bg-slate-50 border-4 border-white shadow-inner flex items-center justify-center">
                                {user?.image ? (
                                    <img
                                        src={user.image}
                                        alt="Driver Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                )}

                                {/* Hover Overlay */}
                                <label
                                    htmlFor="driver-pic-upload"
                                    className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                                >
                                    Upload Photo
                                </label>
                            </div>
                            <input
                                type="file"
                                id="driver-pic-upload"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                    label="Full Name"
                                    name="name"
                                    value={profileForm.name}
                                    onChange={handleProfileChange}
                                />
                                <Field
                                    label={profileForm.idLabel}
                                    name="idNumber"
                                    value={profileForm.idNumber || 'Not set'}
                                    readOnly
                                />
                                <Field
                                    label="Phone Number"
                                    name="phone"
                                    value={profileForm.phone}
                                    onChange={handleProfileChange}
                                />
                                <Field
                                    label="Department"
                                    name="department"
                                    value={profileForm.department}
                                    onChange={handleProfileChange}
                                    options={['Faculty of IT', 'School of Computing', 'Business School', 'Finance Office', 'Academic Staff']}
                                />
                            </div>

                            <div className="mt-5 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSavingProfile}
                                    className="rounded-xl bg-blue-700 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 transition cursor-pointer"
                                >
                                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </Panel>

                    {/* Change Password */}
                    <Panel
                        title="Change Password"
                        icon={<svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                    >
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Current Password</label>
                                    <input
                                        type="password"
                                        name="current"
                                        value={passwordForm.current}
                                        onChange={handlePasswordChange}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-xs outline-none transition focus:border-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">New Password</label>
                                    <input
                                        type="password"
                                        name="new"
                                        value={passwordForm.new}
                                        onChange={handlePasswordChange}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-xs outline-none transition focus:border-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Confirm New Password</label>
                                    <input
                                        type="password"
                                        name="confirm"
                                        value={passwordForm.confirm}
                                        onChange={handlePasswordChange}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-xs outline-none transition focus:border-blue-600"
                                    />
                                </div>
                            </div>

                            <div className="mt-5 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPasswordForm({ current: '', new: '', confirm: '' })}
                                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer px-4 py-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdatingPassword}
                                    className="rounded-xl bg-blue-700 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 transition cursor-pointer"
                                >
                                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </Panel>

                    <Panel
                        title="Linked Vehicle"
                        icon={<svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 17h14l1-5-1.5-4.5A2 2 0 0016.61 6H7.39a2 2 0 00-1.89 1.5L4 12l1 5z" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" /></svg>}
                    >
                        {isLoadingVehicles ? (
                            <p className="text-sm text-slate-500">Checking linked vehicles...</p>
                        ) : vehiclesError ? (
                            <p className="text-sm text-amber-700">{vehiclesError}</p>
                        ) : vehicles.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-700">No vehicle linked to this driver.</p>
                                <p className="mt-1 text-xs text-slate-500">Link a vehicle to see it here.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {vehicles.map((vehicle) => (
                                    <div key={vehicle.id} className="rounded-xl border border-slate-200 bg-white p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{vehicle.registration_number}</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {vehicle.make || 'Unknown Make'} {vehicle.model || 'Unknown Model'}
                                                </p>
                                                <p className="mt-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                                    {vehicle.is_primary ? 'Primary Vehicle' : 'Secondary Vehicle'}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => openUnlinkModal(vehicle)}
                                                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[11px] font-bold text-red-600 transition hover:bg-red-50"
                                            >
                                                Unlink Vehicle
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>
                </div>

                {/* Right Widgets column */}
                <div className="space-y-6">
                    {/* Notifications checklist */}
                    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-xs">
                        <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Notifications</p>
                        <div className="space-y-3.5">
                            <label className="flex items-start gap-3 text-xs text-slate-700 font-semibold cursor-pointer">
                                <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 rounded border-slate-200 text-blue-700 focus:ring-blue-500" />
                                <span>Parking Expiration Alerts</span>
                            </label>
                            <label className="flex items-start gap-3 text-xs text-slate-700 font-semibold cursor-pointer">
                                <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 rounded border-slate-200 text-blue-700 focus:ring-blue-500" />
                                <span>Zone Occupancy Updates</span>
                            </label>
                            <label className="flex items-start gap-3 text-xs text-slate-700 font-semibold cursor-pointer">
                                <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-200 text-blue-700 focus:ring-blue-500" />
                                <span>University Events & Closures</span>
                            </label>
                        </div>
                    </section>

                    {/* Account status info card */}
                    <section className="rounded-2xl border border-blue-200 bg-blue-50/50 px-5 py-5 shadow-xs">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-bold text-blue-700">Account Status</p>
                                <div className="mt-4 space-y-2 text-xs text-slate-700">
                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-400 font-medium">Member Since</span>
                                        <span className="font-semibold text-slate-800">Sept 2024</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-400 font-medium">Last Login</span>
                                        <span className="font-semibold text-slate-800">Just now</span>
                                    </div>
                                </div>
                            </div>
                            <span className="rounded-md bg-blue-100 border border-blue-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-700">
                                Verified
                            </span>
                        </div>
                    </section>

                    {/* Account Deletion */}
                    <section className="pt-4 border-t border-slate-200">
                        <p className="text-xs font-bold text-red-600">Account Management</p>
                        <p className="mt-1 text-[11px] text-slate-500 leading-normal">
                            Removing your account will permanently revoke your campus parking permissions and digital permits.
                        </p>
                        <button
                            type="button"
                            onClick={() => alert('Account deletion request submitted to Administration.')}
                            className="mt-3.5 w-full rounded-xl border border-red-200 text-red-600 bg-white hover:bg-red-50 py-2.5 text-xs font-bold transition cursor-pointer"
                        >
                            Request Deletion
                        </button>
                    </section>
                </div>
            </div>

            {vehicleToUnlink && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40" onClick={closeUnlinkModal} />
                    <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                        {unlinkStep === 'confirm' ? (
                            <>
                                <h3 className="text-lg font-bold text-slate-800">Unlink this vehicle?</h3>
                                <p className="mt-2 text-sm text-slate-600">
                                    Are you sure you want to unlink <span className="font-semibold">{vehicleToUnlink.registration_number}</span> from your profile?
                                </p>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={closeUnlinkModal}
                                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUnlinkStep('reason')}
                                        className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
                                    >
                                        Yes, Continue
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold text-slate-800">Why are you unlinking this vehicle?</h3>

                                <div className="mt-4 space-y-2">
                                    {unlinkReasons.map((reason) => (
                                        <label key={reason} className="flex items-center gap-2 text-sm text-slate-700">
                                            <input
                                                type="radio"
                                                name="unlinkReason"
                                                value={reason}
                                                checked={unlinkReason === reason}
                                                onChange={(e) => setUnlinkReason(e.target.value)}
                                                className="h-4 w-4 border-slate-300 text-blue-700 focus:ring-blue-500"
                                            />
                                            <span>{reason}</span>
                                        </label>
                                    ))}
                                </div>

                                {unlinkReason === 'Other' && (
                                    <textarea
                                        value={otherReason}
                                        onChange={(e) => setOtherReason(e.target.value)}
                                        placeholder="Please provide your reason"
                                        className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                        rows={3}
                                    />
                                )}

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setUnlinkStep('confirm')}
                                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isUnlinkingVehicle}
                                        onClick={handleConfirmUnlinkReason}
                                        className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {isUnlinkingVehicle ? 'Unlinking...' : 'Confirm Unlink'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
