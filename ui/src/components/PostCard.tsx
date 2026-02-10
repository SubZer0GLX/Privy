import React, { useState } from 'react';
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

    return (
        <article className="mt-2 bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 cursor-pointer" onClick={handleProfileClick}>
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        <img src={post.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1">
                            <h3 className="font-bold text-[15px] hover:text-orange-600 transition-colors">{post.user.displayName}</h3>
                            {post.user.isVerified && (
                                <span className="material-symbols-rounded text-orange-500 text-[16px] filled">verified</span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">@{post.user.username} • {post.timestamp}</p>
                    </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                    <span className="material-symbols-rounded">more_horiz</span>
                </button>
            </div>

            {/* Content Text */}
            <div className="px-4 pb-3">
                <p className="text-[15px] leading-relaxed text-gray-800" dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>

            {/* Image */}
            {post.image && (
                <div className="relative w-full bg-gray-100">
                    <img src={post.image} alt="Post content" className="w-full h-auto object-cover max-h-[500px]" />
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full">
                        <span className="text-white text-[10px] font-bold">1/6</span>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={handleLike}
                        className={`flex items-center gap-1.5 group transition-colors ${isLiked ? 'text-red-500' : 'text-gray-700'}`}
                    >
                        <span className={`material-symbols-rounded ${isLiked ? 'font-variation-fill-1' : ''}`}>favorite</span>
                        <span className="text-sm font-medium">{likes >= 1000 ? `${(likes/1000).toFixed(1)}k` : likes}</span>
                    </button>
                    
                    <button className="flex items-center gap-1.5 text-gray-700 hover:text-orange-500 transition-colors">
                        <span className="material-symbols-rounded">chat_bubble</span>
                        <span className="text-sm font-medium">{post.comments}</span>
                    </button>
                    
                    {post.tipAmount && (
                        <button className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 rounded-full hover:bg-orange-100 transition-colors">
                            <span className="material-symbols-rounded text-orange-500 text-lg">payments</span>
                            <span className="text-sm font-bold text-gray-700">Tip ${post.tipAmount}</span>
                        </button>
                    )}
                </div>
                
                <button 
                    onClick={() => setIsSaved(!isSaved)}
                    className={`${isSaved ? 'text-orange-500' : 'text-gray-700'} hover:text-orange-500 transition-colors`}
                >
                    <span className={`material-symbols-rounded ${isSaved ? 'font-variation-fill-1' : ''}`}>bookmark</span>
                </button>
            </div>
        </article>
    );
};