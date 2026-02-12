import React, { useState, useEffect } from 'react';
import { IMAGES } from '../constants';
import { fetchNui, isDevMode, formatTimestamp } from '../utils/nui';
import { ChatScreen } from './ChatScreen';
import { SearchBar } from '../components/SearchBar';
import { MessageThreadItem } from '../components/MessageThreadItem';

interface MessageThread {
    id: string;
    name: string;
    avatar: string;
    lastMessage: string;
    time: string;
    unreadCount?: number;
    userId: string;
    isOnline?: boolean;
}

const MOCK_MESSAGES: MessageThread[] = [
    {
        id: '1',
        name: 'Amara',
        avatar: IMAGES.avatars.amara,
        lastMessage: 'Hey! I loved the new photos you posted yesterday!',
        time: '2m',
        unreadCount: 2,
        userId: 'u2',
        isOnline: true
    },
    {
        id: '2',
        name: 'Jason Dev',
        avatar: IMAGES.avatars.jason,
        lastMessage: 'Are we still on for the collaboration next week? Let me know if you need to reschedule.',
        time: '1h',
        userId: 'u3',
        isOnline: true
    },
    {
        id: '3',
        name: 'Elena Art',
        avatar: IMAGES.avatars.elena,
        lastMessage: 'Sent you the tip! Keep up the great work.',
        time: '3h',
        userId: 'u4'
    },
    {
        id: '4',
        name: 'Markos',
        avatar: IMAGES.avatars.markos,
        lastMessage: 'Thanks for the reply!',
        time: '1d',
        userId: 'u5'
    },
    {
        id: '5',
        name: 'Sierra Sky',
        avatar: IMAGES.avatars.sierra,
        lastMessage: 'Can you check my latest DM?',
        time: '2d',
        userId: 'u6'
    },
    {
        id: '6',
        name: 'Marcus Cole',
        avatar: IMAGES.avatars.marcus,
        lastMessage: 'The audio quality on your stream was perfect.',
        time: '1w',
        userId: 'u7'
    },
    {
        id: '7',
        name: 'James Call',
        avatar: IMAGES.avatars.james,
        lastMessage: 'Hello!',
        time: '1w',
        userId: 'u8'
    }
];

interface MessagesScreenProps {
    onUserClick: (userId: string) => void;
    pendingChat?: { userId: string; userName: string; userAvatar: string } | null;
    onPendingChatHandled?: () => void;
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({ onUserClick, pendingChat, onPendingChatHandled }) => {
    const [messages, setMessages] = useState<MessageThread[]>(isDevMode() ? MOCK_MESSAGES : []);
    const [activeChat, setActiveChat] = useState<MessageThread | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(!isDevMode());

    useEffect(() => {
        if (!isDevMode()) {
            fetchNui<any[]>('getMessages', {}).then((result) => {
                if (Array.isArray(result) && result.length > 0) {
                    const mapped: MessageThread[] = result.map((m: any) => ({
                        id: String(m.id),
                        name: m.display_name || m.username || 'Unknown',
                        avatar: m.avatar || IMAGES.avatars.user,
                        lastMessage: m.type === 'image' ? '📷 Imagem' : m.type === 'video' ? '🎥 Video' : m.type === 'payment' ? `💰 $${m.amount || '0'}` : (m.content || m.lastMessage || ''),
                        time: formatTimestamp(m.created_at) || 'now',
                        unreadCount: m.unread_count || undefined,
                        userId: String(m.other_user_id || m.sender_id || m.receiver_id || m.id),
                        isOnline: false
                    }));
                    setMessages(mapped);
                }
                setLoading(false);
            });
        }
    }, []);

    // Listen for real-time incoming messages to update thread list
    useEffect(() => {
        const handler = (event: MessageEvent) => {
            const msg = event.data;
            if (msg?.type === 'privy:newMessage' && msg.data) {
                const d = msg.data;
                const senderId = String(d.sender_id);
                setMessages(prev => {
                    const existing = prev.findIndex(t => t.userId === senderId);
                    if (existing !== -1) {
                        const updated = [...prev];
                        updated[existing] = {
                            ...updated[existing],
                            lastMessage: d.content || (d.type === 'image' ? '📷 Photo' : d.type === 'video' ? '🎥 Video' : d.type === 'payment' ? `💰 $${d.amount}` : ''),
                            time: 'now',
                            unreadCount: (updated[existing].unreadCount || 0) + 1
                        };
                        // Move to top
                        const [thread] = updated.splice(existing, 1);
                        return [thread, ...updated];
                    } else {
                        // New thread from unknown sender
                        const newThread: MessageThread = {
                            id: 'rt-' + senderId,
                            name: d.sender_name || 'User',
                            avatar: d.sender_avatar || IMAGES.avatars.user,
                            lastMessage: d.content || '',
                            time: 'now',
                            unreadCount: 1,
                            userId: senderId,
                            isOnline: true
                        };
                        return [newThread, ...prev];
                    }
                });
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    // Handle pending chat from profile screen
    useEffect(() => {
        if (pendingChat) {
            setActiveChat({
                id: 'pending-' + pendingChat.userId,
                name: pendingChat.userName,
                avatar: pendingChat.userAvatar,
                lastMessage: '',
                time: '',
                userId: pendingChat.userId,
            });
            onPendingChatHandled?.();
        }
    }, [pendingChat]);

    const handleBackFromChat = () => {
        setActiveChat(null);
        // Refetch threads after chat
        if (!isDevMode()) {
            fetchNui<any[]>('getMessages', {}).then((result) => {
                if (Array.isArray(result) && result.length > 0) {
                    const mapped: MessageThread[] = result.map((m: any) => ({
                        id: String(m.id),
                        name: m.display_name || m.username || 'Unknown',
                        avatar: m.avatar || IMAGES.avatars.user,
                        lastMessage: m.type === 'image' ? '📷 Imagem' : m.type === 'video' ? '🎥 Video' : m.type === 'payment' ? `💰 $${m.amount || '0'}` : (m.content || m.lastMessage || ''),
                        time: formatTimestamp(m.created_at) || 'now',
                        unreadCount: m.unread_count || undefined,
                        userId: String(m.other_user_id || m.sender_id || m.receiver_id || m.id),
                        isOnline: false
                    }));
                    setMessages(mapped);
                }
            });
        }
    };

    if (activeChat) {
        return (
            <ChatScreen
                userId={activeChat.userId}
                userName={activeChat.name}
                userAvatar={activeChat.avatar}
                onBack={handleBackFromChat}
                onUserClick={onUserClick}
            />
        );
    }

    return (
        <div className="flex flex-col min-h-full bg-white dark:bg-gray-900 pb-24">
            <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 pt-16 pb-3 border-b border-gray-100 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 px-1">Messages</h1>
                <SearchBar placeholder="Search people..." onChange={setSearchQuery} />
            </div>

            <div className="flex flex-col">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <span className="material-symbols-rounded text-3xl text-orange-500 animate-spin">progress_activity</span>
                    </div>
                ) : messages.filter(t => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.trim().toLowerCase();
                    return t.name.toLowerCase().includes(q);
                }).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <span className="material-symbols-rounded text-5xl text-gray-300 dark:text-gray-600 mb-3">chat</span>
                        <p className="text-gray-400 dark:text-gray-500 text-sm">No messages yet</p>
                    </div>
                ) : messages.filter(t => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.trim().toLowerCase();
                    return t.name.toLowerCase().includes(q);
                }).map((thread) => (
                    <MessageThreadItem
                        key={thread.id}
                        avatar={thread.avatar}
                        name={thread.name}
                        lastMessage={thread.lastMessage}
                        time={thread.time}
                        unreadCount={thread.unreadCount}
                        isOnline={thread.isOnline}
                        onClick={() => setActiveChat(thread)}
                    />
                ))}
            </div>
        </div>
    );
};
