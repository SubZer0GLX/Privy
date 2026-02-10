import React from 'react';
import { User, Story } from '../types';

interface StoryRailProps {
    stories: Story[];
    currentUser: User;
    onUserClick?: (userId: string) => void;
}

export const StoryRail: React.FC<StoryRailProps> = ({ stories, currentUser, onUserClick }) => {
    return (
        <div className="flex gap-4 px-4 py-4 overflow-x-auto hide-scrollbar border-b border-gray-100 bg-white">
            {/* Current User Story Add */}
            <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer">
                <div className="relative p-[2px] rounded-full">
                    <img 
                        src={currentUser.avatar} 
                        alt="Your story" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-orange-500 border-2 border-white rounded-full flex items-center justify-center text-white">
                        <span className="material-symbols-rounded text-[14px] font-bold">add</span>
                    </div>
                </div>
                <span className="text-[11px] text-gray-500 font-medium">Your Story</span>
            </div>

            {/* Other Users */}
            {stories.map((story) => (
                <div 
                    key={story.id} 
                    className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
                    onClick={() => onUserClick && onUserClick(story.user.id)}
                >
                    <div className={`p-[2px] rounded-full ${story.hasUnseen ? 'story-gradient' : 'bg-gray-200'}`}>
                        <img 
                            src={story.user.avatar} 
                            alt={story.user.username} 
                            className="w-16 h-16 rounded-full object-cover border-2 border-white"
                        />
                    </div>
                    <span className="text-[11px] text-gray-700 font-medium truncate max-w-[64px] text-center">
                        {story.user.username}
                    </span>
                </div>
            ))}
        </div>
    );
};