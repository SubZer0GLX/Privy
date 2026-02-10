import React from 'react';

interface GalleryGridProps {
    images: string[];
    isLocked?: boolean;
    mediaCount?: number;
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({ images, isLocked = false, mediaCount }) => {
    return (
        <>
            <div className="grid grid-cols-3 gap-0.5">
                {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square bg-gray-100 overflow-hidden group">
                        <img
                            src={img}
                            alt="Post"
                            className={`w-full h-full object-cover transition-all duration-500 ${isLocked ? 'blur-md scale-110' : ''}`}
                        />

                        {isLocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 z-10">
                                <div className="bg-white/20 backdrop-blur-md p-2 rounded-full mb-1">
                                    <span className="material-symbols-rounded text-white drop-shadow-md">lock</span>
                                </div>
                            </div>
                        )}

                        {!isLocked && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                        )}
                    </div>
                ))}
            </div>

            {isLocked && mediaCount !== undefined && (
                <div className="p-8 text-center text-gray-400 text-sm">
                    <p>Subscribe to unlock {mediaCount} posts</p>
                </div>
            )}
        </>
    );
};
