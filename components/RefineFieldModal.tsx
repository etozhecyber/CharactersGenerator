

import React, { useState, useRef, useEffect } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { Spinner } from './Spinner';

interface RefineFieldModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRefine: (instruction: string) => void;
    fieldName: string;
    currentContent: string;
    isLoading: boolean;
    error: string | null;
}

const XMarkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


export const RefineFieldModal: React.FC<RefineFieldModalProps> = ({ isOpen, onClose, onRefine, fieldName, currentContent, isLoading, error }) => {
    const { t } = useLocalization();
    const modalRef = useRef<HTMLDivElement>(null);
    const [instruction, setInstruction] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setInstruction('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!instruction.trim() || isLoading) return;
        onRefine(instruction);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                ref={modalRef}
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6 relative flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">{`${t('refine_prompt_title')}: ${fieldName}`}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-500 hover:text-white rounded-full transition-colors"
                        aria-label={t('close_settings')}
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                
                <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">{t('current_content_label')}</label>
                        <div className="bg-gray-900/50 p-3 rounded-md max-h-48 overflow-y-auto custom-scrollbar border border-gray-700">
                             <p className="text-gray-300 text-sm whitespace-pre-wrap">{currentContent}</p>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="refinement-instruction" className="block text-sm font-medium text-gray-300 mb-2">{t('refinement_instruction_label')}</label>
                        <textarea
                            id="refinement-instruction"
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            placeholder={t('refinement_instruction_placeholder')}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 transition-colors custom-scrollbar"
                            rows={4}
                        />
                    </div>
                     {error && (
                        <div className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm">
                            {`${t('error_prefix')}: ${error}`}
                        </div>
                     )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
                     <button 
                        onClick={onClose}
                        className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                        {t('cancel_button', 'Cancel')} 
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isLoading || !instruction.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center min-w-[120px]"
                    >
                        {isLoading ? (
                            <>
                                <Spinner className="h-5 w-5" />
                                <span className="ml-2">{t('refining_button_loading')}</span>
                            </>
                        ) : (
                            t('refine_button')
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};