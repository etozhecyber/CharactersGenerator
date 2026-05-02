import React from 'react';
import type { CharacterConcept, GalleryViewMode } from '../types';
import { Spinner } from './Spinner';
import { useLocalization } from '../hooks/useLocalization';
import { CharacterTable } from './CharacterTable';

const GridIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
);

const TableIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
    </svg>
);

const CodeBracketIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 15" />
    </svg>
);

interface CharacterGalleryProps {
    concepts: CharacterConcept[];
    isLoading: boolean;
    error: string | null;
    onCreateCard: (concept: CharacterConcept) => void;
    onShowMore: () => void;
    galleryViewMode: GalleryViewMode;
    onGalleryViewModeChange: (mode: GalleryViewMode) => void;
    onShowPrompt: () => void;
}

const ViewModeSwitcher: React.FC<{
    currentMode: GalleryViewMode;
    onChange: (mode: GalleryViewMode) => void;
}> = ({ currentMode, onChange }) => {
    const { t } = useLocalization();
    const baseClasses = "p-2 rounded-md transition-colors duration-200";
    const activeClasses = "bg-indigo-600 text-white";
    const inactiveClasses = "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white";

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => onChange('grid')}
                className={`${baseClasses} ${currentMode === 'grid' ? activeClasses : inactiveClasses}`}
                aria-label={t('view_mode_grid_label')}
                aria-pressed={currentMode === 'grid'}
            >
                <GridIcon className="h-5 w-5" />
            </button>
            <button
                onClick={() => onChange('table')}
                className={`${baseClasses} ${currentMode === 'table' ? activeClasses : inactiveClasses}`}
                aria-label={t('view_mode_table_label')}
                aria-pressed={currentMode === 'table'}
            >
                <TableIcon className="h-5 w-5" />
            </button>
        </div>
    );
};

const PreviewCard: React.FC<{ concept: CharacterConcept; onCreate: () => void }> = ({ concept, onCreate }) => {
    const { t } = useLocalization();
    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-5 flex flex-col justify-between transform hover:-translate-y-1 transition-transform duration-300">
            <div>
                <h3 className="text-lg font-bold text-white">{concept.name}</h3>
                <p className="text-gray-400 mt-2 text-sm">{concept.description}</p>
            </div>
            <button
                onClick={onCreate}
                className="mt-4 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
            >
                {t('create_button')}
            </button>
        </div>
    );
};

export const CharacterGallery: React.FC<CharacterGalleryProps> = ({ concepts, isLoading, error, onCreateCard, onShowMore, galleryViewMode, onGalleryViewModeChange, onShowPrompt }) => {
    const { t } = useLocalization();

    if (error) {
        return <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">{t('error_prefix')}: {error}</div>;
    }

    const hasContent = concepts.length > 0;

    return (
        <div className="flex flex-col flex-grow min-h-0">
             <div className="flex-shrink-0 flex justify-end items-center gap-4 mb-4">
                {hasContent && <ViewModeSwitcher currentMode={galleryViewMode} onChange={onGalleryViewModeChange} />}
                {hasContent && (
                    <button
                        onClick={onShowPrompt}
                        className="p-2 rounded-full bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
                        title="Show Generation Prompt (Debug)"
                    >
                        <CodeBracketIcon className="h-5 w-5" />
                    </button>
                )}
            </div>

            {isLoading && !hasContent ? (
                 <div className="flex justify-center items-center h-full">
                    <Spinner />
                 </div>
            ) : (
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                    {galleryViewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {concepts.map((concept, index) => (
                                <PreviewCard 
                                    key={`${concept.name}-${index}`} 
                                    concept={concept} 
                                    onCreate={() => onCreateCard(concept)} 
                                />
                            ))}
                        </div>
                    ) : (
                        <CharacterTable concepts={concepts} onCreateCard={onCreateCard} />
                    )}

                    {hasContent && (
                        <div className="mt-8 text-center">
                            <button
                                onClick={onShowMore}
                                disabled={isLoading}
                                className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-colors"
                            >
                                {isLoading ? t('loading_more_button') : t('show_more_button')}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};