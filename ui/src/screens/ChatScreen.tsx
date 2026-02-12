import React, { useState, useEffect, useRef } from 'react';
import { fetchNui, isDevMode, formatTimestamp } from '../utils/nui';

function formatChatTime(ts: any): string {
    if (!ts) return '';
    // Handle numeric timestamps (epoch ms)
    if (typeof ts === 'number') {
        const d = new Date(ts);
        if (!isNaN(d.getTime())) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const str = typeof ts === 'string' ? ts : String(ts);
    if (/^\d{1,2}:\d{2}$/.test(str.trim())) return str;
    // Handle pure numeric strings (epoch ms or s)
    if (/^\d{10,13}$/.test(str.trim())) {
        const epoch = parseInt(str.trim());
        const d = new Date(epoch < 10000000000 ? epoch * 1000 : epoch);
        if (!isNaN(d.getTime())) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // MySQL timestamps use space separator, replace with T for reliable parsing
    const normalized = str.trim().replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/, '$1T$2');
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return str;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
import { MessageBubble, MessageType } from '../components/MessageBubble';
import { IMAGES } from '../constants';

interface ChatMessage {
    id: string;
    content: string;
    fromMe: boolean;
    time: string;
    type?: MessageType;
    mediaUrl?: string;
    amount?: number;
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
    { id: '3', content: '', fromMe: false, time: '10:32', type: 'image', mediaUrl: IMAGES.posts.desert },
    { id: '4', content: 'Check this out!', fromMe: false, time: '10:32' },
    { id: '5', content: 'Amazing shot! Here\'s a tip', fromMe: true, time: '10:33', type: 'payment', amount: 10.00 },
    { id: '6', content: 'Thank you so much! 🙏', fromMe: false, time: '10:35' },
];

export const ChatScreen: React.FC<ChatScreenProps> = ({ userId, userName, userAvatar, onBack, onUserClick }) => {
    const [messages, setMessages] = useState<ChatMessage[]>(isDevMode() ? MOCK_CHAT : []);
    const [input, setInput] = useState('');
    const [showActions, setShowActions] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [viewingMedia, setViewingMedia] = useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentNote, setPaymentNote] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const actionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isDevMode()) {
            fetchNui<any[]>('getChatMessages', { userId }).then((result) => {
                if (Array.isArray(result)) {
                    const mapped: ChatMessage[] = result.map((m: any) => {
                        const msgType = m.type || 'text';
                        const isMedia = msgType === 'image' || msgType === 'video';
                        return {
                            id: String(m.id),
                            content: isMedia ? '' : (m.content || ''),
                            fromMe: m.isMine || m.from_me || false,
                            time: formatChatTime(m.time || m.created_at || ''),
                            type: msgType,
                            mediaUrl: m.media_url || (isMedia ? m.content : undefined),
                            amount: m.amount
                        };
                    });
                    setMessages(mapped);
                }
            });
        }
    }, [userId]);

    // Listen for real-time incoming messages
    useEffect(() => {
        const handler = (event: MessageEvent) => {
            const msg = event.data;
            if (msg?.type === 'privy:newMessage' && msg.data) {
                const d = msg.data;
                // Only add if this message is from the user we're chatting with
                if (String(d.sender_id) === String(userId)) {
                    const newMsg: ChatMessage = {
                        id: String(d.id),
                        content: d.content || '',
                        fromMe: false,
                        time: formatChatTime(d.created_at) || now(),
                        type: d.type || 'text',
                        mediaUrl: d.media_url,
                        amount: d.amount
                    };
                    setMessages(prev => [...prev, newMsg]);
                }
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [userId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
                setShowActions(false);
            }
        };
        if (showActions) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showActions]);

    const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const handleSend = async () => {
        const text = input.trim();
        if (!text) return;

        const newMsg: ChatMessage = {
            id: Date.now().toString(),
            content: text,
            fromMe: true,
            time: now()
        };

        setMessages(prev => [...prev, newMsg]);
        setInput('');

        if (!isDevMode()) {
            await fetchNui('sendMessage', { userId, content: text, type: 'text' });
        }
    };

    const handlePickGallery = () => {
        setShowActions(false);

        if (!isDevMode()) {
            components.setGallery({
                includeImages: true,
                includeVideos: false,
                multiSelect: false,
                onSelect: (data) => {
                    const photo = Array.isArray(data) ? data[0] : data;
                    if (photo?.src) {
                        const newMsg: ChatMessage = {
                            id: Date.now().toString(),
                            content: '',
                            fromMe: true,
                            time: now(),
                            type: 'image',
                            mediaUrl: photo.src
                        };
                        setMessages(prev => [...prev, newMsg]);
                        fetchNui('sendMessage', { userId, content: photo.src, type: 'image' });
                    }
                }
            });
        } else {
            const mockUrl = IMAGES.posts.desert;
            const newMsg: ChatMessage = {
                id: Date.now().toString(),
                content: '',
                fromMe: true,
                time: now(),
                type: 'image',
                mediaUrl: mockUrl
            };
            setMessages(prev => [...prev, newMsg]);
        }
    };

    const handleCaptureCamera = () => {
        setShowActions(false);

        if (!isDevMode()) {
            useCamera(
                (url: string) => {
                    if (url) {
                        const newMsg: ChatMessage = {
                            id: Date.now().toString(),
                            content: '',
                            fromMe: true,
                            time: now(),
                            type: 'image',
                            mediaUrl: url
                        };
                        setMessages(prev => [...prev, newMsg]);
                        fetchNui('sendMessage', { userId, content: url, type: 'image' });
                    }
                },
                {
                    default: { type: 'Photo', camera: 'rear' },
                    permissions: { toggleFlash: true, flipCamera: true, takePhoto: true }
                }
            );
        } else {
            const mockUrl = IMAGES.posts.desert;
            const newMsg: ChatMessage = {
                id: Date.now().toString(),
                content: '',
                fromMe: true,
                time: now(),
                type: 'image',
                mediaUrl: mockUrl
            };
            setMessages(prev => [...prev, newMsg]);
        }
    };

    const handleSendPayment = async () => {
        const amount = parseFloat(paymentAmount);
        if (!amount || amount <= 0) return;

        const newMsg: ChatMessage = {
            id: Date.now().toString(),
            content: paymentNote.trim(),
            fromMe: true,
            time: now(),
            type: 'payment',
            amount
        };

        setMessages(prev => [...prev, newMsg]);
        setShowPaymentModal(false);
        setPaymentAmount('');
        setPaymentNote('');

        if (!isDevMode()) {
            await fetchNui('sendPayment', { userId, amount, note: paymentNote.trim() });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center gap-3 px-3 pt-16 pb-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shrink-0">
                <button onClick={onBack} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <span className="material-symbols-rounded text-gray-700 dark:text-gray-300 text-2xl">arrow_back</span>
                </button>
                <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => onUserClick(userId)}
                >
                    <img src={userAvatar} alt={userName} className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-gray-700" />
                    <div>
                        <h3 className="font-bold text-[15px] text-gray-900 dark:text-white hover:text-orange-500 transition-colors">{userName}</h3>
                        <p className="text-[11px] text-green-500 font-medium">Online</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 hide-scrollbar">
                {messages.map((msg) => (
                    <MessageBubble
                        key={msg.id}
                        content={msg.content}
                        time={msg.time}
                        fromMe={msg.fromMe}
                        type={msg.type}
                        mediaUrl={msg.mediaUrl}
                        amount={msg.amount}
                        onMediaClick={(url) => setViewingMedia(url)}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="absolute inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={() => setShowPaymentModal(false)}>
                    <div
                        className="w-full bg-white dark:bg-gray-800 rounded-t-2xl p-6 animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Send Payment</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>

                        <div className="flex items-center justify-center gap-1 mb-6">
                            <span className="text-3xl text-gray-400 dark:text-gray-500">$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="0.00"
                                className="text-4xl font-bold text-gray-900 dark:text-white w-32 text-center border-none outline-none bg-transparent"
                                autoFocus
                            />
                        </div>

                        <input
                            type="text"
                            value={paymentNote}
                            onChange={(e) => setPaymentNote(e.target.value)}
                            placeholder="Add a note (optional)"
                            className="w-full bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 mb-4"
                        />

                        <button
                            onClick={handleSendPayment}
                            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                            className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold active:scale-[0.98] transition-all hover:bg-orange-600 disabled:opacity-40"
                        >
                            Send ${paymentAmount || '0.00'}
                        </button>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="shrink-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-3 py-3">
                {/* Action Buttons */}
                {showActions && (
                    <div ref={actionsRef} className="flex gap-4 mb-3 px-1 animate-fade-in">
                        <button
                            onClick={handlePickGallery}
                            className="flex flex-col items-center gap-1"
                        >
                            <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                                <span className="material-symbols-rounded text-blue-500">photo_library</span>
                            </div>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Galeria</span>
                        </button>
                        <button
                            onClick={handleCaptureCamera}
                            className="flex flex-col items-center gap-1"
                        >
                            <div className="w-11 h-11 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
                                <span className="material-symbols-rounded text-purple-500">photo_camera</span>
                            </div>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Camera</span>
                        </button>
                        <button
                            onClick={() => { setShowActions(false); setShowPaymentModal(true); }}
                            className="flex flex-col items-center gap-1"
                        >
                            <div className="w-11 h-11 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
                                <span className="material-symbols-rounded text-green-500">payments</span>
                            </div>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Payment</span>
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowActions(!showActions)}
                        className={`p-2 rounded-full transition-all ${showActions ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-500 rotate-45' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        <span className="material-symbols-rounded text-xl">add</span>
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 transition-all placeholder-gray-400 dark:placeholder-gray-500"
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

            {/* Fullscreen Media Viewer */}
            {viewingMedia && (
                <div className="absolute inset-0 z-[100] bg-black/95 flex items-center justify-center animate-fade-in" onClick={() => setViewingMedia(null)}>
                    <button
                        onClick={() => setViewingMedia(null)}
                        className="absolute top-14 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                        <span className="material-symbols-rounded">close</span>
                    </button>
                    <img
                        src={viewingMedia}
                        alt="Media"
                        className="max-w-full max-h-[85vh] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};
