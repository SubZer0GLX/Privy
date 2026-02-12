import React, { useState } from 'react';

export interface GalleryPost {
    id?: string;
    thumbnail: string;
    images: string[];
    content?: string;
    timestamp?: string;
    visibility?: string;
}

interface GalleryGridProps {
    posts: GalleryPost[];
    isLocked?: boolean;
    isPremium?: boolean;
    isSubscribed?: boolean;
    mediaCount?: number;
    onPostClick?: (postId: string) => void;
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({ posts, isLocked = false, isPremium = false, isSubscribed = false, mediaCount, onPostClick }) => {
    const [viewerPostIndex, setViewerPostIndex] = useState<number | null>(null);
    const [viewerImageIndex, setViewerImageIndex] = useState(0);

    const openViewer = (postIdx: number) => {
        if (isLocked) return;
        const post = posts[postIdx];
        if (onPostClick && post.id) {
            onPostClick(post.id);
        } else {
            setViewerPostIndex(postIdx);
            setViewerImageIndex(0);
        }
    };

    const closeViewer = () => {
        setViewerPostIndex(null);
        setViewerImageIndex(0);
    };

    const currentPostImages = viewerPostIndex !== null ? posts[viewerPostIndex].images : [];

    return (
        <>
            <div className="grid grid-cols-3 gap-0.5">
                {posts.map((post, idx) => {
                    const postIsLocked = isPremium && !isSubscribed && post.visibility === 'premium';
                    return (
                    <div
                        key={idx}
                        className={`relative aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden group ${!postIsLocked ? 'cursor-pointer' : ''}`}
                        onClick={() => !postIsLocked && openViewer(idx)}
                    >
                        {/\.(mp4|webm|ogg|mov)($|\?)/i.test(post.thumbnail) || post.thumbnail.includes('video') ? (
                            <video
                                src={post.thumbnail}
                                className={`w-full h-full object-cover transition-all duration-500 ${postIsLocked ? 'blur-md scale-110' : ''}`}
                                muted
                                playsInline
                            />
                        ) : (
                            <img
                                src={post.thumbnail}
                                alt="Post"
                                className={`w-full h-full object-cover transition-all duration-500 ${postIsLocked ? 'blur-md scale-110' : ''}`}
                            />
                        )}

                        {/* Multi-image badge */}
                        {!postIsLocked && post.images.length > 1 && (
                            <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-md flex items-center gap-0.5 z-10">
                                <span className="material-symbols-rounded text-white text-[12px]">collections</span>
                                <span className="text-white text-[10px] font-bold">{post.images.length}</span>
                            </div>
                        )}

                        {postIsLocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 z-10">
                                <div className="bg-white/20 backdrop-blur-md p-2 rounded-full mb-1">
                                    <span className="material-symbols-rounded text-white drop-shadow-md">lock</span>
                                </div>
                            </div>
                        )}

                        {!postIsLocked && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                        )}
                    </div>
                    );
                })}
            </div>

            {/* Image Viewer Modal */}
            {viewerPostIndex !== null && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-fade-in select-none">
                    {/* Close button */}
                    <button
                        onClick={closeViewer}
                        className="absolute top-14 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                        <span className="material-symbols-rounded">close</span>
                    </button>

                    {/* Counter */}
                    {currentPostImages.length > 1 && (
                        <div className="absolute top-14 left-4 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full">
                            <span className="text-white text-xs font-bold">{viewerImageIndex + 1}/{currentPostImages.length}</span>
                        </div>
                    )}

                    {/* Previous button */}
                    {viewerImageIndex > 0 && (
                        <button
                            onClick={() => setViewerImageIndex(viewerImageIndex - 1)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all"
                        >
                            <span className="material-symbols-rounded">chevron_left</span>
                        </button>
                    )}

                    {/* Image / Video */}
                    {/\.(mp4|webm|ogg|mov)($|\?)/i.test(currentPostImages[viewerImageIndex]) || currentPostImages[viewerImageIndex].includes('video') ? (
                        <video
                            src={currentPostImages[viewerImageIndex]}
                            className="max-w-full max-h-[85vh] object-contain"
                            controls
                            playsInline
                            autoPlay
                            muted
                        />
                    ) : (
                        <img
                            src={currentPostImages[viewerImageIndex]}
                            alt="Viewer"
                            className="max-w-full max-h-[85vh] object-contain"
                        />
                    )}

                    {/* Next button */}
                    {viewerImageIndex < currentPostImages.length - 1 && (
                        <button
                            onClick={() => setViewerImageIndex(viewerImageIndex + 1)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all"
                        >
                            <span className="material-symbols-rounded">chevron_right</span>
                        </button>
                    )}

                    {/* Dot indicators */}
                    {currentPostImages.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {currentPostImages.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setViewerImageIndex(idx)}
                                    className={`h-1.5 rounded-full transition-all ${idx === viewerImageIndex ? 'bg-white w-4' : 'bg-white/40 w-1.5 hover:bg-white/60'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
};
