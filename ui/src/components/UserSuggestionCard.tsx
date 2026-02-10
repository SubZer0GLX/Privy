import React from 'react';

interface UserSuggestionCardProps {
    background: string;
    avatar: string;
    name: string;
    handle: string;
    isVerified?: boolean;
    onClick?: () => void;
}

export const UserSuggestionCard: React.FC<UserSuggestionCardProps> = ({
    background,
    avatar,
    name,
    handle,
    isVerified = false,
    onClick,
}) => {
    return (
        <div
            onClick={onClick}
            className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-shadow"
        >
            <img src={background} alt="Background" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

            <div className="absolute inset-0 p-4 flex items-center gap-4">
                <div className="relative shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white overflow-hidden shadow-lg">
                        <img src={avatar} alt={name} className="w-full h-full object-cover" />
                    </div>
                    <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                    <span className="absolute top-0 left-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">Free</span>
                </div>
                <div className="text-white">
                    <div className="flex items-center gap-1">
                        <h3 className="font-bold text-lg leading-tight">{name}</h3>
                        {isVerified && <span className="material-symbols-rounded text-sm filled">verified</span>}
                    </div>
                    <p className="text-sm opacity-90">{handle}</p>
                </div>
            </div>
        </div>
    );
};
