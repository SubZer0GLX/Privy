import React, { useState, useEffect, useRef } from 'react';
import { fetchNui, isDevMode } from '../utils/nui';
import { MessageBubble } from '../components/MessageBubble';

interface ChatMessage {
    id: string;
    content: string;
    fromMe: boolean;
    time: string;
}

interface ChatScreenProps {
    userId: string;
    userName: string;
    userAvatar: string;
    onBack: () => void;
    onUserClick: (userId: string) => void;
}

const MOCK_CHAT: ChatMessage[] = [
    { id: '1', content: 'Hey! How are you?', fromMe: false, time: '10:30' },
    { id: '2', content: "I'm good! Just posted some new content 🔥", fromMe: true, time: '10:31' },
    { id: '3', content: 'I saw it! Looks amazing', fromMe: false, time: '10:32' },
    { id: '4', content: 'Thank you so much! 🙏', fromMe: true, time: '10:33' },
    { id: '5', content: 'Keep up the great work!', fromMe: false, time: '10:35' },
];

export const ChatScreen: React.FC<ChatScreenProps> = ({ userId, userName, userAvatar, onBack, onUserClick }) => {
    const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isDevMode()) {
            fetchNui<any[]>('getChatMessages', { userId }, MOCK_CHAT as any).then((result) => {
                if (Array.isArray(result) && result.length > 0) {
                    const mapped: ChatMessage[] = result.map((m: any) => ({
                        id: String(m.id),
                        content: m.content,
                        fromMe: m.from_me || false,
                        time: m.time || m.created_at || ''
                    }));
                    setMessages(mapped);
                }
            });
        }
    }, [userId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text) return;

        const newMsg: ChatMessage = {
            id: Date.now().toString(),
            content: text,
            fromMe: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMsg]);
        setInput('');

        if (!isDevMode()) {
            await fetchNui('sendMessage', { userId, content: text });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="flex items-center gap-3 px-3 py-3 bg-white border-b border-gray-100 shrink-0">
                <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <span className="material-symbols-rounded text-gray-700 text-2xl">arrow_back</span>
                </button>
                <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => onUserClick(userId)}
                >
                    <img src={userAvatar} alt={userName} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                    <div>
                        <h3 className="font-bold text-[15px] text-gray-900 hover:text-orange-500 transition-colors">{userName}</h3>
                        <p className="text-[11px] text-green-500 font-medium">Online</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 hide-scrollbar">
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} content={msg.content} time={msg.time} fromMe={msg.fromMe} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 bg-white border-t border-gray-100 px-3 py-3">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="bg-orange-500 text-white p-2.5 rounded-full hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-40"
                    >
                        <span className="material-symbols-rounded text-xl">send</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
