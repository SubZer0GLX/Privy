import React from 'react';
import { formatTimestamp } from '../utils/nui';

interface MessageThreadItemProps {
    avatar: string;
    name: string;
    lastMessage: string;
    time: string;
    unreadCount?: number;
    isOnline?: boolean;
    onClick?: () => void;
}

export const MessageThreadItem: React.FC<MessageThreadItemProps> = ({
    avatar,
    name,
    lastMessage,
    time,
    unreadCount,
    isOnline = false,
    onClick,
}) => {
    return (
        <div
            onClick={onClick}
            className="flex items-center px-5 py-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-700 transition-colors cursor-pointer"
        >
            <div className="relative shrink-0">
                <img
                    src={avatar}
                    alt={name}
                    className="w-14 h-14 rounded-full object-cover border border-gray-100 dark:border-gray-700"
                />
                {isOnline && (
                    <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
                )}
            </div>

            <div className="flex-1 ml-4 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={`text-[16px] truncate ${unreadCount ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-800 dark:text-gray-200'}`}>
                        {name}
                    </h3>
                    <span className={`text-xs ${unreadCount ? 'text-orange-500 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                        {formatTimestamp(time)}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <p className={`text-sm truncate pr-2 ${unreadCount ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                        {lastMessage}
                    </p>
                    {unreadCount && (
                        <span className="shrink-0 bg-orange-500 text-white text-[10px] font-bold px-1.5 h-5 min-w-[20px] flex items-center justify-center rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
