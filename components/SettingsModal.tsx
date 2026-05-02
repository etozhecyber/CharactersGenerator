
import React, { useRef } from 'react';
import type { Language, GenerationModel } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import { useModelList } from '../hooks/useModelList';
import { ModelSelector } from './ModelSelector';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiKey: string;
    onApiKeyChange: (key: string) => void;
    apiEndpoint: string;
    onApiEndpointChange: (endpoint: string) => void;
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

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182" />
    </svg>
);


export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, 
    apiKey, onApiKeyChange,
    apiEndpoint, onApiEndpointChange,
    generationModel, onGenerationModelChange, 
    conceptGenerationModel, onConceptGenerationModelChange,
    cardGenerationLanguage, onCardGenerationLanguageChange, appVersion 
}) => {
    const { language, setLanguage, t } = useLocalization();
    const modalRef = useRef<HTMLDivElement>(null);

    // Single fetch for both model selectors
    const { models, isLoading, error, isFiltered, refetch } = useModelList(apiKey, apiEndpoint);

    if (!isOpen) return null;

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value as Language);
    };

    const handleCardLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onCardGenerationLanguageChange(e.target.value as Language);
    };

    const modelsDisabled = !apiKey || !apiEndpoint;

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
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
                        <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-300 mb-1">{t('api_key_label')}</label>
                        <input
                            id="api-key-input"
                            type="password"
                            value={apiKey}
                            onChange={(e) => onApiKeyChange(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="api-endpoint-input" className="block text-sm font-medium text-gray-300 mb-1">{t('api_endpoint_label')}</label>
                        <input
                            id="api-endpoint-input"
                            type="text"
                            value={apiEndpoint}
                            onChange={(e) => onApiEndpointChange(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* Model selectors with shared model list */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-400">{t('model_select_section_title', 'Models')}</span>
                            <button
                                onClick={refetch}
                                disabled={modelsDisabled || isLoading}
                                className="p-1 text-gray-400 hover:text-white rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title={t('model_select_refresh')}
                            >
                                <RefreshIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        <ModelSelector
                            id="model-select"
                            label={t('generation_model_label')}
                            value={generationModel}
                            onChange={onGenerationModelChange}
                            models={models}
                            isLoading={isLoading}
                            error={error}
                            isFiltered={isFiltered}
                            disabled={modelsDisabled}
                        />

                        <ModelSelector
                            id="concept-model-select"
                            label={t('concept_generation_model_label')}
                            value={conceptGenerationModel}
                            onChange={onConceptGenerationModelChange}
                            models={models}
                            isLoading={isLoading}
                            error={error}
                            isFiltered={isFiltered}
                            disabled={modelsDisabled}
                        />
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
