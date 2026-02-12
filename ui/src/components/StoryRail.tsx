import React from 'react';
import { User, Story } from '../types';

interface StoryRailProps {
    stories: Story[];
    currentUser: User;
    myStory?: Story | null;
    onStoryClick?: (storyIndex: number) => void;
    onMyStoryClick?: () => void;
    onCreateStory?: () => void;
}

export const StoryRail: React.FC<StoryRailProps> = ({ stories, currentUser, myStory, onStoryClick, onMyStoryClick, onCreateStory }) => {
    const hasMyStory = myStory && myStory.items.length > 0;

    const handleAvatarClick = () => {
        if (hasMyStory && onMyStoryClick) {
            onMyStoryClick();
        } else if (onCreateStory) {
            onCreateStory();
        }
    };

    const handleAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onCreateStory) {
            onCreateStory();
        }
    };

    return (
        <div className="flex gap-4 px-4 py-4 overflow-x-auto hide-scrollbar border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            {/* Current User Story */}
            <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={handleAvatarClick}>
                <div className={`relative p-[2px] rounded-full ${hasMyStory ? 'story-gradient' : ''}`}>
                    <img
                        src={currentUser.avatar}
                        alt="Your story"
                        className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-gray-900 shadow-sm"
                    />
                    <div
                        className="absolute bottom-1 right-1 w-5 h-5 bg-orange-500 border-2 border-white dark:border-gray-900 rounded-full flex items-center justify-center text-white cursor-pointer"
                        onClick={handleAddClick}
                    >
                        <span className="material-symbols-rounded text-[14px] font-bold">add</span>
                    </div>
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Your Story</span>
            </div>

            {/* Other Users */}
            {stories.map((story, index) => (
                <div
                    key={story.id}
                    className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
                    onClick={() => onStoryClick && onStoryClick(index)}
                >
                    <div className={`p-[2px] rounded-full ${story.hasUnseen ? 'story-gradient' : 'bg-gray-200 dark:bg-gray-700'}`}>
                        <img
                            src={story.user.avatar}
                            alt={story.user.username}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-gray-900"
                        />
                    </div>
                    <span className="text-[11px] text-gray-700 dark:text-gray-300 font-medium truncate max-w-[64px] text-center">
                        {story.user.username}
                    </span>
                </div>
            ))}
        </div>
    );
};
