
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Language, LocaleMessages } from '../types';

interface LocalizationContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, defaultValue?: string) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useLocalStorage<Language>('language', 'en');
    const [messages, setMessages] = useState<LocaleMessages>({});

    useEffect(() => {
        const loadMessages = async () => {
            try {
                const response = await fetch(`/data/locales/${language}.json`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                setMessages(data);
            } catch (error) {
                console.error(`Could not load locale file for ${language}`, error);
                // Fallback to English
                try {
                    const fallbackResponse = await fetch(`/data/locales/en.json`);
                    if (!fallbackResponse.ok) throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
                    const fallbackData = await fallbackResponse.json();
                    setMessages(fallbackData);
                } catch (fallbackError) {
                    console.error(`Could not load fallback locale file for en`, fallbackError);
                }
            }
        };
        loadMessages();
    }, [language]);

    const t = useCallback((key: string, defaultValue?: string): string => {
        return messages[key] || defaultValue || key;
    }, [messages]);

    const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

    return React.createElement(LocalizationContext.Provider, { value: value }, children);
};

export const useLocalization = (): LocalizationContextType => {
    const context = useContext(LocalizationContext);
    if (context === undefined) {
        throw new Error('useLocalization must be used within a LocalizationProvider');
    }
    return context;
};
