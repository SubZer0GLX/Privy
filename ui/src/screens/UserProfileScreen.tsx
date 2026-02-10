import React, { useState, useEffect } from 'react';
import { IMAGES } from '../constants';
import { fetchNui, isDevMode } from '../utils/nui';
import { ProfileHeader } from '../components/ProfileHeader';
import { GalleryGrid } from '../components/GalleryGrid';

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
        mediaCount: 142,
        isLocked: true,
        posts: Array(9).fill(IMAGES.posts.desert)
    },
    'u6': {
        name: 'Sierra Sky',
        handle: '@sierrasky',
        bio: 'Desert vibes and golden hours. Capture the moment.',
        avatar: IMAGES.avatars.sierra,
        banner: IMAGES.posts.desert,
        isPremium: true,
        price: '5.00',
        mediaCount: 89,
        isLocked: false,
        posts: Array(6).fill(IMAGES.posts.desert)
    },
    'default': {
        name: 'User Profile',
        handle: '@user_handle',
        bio: 'Content Creator',
        avatar: IMAGES.avatars.user,
        banner: IMAGES.backgrounds.abstract,
        isPremium: false,
        mediaCount: 24,
        isLocked: false,
        posts: Array(12).fill(IMAGES.backgrounds.abstract)
    }
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
                        mediaCount: p.postCount || 0,
                        isLocked: p.is_premium === 1 && !p.isFollowing,
                        posts: (p.posts || []).map((post: any) => post.image || IMAGES.backgrounds.abstract)
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
        <div className="flex flex-col min-h-screen bg-white animate-fade-in pb-20">
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
                            className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                        >
                            <span>Subscribe</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded text-xs">${user.price}/mo</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleFollow}
                            className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold shadow-lg shadow-gray-200 active:scale-[0.98] transition-transform"
                        >
                            {following ? 'Following' : 'Follow'}
                        </button>
                    )}

                    <button className="w-12 h-12 flex items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
                        <span className="material-symbols-rounded">mail</span>
                    </button>
                </div>

                {/* Stats / Gallery Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-lg">Posts</span>
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">{user.mediaCount}</span>
                    </div>

                    <div className="flex text-gray-400 gap-4">
                        <span className="material-symbols-rounded text-orange-500">grid_view</span>
                        <span className="material-symbols-rounded hover:text-gray-600">movie</span>
                    </div>
                </div>
            </div>

            <GalleryGrid images={user.posts} isLocked={user.isLocked} mediaCount={user.mediaCount} />
        </div>
    );
};
