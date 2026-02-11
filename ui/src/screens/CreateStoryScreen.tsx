import React, { useState, useRef, useEffect } from 'react';
import { fetchNui, isDevMode } from '../utils/nui';
import { IMAGES } from '../constants';

interface CreateStoryScreenProps {
    onClose: () => void;
}

export const CreateStoryScreen: React.FC<CreateStoryScreenProps> = ({ onClose }) => {
    const [step, setStep] = useState<'camera' | 'preview'>('camera');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
    const [mediaUrl, setMediaUrl] = useState('');
    const [caption, setCaption] = useState('');
    const [publishing, setPublishing] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const [cameraFront, setCameraFront] = useState(true);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const handleCapture = () => {
        // Tap = photo
        if (isDevMode()) {
            setMediaType('image');
            setMediaUrl(IMAGES.posts.desert);
            setStep('preview');
        } else {
            fetchNui<any>('capturePhoto', {}).then((result) => {
                if (result?.url) {
                    setMediaType('image');
                    setMediaUrl(result.url);
                    setStep('preview');
                }
            });
        }
    };

    const handleStartRecording = () => {
        setIsRecording(true);
        setRecordingTime(0);
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);

        if (!isDevMode()) {
            fetchNui('startRecording', {});
        }
    };

    const handleStopRecording = () => {
        setIsRecording(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (isDevMode()) {
            setMediaType('video');
            setMediaUrl(IMAGES.posts.studio);
            setStep('preview');
        } else {
            fetchNui<any>('stopRecording', {}).then((result) => {
                if (result?.url) {
                    setMediaType('video');
                    setMediaUrl(result.url);
                    setStep('preview');
                }
            });
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handlePublish = async () => {
        setPublishing(true);

        if (!isDevMode()) {
            await fetchNui('createStory', {
                type: mediaType,
                mediaUrl,
                caption: caption.trim()
            });
        }

        setTimeout(() => {
            setPublishing(false);
            onClose();
        }, isDevMode() ? 800 : 0);
    };

    // Step: Preview
    if (step === 'preview') {
        return (
            <div className="flex flex-col h-full bg-black relative">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3">
                    <button
                        onClick={() => { setStep('camera'); setCaption(''); }}
                        className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    >
                        <span className="material-symbols-rounded">arrow_back</span>
                    </button>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${mediaType === 'image' ? 'bg-blue-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
                        {mediaType === 'image' ? 'Photo' : `Video • ${formatTime(recordingTime)}`}
                    </span>
                </div>

                {/* Media Preview */}
                <div className="flex-1 flex items-center justify-center overflow-hidden">
                    {mediaType === 'video' ? (
                        <div className="relative w-full h-full">
                            <img src={mediaUrl} alt="Video preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center">
                                    <span className="material-symbols-rounded text-white text-4xl ml-1">play_arrow</span>
                                </div>
                            </div>
                        </div>
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
    }

    // Step: Camera
    return (
        <div className="flex flex-col h-full bg-black relative">
            {/* Camera viewfinder (simulated) */}
            <div className="flex-1 bg-gray-900 relative overflow-hidden">
                {isDevMode() && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <span className="material-symbols-rounded text-white/20 text-[80px]">photo_camera</span>
                            <p className="text-white/30 text-sm mt-2">Camera Preview</p>
                        </div>
                    </div>
                )}

                {/* Top Controls */}
                <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    >
                        <span className="material-symbols-rounded">close</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setFlashOn(!flashOn)}
                            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors ${flashOn ? 'bg-yellow-400/80 text-black' : 'bg-white/20 text-white hover:bg-white/30'}`}
                        >
                            <span className="material-symbols-rounded text-xl">{flashOn ? 'flash_on' : 'flash_off'}</span>
                        </button>
                    </div>
                </div>

                {/* Recording indicator */}
                {isRecording && (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-red-600/90 backdrop-blur-md px-4 py-1.5 rounded-full">
                        <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></span>
                        <span className="text-white text-sm font-bold">{formatTime(recordingTime)}</span>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="bg-black px-6 py-6 flex items-center justify-between">
                {/* Gallery */}
                <button className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/30">
                    <img src={IMAGES.posts.desert} alt="Gallery" className="w-full h-full object-cover" />
                </button>

                {/* Capture / Record Button */}
                <div className="flex flex-col items-center gap-2">
                    {!isRecording ? (
                        <button
                            onClick={handleCapture}
                            onPointerDown={(e) => {
                                const timer = setTimeout(() => handleStartRecording(), 500);
                                const handleUp = () => {
                                    clearTimeout(timer);
                                    window.removeEventListener('pointerup', handleUp);
                                };
                                window.addEventListener('pointerup', handleUp);
                            }}
                            className="w-20 h-20 rounded-full border-[5px] border-white flex items-center justify-center active:scale-95 transition-transform"
                        >
                            <div className="w-16 h-16 rounded-full bg-white"></div>
                        </button>
                    ) : (
                        <button
                            onClick={handleStopRecording}
                            className="w-20 h-20 rounded-full border-[5px] border-red-500 flex items-center justify-center active:scale-95 transition-transform animate-pulse"
                        >
                            <div className="w-8 h-8 rounded-md bg-red-500"></div>
                        </button>
                    )}
                    <p className="text-white/50 text-[10px] font-medium">
                        {isRecording ? 'Tap to stop' : 'Tap photo • Hold video'}
                    </p>
                </div>

                {/* Flip Camera */}
                <button
                    onClick={() => setCameraFront(!cameraFront)}
                    className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                    <span className="material-symbols-rounded text-2xl">flip_camera_ios</span>
                </button>
            </div>
        </div>
    );
};
