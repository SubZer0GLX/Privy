import React from 'react';

interface SearchBarProps {
    placeholder?: string;
    onChange?: (value: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ placeholder = 'Search...', onChange }) => {
    return (
        <div className="relative group">
            <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">search</span>
            <input
                type="text"
                placeholder={placeholder}
                onChange={(e) => onChange?.(e.target.value)}
                className="w-full bg-gray-100 border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all outline-none placeholder-gray-400"
            />
        </div>
    );
};
