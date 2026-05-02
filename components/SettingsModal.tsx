
import React, { useRef } from 'react';
import type { Language, GenerationModel } from '../types';
import { useLocalization } from '../hooks/useLocalization';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    generationModel: GenerationModel;
    onGenerationModelChange: (model: GenerationModel) => void;
    conceptGenerationModel: GenerationModel;
    onConceptGenerationModelChange: (model: GenerationModel) => void;
    cardGenerationLanguage: Language;
    onCardGenerationLanguageChange: (language: Language) => void;
    appVersion: string;
}

const XMarkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, generationModel, onGenerationModelChange, 
    conceptGenerationModel, onConceptGenerationModelChange,
    cardGenerationLanguage, onCardGenerationLanguageChange, appVersion 
}) => {
    const { language, setLanguage, t } = useLocalization();
    const modalRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value as Language);
    };

    const handleCardLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onCardGenerationLanguageChange(e.target.value as Language);
    };

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onGenerationModelChange(e.target.value as GenerationModel);
    };

    const handleConceptModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onConceptGenerationModelChange(e.target.value as GenerationModel);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                ref={modalRef}
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 relative"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1 text-gray-500 hover:text-white rounded-full transition-colors"
                    aria-label={t('close_settings')}
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold text-white mb-6">{t('settings_title')}</h2>
                
                <div className="space-y-6">
                    <div>
                        <label htmlFor="language-select" className="block text-sm font-medium text-gray-300 mb-1">{t('interface_language_label')}</label>
                        <select
                            id="language-select"
                            value={language}
                            onChange={handleLanguageChange}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="en">English</option>
                            <option value="ru">Русский</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="card-language-select" className="block text-sm font-medium text-gray-300 mb-1">{t('card_generation_language_label')}</label>
                        <select
                            id="card-language-select"
                            value={cardGenerationLanguage}
                            onChange={handleCardLanguageChange}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="en">English</option>
                            <option value="ru">Русский</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="model-select" className="block text-sm font-medium text-gray-300 mb-1">{t('generation_model_label')}</label>
                        <select
                            id="model-select"
                            value={generationModel}
                            onChange={handleModelChange}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="gemini-flash-latest">{t('model_flash')}</option>
                            <option value="gemini-2.5-pro">{t('model_pro')}</option>
                            <option value="gemini-3.1-pro-preview">{t('model_3_1_pro')}</option>
                            <option value="gemini-3-flash-preview">{t('model_3_0_flash')}</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="concept-model-select" className="block text-sm font-medium text-gray-300 mb-1">{t('concept_generation_model_label')}</label>
                        <select
                            id="concept-model-select"
                            value={conceptGenerationModel}
                            onChange={handleConceptModelChange}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="gemini-flash-latest">{t('model_flash')}</option>
                            <option value="gemini-2.5-pro">{t('model_pro')}</option>
                            <option value="gemini-3.1-pro-preview">{t('model_3_1_pro')}</option>
                            <option value="gemini-3-flash-preview">{t('model_3_0_flash')}</option>
                        </select>
                    </div>
                </div>

                <div className="mt-8 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                        {`Version: ${appVersion}`}
                    </span>
                    <button 
                        onClick={onClose}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                        {t('done_button')}
                    </button>
                </div>
            </div>
        </div>
    );
};
