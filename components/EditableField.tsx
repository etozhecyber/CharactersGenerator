import React from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { RefineIcon } from './RefineIcon';

interface EditableFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    tokenCount?: number;
    rows: number;
    placeholder?: string;
    onRefineRequest?: () => void;
}

export const EditableField: React.FC<EditableFieldProps> = ({
    id,
    label,
    value,
    onChange,
    tokenCount,
    rows,
    placeholder,
    onRefineRequest,
}) => {
    const { t } = useLocalization();

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <label htmlFor={id} className="text-lg font-semibold text-white">
                    {label}
                </label>
                {onRefineRequest && (
                     <button
                        onClick={onRefineRequest}
                        className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                        title={`${t('refine_button')} ${label}`}
                    >
                        <RefineIcon className="h-4 w-4" />
                        <span>{t('refine_button')}</span>
                    </button>
                )}
            </div>
            <div className="relative">
                <textarea
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={rows}
                    placeholder={placeholder}
                    className="w-full bg-gray-900/70 border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 transition-colors custom-scrollbar"
                />
                 {typeof tokenCount === 'number' && (
                    <div className="absolute bottom-2 right-3 text-xs text-gray-500">
                        ~{tokenCount.toLocaleString()} {t('tokens_label')}
                    </div>
                 )}
            </div>
        </div>
    );
};