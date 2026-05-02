import React from 'react';
import { useLocalization } from '../hooks/useLocalization';

interface HeaderProps {
    onSettingsClick: () => void;
}

const SettingsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
    </svg>
);


export const Header: React.FC<HeaderProps> = ({ onSettingsClick }) => {
    const { t } = useLocalization();
    return (
        <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-20 shadow-md">
            <div className="px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {t('app_title')}
                </h1>
                <button
                    onClick={onSettingsClick}
                    className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors"
                    aria-label={t('settings_title')}
                >
                    <SettingsIcon className="h-6 w-6" />
                </button>
            </div>
        </header>
    );
};
