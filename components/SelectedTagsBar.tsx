
import React from 'react';
import { Tag } from './Tag';
import { useLocalization } from '../hooks/useLocalization';
import type { SelectedTag } from '../types';

interface SelectedTagsBarProps {
    selectedTags: SelectedTag[];
    onTagRemove: (tag: SelectedTag) => void;
    onClearAll: () => void;
}

export const SelectedTagsBar: React.FC<SelectedTagsBarProps> = ({ selectedTags, onTagRemove, onClearAll }) => {
    const { t } = useLocalization();

    if (selectedTags.length === 0) {
        return null;
    }

    return (
        <div className="bg-gray-800 p-3 rounded-lg shadow-md flex items-center flex-wrap gap-3">
            <span className="font-semibold text-gray-300 mr-2">{t('selected_tags_title')}:</span>
            <div className="flex flex-wrap gap-2">
                {selectedTags.map(selectedTag => {
                    const categoryName = t(`category_${selectedTag.categoryId.replace('-', '_')}`);
                    const label = `${categoryName}: ${selectedTag.tag}`;
                    return (
                        <Tag 
                            key={`${selectedTag.categoryId}-${selectedTag.tag}`} 
                            label={label} 
                            onRemove={() => onTagRemove(selectedTag)} 
                        />
                    );
                })}
            </div>
            <button
                onClick={onClearAll}
                className="ml-auto text-sm text-indigo-400 hover:text-indigo-300 hover:underline whitespace-nowrap pl-4"
                aria-label={t('clear_all_tags_aria_label')}
            >
                {t('clear_all_button')}
            </button>
        </div>
    );
};
