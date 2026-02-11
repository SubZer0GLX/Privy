import React from 'react';

export type MessageType = 'text' | 'image' | 'video' | 'payment';

interface MessageBubbleProps {
    content: string;
    time: string;
    fromMe: boolean;
    type?: MessageType;
    mediaUrl?: string;
    amount?: number;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ content, time, fromMe, type = 'text', mediaUrl, amount }) => {
    const bubbleBase = fromMe
        ? 'bg-orange-500 text-white rounded-br-md'
        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md shadow-sm';

    const timeClass = fromMe ? 'text-orange-100' : 'text-gray-400 dark:text-gray-500';

    if (type === 'payment') {
        return (
            <div className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl overflow-hidden ${bubbleBase}`}>
                    <div className={`flex items-center gap-3 px-4 py-3 ${fromMe ? 'bg-white/10' : 'bg-green-50 dark:bg-green-900/20'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${fromMe ? 'bg-white/20' : 'bg-green-100 dark:bg-green-900/30'}`}>
                            <span className={`material-symbols-rounded text-xl ${fromMe ? 'text-white' : 'text-green-600 dark:text-green-400'}`}>payments</span>
                        </div>
                        <div>
                            <p className={`text-xs font-medium ${fromMe ? 'text-orange-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                {fromMe ? 'Payment sent' : 'Payment received'}
                            </p>
                            <p className={`text-lg font-bold ${fromMe ? 'text-white' : 'text-green-600 dark:text-green-400'}`}>${amount?.toFixed(2)}</p>
                        </div>
                    </div>
                    {content && <p className="text-[14px] leading-relaxed px-4 pt-2">{content}</p>}
                    <p className={`text-[10px] mt-1 ${timeClass} text-right px-4 pb-2.5`}>{time}</p>
                </div>
            </div>
        );
    }

    if (type === 'image' && mediaUrl) {
        return (
            <div className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl overflow-hidden ${bubbleBase}`}>
                    <img src={mediaUrl} alt="Shared" className="w-full h-auto max-h-[250px] object-cover" />
                    {content && <p className="text-[14px] leading-relaxed px-4 pt-2">{content}</p>}
                    <p className={`text-[10px] mt-1 ${timeClass} text-right px-4 pb-2.5`}>{time}</p>
                </div>
            </div>
        );
    }

    if (type === 'video' && mediaUrl) {
        return (
            <div className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl overflow-hidden ${bubbleBase}`}>
                    <div className="relative">
                        <img src={mediaUrl} alt="Video" className="w-full h-auto max-h-[250px] object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                                <span className="material-symbols-rounded text-gray-800 text-2xl ml-0.5">play_arrow</span>
                            </div>
                        </div>
                    </div>
                    {content && <p className="text-[14px] leading-relaxed px-4 pt-2">{content}</p>}
                    <p className={`text-[10px] mt-1 ${timeClass} text-right px-4 pb-2.5`}>{time}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${bubbleBase}`}>
                <p className="text-[14px] leading-relaxed">{content}</p>
                <p className={`text-[10px] mt-1 ${timeClass} text-right`}>{time}</p>
            </div>
        </div>
    );
};
