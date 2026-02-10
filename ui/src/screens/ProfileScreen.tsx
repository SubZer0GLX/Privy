import React, { useState, useEffect } from 'react';
import { IMAGES } from '../constants';
import { fetchNui, isDevMode } from '../utils/nui';
import { ProfileHeader } from '../components/ProfileHeader';
import { MenuItem } from '../components/MenuItem';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { FormInput } from '../components/FormInput';

interface UserProfile {
    name: string;
    tag: string;
    bio: string;
    isPremium: boolean;
    price: string;
    avatar: string;
    banner: string;
}

interface ProfileScreenProps {
    onLogout?: () => void;
}

const AVAILABLE_BANNERS = [
    IMAGES.backgrounds.abstract,
    IMAGES.backgrounds.mountain,
    IMAGES.backgrounds.beach
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout }) => {
    const [view, setView] = useState<'main' | 'edit'>('main');

    const [profile, setProfile] = useState<UserProfile>({
        name: 'Your Story',
        tag: '@user_story',
        bio: 'Digital creator & artist. Welcome to my exclusive content world!',
        isPremium: true,
        price: '4.99',
        avatar: IMAGES.avatars.user,
        banner: IMAGES.backgrounds.abstract
    });

    const [darkMode, setDarkMode] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [editForm, setEditForm] = useState<UserProfile>(profile);

    useEffect(() => {
        if (!isDevMode()) {
            fetchNui<any>('getProfile', {}).then((result) => {
                if (result?.success && result.profile) {
                    const p = result.profile;
                    setProfile({
                        name: p.display_name || p.username || 'User',
                        tag: '@' + (p.username || 'user'),
                        bio: p.bio || '',
                        isPremium: p.is_premium === 1,
                        price: String(p.price || '0'),
                        avatar: p.avatar || IMAGES.avatars.user,
                        banner: p.banner || IMAGES.backgrounds.abstract
                    });
                }
            });
        }
    }, []);

    const handleSave = async () => {
        if (!isDevMode()) {
            await fetchNui('updateProfile', {
                displayName: editForm.name,
                username: editForm.tag.replace('@', ''),
                bio: editForm.bio,
                isPremium: editForm.isPremium,
                price: parseFloat(editForm.price) || 0,
                avatar: editForm.avatar,
                banner: editForm.banner
            });
        }
        setProfile(editForm);
        setView('main');
    };

    const handleCancel = () => {
        setEditForm(profile);
        setView('main');
    };

    const cycleBanner = () => {
        const currentIndex = AVAILABLE_BANNERS.indexOf(editForm.banner);
        const nextIndex = (currentIndex + 1) % AVAILABLE_BANNERS.length;
        setEditForm({ ...editForm, banner: AVAILABLE_BANNERS[nextIndex] });
    };

    // --- View: Edit Profile ---
    if (view === 'edit') {
        return (
            <div className="flex flex-col min-h-full bg-white pb-24 animate-fade-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-20">
                    <button onClick={handleCancel} className="text-gray-500 text-sm font-medium hover:text-gray-800">Cancel</button>
                    <h2 className="font-bold text-lg">Edit Profile</h2>
                    <button onClick={handleSave} className="text-orange-500 text-sm font-bold hover:text-orange-600">Done</button>
                </div>

                <div className="overflow-y-auto">
                    <div className="relative h-32 w-full bg-gray-100 cursor-pointer group" onClick={cycleBanner}>
                        <img src={editForm.banner} alt="Banner" className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 text-white">
                                <span className="material-symbols-rounded text-sm">add_a_photo</span>
                                <span className="text-xs font-bold">Change Banner</span>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pb-6">
                        <div className="relative -mt-10 mb-6 flex justify-center">
                            <div className="relative">
                                <img src={editForm.avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-white" />
                                <div className="absolute bottom-0 right-0 bg-orange-500 p-1.5 rounded-full text-white border-2 border-white cursor-pointer shadow-sm">
                                    <span className="material-symbols-rounded text-sm font-bold">edit</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <FormInput label="Name" value={editForm.name} onChange={(v) => setEditForm({...editForm, name: v})} variant="boxed" />
                            <FormInput label="Username (Tag)" value={editForm.tag} onChange={(v) => setEditForm({...editForm, tag: v})} variant="boxed" />
                            <FormInput label="Bio" value={editForm.bio} onChange={(v) => setEditForm({...editForm, bio: v})} variant="boxed" rows={3} />
                        </div>

                        <div className="h-px bg-gray-100 my-6"></div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Plan</label>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setEditForm({...editForm, isPremium: false})}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${!editForm.isPremium ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
                                >
                                    <span className="material-symbols-rounded text-2xl mb-1">lock_open</span>
                                    <span className="font-bold">Free</span>
                                </button>
                                <button
                                    onClick={() => setEditForm({...editForm, isPremium: true})}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${editForm.isPremium ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
                                >
                                    <span className="material-symbols-rounded text-2xl mb-1">diamond</span>
                                    <span className="font-bold">Premium</span>
                                </button>
                            </div>

                            {editForm.isPremium && (
                                <div className="animate-fade-in bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                    <span className="text-sm font-semibold text-gray-700">Monthly Price</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-400 text-lg">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editForm.price}
                                            onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                                            className="w-20 text-right font-bold text-gray-900 border-b border-gray-300 bg-transparent focus:border-orange-500 focus:outline-none text-lg p-0"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- View: Main Profile ---
    return (
        <div className="flex flex-col min-h-full bg-gray-50 pb-24">
            <ProfileHeader
                banner={profile.banner}
                avatar={profile.avatar}
                name={profile.name}
                tag={profile.tag}
                isPremium={profile.isPremium}
                price={profile.price}
            />

            <div className="px-4 mt-6 space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <MenuItem
                        icon="person_edit"
                        label="Edit Profile"
                        iconBg="bg-orange-100"
                        iconColor="text-orange-600"
                        onClick={() => { setEditForm(profile); setView('edit'); }}
                        border
                    />
                    <MenuItem
                        icon="block"
                        label="Blocked Users"
                        iconBg="bg-red-50"
                        iconColor="text-red-500"
                    />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <MenuItem
                        icon="dark_mode"
                        label="Dark Mode"
                        iconBg="bg-gray-100"
                        iconColor="text-gray-600"
                        showChevron={false}
                        rightContent={<ToggleSwitch checked={darkMode} onChange={setDarkMode} />}
                        border
                    />
                    <MenuItem
                        icon="notifications"
                        label="Notifications"
                        iconBg="bg-blue-50"
                        iconColor="text-blue-500"
                        showChevron={false}
                        rightContent={<ToggleSwitch checked={notifications} onChange={setNotifications} />}
                    />
                </div>

                 <button
                    onClick={onLogout}
                    className="w-full bg-white text-red-500 font-bold py-4 rounded-2xl shadow-sm border border-gray-100 mt-2 hover:bg-red-50 transition-colors"
                 >
                    Sign Out
                 </button>
            </div>

            <div className="flex justify-center mt-6 text-xs text-gray-400 font-medium">
                Privy v1.0.2
            </div>
        </div>
    );
};
