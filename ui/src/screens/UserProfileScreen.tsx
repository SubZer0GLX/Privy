import React, { useState, useEffect } from 'react';
import { IMAGES } from '../constants';
import { Post } from '../types';
import { fetchNui, isDevMode, formatTimestamp } from '../utils/nui';
import { ProfileHeader } from '../components/ProfileHeader';
import { PostCard } from '../components/PostCard';
import { PrismaIcon } from '../components/PrismaIcon';
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
const ProfileFeedList: React.FC<{ posts: GalleryPost[]; user: any; isLocked: boolean; mediaCount: number; onPostClick?: (postId: string) => void }> = ({ posts, user, isLocked, mediaCount, onPostClick }) => {
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
                    <article key={postIdx} className="bg-white dark:bg-gray-900 cursor-pointer" onClick={() => post.id && onPostClick?.(post.id)}>
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3">
                            <img src={user.avatar} alt="Avatar" className="w-9 h-9 rounded-full object-cover bg-gray-200 dark:bg-gray-700" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-sm text-gray-900 dark:text-white truncate">{user.name}</span>
                                    {user.isPremium && <span className="material-symbols-rounded text-orange-500 text-[14px] filled">verified</span>}
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{user.handle} • {formatTimestamp(post.timestamp || '')}</p>
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
                            {isVideoUrl(post.images[currentImg]) ? (
                                <video
                                    src={post.images[currentImg]}
                                    className="w-full h-auto object-cover max-h-[500px]"
                                    controls
                                    playsInline
                                    autoPlay
                                    muted
                                    loop
                                />
                            ) : (
                                <img src={post.images[currentImg]} alt="Post" className="w-full h-auto object-cover max-h-[500px]" />
                            )}

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

const isVideoUrl = (url: string) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);

interface UserProfileScreenProps {
    userId: string;
    currentUserId?: string;
    onBack: () => void;
    onMessage?: (userId: string, userName: string, userAvatar: string) => void;
}

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ userId, currentUserId, onBack, onMessage }) => {
    const isOwnProfile = currentUserId ? String(userId) === String(currentUserId) : false;
    const mockUser = isDevMode() ? (USER_DATABASE[userId] || {
        ...USER_DATABASE['default'],
        name: userId
    }) : null;

    const [user, setUser] = useState<any>(mockUser);
    const [following, setFollowing] = useState(mockUser ? !mockUser.isLocked : false);
    const [viewMode, setViewMode] = useState<'grid' | 'feed' | 'video'>('grid');
    const [loadingUser, setLoadingUser] = useState(!isDevMode());
    const [viewingPost, setViewingPost] = useState<Post | null>(null);

    useEffect(() => {
        if (!isDevMode()) {
            fetchNui<any>('getProfile', { userId }).then((result) => {
                if (result?.success && result.profile) {
                    const p = result.profile;
                    const premium = p.is_premium == 1 || p.is_premium === true;
                    const subscribed = p.isSubscribed || false;
                    setUser({
                        name: p.display_name || p.username || 'User',
                        handle: '@' + (p.username || 'user'),
                        bio: p.bio || '',
                        avatar: p.avatar || IMAGES.avatars.user,
                        banner: p.banner || IMAGES.backgrounds.abstract,
                        isPremium: premium,
                        isSubscribed: subscribed,
                        price: String(p.price || '0'),
                        paymentCurrency: p.payment_currency || 'cash',
                        mediaCount: p.postCount || 0,
                        isLocked: premium && !subscribed && !isOwnProfile,
                        posts: (p.posts || []).map((post: any) => {
                            const img = post.image || IMAGES.backgrounds.abstract;
                            const imgs = post.images || [img];
                            return { id: post.id ? String(post.id) : undefined, thumbnail: imgs[0], images: imgs, content: post.content || '', timestamp: post.created_at || '', visibility: post.visibility || 'free' };
                        })
                    });
                    setFollowing(p.isFollowing || false);
                }
                setLoadingUser(false);
            });
        }
    }, [userId]);

    const handleFollow = async () => {
        if (!isDevMode()) {
            const result = await fetchNui<any>('followUser', { userId });
            if (result?.success) {
                setFollowing(result.following);
            }
        } else {
            setFollowing(!following);
        }
    };

    const handleSubscribe = async () => {
        if (!isDevMode()) {
            const result = await fetchNui<any>('subscribe', { creatorId: userId });
            if (result?.success) {
                setUser((prev: any) => ({ ...prev, isSubscribed: true, isLocked: false }));
            }
        } else {
            setUser((prev: any) => ({ ...prev, isSubscribed: true, isLocked: false }));
        }
    };

    const handlePostClick = async (postId: string) => {
        // Try to fetch full post data from server
        const result = !isDevMode() ? await fetchNui<any>('getPost', { postId }) : null;
        if (result && result.id) {
            const p = result;
            setViewingPost({
                id: String(p.id),
                user: {
                    id: String(p.user_id),
                    username: p.username || 'unknown',
                    displayName: p.display_name || p.username || 'Unknown',
                    avatar: p.avatar || IMAGES.avatars.user,
                    isVerified: p.is_premium == 1 || p.is_premium === true
                },
                timestamp: p.created_at || 'now',
                content: p.content || '',
                image: p.image || undefined,
                images: p.images || (p.image ? [p.image] : undefined),
                likes: p.like_count || 0,
                comments: p.comment_count || 0,
                isLiked: p.isLiked || false
            });
        } else if (user) {
            // Fallback: construct from gallery data
            const galleryPost = user.posts?.find((p: GalleryPost) => p.id === postId);
            if (galleryPost) {
                setViewingPost({
                    id: postId,
                    user: {
                        id: userId,
                        username: user.handle?.replace('@', '') || 'user',
                        displayName: user.name || 'User',
                        avatar: user.avatar || IMAGES.avatars.user,
                        isVerified: user.isPremium || false
                    },
                    timestamp: galleryPost.timestamp || 'now',
                    content: galleryPost.content || '',
                    images: galleryPost.images,
                    likes: 0,
                    comments: 0
                });
            }
        }
    };

    if (viewingPost) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-gray-900 animate-fade-in">
                <div className="flex items-center gap-3 px-4 pt-16 pb-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
                    <button onClick={() => setViewingPost(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <span className="material-symbols-rounded text-gray-700 dark:text-gray-300 text-2xl">arrow_back</span>
                    </button>
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">Post</h2>
                </div>
                <div className="flex-1 overflow-y-auto hide-scrollbar pb-20">
                    <PostCard post={viewingPost} onUserClick={onBack} />
                </div>
            </div>
        );
    }

    if (loadingUser || !user) {
        return (
            <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 animate-fade-in pb-20">
                <div className="sticky top-0 z-50 flex items-center px-4 pt-16 pb-3">
                    <button onClick={onBack} className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300">
                        <span className="material-symbols-rounded">arrow_back</span>
                    </button>
                </div>
                <div className="flex items-center justify-center flex-1">
                    <span className="material-symbols-rounded text-3xl text-orange-500 animate-spin">progress_activity</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 animate-fade-in pb-20">
            {/* Header / Nav */}
            <div className="sticky top-0 z-50 flex items-center justify-between px-4 pt-16 pb-3 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
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
                {!isOwnProfile && (
                <div className="flex gap-3 mb-6">
                    {user.isPremium && !user.isSubscribed ? (
                        <button
                            onClick={handleSubscribe}
                            className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-200 dark:shadow-orange-900/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                        >
                            <span>Assinar</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{user.paymentCurrency === 'diamonds' ? <><PrismaIcon className="w-3.5 h-3.5 inline-block mr-0.5" />{user.price}</> : `$${user.price}`}/sem</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleFollow}
                            className={`flex-1 py-3 rounded-xl font-bold shadow-lg active:scale-[0.98] transition-transform ${following ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shadow-gray-100 dark:shadow-gray-900/30' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-gray-200 dark:shadow-gray-900/30'}`}
                        >
                            {following ? 'Following' : 'Follow'}
                        </button>
                    )}

                    <button
                        onClick={() => onMessage?.(userId, user.name, user.avatar)}
                        className="w-12 h-12 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        <span className="material-symbols-rounded">mail</span>
                    </button>
                </div>
                )}

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
                        <button
                            onClick={() => setViewMode('video')}
                            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'video' ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'hover:text-gray-600 dark:hover:text-gray-300'}`}
                        >
                            <span className="material-symbols-rounded">movie</span>
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'video' ? (
                (() => {
                    const videoPosts = (user.posts || []).filter((p: GalleryPost) =>
                        p.images?.some((img: string) => isVideoUrl(img))
                    );
                    if (user.isLocked) {
                        return (
                            <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                                <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mx-auto w-fit mb-3">
                                    <span className="material-symbols-rounded text-3xl">lock</span>
                                </div>
                                <p>Assine para desbloquear os vídeos</p>
                            </div>
                        );
                    }
                    return videoPosts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6">
                            <span className="material-symbols-rounded text-5xl text-gray-300 dark:text-gray-600 mb-3">movie</span>
                            <p className="text-gray-400 dark:text-gray-500 text-sm">No videos yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-1 px-1">
                            {videoPosts.map((p: GalleryPost, idx: number) => {
                                const videoUrl = p.images.find((img: string) => isVideoUrl(img))!;
                                return (
                                    <div key={idx} className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                                        <video src={videoUrl} className="w-full h-full object-cover" muted playsInline />
                                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1">
                                            <span className="material-symbols-rounded text-white text-sm">play_arrow</span>
                                        </div>
                                        {p.content && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                                <p className="text-white text-[10px] truncate">{p.content}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()
            ) : viewMode === 'grid' ? (
                <GalleryGrid posts={user.posts} isPremium={user.isPremium} isSubscribed={user.isSubscribed || isOwnProfile} mediaCount={user.mediaCount} onPostClick={handlePostClick} />
            ) : (
                <ProfileFeedList posts={user.posts} user={user} isLocked={user.isPremium && !user.isSubscribed && !isOwnProfile} mediaCount={user.mediaCount} onPostClick={handlePostClick} />
            )}
        </div>
    );
};
