import React, { useState, useEffect } from 'react';
import { IMAGES } from '../constants';
import { fetchNui, isDevMode, formatTimestamp } from '../utils/nui';
import { ProfileHeader } from '../components/ProfileHeader';
import { PostCard } from '../components/PostCard';
import { GalleryGrid, GalleryPost } from '../components/GalleryGrid';
import { MenuItem } from '../components/MenuItem';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { FormInput } from '../components/FormInput';
import { PaymentCurrency, Post } from '../types';
import { PrismaIcon } from '../components/PrismaIcon';

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
    onUserClick?: (userId: string) => void;
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

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout, darkMode = false, onDarkModeChange, onUserClick }) => {
    const [view, setView] = useState<'main' | 'settings' | 'edit' | 'blocked' | 'liked' | 'myPosts' | 'myStories' | 'wallet'>('main');
    const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');
    const [viewingPost, setViewingPost] = useState<Post | null>(null);
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>(isDevMode() ? MOCK_BLOCKED_USERS : []);
    const [likedPosts, setLikedPosts] = useState<Post[]>([]);
    const [loadingLiked, setLoadingLiked] = useState(!isDevMode());
    const [myPosts, setMyPosts] = useState<Post[]>([]);
    const [loadingMyPosts, setLoadingMyPosts] = useState(!isDevMode());
    const [myStories, setMyStories] = useState<any[]>([]);
    const [loadingMyStories, setLoadingMyStories] = useState(!isDevMode());
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'post' | 'story'; id: string } | null>(null);
    const [wallet, setWallet] = useState<{ cashBalance: number; prismaBalance: number }>({ cashBalance: 0, prismaBalance: 0 });
    const [loadingWallet, setLoadingWallet] = useState(!isDevMode());
    const [withdrawing, setWithdrawing] = useState<'cash' | 'prismas' | null>(null);
    const [withdrawConfirm, setWithdrawConfirm] = useState<'cash' | 'prismas' | null>(null);

    const [profile, setProfile] = useState<UserProfile>(isDevMode() ? {
        name: 'Your Story',
        tag: '@user_story',
        bio: 'Digital creator & artist. Welcome to my exclusive content world!',
        isPremium: true,
        price: '4.99',
        paymentCurrency: 'cash',
        avatar: IMAGES.avatars.user,
        banner: IMAGES.backgrounds.abstract
    } : {
        name: '',
        tag: '@',
        bio: '',
        isPremium: false,
        price: '0',
        paymentCurrency: 'cash',
        avatar: IMAGES.avatars.user,
        banner: IMAGES.backgrounds.abstract
    });
    const [loadingProfile, setLoadingProfile] = useState(!isDevMode());

    const [notifications, setNotifications] = useState(true);
    const [editForm, setEditForm] = useState<UserProfile>(profile);

    // Helper to map server posts to Post[]
    const mapPosts = (result: any[], forceIsLiked?: boolean): Post[] => {
        return result.map((p: any) => ({
            id: String(p.id),
            user: {
                id: String(p.user_id),
                username: p.username || 'unknown',
                displayName: p.display_name || p.username || 'Unknown',
                avatar: p.avatar || IMAGES.avatars.user,
                isVerified: p.is_premium === 1,
            },
            timestamp: p.created_at || 'now',
            content: p.content || '',
            images: p.images || (p.image ? [p.image] : undefined),
            likes: p.like_count || p.likes || 0,
            comments: p.comment_count || 0,
            isLiked: forceIsLiked !== undefined ? forceIsLiked : (p.isLiked || false),
        }));
    };

    useEffect(() => {
        if (!isDevMode()) {
            // Load profile
            fetchNui<any>('getProfile', {}).then((result) => {
                if (result?.success && result.profile) {
                    const p = result.profile;
                    setProfile({
                        name: p.display_name || p.username || 'User',
                        tag: '@' + (p.username || 'user'),
                        bio: p.bio || '',
                        isPremium: p.is_premium == 1 || p.is_premium === true,
                        price: String(p.price || '0'),
                        paymentCurrency: p.payment_currency || 'cash',
                        avatar: p.avatar || IMAGES.avatars.user,
                        banner: p.banner || IMAGES.backgrounds.abstract
                    });
                }
                setLoadingProfile(false);
            });

            // Pre-load my posts
            fetchNui<any[]>('getMyPosts', {}).then((result) => {
                if (Array.isArray(result)) {
                    setMyPosts(mapPosts(result));
                }
                setLoadingMyPosts(false);
            });

            // Pre-load my stories
            fetchNui<any>('getMyStories', {}).then((result) => {
                if (result && Array.isArray(result.items)) {
                    setMyStories(result.items);
                }
                setLoadingMyStories(false);
            });

            // Pre-load liked posts
            fetchNui<any[]>('getLikedPosts', {}).then((result) => {
                if (Array.isArray(result)) {
                    setLikedPosts(mapPosts(result, true));
                }
                setLoadingLiked(false);
            });

            // Pre-load wallet
            fetchNui<any>('getWallet', {}).then((result) => {
                if (result) {
                    setWallet({
                        cashBalance: parseFloat(result.cashBalance) || 0,
                        prismaBalance: parseInt(result.prismaBalance) || 0,
                    });
                }
                setLoadingWallet(false);
            });

            // Pre-load blocked users
            fetchNui<any[]>('getBlockedUsers', {}).then((result) => {
                if (Array.isArray(result)) {
                    const mapped: BlockedUser[] = result.map((u: any) => ({
                        id: String(u.id),
                        username: '@' + (u.username || 'user'),
                        displayName: u.display_name || u.username || 'User',
                        avatar: u.avatar || IMAGES.avatars.user,
                    }));
                    setBlockedUsers(mapped);
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

    const pickBanner = () => {
        if (isDevMode()) {
            const currentIndex = AVAILABLE_BANNERS.indexOf(editForm.banner);
            const nextIndex = (currentIndex + 1) % AVAILABLE_BANNERS.length;
            setEditForm({ ...editForm, banner: AVAILABLE_BANNERS[nextIndex] });
            return;
        }
        components.setGallery({
            includeImages: true,
            includeVideos: false,
            multiSelect: false,
            onSelect: (data) => {
                const photo = Array.isArray(data) ? data[0] : data;
                if (photo?.src) {
                    setEditForm(prev => ({ ...prev, banner: photo.src }));
                }
            }
        });
    };

    const pickAvatar = () => {
        if (isDevMode()) return;
        components.setGallery({
            includeImages: true,
            includeVideos: false,
            multiSelect: false,
            onSelect: (data) => {
                const photo = Array.isArray(data) ? data[0] : data;
                if (photo?.src) {
                    setEditForm(prev => ({ ...prev, avatar: photo.src }));
                }
            }
        });
    };

    const handleUnblock = async (userId: string) => {
        if (!isDevMode()) {
            await fetchNui('unblockUser', { userId });
        }
        setBlockedUsers(blockedUsers.filter(u => u.id !== userId));
    };

    const handleOpenLiked = () => {
        setView('liked');
    };

    const handleOpenMyPosts = () => {
        setView('myPosts');
    };

    const handleOpenMyStories = () => {
        setView('myStories');
    };

    const handleDeletePost = async (postId: string) => {
        if (!isDevMode()) {
            await fetchNui('deletePost', { postId });
        }
        setMyPosts(prev => prev.filter(p => p.id !== postId));
        setDeleteConfirm(null);
    };

    const handleDeleteStory = async (storyId: string) => {
        if (!isDevMode()) {
            await fetchNui('deleteStory', { storyId });
        }
        setMyStories(prev => prev.filter(s => String(s.id) !== storyId));
        setDeleteConfirm(null);
    };

    const handleWithdraw = async (currency: 'cash' | 'prismas') => {
        const amount = currency === 'cash' ? wallet.cashBalance : wallet.prismaBalance;
        if (amount <= 0) return;
        setWithdrawConfirm(null);
        setWithdrawing(currency);
        if (!isDevMode()) {
            await fetchNui('withdrawWallet', { currency, amount });
        }
        setWallet(prev => ({
            ...prev,
            cashBalance: currency === 'cash' ? 0 : prev.cashBalance,
            prismaBalance: currency === 'prismas' ? 0 : prev.prismaBalance,
        }));
        setWithdrawing(null);
    };

    // --- View: Wallet ---
    if (view === 'wallet') {
        return (
            <div className="flex flex-col min-h-full bg-white dark:bg-gray-900 pb-24 animate-fade-in">
                <div className="flex items-center justify-between px-4 pt-16 pb-3 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-20">
                    <button onClick={() => setView('main')} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <span className="material-symbols-rounded">arrow_back</span>
                    </button>
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">Wallet</h2>
                    <div className="w-10"></div>
                </div>

                <div className="overflow-y-auto px-4 pt-6">
                    {loadingWallet ? (
                        <div className="flex items-center justify-center py-20">
                            <span className="material-symbols-rounded text-3xl text-orange-500 animate-spin">progress_activity</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Cash Balance Card */}
                            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 shadow-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="material-symbols-rounded text-white/80 text-xl">payments</span>
                                    <span className="text-white/80 text-sm font-semibold">Dinheiro</span>
                                </div>
                                <div className="text-white text-3xl font-bold mb-4">
                                    ${wallet.cashBalance.toFixed(2)}
                                </div>
                                <p className="text-white/60 text-xs mb-4">Saldo proveniente de assinaturas em dinheiro</p>
                                <button
                                    onClick={() => setWithdrawConfirm('cash')}
                                    disabled={wallet.cashBalance <= 0 || withdrawing === 'cash'}
                                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                                        wallet.cashBalance > 0 && withdrawing !== 'cash'
                                            ? 'bg-white text-green-600 hover:bg-green-50 active:scale-[0.98]'
                                            : 'bg-white/20 text-white/50 cursor-not-allowed'
                                    }`}
                                >
                                    {withdrawing === 'cash' ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="material-symbols-rounded text-base animate-spin">progress_activity</span>
                                            Sacando...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="material-symbols-rounded text-base">account_balance</span>
                                            Sacar Dinheiro
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Prisma Balance Card */}
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 shadow-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <PrismaIcon className="w-5 h-5" />
                                    <span className="text-white/80 text-sm font-semibold">Prismas</span>
                                </div>
                                <div className="text-white text-3xl font-bold mb-4 flex items-center gap-2">
                                    <PrismaIcon className="w-7 h-7" />
                                    {wallet.prismaBalance}
                                </div>
                                <p className="text-white/60 text-xs mb-4">Saldo proveniente de assinaturas e tips em prismas</p>
                                <button
                                    onClick={() => setWithdrawConfirm('prismas')}
                                    disabled={wallet.prismaBalance <= 0 || withdrawing === 'prismas'}
                                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                                        wallet.prismaBalance > 0 && withdrawing !== 'prismas'
                                            ? 'bg-white text-purple-600 hover:bg-purple-50 active:scale-[0.98]'
                                            : 'bg-white/20 text-white/50 cursor-not-allowed'
                                    }`}
                                >
                                    {withdrawing === 'prismas' ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="material-symbols-rounded text-base animate-spin">progress_activity</span>
                                            Sacando...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="material-symbols-rounded text-base">account_balance</span>
                                            Sacar Prismas
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Info */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-rounded text-orange-500 text-xl mt-0.5">info</span>
                                    <div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">Como funciona?</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                            Quando alguém assina seu perfil premium, o valor é acumulado aqui. Você pode sacar a qualquer momento para receber diretamente na sua conta do jogo.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Withdraw Confirmation Dialog */}
                {withdrawConfirm && (() => {
                    const isCash = withdrawConfirm === 'cash';
                    const grossAmount = isCash ? wallet.cashBalance : wallet.prismaBalance;
                    const fee = isCash ? grossAmount * 0.1 : Math.floor(grossAmount * 0.1);
                    const netAmount = isCash ? grossAmount - fee : grossAmount - fee;
                    return (
                        <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center" onClick={() => setWithdrawConfirm(null)}>
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mx-8 w-full max-w-xs shadow-xl" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-center mb-4">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isCash ? 'bg-green-100 dark:bg-green-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                                        <span className={`material-symbols-rounded text-2xl ${isCash ? 'text-green-500' : 'text-purple-500'}`}>receipt_long</span>
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white text-center mb-1">Confirmar Saque</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-5">Uma taxa de <span className="font-bold text-orange-500">10%</span> será aplicada sobre o valor do saque.</p>

                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2 mb-5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Saldo total</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {isCash ? `$${grossAmount.toFixed(2)}` : `${grossAmount} prismas`}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Taxa (10%)</span>
                                        <span className="text-sm font-bold text-red-500">
                                            -{isCash ? `$${fee.toFixed(2)}` : `${fee} prismas`}
                                        </span>
                                    </div>
                                    <div className="h-px bg-gray-200 dark:bg-gray-600"></div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Você recebe</span>
                                        <span className={`text-lg font-bold ${isCash ? 'text-green-500' : 'text-purple-500'}`}>
                                            {isCash ? `$${netAmount.toFixed(2)}` : `${netAmount} prismas`}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => setWithdrawConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-sm">
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => handleWithdraw(withdrawConfirm)}
                                        className={`flex-1 py-2.5 rounded-xl text-white font-semibold text-sm ${isCash ? 'bg-green-500 hover:bg-green-600' : 'bg-purple-500 hover:bg-purple-600'}`}
                                    >
                                        Sacar
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        );
    }

    // --- View: Liked Posts ---
    if (view === 'liked') {
        return (
            <div className="flex flex-col min-h-full bg-white dark:bg-gray-900 pb-24 animate-fade-in">
                <div className="flex items-center justify-between px-4 pt-16 pb-3 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-20">
                    <button onClick={() => setView('main')} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <span className="material-symbols-rounded">arrow_back</span>
                    </button>
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">Liked Posts</h2>
                    <div className="w-10"></div>
                </div>

                <div className="overflow-y-auto">
                    {loadingLiked ? (
                        <div className="flex items-center justify-center py-20">
                            <span className="material-symbols-rounded text-3xl text-orange-500 animate-spin">progress_activity</span>
                        </div>
                    ) : likedPosts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-6">
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-4">
                                <span className="material-symbols-rounded text-4xl text-gray-400 dark:text-gray-500">favorite</span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-semibold text-base mb-1">No liked posts</p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm text-center">Posts you like will appear here.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {likedPosts.map(post => (
                                <PostCard key={post.id} post={post} onUserClick={onUserClick} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- View: Blocked Users ---
    if (view === 'blocked') {
        return (
            <div className="flex flex-col min-h-full bg-white dark:bg-gray-900 pb-24 animate-fade-in">
                <div className="flex items-center justify-between px-4 pt-16 pb-3 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-20">
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

    // --- View: My Posts ---
    if (view === 'myPosts') {
        return (
            <div className="flex flex-col min-h-full bg-white dark:bg-gray-900 pb-24 animate-fade-in">
                <div className="flex items-center justify-between px-4 pt-16 pb-3 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-20">
                    <button onClick={() => setView('main')} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <span className="material-symbols-rounded">arrow_back</span>
                    </button>
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">My Posts</h2>
                    <div className="w-10"></div>
                </div>

                <div className="overflow-y-auto">
                    {loadingMyPosts ? (
                        <div className="flex items-center justify-center py-20">
                            <span className="material-symbols-rounded text-3xl text-orange-500 animate-spin">progress_activity</span>
                        </div>
                    ) : myPosts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-6">
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-4">
                                <span className="material-symbols-rounded text-4xl text-gray-400 dark:text-gray-500">photo_library</span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-semibold text-base mb-1">No posts yet</p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm text-center">Your posts will appear here.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {myPosts.map(post => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    onUserClick={onUserClick}
                                    onDelete={(postId) => setDeleteConfirm({ type: 'post', id: postId })}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Delete confirmation */}
                {deleteConfirm?.type === 'post' && (
                    <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center" onClick={() => setDeleteConfirm(null)}>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mx-8 w-full max-w-xs shadow-xl" onClick={e => e.stopPropagation()}>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white text-center mb-2">Delete Post?</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-6">This post will be permanently removed.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-sm">Cancel</button>
                                <button onClick={() => handleDeletePost(deleteConfirm.id)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600">Delete</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- View: My Stories ---
    if (view === 'myStories') {
        return (
            <div className="flex flex-col min-h-full bg-white dark:bg-gray-900 pb-24 animate-fade-in">
                <div className="flex items-center justify-between px-4 pt-16 pb-3 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-20">
                    <button onClick={() => setView('main')} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <span className="material-symbols-rounded">arrow_back</span>
                    </button>
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">My Stories</h2>
                    <div className="w-10"></div>
                </div>

                <div className="overflow-y-auto">
                    {loadingMyStories ? (
                        <div className="flex items-center justify-center py-20">
                            <span className="material-symbols-rounded text-3xl text-orange-500 animate-spin">progress_activity</span>
                        </div>
                    ) : myStories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-6">
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-4">
                                <span className="material-symbols-rounded text-4xl text-gray-400 dark:text-gray-500">auto_stories</span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-semibold text-base mb-1">No active stories</p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm text-center">Your stories will appear here while they're active.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2 p-4">
                            {myStories.map((story) => (
                                <div key={story.id} className="relative rounded-xl overflow-hidden aspect-[3/4] bg-gray-100 dark:bg-gray-800 group">
                                    <img src={story.media_url} alt="Story" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    {story.caption && (
                                        <p className="absolute bottom-8 left-2 right-2 text-white text-xs font-medium truncate">{story.caption}</p>
                                    )}
                                    <span className="absolute bottom-2 left-2 text-white/60 text-[10px]">{story.created_at}</span>
                                    <button
                                        onClick={() => setDeleteConfirm({ type: 'story', id: String(story.id) })}
                                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        style={{ opacity: 1 }}
                                    >
                                        <span className="material-symbols-rounded text-base">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Delete confirmation */}
                {deleteConfirm?.type === 'story' && (
                    <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center" onClick={() => setDeleteConfirm(null)}>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mx-8 w-full max-w-xs shadow-xl" onClick={e => e.stopPropagation()}>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white text-center mb-2">Delete Story?</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-6">This story will be permanently removed.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-sm">Cancel</button>
                                <button onClick={() => handleDeleteStory(deleteConfirm.id)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600">Delete</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- View: Edit Profile ---
    if (view === 'edit') {
        return (
            <div className="flex flex-col min-h-full bg-white dark:bg-gray-900 pb-24 animate-fade-in">
                <div className="flex items-center justify-between px-4 pt-16 pb-3 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-20">
                    <button onClick={handleCancel} className="text-gray-500 dark:text-gray-400 text-sm font-medium hover:text-gray-800 dark:hover:text-gray-200">Cancel</button>
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">Edit Profile</h2>
                    <button onClick={handleSave} className="text-orange-500 text-sm font-bold hover:text-orange-600">Done</button>
                </div>

                <div className="overflow-y-auto">
                    <div className="relative h-32 w-full bg-gray-100 dark:bg-gray-800 cursor-pointer group" onClick={pickBanner}>
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
                                <div
                                    onClick={pickAvatar}
                                    className="absolute bottom-0 right-0 bg-orange-500 p-1.5 rounded-full text-white border-2 border-white dark:border-gray-900 cursor-pointer shadow-sm"
                                >
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
                                            <PrismaIcon className="w-7 h-7 mb-1" />
                                            <span className="font-bold text-sm">Prismas</span>
                                        </button>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Preço Semanal</span>
                                        <div className="flex items-center gap-1">
                                            <span className={`text-lg ${editForm.paymentCurrency === 'diamonds' ? 'text-purple-400 dark:text-purple-500' : 'text-green-500 dark:text-green-400'}`}>
                                                {editForm.paymentCurrency === 'diamonds' ? <PrismaIcon className="w-5 h-5 inline-block" /> : '$'}
                                            </span>
                                            <input
                                                type="number"
                                                step="1"
                                                min="0"
                                                value={editForm.price}
                                                onChange={(e) => setEditForm({...editForm, price: String(Math.floor(Number(e.target.value) || 0))})}
                                                className="w-28 text-right font-bold text-gray-900 dark:text-white border-b-2 border-gray-300 dark:border-gray-600 bg-transparent focus:border-orange-500 focus:outline-none text-xl py-1 px-1"
                                                placeholder="0"
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
    if (loadingProfile) {
        return (
            <div className="flex items-center justify-center min-h-full bg-white dark:bg-gray-900 pb-24">
                <span className="material-symbols-rounded text-3xl text-orange-500 animate-spin">progress_activity</span>
            </div>
        );
    }

    // Build gallery posts from myPosts
    const galleryPosts: GalleryPost[] = myPosts.map(p => ({
        id: p.id,
        thumbnail: (p.images && p.images[0]) || p.image || IMAGES.backgrounds.abstract,
        images: p.images || (p.image ? [p.image] : [IMAGES.backgrounds.abstract]),
        content: p.content,
        timestamp: p.timestamp,
    }));

    const handlePostClick = async (postId: string) => {
        const post = myPosts.find(p => p.id === postId);
        if (post) {
            setViewingPost(post);
        }
    };

    return (
        <div className="flex flex-col min-h-full bg-white dark:bg-gray-900 pb-24 animate-fade-in">
            {/* Header with 3-dots menu */}
            <div className="sticky top-0 z-50 flex items-center justify-between px-4 pt-16 pb-3 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
                <div className="w-10"></div>
                <button
                    onClick={() => setView('settings')}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto hover:bg-white/30 transition-colors"
                >
                    <span className="material-symbols-rounded">more_vert</span>
                </button>
            </div>

            {/* Profile header */}
            <div className="-mt-14">
                <ProfileHeader
                    banner={profile.banner}
                    avatar={profile.avatar}
                    name={profile.name}
                    tag={profile.tag}
                    isPremium={profile.isPremium}
                    isVerified={profile.isPremium}
                    price={profile.price}
                    paymentCurrency={profile.paymentCurrency}
                    bio={profile.bio}
                    layout="inline"
                />
            </div>

            {/* Posts section */}
            <div className="px-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white text-lg">Posts</span>
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs font-bold">{myPosts.length}</span>
                    </div>
                    <div className="flex text-gray-400 dark:text-gray-500 gap-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'hover:text-gray-600 dark:hover:text-gray-300'}`}
                        >
                            <span className="material-symbols-rounded">grid_view</span>
                        </button>
                        <button
                            onClick={() => setViewMode('feed')}
                            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'feed' ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'hover:text-gray-600 dark:hover:text-gray-300'}`}
                        >
                            <span className="material-symbols-rounded">view_agenda</span>
                        </button>
                    </div>
                </div>
            </div>

            {loadingMyPosts ? (
                <div className="flex items-center justify-center py-16">
                    <span className="material-symbols-rounded text-3xl text-orange-500 animate-spin">progress_activity</span>
                </div>
            ) : galleryPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                    <span className="material-symbols-rounded text-5xl text-gray-300 dark:text-gray-600 mb-3">photo_library</span>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhum post ainda</p>
                </div>
            ) : viewMode === 'grid' ? (
                <GalleryGrid posts={galleryPosts} onPostClick={handlePostClick} />
            ) : (
                <div className="flex flex-col gap-2">
                    {myPosts.map(post => (
                        <PostCard key={post.id} post={post} onUserClick={onUserClick} />
                    ))}
                </div>
            )}

            {/* Viewing single post */}
            {viewingPost && (
                <div className="absolute inset-0 z-[60] bg-white dark:bg-gray-900 flex flex-col animate-fade-in">
                    <div className="flex items-center gap-3 px-4 pt-16 pb-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
                        <button onClick={() => setViewingPost(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <span className="material-symbols-rounded text-gray-700 dark:text-gray-300 text-2xl">arrow_back</span>
                        </button>
                        <h2 className="font-bold text-lg text-gray-900 dark:text-white">Post</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto hide-scrollbar pb-20">
                        <PostCard post={viewingPost} onUserClick={onUserClick} />
                    </div>
                </div>
            )}

            {/* Settings Panel Overlay */}
            {view === 'settings' && (
                <div className="absolute inset-0 z-[70] bg-white dark:bg-gray-900 flex flex-col animate-fade-in">
                    <div className="flex items-center justify-between px-4 pt-16 pb-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
                        <button onClick={() => setView('main')} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <span className="material-symbols-rounded">arrow_back</span>
                        </button>
                        <h2 className="font-bold text-lg text-gray-900 dark:text-white">Settings</h2>
                        <div className="w-10"></div>
                    </div>

                    <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pt-4 pb-24 space-y-4">
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
                                icon="photo_library"
                                label="My Posts"
                                iconBg="bg-blue-50 dark:bg-blue-900/30"
                                iconColor="text-blue-500"
                                onClick={handleOpenMyPosts}
                                rightContent={
                                    <div className="flex items-center gap-2">
                                        {myPosts.length > 0 && <span className="text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">{myPosts.length}</span>}
                                        <span className="material-symbols-rounded text-gray-400 dark:text-gray-500">chevron_right</span>
                                    </div>
                                }
                                border
                            />
                            <MenuItem
                                icon="auto_stories"
                                label="My Stories"
                                iconBg="bg-purple-50 dark:bg-purple-900/30"
                                iconColor="text-purple-500"
                                onClick={handleOpenMyStories}
                                border
                            />
                            <MenuItem
                                icon="favorite"
                                label="Liked Posts"
                                iconBg="bg-red-50 dark:bg-red-900/30"
                                iconColor="text-red-500"
                                onClick={handleOpenLiked}
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
                                border
                            />
                            <MenuItem
                                icon="account_balance_wallet"
                                label="Wallet"
                                iconBg="bg-green-50 dark:bg-green-900/30"
                                iconColor="text-green-500"
                                onClick={() => setView('wallet')}
                                rightContent={
                                    <div className="flex items-center gap-2">
                                        {(wallet.cashBalance > 0 || wallet.prismaBalance > 0) && (
                                            <span className="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                                                ${wallet.cashBalance.toFixed(0)}
                                            </span>
                                        )}
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

                        <div className="flex justify-center mt-4 text-xs text-gray-400 dark:text-gray-500 font-medium">
                            Privy v1.0.2
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
