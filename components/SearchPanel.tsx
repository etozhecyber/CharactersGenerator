
import React, { useState, useEffect, useMemo } from 'react';
import { Accordion } from './Accordion';
import type { TagCategory, SelectedTag } from '../types';
import { CATEGORY_DEFINITIONS } from '../constants';
import { useLocalization } from '../hooks/useLocalization';

interface SearchPanelProps {
    selectedTags: SelectedTag[];
    onSelectedTagsChange: (tags: SelectedTag[]) => void;
    onGenerate: () => void;
    isLoading: boolean;
}

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

export const SearchPanel: React.FC<SearchPanelProps> = ({ selectedTags, onSelectedTagsChange, onGenerate, isLoading }) => {
    const { t } = useLocalization();
    const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);
    const [isOpen, setIsOpen] = useState(false); // Collapsed by default on mobile

    useEffect(() => {
        const checkScreenSize = () => {
            if (window.innerWidth >= 1024) {
                setIsOpen(true);
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const categories = await Promise.all(
                    CATEGORY_DEFINITIONS.map(async (categoryDef) => {
                        const response = await fetch(`${import.meta.env.BASE_URL}data/tags/${categoryDef.id.replace('-', '_')}.json`);
                        if (!response.ok) {
                            console.error(`Failed to fetch tags for ${categoryDef.id}`);
                            return { id: categoryDef.id, tags: [], description: categoryDef.description };
                        }
                        const tags = await response.json();
                        return { id: categoryDef.id, tags, description: categoryDef.description };
                    })
                );
                setTagCategories(categories.filter(c => c.tags.length > 0));
            } catch (error) {
                console.error("Failed to load tag categories:", error);
            }
        };
        fetchTags();
    }, []);

    const handleTagToggle = (categoryId: string, tag: string) => {
        const newTagObject = { categoryId, tag };
        const isSelected = selectedTags.some(t => t.categoryId === categoryId && t.tag === tag);

        const newSelectedTags = isSelected
            ? selectedTags.filter(t => !(t.categoryId === categoryId && t.tag === tag))
            : [...selectedTags, newTagObject];
        onSelectedTagsChange(newSelectedTags);
    };
    
    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col lg:h-full">
            {/* Mobile-only clickable header */}
            <div className="flex justify-between items-center lg:hidden cursor-pointer" onClick={() => setIsOpen(prev => !prev)}>
                <h2 className="text-lg font-semibold">{t('tag_categories_title')}</h2>
                <button
                    aria-label="Toggle tag categories"
                    aria-expanded={isOpen}
                    className="p-1"
                >
                    <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>
            
            {/* Collapsible Body */}
            <div className={`flex-col flex-grow min-h-0 ${isOpen ? 'flex' : 'hidden'} lg:flex`}>
                <div className={`flex-grow overflow-y-auto min-h-0 custom-scrollbar pr-2 ${isOpen ? 'mt-4' : ''} lg:mt-0`}>
                    {/* Desktop-only title, now STICKY inside the scrollable container */}
                     <h2 className="text-lg font-semibold mb-2 hidden lg:block sticky top-0 bg-gray-800 z-10 py-2">
                        {t('tag_categories_title')}
                    </h2>
                    
                    <div className="space-y-2">
                        {tagCategories.map(category => (
                            <Accordion 
                                key={category.id} 
                                title={t(`category_${category.id.replace('-', '_')}`)}
                                description={category.description}
                            >
                                <TagSelector 
                                    categoryId={category.id}
                                    tags={category.tags}
                                    selectedTags={selectedTags}
                                    onTagToggle={handleTagToggle}
                                />
                            </Accordion>
                        ))}
                    </div>
                </div>
                
                <div className="mt-4 flex-shrink-0">
                    <button
                        onClick={onGenerate}
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center text-lg shadow-lg"
                    >
                        {isLoading ? t('generating_button_loading') : t('generate_button')}
                    </button>
                </div>
            </div>
        </div>
    );
};


interface TagSelectorProps {
    categoryId: string;
    tags: string[];
    selectedTags: SelectedTag[];
    onTagToggle: (categoryId: string, tag: string) => void;
}

const TagSelector: React.FC<TagSelectorProps> = ({ categoryId, tags, selectedTags, onTagToggle }) => {
    const { t } = useLocalization();
    const [filter, setFilter] = useState('');

    const lowerCaseFilter = filter.trim().toLowerCase();

    const filteredTags = useMemo(() =>
        tags.filter(tag => tag.toLowerCase().includes(lowerCaseFilter)),
        [tags, lowerCaseFilter]
    );
    
    // Show the "Add custom tag" button if the user has typed something that yields no results from the predefined list.
    const showAddCustomTag = lowerCaseFilter && filteredTags.length === 0;

    const handleAddCustomTag = () => {
        const trimmedTag = filter.trim();
        // Prevent adding empty or duplicate tags within the same category
        if (!trimmedTag || selectedTags.some(t => t.categoryId === categoryId && t.tag.toLowerCase() === trimmedTag.toLowerCase())) {
            return;
        }
        onTagToggle(categoryId, trimmedTag);
        setFilter('');
    };


    return (
        <div className="space-y-3 bg-gray-900/50 p-3 rounded-b-md">
            <input
                type="text"
                placeholder={t('filter_tags_placeholder')}
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-sm text-gray-200 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredTags.map(tag => (
                    <label key={tag} className="flex items-center space-x-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={selectedTags.some(t => t.categoryId === categoryId && t.tag === tag)}
                            onChange={() => onTagToggle(categoryId, tag)}
                            className="h-4 w-4 rounded bg-gray-700 border-gray-500 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 focus:ring-2"
                        />
                        <span className="text-gray-300 group-hover:text-white transition-colors">{tag}</span>
                    </label>
                ))}
                {showAddCustomTag && (
                    <button
                        onClick={handleAddCustomTag}
                        className="w-full flex items-center space-x-3 cursor-pointer group p-2 rounded-md hover:bg-indigo-900/70 text-left transition-colors"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-indigo-400 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span className="text-indigo-300 group-hover:text-white transition-colors text-sm">
                            {t('add_custom_tag', 'Add custom tag:')} <span className="font-semibold italic">"{filter.trim()}"</span>
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
};