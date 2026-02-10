import React, { ReactNode } from 'react';

interface MenuItemProps {
    icon: string;
    label: string;
    iconBg?: string;
    iconColor?: string;
    onClick?: () => void;
    rightContent?: ReactNode;
    showChevron?: boolean;
    border?: boolean;
}

export const MenuItem: React.FC<MenuItemProps> = ({
    icon,
    label,
    iconBg = 'bg-gray-100',
    iconColor = 'text-gray-600',
    onClick,
    rightContent,
    showChevron = true,
    border = false,
}) => {
    return (
        <div
            onClick={onClick}
            className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors ${border ? 'border-b border-gray-50' : ''}`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${iconBg} ${iconColor} flex items-center justify-center`}>
                    <span className="material-symbols-rounded">{icon}</span>
                </div>
                <span className="font-semibold text-gray-700">{label}</span>
            </div>
            {rightContent || (showChevron && <span className="material-symbols-rounded text-gray-400">chevron_right</span>)}
        </div>
    );
};
