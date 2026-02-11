import React, { useState, useRef, useEffect } from 'react';
import { Post } from '../types';
import { fetchNui, isDevMode } from '../utils/nui';

interface PostCardProps {
    post: Post;
    onUserClick?: (userId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onUserClick }) => {
    const [isLiked, setIsLiked] = useState(false);
    const [likes, setLikes] = useState(post.likes);
    const [isSaved, setIsSaved] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [currentImage, setCurrentImage] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

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
        if (!isDevMode()) {
            const result = await fetchNui<any>('likePost', { postId: post.id });
            if (result?.success) {
                setIsLiked(result.liked);
                setLikes(prev => result.liked ? prev + 1 : prev - 1);
                return;
            }
        }
        if (isLiked) {
            setLikes(prev => prev - 1);
        } else {
            setLikes(prev => prev + 1);
        }
        setIsLiked(!isLiked);
    };

    const handleProfileClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onUserClick) {
            onUserClick(post.user.id);
        }
    };

    const handleBlock = async () => {
        setShowMenu(false);
        if (!isDevMode()) {
            await fetchNui('blockUser', { userId: post.user.id });
        }
    };

    const handleReport = async () => {
        setShowMenu(false);
        if (!isDevMode()) {
            await fetchNui('reportPost', { postId: post.id, userId: post.user.id });
        }
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
                        <p className="text-xs text-gray-500 dark:text-gray-400">@{post.user.username} • {post.timestamp}</p>
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
                    <img src={allImages[currentImage]} alt="Post content" className="w-full h-auto object-cover max-h-[500px]" />

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

                    <button className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 hover:text-orange-500 transition-colors">
                        <span className="material-symbols-rounded">chat_bubble</span>
                        <span className="text-sm font-medium">{post.comments}</span>
                    </button>

                    {post.tipAmount && (
                        <button className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 dark:bg-orange-900/20 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors">
                            <span className="material-symbols-rounded text-orange-500 text-lg">payments</span>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Tip ${post.tipAmount}</span>
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setIsSaved(!isSaved)}
                    className={`${isSaved ? 'text-orange-500' : 'text-gray-700 dark:text-gray-300'} hover:text-orange-500 transition-colors`}
                >
                    <span className={`material-symbols-rounded ${isSaved ? 'font-variation-fill-1' : ''}`}>bookmark</span>
                </button>
            </div>
        </article>
    );
};
