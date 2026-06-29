import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

export default function ProfileTab({ triggerToast }) {
    const { user, updateProfile } = useAuth();

    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        phone: '',
        department: '',
    });

    useEffect(() => {
        if (user) {
            setProfileForm({
                name: user.name || 'Admin Administrator',
                email: user.email || 'admin@unipark.ac.ke',
                phone: user.phone || '+254 722 987654',
                department: user.department || 'Security Command Centre',
            });
        }
    }, [user]);

    const handleProfileFormChange = (e) => {
        const { name, value } = e.target;
        setProfileForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = (e) => {
        e.preventDefault();
        updateProfile(profileForm);
        triggerToast('Profile settings saved successfully!');
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
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight">Profile Settings</h1>
                <p className="text-gray-500 mt-1">Manage your administrative credentials, personal details, and profile avatar.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Left Column: Avatar upload */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm h-fit">
                    <div className="relative group w-40 h-40 rounded-full overflow-hidden bg-gray-50 border-4 border-white shadow-inner flex items-center justify-center mb-6">
                        {user?.image ? (
                            <img
                                src={user.image}
                                alt="Admin Avatar"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400">
                                <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        )}

                        {/* Hover Overlay */}
                        <label
                            htmlFor="profile-pic-upload"
                            className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                        >
                            <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Upload Photo
                        </label>
                    </div>

                    <input
                        type="file"
                        id="profile-pic-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />

                    <label
                        htmlFor="profile-pic-upload"
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 border border-gray-300 transition cursor-pointer mb-2"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Select Image
                    </label>
                    <p className="text-[10px] text-gray-400">Supported formats: JPG, PNG. Max size 2MB.</p>
                </div>

                {/* Right Column: Details form */}
                <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Personal Information</h2>
                    <form onSubmit={handleSaveProfile} className="space-y-5">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={profileForm.name}
                                    onChange={handleProfileFormChange}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={profileForm.email}
                                    onChange={handleProfileFormChange}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
                                />
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone Number</label>
                                <input
                                    type="text"
                                    name="phone"
                                    required
                                    value={profileForm.phone}
                                    onChange={handleProfileFormChange}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Department / Office</label>
                                <input
                                    type="text"
                                    name="department"
                                    required
                                    value={profileForm.department}
                                    onChange={handleProfileFormChange}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition cursor-pointer"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
