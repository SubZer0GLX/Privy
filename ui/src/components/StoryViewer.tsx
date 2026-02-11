import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Story } from '../types';

interface StoryViewerProps {
    stories: Story[];
    initialIndex: number;
    onClose: () => void;
    onUserClick?: (userId: string) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ stories, initialIndex, onClose, onUserClick }) => {
    const [storyIndex, setStoryIndex] = useState(initialIndex);
    const [itemIndex, setItemIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const DURATION = 5000; // 5s per story item
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

    // Auto-advance timer
    useEffect(() => {
        if (paused) return;
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
    }, [storyIndex, itemIndex, paused, clearTimer, goNext]);

    // Cleanup on unmount
    useEffect(() => clearTimer, [clearTimer]);

    if (!story || !item) return null;

    const handleTap = (e: React.MouseEvent) => {
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

    return (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center select-none">
            {/* Story content - tappable area */}
            <div
                className="relative w-full h-full max-w-md mx-auto"
                onClick={handleTap}
                onPointerDown={() => setPaused(true)}
                onPointerUp={() => setPaused(false)}
                onPointerLeave={() => setPaused(false)}
            >
                {/* Image */}
                <img
                    src={item.image}
                    alt="Story"
                    className="w-full h-full object-cover"
                />

                {/* Top gradient overlay */}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent h-32 pointer-events-none" />

                {/* Progress bars */}
                <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
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
                <div className="absolute top-6 left-3 right-3 flex items-center justify-between z-10">
                    <div
                        className="flex items-center gap-2.5 cursor-pointer"
                        onClick={handleProfileClick}
                    >
                        <img
                            src={story.user.avatar}
                            alt={story.user.displayName}
                            className="w-9 h-9 rounded-full object-cover border-2 border-white/50"
                        />
                        <div>
                            <div className="flex items-center gap-1">
                                <span className="text-white font-bold text-sm drop-shadow-md">{story.user.displayName}</span>
                                {story.user.isVerified && (
                                    <span className="material-symbols-rounded text-orange-400 text-[14px] filled drop-shadow-md">verified</span>
                                )}
                            </div>
                            <span className="text-white/60 text-[11px]">{item.timestamp}</span>
                        </div>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition-colors"
                    >
                        <span className="material-symbols-rounded text-xl">close</span>
                    </button>
                </div>

                {/* Bottom gradient + caption */}
                {item.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pt-20 pointer-events-none">
                        <p className="text-white text-sm font-medium drop-shadow-md">{item.caption}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
