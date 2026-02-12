import React from 'react';
import { PaymentCurrency } from '../types';
import { PrismaIcon } from './PrismaIcon';

interface ProfileHeaderProps {
    banner: string;
    avatar: string;
    name: string;
    tag: string;
    isPremium?: boolean;
    price?: string;
    paymentCurrency?: PaymentCurrency;
    bio?: string;
    isVerified?: boolean;
    layout?: 'centered' | 'inline';
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    banner,
    avatar,
    name,
    tag,
    isPremium = false,
    price,
    paymentCurrency = 'cash',
    bio,
    isVerified = false,
    layout = 'centered',
}) => {
    if (layout === 'inline') {
        return (
            <>
                <div className="h-40 w-full relative">
                    <img src={banner} alt="Banner" className="w-full h-full object-cover" />
                </div>

                <div className="px-5 relative">
                    <div className="flex items-end -mt-10 mb-4">
                        <div className="relative shrink-0">
                            <img
                                src={avatar}
                                alt={name}
                                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-md bg-white dark:bg-gray-900"
                            />
                            {isPremium && (
                                <div className="absolute bottom-1 right-1 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full p-1 border-2 border-white dark:border-gray-900 shadow-sm">
                                    <span className="material-symbols-rounded text-[14px] block">diamond</span>
                                </div>
                            )}
                        </div>

                        <div className="ml-4 mb-2 flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{name}</h1>
                                {(isPremium || isVerified) && <span className="material-symbols-rounded text-orange-500 text-[18px] filled">verified</span>}
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">{tag}</p>
                        </div>
                    </div>

                    {bio && (
                        <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed mb-6">{bio}</p>
                    )}
                </div>
            </>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 pb-6 rounded-b-3xl shadow-sm border-b border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="h-32 w-full bg-gray-200 dark:bg-gray-700 relative">
                <img src={banner} alt="Profile Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
            </div>

            <div className="px-6 flex flex-col items-center -mt-12 relative z-10">
                <div className="relative mb-3">
                    <img src={avatar} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg bg-white dark:bg-gray-800" />
                    {isPremium && (
                        <div className="absolute bottom-1 right-1 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full p-1.5 border-2 border-white dark:border-gray-800 shadow-sm" title="Premium Creator">
                            <span className="material-symbols-rounded text-sm block">diamond</span>
                        </div>
                    )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{name}</h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mb-4">{tag}</p>

                <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-2 ${isPremium ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    {isPremium ? 'Premium Plan' : 'Free Plan'}
                </div>
                {isPremium && price && (
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                        {paymentCurrency === 'diamonds' ? <><PrismaIcon className="w-4 h-4 inline-block mr-1" />{price}</> : `$${price}`} / semana
                    </p>
                )}
            </div>
        </div>
    );
};
