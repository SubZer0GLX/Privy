export interface User {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    isVerified?: boolean;
}

export interface Story {
    id: string;
    user: User;
    hasUnseen: boolean;
}

export interface Post {
    id: string;
    user: User;
    timestamp: string;
    content: string;
    image?: string;
    likes: number;
    comments: number;
    tipAmount?: number;
}

export type NavTab = 'home' | 'search' | 'create' | 'messages' | 'profile';