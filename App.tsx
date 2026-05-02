
import React, { useState, useEffect, useCallback } from 'react';
import { SearchPanel } from './components/SearchPanel';
import { CharacterGallery } from './components/CharacterGallery';
import { CharacterCardView } from './components/CharacterCardView';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { PromptDebugModal } from './components/PromptDebugModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { LocalizationProvider, useLocalization } from './hooks/useLocalization';
import { generateConcepts, generateFullCard } from './services/aiService';
import type { CharacterConcept, FullCharacter, Language, GalleryViewMode, GenerationModel, SelectedTag } from './types';
import { SelectedTagsBar } from './components/SelectedTagsBar';
import { APP_VERSION } from './version';

const AppContent: React.FC = () => {
    const { t, language } = useLocalization();
    const [selectedTags, setSelectedTags] = useLocalStorage<SelectedTag[]>('selectedTags', []);
    const [characterConcepts, setCharacterConcepts] = useState<CharacterConcept[]>([]);
    const [currentView, setCurrentView] = useState<'gallery' | 'card'>('gallery');
    const [selectedConcept, setSelectedConcept] = useState<CharacterConcept | null>(null);
    const [fullCharacter, setFullCharacter] = useState<FullCharacter | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Split error state for different views
    const [conceptError, setConceptError] = useState<string | null>(null);
    const [cardError, setCardError] = useState<string | null>(null);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [galleryViewMode, setGalleryViewMode] = useLocalStorage<GalleryViewMode>('galleryViewMode', 'grid');
    const [generationModel, setGenerationModel] = useLocalStorage<GenerationModel>('generationModel', '');
    const [conceptGenerationModel, setConceptGenerationModel] = useLocalStorage<GenerationModel>('conceptGenerationModel', '');
    const [cardGenerationLanguage, setCardGenerationLanguage] = useLocalStorage<Language>('cardGenerationLanguage', 'en');
    const [apiKey, setApiKey] = useLocalStorage<string>('apiKey', '');
    const [apiEndpoint, setApiEndpoint] = useLocalStorage<string>('apiEndpoint', 'https://api.openai.com/v1');

    // State for prompt debugging
    const [lastConceptPrompt, setLastConceptPrompt] = useState<object | null>(null);
    const [lastFullCardPrompt, setLastFullCardPrompt] = useState<object | null>(null);
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [promptToDisplay, setPromptToDisplay] = useState<object | null>(null);

    const fetchConcepts = useCallback(async (tags: SelectedTag[], append: boolean = false) => {
        setIsLoading(true);
        setConceptError(null); // Use concept-specific error state
        
        if (!apiKey) {
            setConceptError(t('error_api_key_not_set'));
            setIsSettingsOpen(true);
            setIsLoading(false);
            return;
        }
        
        if (!conceptGenerationModel) {
            setConceptError(t('error_no_model_selected'));
            setIsSettingsOpen(true);
            setIsLoading(false);
            return;
        }
        
        try {
            // Concepts are always generated with the user-selected concept model.
            // Concept descriptions use the UI language.
            const { concepts: newConcepts, prompt } = await generateConcepts(
                tags, language, conceptGenerationModel, { apiKey, apiEndpoint }
            );
            setLastConceptPrompt(prompt); // Store the prompt for debugging
            
            // Deduplicate new concepts against existing ones
            const existingConceptNames = new Set(characterConcepts.map(c => c.name));
            const uniqueNewConcepts = newConcepts.filter(c => !existingConceptNames.has(c.name));
            
            if (append) {
                setCharacterConcepts(prev => [...prev, ...uniqueNewConcepts]);
            } else {
                setCharacterConcepts(uniqueNewConcepts);
            }
        } catch (err) {
            console.error(err);
            setConceptError(err instanceof Error ? err.message : t('error_generating_concepts')); // Set concept-specific error
        } finally {
            setIsLoading(false);
        }
    }, [t, characterConcepts, language, conceptGenerationModel]);

    useEffect(() => {
        if (!apiKey) {
            setIsSettingsOpen(true);
        } else {
            // Initial load with no tags
            fetchConcepts([], false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleGenerate = () => {
        fetchConcepts(selectedTags, false);
    };

    const handleShowMore = () => {
        fetchConcepts(selectedTags, true);
    };

    const handleCreateFullCard = useCallback(async (concept: CharacterConcept) => {
        setSelectedConcept(concept);
        setCurrentView('card');
        setIsLoading(true);
        setCardError(null); // Use card-specific error state
        setFullCharacter(null);
        
        if (!apiKey) {
            setCardError(t('error_api_key_not_set'));
            setIsSettingsOpen(true);
            setIsLoading(false);
            return;
        }
        
        if (!generationModel) {
            setCardError(t('error_no_model_selected'));
            setIsSettingsOpen(true);
            setIsLoading(false);
            return;
        }
        
        try {
            // Full card generation uses the user-selected model and card language.
            const { character, prompt } = await generateFullCard(
                concept, selectedTags, generationModel, cardGenerationLanguage, { apiKey, apiEndpoint }
            );
            setFullCharacter(character);
            setLastFullCardPrompt(prompt); // Store the prompt for debugging
        } catch (err) {
            console.error(err);
            setCardError(err instanceof Error ? err.message : t('error_generating_card')); // Set card-specific error
        } finally {
            setIsLoading(false);
        }
    }, [selectedTags, generationModel, cardGenerationLanguage, t]);

    const handleRegenerateFullCard = useCallback(() => {
        if (selectedConcept) {
            handleCreateFullCard(selectedConcept);
        }
    }, [selectedConcept, handleCreateFullCard]);

    const handleBackToSearch = () => {
        setCurrentView('gallery');
        setFullCharacter(null);
        setSelectedConcept(null);
        setCardError(null); // Clear card error when returning to gallery
    };
    
    const handleTagRemove = (tagToRemove: SelectedTag) => {
        setSelectedTags(prev => prev.filter(tag => tag.categoryId !== tagToRemove.categoryId || tag.tag !== tagToRemove.tag));
    };

    const handleClearAllTags = () => {
        setSelectedTags([]);
    };

    const handleShowConceptPrompt = () => {
        setPromptToDisplay(lastConceptPrompt);
        setIsPromptModalOpen(true);
    };

    const handleShowFullCardPrompt = () => {
        setPromptToDisplay(lastFullCardPrompt);
        setIsPromptModalOpen(true);
    };

    return (
        <div className="h-screen bg-gray-900 text-gray-100 font-sans flex flex-col overflow-hidden">
            <Header onSettingsClick={() => setIsSettingsOpen(true)} />
            
            <main className={`p-4 sm:p-6 lg:p-8 flex-grow ${currentView === 'gallery' ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}>
                {currentView === 'gallery' ? (
                    <div className="flex flex-col lg:flex-row gap-8 h-full">
                        <div className="lg:w-1/4 xl:w-1/5">
                            <SearchPanel 
                                selectedTags={selectedTags}
                                onSelectedTagsChange={setSelectedTags}
                                onGenerate={handleGenerate}
                                isLoading={isLoading}
                            />
                        </div>
                        <div className="lg:w-3/4 xl:w-4/5 flex flex-col gap-6 flex-grow min-h-0">
                           <SelectedTagsBar
                               selectedTags={selectedTags}
                               onTagRemove={handleTagRemove}
                               onClearAll={handleClearAllTags}
                           />
                           <CharacterGallery
                                concepts={characterConcepts}
                                isLoading={isLoading}
                                error={conceptError}
                                onCreateCard={handleCreateFullCard}
                                onShowMore={handleShowMore}
                                galleryViewMode={galleryViewMode}
                                onGalleryViewModeChange={setGalleryViewMode}
                                onShowPrompt={handleShowConceptPrompt}
                            />
                        </div>
                    </div>
                ) : (
                    <CharacterCardView
                        character={fullCharacter}
                        isLoading={isLoading}
                        error={cardError}
                        onBack={handleBackToSearch}
                        onRegenerate={handleRegenerateFullCard}
                        onShowPrompt={handleShowFullCardPrompt}
                        originalPrompt={lastFullCardPrompt}
                        generationModel={generationModel}
                        selectedTags={selectedTags}
                        appVersion={APP_VERSION}
                        generationLanguage={cardGenerationLanguage}
                        apiSettings={{ apiKey, apiEndpoint }}
                        conceptGenerationModel={conceptGenerationModel}
                    />
                )}
            </main>
            
            <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                apiKey={apiKey}
                onApiKeyChange={setApiKey}
                apiEndpoint={apiEndpoint}
                onApiEndpointChange={setApiEndpoint}
                generationModel={generationModel}
                onGenerationModelChange={setGenerationModel}
                conceptGenerationModel={conceptGenerationModel}
                onConceptGenerationModelChange={setConceptGenerationModel}
                cardGenerationLanguage={cardGenerationLanguage}
                onCardGenerationLanguageChange={setCardGenerationLanguage}
                appVersion={APP_VERSION}
            />

            <PromptDebugModal
                isOpen={isPromptModalOpen}
                onClose={() => setIsPromptModalOpen(false)}
                promptData={promptToDisplay}
            />
        </div>
    );
};


const App: React.FC = () => (
    <LocalizationProvider>
        <AppContent />
    </LocalizationProvider>
);

export default App;
