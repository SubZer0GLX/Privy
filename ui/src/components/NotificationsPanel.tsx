import React from 'react';
import { IMAGES } from '../constants';

export interface Notification {
    id: string;
    type: 'like' | 'comment' | 'follow' | 'tip' | 'message';
    userName: string;
    userAvatar: string;
    userId: string;
    text: string;
    time: string;
    isRead: boolean;
}

const ICON_MAP: Record<Notification['type'], { icon: string; color: string; bg: string }> = {
    like: { icon: 'favorite', color: 'text-red-500', bg: 'bg-red-50' },
    comment: { icon: 'chat_bubble', color: 'text-blue-500', bg: 'bg-blue-50' },
    follow: { icon: 'person_add', color: 'text-green-500', bg: 'bg-green-50' },
    tip: { icon: 'payments', color: 'text-orange-500', bg: 'bg-orange-50' },
    message: { icon: 'mail', color: 'text-purple-500', bg: 'bg-purple-50' },
};

interface NotificationsPanelProps {
    notifications: Notification[];
    onClose: () => void;
    onUserClick: (userId: string) => void;
    onMarkAllRead: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
    notifications,
    onClose,
    onUserClick,
    onMarkAllRead,
}) => {
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="absolute inset-0 z-[60] bg-white flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <span className="material-symbols-rounded text-gray-700 text-2xl">arrow_back</span>
                </button>
                <h2 className="font-bold text-lg text-gray-900">Notifications</h2>
                <button
                    onClick={onMarkAllRead}
                    className="text-orange-500 text-sm font-semibold hover:text-orange-600 transition-colors"
                >
                    {unreadCount > 0 ? 'Read all' : ''}
                </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto hide-scrollbar">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400">
                        <span className="material-symbols-rounded text-5xl mb-3 text-gray-200">notifications_off</span>
                        <p className="text-sm">No notifications yet</p>
                    </div>
                ) : (
                    notifications.map((notif) => {
                        const iconInfo = ICON_MAP[notif.type];
                        return (
                            <div
                                key={notif.id}
                                onClick={() => onUserClick(notif.userId)}
                                className={`flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-orange-50/40' : ''}`}
                            >
                                <div className="relative shrink-0">
                                    <img
                                        src={notif.userAvatar}
                                        alt={notif.userName}
                                        className="w-12 h-12 rounded-full object-cover border border-gray-100"
                                    />
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ${iconInfo.bg} ${iconInfo.color} flex items-center justify-center border-2 border-white`}>
                                        <span className="material-symbols-rounded text-[11px] filled">{iconInfo.icon}</span>
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-800 leading-snug">
                                        <span className="font-bold">{notif.userName}</span>{' '}
                                        {notif.text}
                                    </p>
                                    <span className="text-[11px] text-gray-400 mt-0.5 block">{notif.time}</span>
                                </div>

                                {!notif.isRead && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 'n1',
        type: 'like',
        userName: 'Amara',
        userAvatar: IMAGES.avatars.amara,
        userId: 'u2',
        text: 'liked your post',
        time: '2m ago',
        isRead: false
    },
    {
        id: 'n2',
        type: 'follow',
        userName: 'Jason Dev',
        userAvatar: IMAGES.avatars.jason,
        userId: 'u3',
        text: 'started following you',
        time: '15m ago',
        isRead: false
    },
    {
        id: 'n3',
        type: 'tip',
        userName: 'Elena Art',
        userAvatar: IMAGES.avatars.elena,
        userId: 'u4',
        text: 'sent you a $5.00 tip',
        time: '1h ago',
        isRead: false
    },
    {
        id: 'n4',
        type: 'comment',
        userName: 'Sierra Sky',
        userAvatar: IMAGES.avatars.sierra,
        userId: 'u6',
        text: 'commented on your post: "Amazing shot!"',
        time: '3h ago',
        isRead: true
    },
    {
        id: 'n5',
        type: 'like',
        userName: 'Marcus Cole',
        userAvatar: IMAGES.avatars.marcus,
        userId: 'u7',
        text: 'liked your post',
        time: '5h ago',
        isRead: true
    },
    {
        id: 'n6',
        type: 'follow',
        userName: 'Markos',
        userAvatar: IMAGES.avatars.markos,
        userId: 'u5',
        text: 'started following you',
        time: '1d ago',
        isRead: true
    },
];
