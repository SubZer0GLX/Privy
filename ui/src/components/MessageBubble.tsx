import React from 'react';

interface MessageBubbleProps {
    content: string;
    time: string;
    fromMe: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ content, time, fromMe }) => {
    return (
        <div className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                fromMe
                    ? 'bg-orange-500 text-white rounded-br-md'
                    : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
            }`}>
                <p className="text-[14px] leading-relaxed">{content}</p>
                <p className={`text-[10px] mt-1 ${fromMe ? 'text-orange-100' : 'text-gray-400'} text-right`}>{time}</p>
            </div>
        </div>
    );
};
