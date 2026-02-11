import React, { useState, useEffect } from 'react';
import { StoryRail } from '../components/StoryRail';
import { StoryViewer } from '../components/StoryViewer';
import { PostCard } from '../components/PostCard';
import { User, Story, Post } from '../types';
import { IMAGES } from '../constants';
import { fetchNui, isDevMode } from '../utils/nui';

// Mock data for dev mode
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
            { id: 's1-1', image: IMAGES.backgrounds.beach, caption: 'Beach day vibes 🌊', timestamp: '2h ago' },
            { id: 's1-2', image: IMAGES.posts.desert, caption: 'Desert sunset was magical ✨', timestamp: '1h ago' },
            { id: 's1-3', image: IMAGES.backgrounds.mountain, timestamp: '30min ago' },
        ]
    },
    {
        id: 's2',
        user: { id: 'u3', username: 'jason_dev', displayName: 'Jason', avatar: IMAGES.avatars.jason },
        hasUnseen: true,
        items: [
            { id: 's2-1', image: IMAGES.posts.studio, caption: 'Late night coding session 💻', timestamp: '4h ago' },
        ]
    },
    {
        id: 's3',
        user: { id: 'u4', username: 'elena_art', displayName: 'Elena', avatar: IMAGES.avatars.elena, isVerified: true },
        hasUnseen: true,
        items: [
            { id: 's3-1', image: IMAGES.live.stream1, caption: 'New painting in progress 🎨', timestamp: '3h ago' },
            { id: 's3-2', image: IMAGES.live.stream2, caption: 'Almost done!', timestamp: '1h ago' },
        ]
    },
    {
        id: 's4',
        user: { id: 'u5', username: 'markos', displayName: 'Markos', avatar: IMAGES.avatars.markos },
        hasUnseen: true,
        items: [
            { id: 's4-1', image: IMAGES.backgrounds.mountain, caption: 'Morning hike 🏔️', timestamp: '5h ago' },
            { id: 's4-2', image: IMAGES.backgrounds.abstract, timestamp: '3h ago' },
            { id: 's4-3', image: IMAGES.live.stream3, caption: 'Gym time 💪', timestamp: '1h ago' },
        ]
    },
];

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
    const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
    const [stories, setStories] = useState<Story[]>(MOCK_STORIES);
    const [currentUser] = useState<User>(MOCK_CURRENT_USER);
    const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!isDevMode()) {
            fetchNui<any[]>('getPosts', {}, MOCK_POSTS).then((result) => {
                if (Array.isArray(result) && result.length > 0) {
                    const mapped: Post[] = result.map((p: any) => ({
                        id: String(p.id),
                        user: {
                            id: String(p.user_id),
                            username: p.username || 'unknown',
                            displayName: p.display_name || p.username || 'Unknown',
                            avatar: p.avatar || IMAGES.avatars.user,
                            isVerified: p.is_premium === 1
                        },
                        timestamp: p.created_at || 'now',
                        content: p.content || '',
                        image: p.image || undefined,
                        images: p.images || (p.image ? [p.image] : undefined),
                        likes: p.like_count || p.likes || 0,
                        comments: p.comment_count || 0,
                        tipAmount: undefined
                    }));
                    setPosts(mapped);
                }
            });
        }
    }, []);

    const handleStoryClick = (index: number) => {
        setViewingStoryIndex(index);
    };

    const handleStoryClose = () => {
        // Mark viewed story as seen
        if (viewingStoryIndex !== null) {
            setStories(prev => prev.map((s, i) =>
                i === viewingStoryIndex ? { ...s, hasUnseen: false } : s
            ));
        }
        setViewingStoryIndex(null);
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-900 pb-24">
            <StoryRail
                stories={stories}
                currentUser={currentUser}
                onStoryClick={handleStoryClick}
                onCreateStory={onCreateStory}
            />
            <div className="flex flex-col gap-2">
                {posts.map(post => <PostCard key={post.id} post={post} onUserClick={onUserClick} />)}
            </div>

            {/* Story Viewer */}
            {viewingStoryIndex !== null && (
                <StoryViewer
                    stories={stories}
                    initialIndex={viewingStoryIndex}
                    onClose={handleStoryClose}
                    onUserClick={onUserClick}
                />
            )}
        </div>
    );
};
