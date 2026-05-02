
import React, { useState } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { useTokenCounter } from '../hooks/useTokenCounter';
import { RefineIcon } from './RefineIcon';

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);


interface EditableGreetingProps {
    greeting: string;
    index: number;
    onChange: (index: number, value: string) => void;
    onDelete: (index: number) => void;
    onRefineRequest: (index: number, content: string) => void;
}

export const EditableGreeting: React.FC<EditableGreetingProps> = ({ greeting, index, onChange, onDelete, onRefineRequest }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useLocalization();
    const tokenCount = useTokenCounter(greeting);
    const greetingLabel = `${t('alternate_greeting_header')} ${index + 1}`;

    return (
        <div className="bg-gray-800/70 rounded-md">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 text-left font-medium text-gray-200 hover:bg-gray-700/50 transition-colors rounded-t-md"
                aria-expanded={isOpen}
            >
                <span>{greetingLabel}</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
                <div className="bg-gray-900/50 p-4 space-y-3 rounded-b-md">
                    <div className="relative">
                        <textarea
                            value={greeting}
                            onChange={(e) => onChange(index, e.target.value)}
                            className="w-full bg-gray-900/70 border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 transition-colors custom-scrollbar"
                            rows={8}
                            aria-label={greetingLabel}
                        />
                         <div className="absolute bottom-2 right-3 text-xs text-gray-500">
                            ~{tokenCount.toLocaleString()} {t('tokens_label')}
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-4">
                         <button
                            onClick={() => onRefineRequest(index, greeting)}
                            className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                            title={`${t('refine_button')} ${greetingLabel}`}
                        >
                            <RefineIcon className="h-4 w-4" />
                            <span>{t('refine_button')}</span>
                        </button>
                        <button
                            onClick={() => onDelete(index)}
                            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-400 transition-colors"
                            aria-label={`${t('delete_greeting_aria_label')} ${index + 1}`}
                        >
                            <TrashIcon className="h-4 w-4" />
                            <span>{t('delete_button')}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
