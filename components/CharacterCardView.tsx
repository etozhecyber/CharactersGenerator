
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { FullCharacter, GenerationModel, SelectedTag, Language } from '../types';
import { Spinner } from './Spinner';
import { useLocalization } from '../hooks/useLocalization';
import { useTokenCounter, countTokens } from '../hooks/useTokenCounter';
import { EditableField } from './EditableField';
import { EditableGreeting } from './EditableGreeting';
import { RefineFieldModal } from './RefineFieldModal';
import { refineField, generateImagePrompt, generateAvatar } from '../services/aiService';
import { exportCharacterCard } from '../services/exportService';
import { SparklesIcon } from './SparklesIcon';
import { ImageIcon } from './ImageIcon';
import { RefineIcon } from './RefineIcon';
import { EditableCharacterName } from './EditableCharacterName';

const ArrowLeftIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
);
const ArrowDownTrayIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);
const CodeBracketIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 15" />
    </svg>
);
const PlusCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);


interface CharacterCardViewProps {
    character: FullCharacter | null;
    isLoading: boolean;
    error: string | null;
    onBack: () => void;
    onRegenerate: () => void;
    onShowPrompt: () => void;
    originalPrompt: object | null;
    generationModel: GenerationModel;
    selectedTags: SelectedTag[];
    appVersion: string;
    generationLanguage: Language;
    apiSettings: { apiKey: string; apiEndpoint: string; };
    conceptGenerationModel: GenerationModel;
}

export const CharacterCardView: React.FC<CharacterCardViewProps> = ({ character, isLoading, error, onBack, onRegenerate, onShowPrompt, originalPrompt, generationModel, selectedTags, appVersion, generationLanguage, apiSettings, conceptGenerationModel }) => {
    const { t } = useLocalization();
    const [characterData, setCharacterData] = useState<FullCharacter | null>(null);

    // State for refinement modal
    const [isRefining, setIsRefining] = useState(false);
    const [refineError, setRefineError] = useState<string | null>(null);
    const [fieldToRefine, setFieldToRefine] = useState<{ field: keyof FullCharacter, index?: number | null } | null>(null);
    
    // State for image generation (now local to this component)
    const [imagePrompt, setImagePrompt] = useState('');
    const [avatarImage, setAvatarImage] = useState('');
    const [isGeneratingImagePrompt, setIsGeneratingImagePrompt] = useState(false);
    const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState<string | null>(null);


    useEffect(() => {
        if (character) {
            setCharacterData(JSON.parse(JSON.stringify(character)));
            // Reset local image state when character changes
            setImagePrompt('');
            setAvatarImage('');
            setAvatarError(null);
        }
    }, [character]);

    const handleFieldChange = useCallback((field: keyof FullCharacter, value: string) => {
        setCharacterData(prev => prev ? { ...prev, [field]: value } : null);
    }, []);

    const handleGreetingChange = useCallback((index: number, value: string) => {
        setCharacterData(prev => {
            if (!prev) return null;
            const newGreetings = [...prev.alternate_greetings];
            newGreetings[index] = value;
            return { ...prev, alternate_greetings: newGreetings };
        });
    }, []);

    const handleDeleteGreeting = useCallback((indexToDelete: number) => {
        setCharacterData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                alternate_greetings: prev.alternate_greetings.filter((_, index) => index !== indexToDelete)
            };
        });
    }, []);
    
    const handleAddGreeting = useCallback(() => {
        setCharacterData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                alternate_greetings: [...prev.alternate_greetings, ""]
            };
        });
    }, []);

    const handleOpenRefineModal = useCallback((field: keyof FullCharacter, index: number | null = null) => {
        setRefineError(null);
        setFieldToRefine({ field, index });
    }, []);

    const handleCloseRefineModal = useCallback(() => {
        setFieldToRefine(null);
    }, []);

    const handleRefineSubmit = useCallback(async (instruction: string) => {
        if (!characterData || !fieldToRefine) return;
        
        if (!apiSettings.apiKey) {
            setRefineError(t('error_api_key_not_set'));
            return;
        }
        
        if (!generationModel) {
            setRefineError(t('error_no_model_selected'));
            return;
        }
        
        setIsRefining(true);
        setRefineError(null);
        try {
            const { refinedContent } = await refineField({
                fullCharacterData: characterData,
                fieldToRefine: fieldToRefine.field,
                userInstruction: instruction,
                originalPromptObject: originalPrompt,
                model: generationModel,
                fieldIndex: fieldToRefine.index,
                language: generationLanguage,
                apiSettings
            });
            
            if (fieldToRefine.field === 'alternate_greetings' && typeof fieldToRefine.index === 'number') {
                handleGreetingChange(fieldToRefine.index, refinedContent);
            } else {
                handleFieldChange(fieldToRefine.field as keyof FullCharacter, refinedContent);
            }

            handleCloseRefineModal();

        } catch (err) {
            console.error("Refinement failed:", err);
            setRefineError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsRefining(false);
        }
    }, [characterData, fieldToRefine, originalPrompt, generationModel, generationLanguage, apiSettings, handleFieldChange, handleGreetingChange, handleCloseRefineModal]);


    const handleGenerateImagePrompt = useCallback(async () => {
        if (!characterData) return;
        
        if (!apiSettings.apiKey) {
            setAvatarError(t('error_api_key_not_set'));
            return;
        }
        
        if (!conceptGenerationModel) {
            setAvatarError(t('error_no_model_selected'));
            return;
        }
        
        setIsGeneratingImagePrompt(true);
        setAvatarError(null);
        try {
            const { imagePrompt } = await generateImagePrompt(characterData, conceptGenerationModel, apiSettings);
            setImagePrompt(imagePrompt);
        } catch (err) {
            setAvatarError(err instanceof Error ? err.message : t('error_generating_image_prompt'));
        } finally {
            setIsGeneratingImagePrompt(false);
        }
    }, [characterData, conceptGenerationModel, apiSettings, t]);

    const handleGenerateAvatar = useCallback(async () => {
        if (!imagePrompt) return;
        
        if (!apiSettings.apiKey) {
            setAvatarError(t('error_api_key_not_set'));
            return;
        }
        
        setIsGeneratingAvatar(true);
        setAvatarError(null);
        try {
            const { imageBytes } = await generateAvatar(imagePrompt);
            setAvatarImage(imageBytes);
        } catch (err) {
            setAvatarError(err instanceof Error ? err.message : t('error_generating_avatar'));
        } finally {
            setIsGeneratingAvatar(false);
        }
    }, [imagePrompt, t]);

    const handleExport = useCallback(() => {
        if (characterData) {
            exportCharacterCard({
                characterData,
                appVersion,
                generationModel,
                selectedTags
            });
        }
    }, [characterData, appVersion, generationModel, selectedTags]);
    
    const handleDownloadAvatar = useCallback(() => {
        if (!avatarImage || !characterData) return;

        const link = document.createElement('a');
        link.href = `data:image/jpeg;base64,${avatarImage}`;
        const safeName = (characterData.name || 'character').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `${safeName}_avatar.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [avatarImage, characterData]);

    const permanentContextTokens = useTokenCounter(
        [characterData?.description, characterData?.personality, characterData?.scenario, characterData?.mes_example].join(' ')
    );

    const totalTokens = useTokenCounter(
        Object.values(characterData || {}).filter(v => typeof v === 'string').join(' ') + 
        (characterData?.alternate_greetings || []).join(' ')
    );

    const currentRefiningContent = useMemo(() => {
        if (!fieldToRefine || !characterData) return '';
        if (fieldToRefine.field === 'alternate_greetings' && typeof fieldToRefine.index === 'number') {
            return characterData.alternate_greetings[fieldToRefine.index];
        }
        return characterData[fieldToRefine.field] as string;
    }, [fieldToRefine, characterData]);

    if (isLoading && !characterData) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Spinner className="h-16 w-16 mb-4" />
                <p className="text-xl text-gray-300">{t('loading_full_card')}</p>
            </div>
        );
    }

    if (error) {
        return (
             <div className="text-center text-red-400 bg-red-900/50 p-6 rounded-lg max-w-2xl mx-auto">
                <h2 className="text-xl font-bold mb-2">{t('error_prefix')}:</h2>
                <p className="mb-4">{error}</p>
                <div className="flex justify-center items-center gap-4 mt-6">
                    <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                        <ArrowLeftIcon className="h-5 w-5" />
                        {t('back_to_search_button')}
                    </button>
                    <button onClick={onRegenerate} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-wait text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                        {isLoading ? <Spinner className="h-5 w-5" /> : <RefineIcon className="h-5 w-5" />}
                        {t('retry_button', 'Try Again')}
                    </button>
                </div>
            </div>
        );
    }
    
    if (!characterData) {
        return <div className="text-center p-4">{t('no_character_data')}</div>;
    }

    const fieldLabels: Record<keyof FullCharacter | 'alternate_greetings', string> = {
        name: t('card_field_name'),
        description: t('card_field_description'),
        personality: t('card_field_personality'),
        first_mes: t('card_field_first_mes'),
        mes_example: t('card_field_mes_example'),
        scenario: t('card_field_scenario'),
        alternate_greetings: t('card_field_alternate_greetings'),
    };

    return (
        <>
            {/* Header Bar */}
            <div className="flex flex-wrap gap-4 items-center justify-between mb-6 pb-4 border-b border-gray-700">
                <div className="flex-1 min-w-0">
                    <EditableCharacterName 
                        name={characterData.name}
                        onNameChange={(newName) => handleFieldChange('name', newName)}
                    />
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                    <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm">
                        <ArrowLeftIcon className="h-5 w-5" />
                        {t('back_to_search_button')}
                    </button>
                    <button onClick={onRegenerate} disabled={isLoading} className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-wait text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm">
                       {isLoading ? <Spinner className="h-5 w-5" /> : <RefineIcon className="h-5 w-5" />}
                        {t('regenerate_button')}
                    </button>
                     <button onClick={handleExport} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm">
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        {t('export_json_button')}
                    </button>
                    <button onClick={onShowPrompt} className="p-2.5 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white transition-colors" title="Show Generation Prompt (Debug)">
                        <CodeBracketIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Avatar & Vitals */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Avatar Card */}
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                        <div className="relative aspect-square bg-gray-900/50 rounded-md mb-4 flex items-center justify-center overflow-hidden">
                             {isGeneratingAvatar ? (
                                <Spinner className="h-12 w-12" />
                            ) : avatarImage ? (
                                <>
                                    <img src={`data:image/jpeg;base64,${avatarImage}`} alt={characterData.name} className="w-full h-full object-cover" />
                                    <button
                                        onClick={handleDownloadAvatar}
                                        className="absolute bottom-2 right-2 bg-indigo-600/80 hover:bg-indigo-700/90 text-white p-2 rounded-full transition-colors backdrop-blur-sm shadow-lg"
                                        aria-label={t('download_avatar_aria_label', 'Download Avatar')}
                                        title={t('download_avatar_aria_label', 'Download Avatar')}
                                    >
                                        <ArrowDownTrayIcon className="h-5 w-5" />
                                    </button>
                                </>
                            ) : (
                                <ImageIcon className="h-24 w-24 text-gray-600" />
                            )}
                        </div>
                         {avatarError && <p className="text-red-400 text-sm mb-2 text-center">{avatarError}</p>}
                        
                        <EditableField 
                            id="image-prompt"
                            label={t('card_field_image_prompt')}
                            value={imagePrompt}
                            onChange={value => setImagePrompt(value)}
                            rows={4}
                            placeholder={t('image_prompt_placeholder')}
                        />
                        <div className="grid grid-cols-2 gap-3 mt-3">
                             <button
                                onClick={handleGenerateImagePrompt}
                                disabled={isGeneratingImagePrompt || isGeneratingAvatar}
                                className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-wait text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"
                            >
                                {isGeneratingImagePrompt ? <Spinner className="w-5 h-5"/> : <SparklesIcon className="w-5 h-5"/>}
                                {t('generate_image_prompt_button_title')}
                            </button>
                            <button
                                onClick={handleGenerateAvatar}
                                disabled={true}
                                title={t('error_feature_disabled')}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm opacity-50"
                            >
                                {isGeneratingAvatar ? <Spinner className="w-5 h-5"/> : <ImageIcon className="w-5 h-5"/>}
                                {t('generate_avatar_button_title')}
                            </button>
                        </div>
                    </div>
                    {/* Token Info Card */}
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50 sticky top-24">
                        <h3 className="text-lg font-semibold text-white mb-4">Token Info</h3>
                        <div 
                            className="group relative flex justify-between items-center text-sm mb-2"
                            title={t('permanent_tokens_tooltip')}
                        >
                            <span className="text-gray-400 border-b border-dotted border-gray-500 cursor-help">{t('permanent_tokens')}</span>
                            <span className="font-semibold text-white">{permanentContextTokens.toLocaleString()} {t('tokens_label')}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">{t('total_tokens')}</span>
                            <span className="font-bold text-indigo-300">{totalTokens.toLocaleString()} {t('tokens_label')}</span>
                        </div>
                    </div>
                </div>
                
                {/* Right Column: Character Details */}
                <div className="lg:col-span-2 space-y-6">
                     <EditableField
                        id="description"
                        label={fieldLabels.description}
                        value={characterData.description}
                        onChange={value => handleFieldChange('description', value)}
                        onRefineRequest={() => handleOpenRefineModal('description')}
                        tokenCount={countTokens(characterData.description)}
                        rows={10}
                    />
                    <EditableField
                        id="personality"
                        label={fieldLabels.personality}
                        value={characterData.personality}
                        onChange={value => handleFieldChange('personality', value)}
                        onRefineRequest={() => handleOpenRefineModal('personality')}
                        tokenCount={countTokens(characterData.personality)}
                        rows={6}
                    />
                     <EditableField
                        id="scenario"
                        label={fieldLabels.scenario}
                        value={characterData.scenario}
                        onChange={value => handleFieldChange('scenario', value)}
                        onRefineRequest={() => handleOpenRefineModal('scenario')}
                        tokenCount={countTokens(characterData.scenario)}
                        rows={3}
                    />
                    <EditableField
                        id="first_mes"
                        label={fieldLabels.first_mes}
                        value={characterData.first_mes}
                        onChange={value => handleFieldChange('first_mes', value)}
                        onRefineRequest={() => handleOpenRefineModal('first_mes')}
                        tokenCount={countTokens(characterData.first_mes)}
                        rows={8}
                    />
                    <EditableField
                        id="mes_example"
                        label={fieldLabels.mes_example}
                        value={characterData.mes_example}
                        onChange={value => handleFieldChange('mes_example', value)}
                        onRefineRequest={() => handleOpenRefineModal('mes_example')}
                        tokenCount={countTokens(characterData.mes_example)}
                        rows={12}
                    />

                    {/* Alternate Greetings Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-3">{fieldLabels.alternate_greetings}</h3>
                        <div className="space-y-4">
                            {characterData.alternate_greetings.map((greeting, index) => (
                                <EditableGreeting
                                    key={index}
                                    index={index}
                                    greeting={greeting}
                                    onChange={handleGreetingChange}
                                    onDelete={handleDeleteGreeting}
                                    onRefineRequest={() => handleOpenRefineModal('alternate_greetings', index)}
                                />
                            ))}
                        </div>
                        <button onClick={handleAddGreeting} className="mt-4 flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors">
                            <PlusCircleIcon className="h-6 w-6" />
                            <span>{t('add_greeting_button')}</span>
                        </button>
                    </div>
                </div>
            </div>

            <RefineFieldModal
                isOpen={!!fieldToRefine}
                onClose={handleCloseRefineModal}
                onRefine={handleRefineSubmit}
                fieldName={fieldToRefine ? `${fieldLabels[fieldToRefine.field]}${typeof fieldToRefine.index === 'number' ? ` #${fieldToRefine.index + 1}` : ''}` : ''}
                currentContent={currentRefiningContent}
                isLoading={isRefining}
                error={refineError}
            />
        </>
    );
};
