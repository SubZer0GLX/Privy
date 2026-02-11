import React, { useState, useEffect } from 'react';
import { IMAGES } from '../constants';
import { fetchNui, isDevMode } from '../utils/nui';
import { ProfileHeader } from '../components/ProfileHeader';
import { MenuItem } from '../components/MenuItem';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { FormInput } from '../components/FormInput';
import { PaymentCurrency } from '../types';

interface UserProfile {
    name: string;
    tag: string;
    bio: string;
    isPremium: boolean;
    price: string;
    paymentCurrency: PaymentCurrency;
    avatar: string;
    banner: string;
}

interface ProfileScreenProps {
    onLogout?: () => void;
    darkMode?: boolean;
    onDarkModeChange?: (value: boolean) => void;
}

const AVAILABLE_BANNERS = [
    IMAGES.backgrounds.abstract,
    IMAGES.backgrounds.mountain,
    IMAGES.backgrounds.beach
];

interface BlockedUser {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
}

const MOCK_BLOCKED_USERS: BlockedUser[] = [
    { id: 'b1', username: '@markos_fit', displayName: 'Markos', avatar: IMAGES.avatars.markos },
    { id: 'b2', username: '@elena_rose', displayName: 'Elena Rose', avatar: IMAGES.avatars.elena },
    { id: 'b3', username: '@kurt_w', displayName: 'Kurt Wagner', avatar: IMAGES.avatars.kurt },
    { id: 'b4', username: '@carl_johnson', displayName: 'Carl J.', avatar: IMAGES.avatars.carl },
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout, darkMode = false, onDarkModeChange }) => {
    const [view, setView] = useState<'main' | 'edit' | 'blocked'>('main');
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>(MOCK_BLOCKED_USERS);

    const [profile, setProfile] = useState<UserProfile>({
        name: 'Your Story',
        tag: '@user_story',
        bio: 'Digital creator & artist. Welcome to my exclusive content world!',
        isPremium: true,
        price: '4.99',
        paymentCurrency: 'cash',
        avatar: IMAGES.avatars.user,
        banner: IMAGES.backgrounds.abstract
    });

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
                        paymentCurrency: p.payment_currency || 'cash',
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
                paymentCurrency: editForm.paymentCurrency,
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

    const handleUnblock = async (userId: string) => {
        if (!isDevMode()) {
            await fetchNui('unblockUser', { userId });
        }
        setBlockedUsers(blockedUsers.filter(u => u.id !== userId));
    };

    // --- View: Blocked Users ---
    if (view === 'blocked') {
        return (
            <div className="flex flex-col min-h-full bg-white dark:bg-gray-900 pb-24 animate-fade-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-20">
                    <button onClick={() => setView('main')} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <span className="material-symbols-rounded">arrow_back</span>
                    </button>
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">Usuários Bloqueados</h2>
                    <div className="w-10"></div>
                </div>

                <div className="overflow-y-auto">
                    {blockedUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-6">
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-4">
                                <span className="material-symbols-rounded text-4xl text-gray-400 dark:text-gray-500">shield</span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-semibold text-base mb-1">Nenhum usuário bloqueado</p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm text-center">Quando você bloquear alguém, essa pessoa aparecerá aqui.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {blockedUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <img src={user.avatar} alt={user.displayName} className="w-12 h-12 rounded-full object-cover bg-gray-200 dark:bg-gray-700 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{user.displayName}</p>
                                            <p className="text-gray-400 dark:text-gray-500 text-xs">{user.username}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleUnblock(user.id)}
                                        className="ml-3 shrink-0 px-4 py-2 rounded-xl text-xs font-bold border-2 border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-[0.97] transition-all"
                                    >
                                        Desbloquear
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- View: Edit Profile ---
    if (view === 'edit') {
        return (
            <div className="flex flex-col min-h-full bg-white dark:bg-gray-900 pb-24 animate-fade-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-20">
                    <button onClick={handleCancel} className="text-gray-500 dark:text-gray-400 text-sm font-medium hover:text-gray-800 dark:hover:text-gray-200">Cancel</button>
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">Edit Profile</h2>
                    <button onClick={handleSave} className="text-orange-500 text-sm font-bold hover:text-orange-600">Done</button>
                </div>

                <div className="overflow-y-auto">
                    <div className="relative h-32 w-full bg-gray-100 dark:bg-gray-800 cursor-pointer group" onClick={cycleBanner}>
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
                                <img src={editForm.avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-md bg-white dark:bg-gray-900" />
                                <div className="absolute bottom-0 right-0 bg-orange-500 p-1.5 rounded-full text-white border-2 border-white dark:border-gray-900 cursor-pointer shadow-sm">
                                    <span className="material-symbols-rounded text-sm font-bold">edit</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <FormInput label="Name" value={editForm.name} onChange={(v) => setEditForm({...editForm, name: v})} variant="boxed" />
                            <FormInput label="Username (Tag)" value={editForm.tag} onChange={(v) => setEditForm({...editForm, tag: v})} variant="boxed" />
                            <FormInput label="Bio" value={editForm.bio} onChange={(v) => setEditForm({...editForm, bio: v})} variant="boxed" rows={3} />
                        </div>

                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-6"></div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Account Plan</label>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setEditForm({...editForm, isPremium: false})}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${!editForm.isPremium ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300'}`}
                                >
                                    <span className="material-symbols-rounded text-2xl mb-1">lock_open</span>
                                    <span className="font-bold">Free</span>
                                </button>
                                <button
                                    onClick={() => setEditForm({...editForm, isPremium: true})}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${editForm.isPremium ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300'}`}
                                >
                                    <span className="material-symbols-rounded text-2xl mb-1">diamond</span>
                                    <span className="font-bold">Premium</span>
                                </button>
                            </div>

                            {editForm.isPremium && (
                                <div className="animate-fade-in space-y-3">
                                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Moeda do Pagamento</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setEditForm({...editForm, paymentCurrency: 'cash'})}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${editForm.paymentCurrency === 'cash' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300'}`}
                                        >
                                            <span className="material-symbols-rounded text-2xl mb-1">payments</span>
                                            <span className="font-bold text-sm">Dinheiro</span>
                                        </button>
                                        <button
                                            onClick={() => setEditForm({...editForm, paymentCurrency: 'diamonds'})}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${editForm.paymentCurrency === 'diamonds' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300'}`}
                                        >
                                            <span className="material-symbols-rounded text-2xl mb-1">diamond</span>
                                            <span className="font-bold text-sm">Diamantes</span>
                                        </button>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Preço Semanal</span>
                                        <div className="flex items-center gap-1">
                                            <span className={`text-lg ${editForm.paymentCurrency === 'diamonds' ? 'text-purple-400 dark:text-purple-500' : 'text-green-500 dark:text-green-400'}`}>
                                                {editForm.paymentCurrency === 'diamonds' ? '💎' : '$'}
                                            </span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editForm.price}
                                                onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                                                className="w-20 text-right font-bold text-gray-900 dark:text-white border-b border-gray-300 dark:border-gray-600 bg-transparent focus:border-orange-500 focus:outline-none text-lg p-0"
                                                placeholder="0.00"
                                            />
                                        </div>
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
        <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-900 pb-24">
            <ProfileHeader
                banner={profile.banner}
                avatar={profile.avatar}
                name={profile.name}
                tag={profile.tag}
                isPremium={profile.isPremium}
                price={profile.price}
                paymentCurrency={profile.paymentCurrency}
            />

            <div className="px-4 mt-6 space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <MenuItem
                        icon="person_edit"
                        label="Edit Profile"
                        iconBg="bg-orange-100 dark:bg-orange-900/30"
                        iconColor="text-orange-600 dark:text-orange-400"
                        onClick={() => { setEditForm(profile); setView('edit'); }}
                        border
                    />
                    <MenuItem
                        icon="block"
                        label="Blocked Users"
                        iconBg="bg-red-50 dark:bg-red-900/30"
                        iconColor="text-red-500"
                        onClick={() => setView('blocked')}
                        rightContent={
                            <div className="flex items-center gap-2">
                                {blockedUsers.length > 0 && <span className="text-xs font-bold text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">{blockedUsers.length}</span>}
                                <span className="material-symbols-rounded text-gray-400 dark:text-gray-500">chevron_right</span>
                            </div>
                        }
                    />
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <MenuItem
                        icon="dark_mode"
                        label="Dark Mode"
                        iconBg="bg-gray-100 dark:bg-gray-700"
                        iconColor="text-gray-600 dark:text-gray-300"
                        showChevron={false}
                        rightContent={<ToggleSwitch checked={darkMode} onChange={(v) => onDarkModeChange?.(v)} />}
                        border
                    />
                    <MenuItem
                        icon="notifications"
                        label="Notifications"
                        iconBg="bg-blue-50 dark:bg-blue-900/30"
                        iconColor="text-blue-500"
                        showChevron={false}
                        rightContent={<ToggleSwitch checked={notifications} onChange={setNotifications} />}
                    />
                </div>

                 <button
                    onClick={onLogout}
                    className="w-full bg-white dark:bg-gray-800 text-red-500 font-bold py-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mt-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                 >
                    Sign Out
                 </button>
            </div>

            <div className="flex justify-center mt-6 text-xs text-gray-400 dark:text-gray-500 font-medium">
                Privy v1.0.2
            </div>
        </div>
    );
};
