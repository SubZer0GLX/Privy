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
import { fetchNui, isDevMode } from './utils/nui';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentTab, setCurrentTab] = useState<NavTab>('home');
    const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        if (isDevMode()) {
            document.body.style.visibility = 'visible';
        }
    }, []);

    // Auto-login: try to fetch existing account on mount (only in FiveM)
    useEffect(() => {
        if (!isDevMode()) {
            fetchNui('login', {}, { success: false } as any).then((result: any) => {
                if (result.success && result.user) {
                    setCurrentUser(result.user);
                    setIsAuthenticated(true);
                }
            });
        }
    }, []);

    const handleLogin = (user?: any) => {
        if (user) setCurrentUser(user);
        setIsAuthenticated(true);
    };

    const handleUserClick = (userId: string) => {
        setShowNotifications(false);
        setViewingProfileId(userId);
    };

    const handleBackFromProfile = () => {
        setViewingProfileId(null);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setCurrentUser(null);
    };

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    if (!isAuthenticated) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
            {/* Global Header (Only show if not viewing a profile and on home) */}
            {!viewingProfileId && currentTab === 'home' && (
                <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-50">
                    <div className="flex items-center gap-1">
                        <span className="material-symbols-rounded text-orange-500 text-3xl">cloud</span>
                        <span className="font-bold text-xl tracking-tight text-gray-900">PRIVY</span>
                    </div>
                    <button
                        onClick={() => setShowNotifications(true)}
                        className="relative cursor-pointer"
                    >
                        <span className="material-symbols-rounded text-gray-700 text-2xl">notifications</span>
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>
                </header>
            )}

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto hide-scrollbar relative">
                {/* Notifications Panel */}
                {showNotifications && (
                    <NotificationsPanel
                        notifications={notifications}
                        onClose={() => setShowNotifications(false)}
                        onUserClick={handleUserClick}
                        onMarkAllRead={handleMarkAllRead}
                    />
                )}

                {viewingProfileId ? (
                    <div className="absolute inset-0 z-50 bg-white">
                        <UserProfileScreen userId={viewingProfileId} onBack={handleBackFromProfile} />
                    </div>
                ) : (
                    <>
                        {currentTab === 'home' && <HomeScreen onUserClick={handleUserClick} />}
                        {currentTab === 'search' && <DiscoveryScreen onUserClick={handleUserClick} />}
                        {currentTab === 'messages' && <MessagesScreen onUserClick={handleUserClick} />}
                        {currentTab === 'profile' && <ProfileScreen onLogout={handleLogout} />}
                        {currentTab === 'create' && (
                            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
                                <span className="material-symbols-rounded text-6xl mb-4 text-gray-200">construction</span>
                                <p>Work in Progress</p>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Hide Bottom Nav when viewing another user's profile */}
            {!viewingProfileId && (
                <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
            )}
        </div>
    );
};

export default App;
