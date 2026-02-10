import React, { useState, useEffect } from 'react';
import { IMAGES } from '../constants';
import { fetchNui, isDevMode } from '../utils/nui';
import { SearchBar } from '../components/SearchBar';
import { UserSuggestionCard } from '../components/UserSuggestionCard';

const MOCK_SUGGESTIONS = [
    {
        id: 'u7',
        name: 'James J Call',
        handle: '@jamesjcall',
        bg: IMAGES.backgrounds.mountain,
        avatar: IMAGES.avatars.james,
        isVerified: true
    },
    {
        id: 'u8',
        name: 'Kurt L Hamby',
        handle: '@kurtlhamby',
        bg: IMAGES.backgrounds.abstract,
        avatar: IMAGES.avatars.kurt,
        isVerified: true
    },
    {
        id: 'u9',
        name: 'Jeneva G Taylor',
        handle: '@enevagtaylor',
        bg: IMAGES.backgrounds.beach,
        avatar: IMAGES.avatars.jeneva,
        isVerified: false
    }
];

interface DiscoveryScreenProps {
    onUserClick: (userId: string) => void;
}

export const DiscoveryScreen: React.FC<DiscoveryScreenProps> = ({ onUserClick }) => {
    const [suggestions, setSuggestions] = useState(MOCK_SUGGESTIONS);

    useEffect(() => {
        if (!isDevMode()) {
            fetchNui<any[]>('discover', {}, MOCK_SUGGESTIONS as any).then((result) => {
                if (Array.isArray(result) && result.length > 0) {
                    const bgs = [IMAGES.backgrounds.mountain, IMAGES.backgrounds.abstract, IMAGES.backgrounds.beach];
                    const mapped = result.map((u: any, i: number) => ({
                        id: String(u.id),
                        name: u.display_name || u.username,
                        handle: '@' + u.username,
                        bg: bgs[i % bgs.length],
                        avatar: u.avatar || IMAGES.avatars.user,
                        isVerified: u.is_premium === 1
                    }));
                    setSuggestions(mapped);
                }
            });
        }
    }, []);

    return (
        <div className="pb-24">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-40 border-b border-gray-100 px-4 py-3">
                <SearchBar placeholder="Search Posts" />
            </div>

            <section className="mt-4 px-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-rounded text-orange-500">bar_chart</span>
                        <h2 className="font-bold text-lg text-gray-800">Suggestions</h2>
                    </div>
                    <div className="flex gap-4">
                         <button className="material-symbols-rounded text-gray-400 hover:text-orange-500">visibility_off</button>
                         <button className="material-symbols-rounded text-gray-400 hover:text-orange-500">refresh</button>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {suggestions.map(sug => (
                        <UserSuggestionCard
                            key={sug.id}
                            background={sug.bg}
                            avatar={sug.avatar}
                            name={sug.name}
                            handle={sug.handle}
                            isVerified={sug.isVerified}
                            onClick={() => onUserClick(sug.id)}
                        />
                    ))}
                </div>

                <div className="flex justify-center items-center gap-1.5 mt-4">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                </div>
            </section>
        </div>
    );
};
