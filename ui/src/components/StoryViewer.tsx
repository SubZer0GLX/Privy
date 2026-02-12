import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Story } from '../types';
import { formatTimestamp } from '../utils/nui';

interface StoryViewerProps {
    stories: Story[];
    initialIndex: number;
    onClose: () => void;
    onUserClick?: (userId: string) => void;
    isOwn?: boolean;
    onDeleteStory?: (storyId: string, itemId: string) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ stories, initialIndex, onClose, onUserClick, isOwn = false, onDeleteStory }) => {
    const [storyIndex, setStoryIndex] = useState(initialIndex);
    const [itemIndex, setItemIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const DURATION = 5000;
    const TICK = 50;

    const story = stories[storyIndex];
    const item = story?.items[itemIndex];

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const goNext = useCallback(() => {
        clearTimer();
        if (itemIndex < story.items.length - 1) {
            setItemIndex(itemIndex + 1);
            setProgress(0);
        } else if (storyIndex < stories.length - 1) {
            setStoryIndex(storyIndex + 1);
            setItemIndex(0);
            setProgress(0);
        } else {
            onClose();
        }
    }, [itemIndex, storyIndex, story, stories.length, clearTimer, onClose]);

    const goPrev = useCallback(() => {
        clearTimer();
        if (itemIndex > 0) {
            setItemIndex(itemIndex - 1);
            setProgress(0);
        } else if (storyIndex > 0) {
            const prevStory = stories[storyIndex - 1];
            setStoryIndex(storyIndex - 1);
            setItemIndex(prevStory.items.length - 1);
            setProgress(0);
        }
    }, [itemIndex, storyIndex, stories, clearTimer]);

    useEffect(() => {
        if (paused || showDeleteConfirm) return;
        setProgress(0);
        clearTimer();

        timerRef.current = setInterval(() => {
            setProgress(prev => {
                const next = prev + (TICK / DURATION) * 100;
                if (next >= 100) {
                    goNext();
                    return 0;
                }
                return next;
            });
        }, TICK);

        return clearTimer;
    }, [storyIndex, itemIndex, paused, showDeleteConfirm, clearTimer, goNext]);

    useEffect(() => clearTimer, [clearTimer]);

    if (!story || !item) return null;

    const handleTap = (e: React.MouseEvent) => {
        if (showDeleteConfirm) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 3) {
            goPrev();
        } else {
            goNext();
        }
    };

    const handleProfileClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClose();
        if (onUserClick) onUserClick(story.user.id);
    };

    const handleDelete = () => {
        setPaused(true);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (onDeleteStory) {
            onDeleteStory(story.id, item.id);
        }
        setShowDeleteConfirm(false);
        setPaused(false);

        // If this was the last item in the last story, close
        if (story.items.length <= 1 && storyIndex >= stories.length - 1) {
            onClose();
        } else if (story.items.length <= 1) {
            // Move to next story
            setStoryIndex(storyIndex);
            setItemIndex(0);
            setProgress(0);
        } else if (itemIndex >= story.items.length - 1) {
            setItemIndex(Math.max(0, itemIndex - 1));
            setProgress(0);
        } else {
            setProgress(0);
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setPaused(false);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center select-none">
            <div
                className="relative w-full h-full max-w-md mx-auto"
                onClick={handleTap}
                onPointerDown={() => !showDeleteConfirm && setPaused(true)}
                onPointerUp={() => !showDeleteConfirm && setPaused(false)}
                onPointerLeave={() => !showDeleteConfirm && setPaused(false)}
            >
                {/\.(mp4|webm|ogg|mov)($|\?)/i.test(item.image) || item.image.includes('video') ? (
                    <video
                        src={item.image}
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                        muted
                    />
                ) : (
                    <img
                        src={item.image}
                        alt="Story"
                        className="w-full h-full object-cover"
                    />
                )}

                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent h-32 pointer-events-none" />

                {/* Progress bars */}
                <div className="absolute top-10 left-2 right-2 flex gap-1 z-10">
                    {story.items.map((_, idx) => (
                        <div key={idx} className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full transition-all"
                                style={{
                                    width: idx < itemIndex ? '100%' : idx === itemIndex ? `${progress}%` : '0%',
                                    transitionDuration: idx === itemIndex ? `${TICK}ms` : '0ms',
                                    transitionTimingFunction: 'linear'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* User info header */}
                <div className="absolute top-14 left-3 right-3 flex items-center justify-between z-10">
                    <div
                        className="flex items-center gap-2.5 cursor-pointer"
                        onClick={!isOwn ? handleProfileClick : undefined}
                    >
                        <img
                            src={story.user.avatar}
                            alt={story.user.displayName}
                            className="w-9 h-9 rounded-full object-cover border-2 border-white/50"
                        />
                        <div>
                            <div className="flex items-center gap-1">
                                <span className="text-white font-bold text-sm drop-shadow-md">
                                    {isOwn ? 'Your Story' : story.user.displayName}
                                </span>
                                {story.user.isVerified && (
                                    <span className="material-symbols-rounded text-orange-400 text-[14px] filled drop-shadow-md">verified</span>
                                )}
                            </div>
                            <span className="text-white/60 text-[11px]">{formatTimestamp(item.timestamp)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isOwn && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                                className="w-9 h-9 rounded-full bg-red-500/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                            >
                                <span className="material-symbols-rounded text-xl">delete</span>
                            </button>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                            className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition-colors"
                        >
                            <span className="material-symbols-rounded text-xl">close</span>
                        </button>
                    </div>
                </div>

                {/* Caption */}
                {item.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pb-10 pt-20 pointer-events-none">
                        <p className="text-white text-sm font-medium drop-shadow-md">{item.caption}</p>
                    </div>
                )}

                {/* Delete confirmation modal */}
                {showDeleteConfirm && (
                    <div
                        className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mx-8 w-full max-w-xs shadow-xl">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white text-center mb-2">Delete Story?</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-6">This story will be permanently removed.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={cancelDelete}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
