import React, { useState } from 'react';
import { fetchNui, isDevMode } from '../utils/nui';
import { IMAGES } from '../constants';

const isVideoUrl = (url: string) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);

interface CreatePostScreenProps {
    onClose: (created?: boolean) => void;
}

export const CreatePostScreen: React.FC<CreatePostScreenProps> = ({ onClose }) => {
    const [step, setStep] = useState<'gallery' | 'details'>('gallery');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [description, setDescription] = useState('');
    const [visibility, setVisibility] = useState<'free' | 'premium'>('free');
    const [publishing, setPublishing] = useState(false);

    // Open LB Phone gallery on mount
    React.useEffect(() => {
        if (!isDevMode() && step === 'gallery') {
            components.setGallery({
                includeImages: true,
                includeVideos: true,
                onSelect: (data) => {
                    const photo = Array.isArray(data) ? data[0] : data;
                    if (photo?.src) {
                        setSelectedImages(prev => [...prev, photo.src]);
                        setStep('details');
                    }
                },
                onCancel: () => {
                    if (selectedImages.length > 0) {
                        setStep('details');
                    } else {
                        onClose();
                    }
                }
            });
        }
    }, [step]);

    // Dev mode: toggle image selection
    const handleDevToggle = (img: string) => {
        setSelectedImages(prev =>
            prev.includes(img) ? prev.filter(i => i !== img) : [...prev, img]
        );
    };

    const handleDevContinue = () => {
        if (selectedImages.length > 0) {
            setPreviewIndex(0);
            setStep('details');
        }
    };

    const handleRemoveImage = (idx: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== idx));
        if (previewIndex >= selectedImages.length - 1 && previewIndex > 0) {
            setPreviewIndex(previewIndex - 1);
        }
    };

    const handleAddMore = () => {
        if (!isDevMode()) {
            setStep('gallery');
        }
    };

    const handlePublish = async () => {
        if (selectedImages.length === 0 || publishing) return;
        setPublishing(true);

        if (!isDevMode()) {
            await fetchNui('createPost', {
                image: selectedImages[0],
                images: selectedImages,
                content: description.trim(),
                visibility
            });
        }

        setTimeout(() => {
            setPublishing(false);
            onClose(true);
        }, isDevMode() ? 600 : 0);
    };

    // Step: Gallery (dev mode only — in production LB Phone gallery opens natively)
    if (step === 'gallery') {
        if (!isDevMode()) {
            return (
                <div className="flex flex-col h-full bg-black items-center justify-center">
                    <span className="material-symbols-rounded text-white/30 text-5xl animate-spin">progress_activity</span>
                    <p className="text-white/40 text-sm mt-3">Opening gallery...</p>
                </div>
            );
        }

        const devImages = [
            IMAGES.posts.desert,
            IMAGES.posts.studio,
            IMAGES.backgrounds.mountain,
            IMAGES.backgrounds.beach,
            IMAGES.backgrounds.abstract,
            IMAGES.live.stream1,
        ];

        return (
            <div className="flex flex-col h-full bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between px-4 pt-16 pb-3 border-b border-gray-100 dark:border-gray-700">
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <span className="material-symbols-rounded text-gray-700 dark:text-gray-300 text-2xl">close</span>
                    </button>
                    <span className="font-bold text-gray-900 dark:text-white">Selecionar Fotos</span>
                    <button
                        onClick={handleDevContinue}
                        disabled={selectedImages.length === 0}
                        className="text-orange-500 text-sm font-bold disabled:opacity-30"
                    >
                        Avançar
                    </button>
                </div>

                {/* Selected count bar */}
                {selectedImages.length > 0 && (
                    <div className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-rounded text-orange-500 text-lg">collections</span>
                            <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                {selectedImages.length} {selectedImages.length === 1 ? 'foto selecionada' : 'fotos selecionadas'}
                            </span>
                        </div>
                        <button
                            onClick={() => setSelectedImages([])}
                            className="text-xs text-orange-500 font-bold hover:text-orange-600"
                        >
                            Limpar
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-1">
                    <div className="grid grid-cols-3 gap-1">
                        {devImages.map((img, i) => {
                            const selectedIdx = selectedImages.indexOf(img);
                            const isSelected = selectedIdx !== -1;
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleDevToggle(img)}
                                    className="aspect-square overflow-hidden relative group"
                                >
                                    <img src={img} alt="" className={`w-full h-full object-cover transition-all ${isSelected ? 'scale-95 rounded-lg' : 'hover:opacity-80'}`} />
                                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                                        isSelected
                                            ? 'bg-orange-500 border-orange-500 text-white'
                                            : 'border-white/70 bg-black/20 text-transparent'
                                    }`}>
                                        {isSelected ? selectedIdx + 1 : ''}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Step: Details (visibility + description)
    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-16 pb-3 border-b border-gray-100 dark:border-gray-700">
                <button
                    onClick={() => {
                        setDescription('');
                        setPreviewIndex(0);
                        setStep('gallery');
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <span className="material-symbols-rounded text-gray-700 dark:text-gray-300 text-2xl">arrow_back</span>
                </button>
                <span className="font-bold text-gray-900 dark:text-white">Novo Post</span>
                <div className="w-8" />
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Image Preview Carousel */}
                <div className="relative aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-800 select-none">
                    {selectedImages.length > 0 && (
                        isVideoUrl(selectedImages[previewIndex])
                            ? <video src={selectedImages[previewIndex]} className="w-full h-full object-cover" controls playsInline />
                            : <img src={selectedImages[previewIndex]} alt="Selected" className="w-full h-full object-cover" />
                    )}

                    {selectedImages.length > 1 && (
                        <>
                            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full">
                                <span className="text-white text-[10px] font-bold">{previewIndex + 1}/{selectedImages.length}</span>
                            </div>

                            {previewIndex > 0 && (
                                <button
                                    onClick={() => setPreviewIndex(previewIndex - 1)}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 active:scale-90 transition-all"
                                >
                                    <span className="material-symbols-rounded text-lg">chevron_left</span>
                                </button>
                            )}

                            {previewIndex < selectedImages.length - 1 && (
                                <button
                                    onClick={() => setPreviewIndex(previewIndex + 1)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 active:scale-90 transition-all"
                                >
                                    <span className="material-symbols-rounded text-lg">chevron_right</span>
                                </button>
                            )}

                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {selectedImages.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-1.5 h-1.5 rounded-full transition-all ${idx === previewIndex ? 'bg-white w-3' : 'bg-white/50'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Thumbnail strip + add more */}
                <div className="px-4 py-3 flex gap-2 items-center overflow-x-auto">
                    {selectedImages.map((img, idx) => (
                        <div key={idx} className="relative shrink-0 group">
                            <button
                                onClick={() => setPreviewIndex(idx)}
                                className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${idx === previewIndex ? 'border-orange-500' : 'border-transparent opacity-70'}`}
                            >
                                {isVideoUrl(img) ? (
                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
                                        <video src={img} className="w-full h-full object-cover" muted playsInline />
                                        <span className="material-symbols-rounded text-white text-sm absolute">play_arrow</span>
                                    </div>
                                ) : (
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                )}
                            </button>
                            <button
                                onClick={() => handleRemoveImage(idx)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            >
                                <span className="material-symbols-rounded text-[12px]">close</span>
                            </button>
                        </div>
                    ))}

                    {/* Add more button */}
                    <button
                        onClick={isDevMode() ? () => setStep('gallery') : handleAddMore}
                        className="w-14 h-14 shrink-0 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:border-orange-400 hover:text-orange-400 transition-colors"
                    >
                        <span className="material-symbols-rounded">add</span>
                    </button>
                </div>

                <div className="px-4 pb-4 space-y-5">
                    {/* Visibility Selector */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Visibilidade</label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setVisibility('free')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                                    visibility === 'free'
                                        ? 'bg-green-500 text-white shadow-md shadow-green-200 dark:shadow-green-900/30'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                <span className="material-symbols-rounded text-lg">public</span>
                                Free
                            </button>
                            <button
                                onClick={() => setVisibility('premium')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                                    visibility === 'premium'
                                        ? 'bg-orange-500 text-white shadow-md shadow-orange-200 dark:shadow-orange-900/30'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                <span className="material-symbols-rounded text-lg">lock</span>
                                Premium
                            </button>
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                            {visibility === 'free'
                                ? 'Todos podem ver este post'
                                : 'Apenas assinantes podem ver este post'}
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Descrição</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Escreva algo sobre seu post..."
                            rows={4}
                            className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 transition-all resize-none placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>
                </div>
            </div>

            {/* Publish Button */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                <button
                    onClick={handlePublish}
                    disabled={publishing || selectedImages.length === 0}
                    className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold active:scale-[0.98] transition-all hover:bg-orange-600 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    {publishing ? (
                        <>
                            <span className="material-symbols-rounded text-lg animate-spin">progress_activity</span>
                            <span>Publicando...</span>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-rounded text-lg">upload</span>
                            <span>Publicar Post</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
