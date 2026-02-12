import React, { useState, useEffect } from 'react';
import { StoryRail } from '../components/StoryRail';
import { StoryViewer } from '../components/StoryViewer';
import { PostCard } from '../components/PostCard';
import { User, Story, Post } from '../types';
import { IMAGES } from '../constants';
import { fetchNui, isDevMode } from '../utils/nui';

const MOCK_CURRENT_USER: User = {
    id: 'u1',
    username: 'user_story',
    displayName: 'Your Story',
    avatar: IMAGES.avatars.user
};

const MOCK_STORIES: Story[] = [
    {
        id: 's1',
        user: { id: 'u2', username: 'amara_x', displayName: 'Amara', avatar: IMAGES.avatars.amara },
        hasUnseen: true,
        items: [
            { id: 's1-1', image: IMAGES.backgrounds.beach, caption: 'Beach day vibes', timestamp: '2h ago' },
            { id: 's1-2', image: IMAGES.posts.desert, caption: 'Desert sunset was magical', timestamp: '1h ago' },
            { id: 's1-3', image: IMAGES.backgrounds.mountain, timestamp: '30min ago' },
        ]
    },
    {
        id: 's2',
        user: { id: 'u3', username: 'jason_dev', displayName: 'Jason', avatar: IMAGES.avatars.jason },
        hasUnseen: true,
        items: [
            { id: 's2-1', image: IMAGES.posts.studio, caption: 'Late night coding session', timestamp: '4h ago' },
        ]
    },
    {
        id: 's3',
        user: { id: 'u4', username: 'elena_art', displayName: 'Elena', avatar: IMAGES.avatars.elena, isVerified: true },
        hasUnseen: true,
        items: [
            { id: 's3-1', image: IMAGES.live.stream1, caption: 'New painting in progress', timestamp: '3h ago' },
            { id: 's3-2', image: IMAGES.live.stream2, caption: 'Almost done!', timestamp: '1h ago' },
        ]
    },
    {
        id: 's4',
        user: { id: 'u5', username: 'markos', displayName: 'Markos', avatar: IMAGES.avatars.markos },
        hasUnseen: true,
        items: [
            { id: 's4-1', image: IMAGES.backgrounds.mountain, caption: 'Morning hike', timestamp: '5h ago' },
            { id: 's4-2', image: IMAGES.backgrounds.abstract, timestamp: '3h ago' },
            { id: 's4-3', image: IMAGES.live.stream3, caption: 'Gym time', timestamp: '1h ago' },
        ]
    },
];

const MOCK_MY_STORY: Story = {
    id: 'my',
    user: MOCK_CURRENT_USER,
    hasUnseen: false,
    items: [
        { id: 'my-1', image: IMAGES.posts.desert, caption: 'My first story!', timestamp: '1h ago' },
    ]
};

const MOCK_POSTS: Post[] = [
    {
        id: 'p1',
        user: { id: 'u6', username: 'sierrasky', displayName: 'Sierra Sky', avatar: IMAGES.avatars.sierra, isVerified: true },
        timestamp: '2h ago',
        content: `Golden hour in the dunes. Can't wait to share the full set from this desert trip with you all. Swipe for more! <span class="text-orange-500 font-medium">#desertvibes #goldenhour</span>`,
        images: [IMAGES.posts.desert, IMAGES.posts.studio, IMAGES.backgrounds.beach, IMAGES.backgrounds.mountain],
        likes: 1200,
        comments: 84,
        tipAmount: 5
    },
    {
        id: 'p2',
        user: { id: 'u7', username: 'm_cole', displayName: 'Marcus Cole', avatar: IMAGES.avatars.marcus },
        timestamp: '5h ago',
        content: 'New studio setup is finally complete!',
        images: [IMAGES.posts.studio, IMAGES.posts.desert],
        likes: 450,
        comments: 23
    }
];

interface HomeScreenProps {
    onUserClick: (userId: string) => void;
    onCreateStory?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onUserClick, onCreateStory }) => {
    const [posts, setPosts] = useState<Post[]>(isDevMode() ? MOCK_POSTS : []);
    const [stories, setStories] = useState<Story[]>(isDevMode() ? MOCK_STORIES : []);
    const [myStory, setMyStory] = useState<Story | null>(isDevMode() ? MOCK_MY_STORY : null);
    const [currentUser, setCurrentUser] = useState<User>(MOCK_CURRENT_USER);
    const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
    const [viewingOwnStory, setViewingOwnStory] = useState(false);
    const [loading, setLoading] = useState(!isDevMode());

    useEffect(() => {
        if (!isDevMode()) {
            // Load current user profile
            fetchNui<any>('getProfile', {}).then((result) => {
                if (result?.success && result.profile) {
                    const p = result.profile;
                    setCurrentUser({
                        id: String(p.id),
                        username: p.username || 'user',
                        displayName: p.display_name || p.username || 'You',
                        avatar: p.avatar || IMAGES.avatars.user,
                    });
                }
            });

            // Load posts
            fetchNui<any[]>('getPosts', {}).then((result) => {
                if (Array.isArray(result)) {
                    const mapped: Post[] = result.map((p: any) => ({
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
                        likes: p.like_count || p.likes || 0,
                        comments: p.comment_count || 0,
                        tipAmount: undefined,
                        isLiked: p.isLiked || false
                    }));
                    setPosts(mapped);
                }
                setLoading(false);
            });

            // Load other users' stories
            fetchNui<any[]>('getStories', {}).then((result) => {
                if (Array.isArray(result) && result.length > 0) {
                    const mapped: Story[] = result.map((s: any) => ({
                        id: String(s.user?.id || s.id),
                        user: {
                            id: String(s.user?.id || ''),
                            username: s.user?.username || 'user',
                            displayName: s.user?.displayName || s.user?.display_name || 'User',
                            avatar: s.user?.avatar || IMAGES.avatars.user,
                            isVerified: s.user?.isVerified || false,
                        },
                        hasUnseen: true,
                        items: (s.items || []).map((item: any) => ({
                            id: String(item.id),
                            image: item.image || item.media_url,
                            caption: item.caption || undefined,
                            timestamp: item.timestamp || item.created_at || 'now',
                        })),
                    }));
                    setStories(mapped);
                }
            });

            // Load own stories
            fetchNui<any>('getMyStories', {}).then((result) => {
                if (result && Array.isArray(result.items) && result.items.length > 0) {
                    setMyStory(prev => ({
                        id: 'my',
                        user: prev?.user || currentUser,
                        hasUnseen: false,
                        items: result.items.map((s: any) => ({
                            id: String(s.id),
                            image: s.media_url,
                            caption: s.caption || undefined,
                            timestamp: s.created_at || 'now',
                        })),
                    }));
                }
            });
        }
    }, []);

    const handleStoryClick = (index: number) => {
        setViewingOwnStory(false);
        setViewingStoryIndex(index);
    };

    const handleMyStoryClick = () => {
        setViewingOwnStory(true);
        setViewingStoryIndex(0);
    };

    const handleStoryClose = () => {
        if (!viewingOwnStory && viewingStoryIndex !== null) {
            setStories(prev => prev.map((s, i) =>
                i === viewingStoryIndex ? { ...s, hasUnseen: false } : s
            ));
        }
        setViewingStoryIndex(null);
        setViewingOwnStory(false);
    };

    const handleDeleteStory = async (_storyId: string, itemId: string) => {
        if (!isDevMode()) {
            await fetchNui('deleteStory', { storyId: itemId });
        }

        setMyStory(prev => {
            if (!prev) return null;
            const newItems = prev.items.filter(i => i.id !== itemId);
            if (newItems.length === 0) return null;
            return { ...prev, items: newItems };
        });
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-900 pb-24">
            <StoryRail
                stories={stories}
                currentUser={currentUser}
                myStory={myStory}
                onStoryClick={handleStoryClick}
                onMyStoryClick={handleMyStoryClick}
                onCreateStory={onCreateStory}
            />
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <span className="material-symbols-rounded text-3xl text-orange-500 animate-spin">progress_activity</span>
                </div>
            ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6">
                    <span className="material-symbols-rounded text-5xl text-gray-300 dark:text-gray-600 mb-3">photo_library</span>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">No posts yet. Be the first to post!</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {posts.map(post => <PostCard key={post.id} post={post} onUserClick={onUserClick} />)}
                </div>
            )}

            {/* Story Viewer - Other users */}
            {viewingStoryIndex !== null && !viewingOwnStory && (
                <StoryViewer
                    stories={stories}
                    initialIndex={viewingStoryIndex}
                    onClose={handleStoryClose}
                    onUserClick={onUserClick}
                />
            )}

            {/* Story Viewer - Own stories */}
            {viewingOwnStory && myStory && (
                <StoryViewer
                    stories={[myStory]}
                    initialIndex={0}
                    onClose={handleStoryClose}
                    isOwn
                    onDeleteStory={handleDeleteStory}
                />
            )}
        </div>
    );
};
