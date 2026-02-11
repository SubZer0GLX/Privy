import React from 'react';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (value: boolean) => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange }) => (
    <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-600'}`}
    >
        <span
            className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
    </button>
);
