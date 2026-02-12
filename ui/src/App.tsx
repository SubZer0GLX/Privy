import React, { useState, useEffect } from 'react';
import { NavTab } from './types';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { DiscoveryScreen } from './screens/DiscoveryScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { MessagesScreen } from './screens/MessagesScreen';
import { UserProfileScreen } from './screens/UserProfileScreen';
import { BottomNav } from './components/BottomNav';
import { NotificationsPanel, Notification, MOCK_NOTIFICATIONS } from './components/NotificationsPanel';
import appIcon from '/icone.png';
import { CreateStoryScreen } from './screens/CreateStoryScreen';
import { CreatePostScreen } from './screens/CreatePostScreen';
import { PostCard } from './components/PostCard';
import { Post } from './types';
import { IMAGES } from './constants';
import { fetchNui, isDevMode } from './utils/nui';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentTab, setCurrentTab] = useState<NavTab>('home');
    const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showCreateStory, setShowCreateStory] = useState(false);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>(isDevMode() ? MOCK_NOTIFICATIONS : []);
    const [darkMode, setDarkMode] = useState(false);
    const [pendingChat, setPendingChat] = useState<{ userId: string; userName: string; userAvatar: string } | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [viewingPost, setViewingPost] = useState<Post | null>(null);
    const [loadingPost, setLoadingPost] = useState(false);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        if (isDevMode()) {
            document.body.style.visibility = 'visible';
        }
    }, []);

    // Auto-login: try to fetch existing account on mount (only in FiveM)
    useEffect(() => {
        if (!isDevMode()) {
            fetchNui('login', {}).then((result: any) => {
                if (result?.success && result.user) {
                    setCurrentUser(result.user);
                    setIsAuthenticated(true);
                    // Load notifications after login
                    fetchNui<any[]>('getNotifications', {}).then((notifs) => {
                        if (notifs && Array.isArray(notifs)) {
                            setNotifications(notifs.map((n: any) => ({
                                id: String(n.id),
                                type: n.type,
                                userName: n.from_display_name || n.from_username,
                                userAvatar: n.from_avatar || '',
                                userId: String(n.from_user_id),
                                postId: n.post_id ? String(n.post_id) : undefined,
                                text: n.text,
                                time: n.created_at,
                                isRead: n.is_read === 1 || n.is_read === true,
                            })));
                        }
                    });
                }
            });
        }
    }, []);

    const handleLogin = (user?: any) => {
        if (user) setCurrentUser(user);
        setIsAuthenticated(true);
    };

    const handleTabChange = (tab: NavTab) => {
        setCurrentTab(tab);
        setShowCreatePost(false);
        setShowCreateStory(false);
        setShowNotifications(false);
        setViewingProfileId(null);
    };

    const handleUserClick = (userId: string) => {
        setShowNotifications(false);
        setViewingProfileId(userId);
    };

    const handleBackFromProfile = () => {
        setViewingProfileId(null);
    };

    const handleMessageUser = (userId: string, userName: string, userAvatar: string) => {
        setViewingProfileId(null);
        setPendingChat({ userId, userName, userAvatar });
        setCurrentTab('messages');
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setCurrentUser(null);
    };

    const refreshNotifications = () => {
        if (!isDevMode()) {
            fetchNui<any[]>('getNotifications', {}).then((notifs) => {
                if (notifs && Array.isArray(notifs)) {
                    setNotifications(notifs.map((n: any) => ({
                        id: String(n.id),
                        type: n.type,
                        userName: n.from_display_name || n.from_username,
                        userAvatar: n.from_avatar || '',
                        userId: String(n.from_user_id),
                        postId: n.post_id ? String(n.post_id) : undefined,
                        text: n.text,
                        time: n.created_at,
                        isRead: n.is_read === 1 || n.is_read === true,
                    })));
                }
            });
        }
    };

    const handleOpenNotifications = () => {
        refreshNotifications();
        setShowNotifications(true);
    };

    const handlePostClick = async (postId: string) => {
        setShowNotifications(false);
        setLoadingPost(true);
        if (!isDevMode()) {
            const result = await fetchNui<any>('getPost', { postId });
            if (result) {
                const p = result;
                setViewingPost({
                    id: String(p.id),
                    user: {
                        id: String(p.user_id),
                        username: p.username || 'unknown',
                        displayName: p.display_name || p.username || 'Unknown',
                        avatar: p.avatar || IMAGES.avatars.user,
                        isVerified: p.is_premium == 1 || p.is_premium === true
                    },
                    timestamp: p.created_at || 'now',
                    content: p.content || '',
                    image: p.image || undefined,
                    images: p.images || (p.image ? [p.image] : undefined),
                    likes: p.like_count || 0,
                    comments: p.comment_count || 0,
                    isLiked: p.isLiked || false
                });
            }
        }
        setLoadingPost(false);
    };

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        if (!isDevMode()) {
            fetchNui('markNotificationsRead', {});
        }
    };

    if (!isAuthenticated) {
        return (
            <div className={`app-shell ${darkMode ? 'dark' : ''}`}>
                <LoginScreen onLogin={handleLogin} />
            </div>
        );
    }

    return (
        <div className={`app-shell ${darkMode ? 'dark' : ''}`}>
            <div className="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
                {/* Global Header (Only show if not viewing a profile and on home) */}
                {!viewingProfileId && currentTab === 'home' && (
                    <header className="flex items-center justify-between px-4 pt-16 pb-3 border-b border-gray-100 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md sticky top-0 z-50">
                        <div className="flex items-center gap-1">
                            <img src={appIcon} alt="Privy" className="w-8 h-8 object-contain" />
                            <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">PRIVY</span>
                        </div>
                        <button
                            onClick={handleOpenNotifications}
                            className="relative cursor-pointer"
                        >
                            <span className="material-symbols-rounded text-gray-700 dark:text-gray-300 text-2xl">notifications</span>
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                            )}
                        </button>
                    </header>
                )}

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto hide-scrollbar relative">
                    {/* Create Story Overlay */}
                    {showCreateStory && (
                        <div className="absolute inset-0 z-[70] bg-white dark:bg-gray-900">
                            <CreateStoryScreen onClose={(created) => { setShowCreateStory(false); if (created) setRefreshKey(k => k + 1); }} />
                        </div>
                    )}

                    {/* Create Post Overlay */}
                    {showCreatePost && (
                        <div className="absolute inset-0 z-[70] bg-white dark:bg-gray-900">
                            <CreatePostScreen onClose={(created) => { setShowCreatePost(false); if (created) setRefreshKey(k => k + 1); }} />
                        </div>
                    )}

                    {viewingProfileId ? (
                        <div className="absolute inset-0 z-50 bg-white dark:bg-gray-900">
                            <UserProfileScreen userId={viewingProfileId} currentUserId={currentUser?.id != null ? String(currentUser.id) : undefined} onBack={handleBackFromProfile} onMessage={handleMessageUser} />
                        </div>
                    ) : (
                        <>
                            {currentTab === 'home' && <HomeScreen key={`home-${refreshKey}`} onUserClick={handleUserClick} onCreateStory={() => setShowCreateStory(true)} />}
                            {currentTab === 'search' && <DiscoveryScreen onUserClick={handleUserClick} />}
                            {currentTab === 'messages' && <MessagesScreen key={`msg-${refreshKey}`} onUserClick={handleUserClick} pendingChat={pendingChat} onPendingChatHandled={() => setPendingChat(null)} />}
                            {currentTab === 'profile' && <ProfileScreen key={`prof-${refreshKey}`} onLogout={handleLogout} darkMode={darkMode} onDarkModeChange={setDarkMode} onUserClick={handleUserClick} />}
                        </>
                    )}
                </main>

                {/* Hide Bottom Nav when viewing another user's profile */}
                {!viewingProfileId && (
                    <BottomNav currentTab={currentTab} onTabChange={handleTabChange} onCreatePost={() => setShowCreatePost(true)} userAvatar={currentUser?.avatar} />
                )}

                {/* Notifications Panel - overlays entire app */}
                {showNotifications && (
                    <div className="absolute inset-0 z-[80] bg-white dark:bg-gray-900 flex flex-col">
                        <NotificationsPanel
                            notifications={notifications}
                            onClose={() => setShowNotifications(false)}
                            onUserClick={handleUserClick}
                            onPostClick={handlePostClick}
                            onMarkAllRead={handleMarkAllRead}
                        />
                    </div>
                )}

                {/* Single Post View - from notification click */}
                {viewingPost && (
                    <div className="absolute inset-0 z-[85] bg-white dark:bg-gray-900 flex flex-col">
                        <div className="flex items-center gap-3 px-4 pt-16 pb-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
                            <button onClick={() => setViewingPost(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                <span className="material-symbols-rounded text-gray-700 dark:text-gray-300 text-2xl">arrow_back</span>
                            </button>
                            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Post</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto hide-scrollbar pb-20">
                            <PostCard post={viewingPost} onUserClick={(uid) => { setViewingPost(null); handleUserClick(uid); }} />
                        </div>
                    </div>
                )}

                {/* Loading Post Overlay */}
                {loadingPost && (
                    <div className="absolute inset-0 z-[85] bg-white dark:bg-gray-900 flex items-center justify-center">
                        <span className="material-symbols-rounded text-3xl text-orange-500 animate-spin">progress_activity</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
