import React, { useState, useRef, useEffect } from 'react';
import { Post, Comment } from '../types';
import { PrismaIcon } from './PrismaIcon';
import { fetchNui, isDevMode, formatTimestamp } from '../utils/nui';
import { IMAGES } from '../constants';

const MOCK_COMMENTS: Comment[] = [
    { id: 'c1', user: { id: 'u2', username: 'amara_x', displayName: 'Amara', avatar: IMAGES.avatars.amara }, content: 'Amazing shot! Love this vibe', timestamp: '1h ago' },
    { id: 'c2', user: { id: 'u3', username: 'jason_dev', displayName: 'Jason', avatar: IMAGES.avatars.jason }, content: 'Incredible work as always', timestamp: '2h ago' },
];

interface PostCardProps {
    post: Post;
    onUserClick?: (userId: string) => void;
    onDelete?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onUserClick, onDelete }) => {
    const [isLiked, setIsLiked] = useState(post.isLiked || false);
    const [likes, setLikes] = useState(post.likes);
    const [showMenu, setShowMenu] = useState(false);
    const [currentImage, setCurrentImage] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState('');
    const [commentCount, setCommentCount] = useState(post.comments);
    const [loadingComments, setLoadingComments] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [tipped, setTipped] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const commentInputRef = useRef<HTMLInputElement>(null);

    const allImages = post.images && post.images.length > 0 ? post.images : (post.image ? [post.image] : []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    const handleLike = async () => {
        const wasLiked = isLiked;
        setIsLiked(!wasLiked);
        setLikes(prev => wasLiked ? prev - 1 : prev + 1);

        if (!isDevMode()) {
            const result = await fetchNui<any>('likePost', { postId: post.id });
            if (result?.success) {
                setIsLiked(result.liked);
                setLikes(prev => {
                    const base = wasLiked ? prev : prev;
                    return result.liked === !wasLiked ? base : (result.liked ? base + 1 : base - 1);
                });
            }
        }
    };

    const handleOpenComments = async () => {
        if (showComments) {
            setShowComments(false);
            return;
        }
        setShowComments(true);
        setLoadingComments(true);

        if (isDevMode()) {
            setComments(MOCK_COMMENTS);
            setLoadingComments(false);
        } else {
            const result = await fetchNui<any[]>('getComments', { postId: post.id }, MOCK_COMMENTS);
            if (Array.isArray(result)) {
                const mapped: Comment[] = result.map((c: any) => ({
                    id: String(c.id),
                    user: {
                        id: String(c.user_id),
                        username: c.username || 'user',
                        displayName: c.display_name || c.username || 'User',
                        avatar: c.avatar || IMAGES.avatars.user,
                    },
                    content: c.content,
                    timestamp: c.created_at || 'now',
                }));
                setComments(mapped);
            }
            setLoadingComments(false);
        }

        setTimeout(() => commentInputRef.current?.focus(), 100);
    };

    const handleSubmitComment = async () => {
        const text = commentText.trim();
        if (!text || submitting) return;
        setSubmitting(true);

        if (isDevMode()) {
            const newComment: Comment = {
                id: 'c' + Date.now(),
                user: { id: 'u1', username: 'you', displayName: 'You', avatar: IMAGES.avatars.user },
                content: text,
                timestamp: 'now',
            };
            setComments(prev => [...prev, newComment]);
            setCommentCount(prev => prev + 1);
            setCommentText('');
            setSubmitting(false);
        } else {
            const result = await fetchNui<any>('addComment', { postId: post.id, content: text });
            if (result?.success) {
                setComments(prev => [...prev, {
                    id: String(result.commentId || Date.now()),
                    user: {
                        id: String(result.user_id || 'me'),
                        username: result.username || 'you',
                        displayName: result.display_name || 'You',
                        avatar: result.avatar || IMAGES.avatars.user,
                    },
                    content: text,
                    timestamp: 'now',
                }]);
                setCommentCount(prev => prev + 1);
                setCommentText('');
            }
            setSubmitting(false);
        }
    };

    const handleProfileClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onUserClick) onUserClick(post.user.id);
    };

    const handleBlock = async () => {
        setShowMenu(false);
        if (!isDevMode()) await fetchNui('blockUser', { userId: post.user.id });
    };

    const handleReport = async () => {
        setShowMenu(false);
        if (!isDevMode()) await fetchNui('reportPost', { postId: post.id, userId: post.user.id });
    };

    return (
        <article className="mt-2 bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 cursor-pointer" onClick={handleProfileClick}>
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <img src={post.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1">
                            <h3 className="font-bold text-[15px] text-gray-900 dark:text-white hover:text-orange-600 transition-colors">{post.user.displayName}</h3>
                            {post.user.isVerified && (
                                <span className="material-symbols-rounded text-orange-500 text-[16px] filled">verified</span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">@{post.user.username} • {formatTimestamp(post.timestamp)}</p>
                    </div>
                </div>
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                    >
                        <span className="material-symbols-rounded">more_horiz</span>
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-fade-in">
                            {onDelete && (
                                <>
                                    <button
                                        onClick={() => { setShowMenu(false); onDelete(post.id); }}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <span className="material-symbols-rounded text-red-500 text-xl">delete</span>
                                        <span className="text-sm font-medium text-red-600 dark:text-red-400">Delete post</span>
                                    </button>
                                    <div className="h-px bg-gray-100 dark:bg-gray-700"></div>
                                </>
                            )}
                            {!onDelete && (
                                <>
                                    <button
                                        onClick={handleBlock}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <span className="material-symbols-rounded text-gray-500 dark:text-gray-400 text-xl">block</span>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Block user</span>
                                    </button>
                                    <div className="h-px bg-gray-100 dark:bg-gray-700"></div>
                                    <button
                                        onClick={handleReport}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <span className="material-symbols-rounded text-red-500 text-xl">flag</span>
                                        <span className="text-sm font-medium text-red-600 dark:text-red-400">Report post</span>
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Text */}
            <div className="px-4 pb-3">
                <p className="text-[15px] leading-relaxed text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>

            {/* Image Carousel */}
            {allImages.length > 0 && (
                <div className="relative w-full bg-gray-100 dark:bg-gray-800 overflow-hidden select-none">
                    {/\.(mp4|webm|ogg|mov)($|\?)/i.test(allImages[currentImage]) || allImages[currentImage].includes('video') ? (
                        <video
                            src={allImages[currentImage]}
                            className="w-full h-auto object-cover max-h-[500px]"
                            controls
                            playsInline
                            autoPlay
                            muted
                            loop
                        />
                    ) : (
                        <img src={allImages[currentImage]} alt="Post content" className="w-full h-auto object-cover max-h-[500px]" />
                    )}

                    {allImages.length > 1 && (
                        <>
                            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full">
                                <span className="text-white text-[10px] font-bold">{currentImage + 1}/{allImages.length}</span>
                            </div>

                            {currentImage > 0 && (
                                <button
                                    onClick={() => setCurrentImage(currentImage - 1)}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 active:scale-90 transition-all"
                                >
                                    <span className="material-symbols-rounded text-lg">chevron_left</span>
                                </button>
                            )}

                            {currentImage < allImages.length - 1 && (
                                <button
                                    onClick={() => setCurrentImage(currentImage + 1)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 active:scale-90 transition-all"
                                >
                                    <span className="material-symbols-rounded text-lg">chevron_right</span>
                                </button>
                            )}

                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {allImages.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImage ? 'bg-white w-3' : 'bg-white/50'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-6">
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-1.5 group transition-colors ${isLiked ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                        <span className={`material-symbols-rounded ${isLiked ? 'font-variation-fill-1' : ''}`}>favorite</span>
                        <span className="text-sm font-medium">{likes >= 1000 ? `${(likes/1000).toFixed(1)}k` : likes}</span>
                    </button>

                    <button
                        onClick={handleOpenComments}
                        className={`flex items-center gap-1.5 transition-colors ${showComments ? 'text-orange-500' : 'text-gray-700 dark:text-gray-300 hover:text-orange-500'}`}
                    >
                        <span className="material-symbols-rounded">chat_bubble</span>
                        <span className="text-sm font-medium">{commentCount}</span>
                    </button>

                    {post.tipAmount && (
                        <button
                            onClick={async () => {
                                if (tipped) return;
                                if (!isDevMode()) {
                                    await fetchNui('tipPost', { postId: post.id, amount: post.tipAmount });
                                }
                                setTipped(true);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors ${tipped ? 'bg-green-50 dark:bg-green-900/20' : 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40'}`}
                        >
                            {tipped ? (
                                <span className="material-symbols-rounded text-green-500 text-lg">check_circle</span>
                            ) : (
                                <PrismaIcon className="w-4 h-4" />
                            )}
                            <span className={`text-sm font-bold ${tipped ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                {tipped ? 'Tipped!' : `${post.tipAmount}`}
                            </span>
                        </button>
                    )}
                </div>

            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="border-t border-gray-100 dark:border-gray-700 px-4 pb-4">
                    {loadingComments ? (
                        <div className="flex items-center justify-center py-6">
                            <span className="material-symbols-rounded text-2xl text-orange-500 animate-spin">progress_activity</span>
                        </div>
                    ) : (
                        <>
                            {comments.length === 0 ? (
                                <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-6">No comments yet. Be the first!</p>
                            ) : (
                                <div className="max-h-60 overflow-y-auto hide-scrollbar py-3 space-y-3">
                                    {comments.map(c => (
                                        <div key={c.id} className="flex gap-2.5">
                                            <img
                                                src={c.user.avatar}
                                                alt={c.user.displayName}
                                                className="w-8 h-8 rounded-full object-cover shrink-0 cursor-pointer"
                                                onClick={() => onUserClick?.(c.user.id)}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-1.5">
                                                    <span
                                                        className="font-bold text-xs text-gray-900 dark:text-white cursor-pointer hover:text-orange-500"
                                                        onClick={() => onUserClick?.(c.user.id)}
                                                    >
                                                        {c.user.displayName}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatTimestamp(c.timestamp)}</span>
                                                </div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{c.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Comment Input */}
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <input
                                    ref={commentInputRef}
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitComment(); }}
                                    placeholder="Add a comment..."
                                    className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-orange-500/20"
                                />
                                <button
                                    onClick={handleSubmitComment}
                                    disabled={!commentText.trim() || submitting}
                                    className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white disabled:opacity-40 active:scale-95 transition-all shrink-0"
                                >
                                    <span className="material-symbols-rounded text-lg">
                                        {submitting ? 'progress_activity' : 'send'}
                                    </span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </article>
    );
};
