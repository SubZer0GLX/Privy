import React, { useState, useEffect, useCallback } from 'react';
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
    const [suggestions, setSuggestions] = useState(isDevMode() ? MOCK_SUGGESTIONS : []);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<typeof MOCK_SUGGESTIONS>([]);
    const [searching, setSearching] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(!isDevMode());

    useEffect(() => {
        if (!isDevMode()) {
            fetchNui<any[]>('discover', {}).then((result) => {
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
                setLoadingSuggestions(false);
            });
        }
    }, []);

    const handleSearch = useCallback((value: string) => {
        setSearchQuery(value);
        const q = value.trim().toLowerCase();

        if (!q) {
            setSearchResults([]);
            setSearching(false);
            return;
        }

        setSearching(true);

        if (isDevMode()) {
            const filtered = suggestions.filter(
                s => s.name.toLowerCase().includes(q) || s.handle.toLowerCase().includes(q)
            );
            setSearchResults(filtered);
            setSearching(false);
        } else {
            fetchNui<any[]>('searchUsers', { query: q }, []).then((result) => {
                if (Array.isArray(result)) {
                    const bgs = [IMAGES.backgrounds.mountain, IMAGES.backgrounds.abstract, IMAGES.backgrounds.beach];
                    const mapped = result.map((u: any, i: number) => ({
                        id: String(u.id),
                        name: u.display_name || u.username,
                        handle: '@' + u.username,
                        bg: bgs[i % bgs.length],
                        avatar: u.avatar || IMAGES.avatars.user,
                        isVerified: u.is_premium === 1
                    }));
                    setSearchResults(mapped);
                } else {
                    setSearchResults([]);
                }
                setSearching(false);
            });
        }
    }, [suggestions]);

    const displayList = searchQuery.trim() ? searchResults : suggestions;
    const isSearching = searchQuery.trim().length > 0;

    return (
        <div className="pb-24 bg-white dark:bg-gray-900">
            <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-40 border-b border-gray-100 dark:border-gray-700 px-4 pt-16 pb-3">
                <SearchBar placeholder="Search users..." onChange={handleSearch} />
            </div>

            <section className="mt-4 px-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-rounded text-orange-500">
                            {isSearching ? 'search' : 'bar_chart'}
                        </span>
                        <h2 className="font-bold text-lg text-gray-800 dark:text-white">
                            {isSearching ? 'Results' : 'Suggestions'}
                        </h2>
                    </div>
                    {!isSearching && (
                        <div className="flex gap-4">
                            <button className="material-symbols-rounded text-gray-400 dark:text-gray-500 hover:text-orange-500">visibility_off</button>
                            <button className="material-symbols-rounded text-gray-400 dark:text-gray-500 hover:text-orange-500">refresh</button>
                        </div>
                    )}
                </div>

                {(searching || loadingSuggestions) ? (
                    <div className="flex items-center justify-center py-12">
                        <span className="material-symbols-rounded text-3xl text-orange-500 animate-spin">progress_activity</span>
                    </div>
                ) : displayList.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {displayList.map(sug => (
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
                ) : isSearching ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                        <span className="material-symbols-rounded text-5xl mb-2">person_search</span>
                        <p className="text-sm">No users found</p>
                    </div>
                ) : null}

                {!isSearching && (
                    <div className="flex justify-center items-center gap-1.5 mt-4">
                        <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                    </div>
                )}
            </section>
        </div>
    );
};
