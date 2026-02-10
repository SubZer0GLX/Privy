import React from 'react';

interface FormInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    variant?: 'underline' | 'boxed';
    rows?: number;
}

export const FormInput: React.FC<FormInputProps> = ({
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
    variant = 'underline',
    rows,
}) => {
    const labelClass = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1";

    if (variant === 'boxed') {
        const baseClass = "w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50";

        if (rows) {
            return (
                <div className="space-y-1">
                    <label className={labelClass}>{label}</label>
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        rows={rows}
                        placeholder={placeholder}
                        className={`${baseClass} resize-none`}
                    />
                </div>
            );
        }

        return (
            <div className="space-y-1">
                <label className={labelClass}>{label}</label>
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={baseClass}
                />
            </div>
        );
    }

    return (
        <div className="border-b border-gray-200">
            <label className={labelClass}>{label}</label>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-transparent border-none p-0 pb-3 text-lg text-gray-900 placeholder-gray-300 focus:ring-0 outline-none"
            />
        </div>
    );
};
