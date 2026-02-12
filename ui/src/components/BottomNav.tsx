import React from 'react';
import { NavTab } from '../types';
import { IMAGES } from '../constants';

interface BottomNavProps {
    currentTab: NavTab;
    onTabChange: (tab: NavTab) => void;
    onCreatePost?: () => void;
    userAvatar?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, onCreatePost, userAvatar }) => {
    return (
        <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 px-6 pt-3 pb-5 flex items-center justify-between z-50 shrink-0">
            <button
                onClick={() => onTabChange('home')}
                className={`${currentTab === 'home' ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'} flex flex-col items-center transition-colors`}
            >
                <span className={`material-symbols-rounded text-3xl ${currentTab === 'home' ? 'font-variation-fill-1' : ''}`}>home</span>
            </button>

            <button
                onClick={() => onTabChange('search')}
                className={`${currentTab === 'search' ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'} flex flex-col items-center transition-colors`}
            >
                <span className="material-symbols-rounded text-3xl">search</span>
            </button>

            <button
                onClick={onCreatePost}
                className="flex items-center justify-center w-12 h-12 bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/30 hover:scale-105 transition-transform active:scale-95"
            >
                <span className="material-symbols-rounded text-3xl">add</span>
            </button>

            <button
                onClick={() => onTabChange('messages')}
                className={`${currentTab === 'messages' ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'} flex flex-col items-center transition-colors`}
            >
                <span className="material-symbols-rounded text-3xl">mail</span>
            </button>

            <button
                onClick={() => onTabChange('profile')}
                className={`flex items-center justify-center ${currentTab === 'profile' ? 'ring-2 ring-orange-500 rounded-full' : ''}`}
            >
                <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 overflow-hidden">
                    <img src={userAvatar || IMAGES.avatars.user} alt="Profile" className="w-full h-full object-cover" />
                </div>
            </button>
        </nav>
    );
};
