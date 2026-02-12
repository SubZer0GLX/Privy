export type PaymentCurrency = 'cash' | 'diamonds';

export interface User {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    isVerified?: boolean;
}

export interface StoryItem {
    id: string;
    image: string;
    caption?: string;
    timestamp: string;
}

export interface Story {
    id: string;
    user: User;
    hasUnseen: boolean;
    items: StoryItem[];
}

export interface Post {
    id: string;
    user: User;
    timestamp: string;
    content: string;
    image?: string;
    images?: string[];
    likes: number;
    comments: number;
    tipAmount?: number;
    isLiked?: boolean;
}

export interface Comment {
    id: string;
    user: User;
    content: string;
    timestamp: string;
}

export type NavTab = 'home' | 'search' | 'messages' | 'profile';