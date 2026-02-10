import React, { useState, useEffect } from 'react';
import { IMAGES } from '../constants';
import { fetchNui, isDevMode } from '../utils/nui';
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
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({ onUserClick }) => {
    const [messages, setMessages] = useState<MessageThread[]>(MOCK_MESSAGES);
    const [activeChat, setActiveChat] = useState<MessageThread | null>(null);

    useEffect(() => {
        if (!isDevMode()) {
            fetchNui<any[]>('getMessages', {}, MOCK_MESSAGES as any).then((result) => {
                if (Array.isArray(result) && result.length > 0) {
                    const mapped: MessageThread[] = result.map((m: any) => ({
                        id: String(m.id),
                        name: m.display_name || m.username || 'Unknown',
                        avatar: m.avatar || IMAGES.avatars.user,
                        lastMessage: m.content || m.lastMessage || '',
                        time: m.created_at || 'now',
                        unreadCount: m.unread_count || undefined,
                        userId: String(m.sender_id || m.receiver_id || m.id)
                    }));
                    setMessages(mapped);
                }
            });
        }
    }, []);

    if (activeChat) {
        return (
            <ChatScreen
                userId={activeChat.userId}
                userName={activeChat.name}
                userAvatar={activeChat.avatar}
                onBack={() => setActiveChat(null)}
                onUserClick={onUserClick}
            />
        );
    }

    return (
        <div className="flex flex-col min-h-full bg-white pb-24">
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-gray-100">
                <h1 className="text-2xl font-bold text-gray-900 mb-4 px-1">Messages</h1>
                <SearchBar placeholder="Search people..." />
            </div>

            <div className="flex flex-col">
                {messages.map((thread) => (
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
