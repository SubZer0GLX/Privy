import React, { useState, useEffect } from 'react';
import { fetchNui, isDevMode } from '../utils/nui';
import { IMAGES } from '../constants';

interface CreateStoryScreenProps {
    onClose: (created?: boolean) => void;
}

const isVideoUrl = (url: string) => {
    return /\.(mp4|webm|ogg|mov)($|\?)/i.test(url) || url.includes('video');
};

export const CreateStoryScreen: React.FC<CreateStoryScreenProps> = ({ onClose }) => {
    const [mediaUrl, setMediaUrl] = useState('');
    const [isVideo, setIsVideo] = useState(false);
    const [caption, setCaption] = useState('');
    const [publishing, setPublishing] = useState(false);

    useEffect(() => {
        if (isDevMode()) {
            setMediaUrl(IMAGES.posts.desert);
        } else {
            useCamera(
                (url) => {
                    if (url) {
                        setMediaUrl(url);
                        setIsVideo(isVideoUrl(url));
                    } else {
                        onClose();
                    }
                },
                {
                    default: {
                        type: 'Photo',
                        flash: false,
                        camera: 'rear',
                    },
                    permissions: {
                        toggleFlash: true,
                        flipCamera: true,
                        takePhoto: true,
                        takeVideo: true,
                        takeLandscapePhoto: false,
                    },
                    saveToGallery: true,
                }
            );
        }
    }, []);

    const handlePublish = async () => {
        setPublishing(true);

        if (!isDevMode()) {
            await fetchNui('createStory', {
                type: isVideo ? 'video' : 'image',
                mediaUrl,
                caption: caption.trim(),
            });
        }

        setTimeout(() => {
            setPublishing(false);
            onClose(true);
        }, isDevMode() ? 800 : 0);
    };

    if (!mediaUrl) {
        return null;
    }

    return (
        <div className="flex flex-col h-full bg-black relative">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-16 pb-3">
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                    <span className="material-symbols-rounded">arrow_back</span>
                </button>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${isVideo ? 'bg-red-500/80' : 'bg-blue-500/80'} text-white`}>
                    {isVideo ? 'Video' : 'Photo'}
                </span>
            </div>

            {/* Media Preview */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
                {isVideo ? (
                    <video
                        src={mediaUrl}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                ) : (
                    <img src={mediaUrl} alt="Story preview" className="w-full h-full object-cover" />
                )}
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-16">
                <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    className="w-full bg-white/15 backdrop-blur-md text-white placeholder-white/50 rounded-full px-4 py-3 text-sm outline-none border border-white/10 focus:border-white/30 transition-colors mb-4"
                />

                <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold active:scale-[0.98] transition-all hover:bg-orange-600 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    {publishing ? (
                        <>
                            <span className="material-symbols-rounded text-lg animate-spin">progress_activity</span>
                            <span>Publishing...</span>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-rounded text-lg">upload</span>
                            <span>Publish Story</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
