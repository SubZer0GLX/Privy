import React, { useState, useEffect } from 'react';
import { IMAGES } from '../constants';
import { fetchNui, isDevMode } from '../utils/nui';
import { ProfileHeader } from '../components/ProfileHeader';
import { GalleryGrid, GalleryPost } from '../components/GalleryGrid';

// Mock Database for dev mode
const USER_DATABASE: Record<string, any> = {
    'u2': {
        name: 'Amara',
        handle: '@amara_x',
        bio: 'Fashion & Lifestyle Model | Travel addict',
        avatar: IMAGES.avatars.amara,
        banner: IMAGES.backgrounds.beach,
        isPremium: true,
        price: '9.99',
        paymentCurrency: 'diamonds' as const,
        mediaCount: 142,
        isLocked: true,
        posts: [
            { thumbnail: IMAGES.posts.desert, images: [IMAGES.posts.desert, IMAGES.backgrounds.beach, IMAGES.backgrounds.mountain], content: 'Desert dreams come true ✨', timestamp: '2h ago' },
            { thumbnail: IMAGES.backgrounds.beach, images: [IMAGES.backgrounds.beach], content: 'Beach vibes only 🌊', timestamp: '5h ago' },
            { thumbnail: IMAGES.posts.studio, images: [IMAGES.posts.studio, IMAGES.posts.desert], content: 'New photoshoot behind the scenes!', timestamp: '1d ago' },
            { thumbnail: IMAGES.backgrounds.mountain, images: [IMAGES.backgrounds.mountain, IMAGES.posts.studio, IMAGES.posts.desert], content: 'Mountain escape 🏔️', timestamp: '2d ago' },
            { thumbnail: IMAGES.posts.desert, images: [IMAGES.posts.desert], content: 'Golden hour never disappoints', timestamp: '3d ago' },
            { thumbnail: IMAGES.backgrounds.beach, images: [IMAGES.backgrounds.beach, IMAGES.backgrounds.mountain], content: 'Travel diary entry #47', timestamp: '4d ago' },
            { thumbnail: IMAGES.posts.studio, images: [IMAGES.posts.studio], content: 'Studio session 📸', timestamp: '5d ago' },
            { thumbnail: IMAGES.posts.desert, images: [IMAGES.posts.desert, IMAGES.backgrounds.beach], content: 'Sunset collection', timestamp: '6d ago' },
            { thumbnail: IMAGES.backgrounds.mountain, images: [IMAGES.backgrounds.mountain], content: 'Nature therapy 🌿', timestamp: '1w ago' },
        ] as GalleryPost[]
    },
    'u6': {
        name: 'Sierra Sky',
        handle: '@sierrasky',
        bio: 'Desert vibes and golden hours. Capture the moment.',
        avatar: IMAGES.avatars.sierra,
        banner: IMAGES.posts.desert,
        isPremium: true,
        price: '5.00',
        paymentCurrency: 'cash' as const,
        mediaCount: 89,
        isLocked: false,
        posts: [
            { thumbnail: IMAGES.posts.desert, images: [IMAGES.posts.desert, IMAGES.posts.studio, IMAGES.backgrounds.mountain], content: 'Golden hour in the dunes. Swipe for more! #desertvibes', timestamp: '2h ago' },
            { thumbnail: IMAGES.posts.studio, images: [IMAGES.posts.studio], content: 'New studio setup is finally complete!', timestamp: '5h ago' },
            { thumbnail: IMAGES.backgrounds.beach, images: [IMAGES.backgrounds.beach, IMAGES.posts.desert], content: 'Weekend getaway vibes 🌅', timestamp: '1d ago' },
            { thumbnail: IMAGES.posts.desert, images: [IMAGES.posts.desert], content: 'Chasing sunsets every day', timestamp: '2d ago' },
            { thumbnail: IMAGES.backgrounds.mountain, images: [IMAGES.backgrounds.mountain, IMAGES.backgrounds.beach, IMAGES.posts.studio, IMAGES.posts.desert], content: 'Full set from the mountain trip! 🏔️✨', timestamp: '3d ago' },
            { thumbnail: IMAGES.posts.studio, images: [IMAGES.posts.studio, IMAGES.backgrounds.mountain], content: 'Behind the scenes of yesterday', timestamp: '5d ago' },
        ] as GalleryPost[]
    },
    'default': {
        name: 'User Profile',
        handle: '@user_handle',
        bio: 'Content Creator',
        avatar: IMAGES.avatars.user,
        banner: IMAGES.backgrounds.abstract,
        isPremium: false,
        paymentCurrency: 'cash' as const,
        mediaCount: 24,
        isLocked: false,
        posts: [
            { thumbnail: IMAGES.backgrounds.abstract, images: [IMAGES.backgrounds.abstract, IMAGES.posts.desert], content: 'New beginnings 🎨', timestamp: '1h ago' },
            { thumbnail: IMAGES.posts.desert, images: [IMAGES.posts.desert], content: 'Exploring new places', timestamp: '3h ago' },
            { thumbnail: IMAGES.backgrounds.mountain, images: [IMAGES.backgrounds.mountain, IMAGES.backgrounds.beach, IMAGES.backgrounds.abstract], content: 'Adventure awaits! Full album from the trip', timestamp: '1d ago' },
            { thumbnail: IMAGES.backgrounds.beach, images: [IMAGES.backgrounds.beach], content: 'Perfect day at the beach 🏖️', timestamp: '2d ago' },
            { thumbnail: IMAGES.posts.studio, images: [IMAGES.posts.studio, IMAGES.posts.desert], content: 'Creative process in motion', timestamp: '4d ago' },
            { thumbnail: IMAGES.backgrounds.abstract, images: [IMAGES.backgrounds.abstract], content: 'Art is everywhere', timestamp: '1w ago' },
        ] as GalleryPost[]
    }
};

// --- Profile Feed List (view_agenda mode) ---
const ProfileFeedList: React.FC<{ posts: GalleryPost[]; user: any; isLocked: boolean; mediaCount: number }> = ({ posts, user, isLocked, mediaCount }) => {
    const [imageIndexes, setImageIndexes] = React.useState<Record<number, number>>({});

    const getImageIndex = (postIdx: number) => imageIndexes[postIdx] || 0;

    const setImageIndex = (postIdx: number, imgIdx: number) => {
        setImageIndexes(prev => ({ ...prev, [postIdx]: imgIdx }));
    };

    if (isLocked) {
        return (
            <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mx-auto w-fit mb-3">
                    <span className="material-symbols-rounded text-3xl">lock</span>
                </div>
                <p>Assine para desbloquear {mediaCount} posts</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {posts.map((post, postIdx) => {
                const currentImg = getImageIndex(postIdx);
                return (
                    <article key={postIdx} className="bg-white dark:bg-gray-900">
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3">
                            <img src={user.avatar} alt="Avatar" className="w-9 h-9 rounded-full object-cover bg-gray-200 dark:bg-gray-700" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-sm text-gray-900 dark:text-white truncate">{user.name}</span>
                                    {user.isPremium && <span className="material-symbols-rounded text-orange-500 text-[14px] filled">verified</span>}
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{user.handle} • {post.timestamp || ''}</p>
                            </div>
                        </div>

                        {/* Content */}
                        {post.content && (
                            <div className="px-4 pb-2">
                                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{post.content}</p>
                            </div>
                        )}

                        {/* Image carousel */}
                        <div className="relative w-full bg-gray-100 dark:bg-gray-800 overflow-hidden select-none">
                            <img src={post.images[currentImg]} alt="Post" className="w-full h-auto object-cover max-h-[500px]" />

                            {post.images.length > 1 && (
                                <>
                                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full">
                                        <span className="text-white text-[10px] font-bold">{currentImg + 1}/{post.images.length}</span>
                                    </div>

                                    {currentImg > 0 && (
                                        <button
                                            onClick={() => setImageIndex(postIdx, currentImg - 1)}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 active:scale-90 transition-all"
                                        >
                                            <span className="material-symbols-rounded text-lg">chevron_left</span>
                                        </button>
                                    )}

                                    {currentImg < post.images.length - 1 && (
                                        <button
                                            onClick={() => setImageIndex(postIdx, currentImg + 1)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 active:scale-90 transition-all"
                                        >
                                            <span className="material-symbols-rounded text-lg">chevron_right</span>
                                        </button>
                                    )}

                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                        {post.images.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImg ? 'bg-white w-3' : 'bg-white/50'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </article>
                );
            })}
        </div>
    );
};

interface UserProfileScreenProps {
    userId: string;
    onBack: () => void;
}

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ userId, onBack }) => {
    const mockUser = USER_DATABASE[userId] || {
        ...USER_DATABASE['default'],
        name: userId
    };

    const [user, setUser] = useState<any>(mockUser);
    const [following, setFollowing] = useState(!mockUser.isLocked);
    const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');

    useEffect(() => {
        if (!isDevMode()) {
            fetchNui<any>('getProfile', { userId }).then((result) => {
                if (result?.success && result.profile) {
                    const p = result.profile;
                    setUser({
                        name: p.display_name || p.username || 'User',
                        handle: '@' + (p.username || 'user'),
                        bio: p.bio || '',
                        avatar: p.avatar || IMAGES.avatars.user,
                        banner: p.banner || IMAGES.backgrounds.abstract,
                        isPremium: p.is_premium === 1,
                        price: String(p.price || '0'),
                        paymentCurrency: p.payment_currency || 'cash',
                        mediaCount: p.postCount || 0,
                        isLocked: p.is_premium === 1 && !p.isFollowing,
                        posts: (p.posts || []).map((post: any) => {
                            const img = post.image || IMAGES.backgrounds.abstract;
                            const imgs = post.images || [img];
                            return { thumbnail: imgs[0], images: imgs, content: post.content || '', timestamp: post.created_at || '' };
                        })
                    });
                    setFollowing(p.isFollowing || false);
                }
            });
        }
    }, [userId]);

    const handleFollow = async () => {
        if (!isDevMode()) {
            const result = await fetchNui<any>('followUser', { userId });
            if (result?.success) {
                setFollowing(result.following);
                if (user.isPremium) {
                    setUser({ ...user, isLocked: !result.following });
                }
            }
        } else {
            setFollowing(!following);
            if (user.isPremium) {
                setUser({ ...user, isLocked: following });
            }
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 animate-fade-in pb-20">
            {/* Header / Nav */}
            <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto hover:bg-white/30 transition-colors"
                >
                    <span className="material-symbols-rounded">arrow_back</span>
                </button>
                <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto hover:bg-white/30 transition-colors">
                    <span className="material-symbols-rounded">more_vert</span>
                </button>
            </div>

            {/* Banner + Profile Info */}
            <div className="-mt-14">
                <ProfileHeader
                    banner={user.banner}
                    avatar={user.avatar}
                    name={user.name}
                    tag={user.handle}
                    isPremium={user.isPremium}
                    isVerified={user.isPremium}
                    price={user.price}
                    paymentCurrency={user.paymentCurrency}
                    bio={user.bio}
                    layout="inline"
                />
            </div>

            {/* Actions / Subscribe */}
            <div className="px-5">
                <div className="flex gap-3 mb-6">
                    {user.isPremium && user.isLocked ? (
                        <button
                            onClick={handleFollow}
                            className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-200 dark:shadow-orange-900/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                        >
                            <span>Assinar</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{user.paymentCurrency === 'diamonds' ? `💎 ${user.price}` : `$${user.price}`}/sem</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleFollow}
                            className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-xl font-bold shadow-lg shadow-gray-200 dark:shadow-gray-900/30 active:scale-[0.98] transition-transform"
                        >
                            {following ? 'Following' : 'Follow'}
                        </button>
                    )}

                    <button className="w-12 h-12 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <span className="material-symbols-rounded">mail</span>
                    </button>
                </div>

                {/* Stats / Gallery Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white text-lg">Posts</span>
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs font-bold">{user.mediaCount}</span>
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
                        <button className="p-1.5 rounded-lg hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                            <span className="material-symbols-rounded">movie</span>
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <GalleryGrid posts={user.posts} isLocked={user.isLocked} mediaCount={user.mediaCount} />
            ) : (
                <ProfileFeedList posts={user.posts} user={user} isLocked={user.isLocked} mediaCount={user.mediaCount} />
            )}
        </div>
    );
};
