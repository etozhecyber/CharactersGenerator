import React, { useState, useEffect, useRef } from 'react';

interface PromptDebugModalProps {
    isOpen: boolean;
    onClose: () => void;
    promptData: object | null;
}

const XMarkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v.007a2.25 2.25 0 0 1-.318 1.188A2.25 2.25 0 0 1 13.5 6.75h-3a2.25 2.25 0 0 1-2.25-2.25V5.112c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
    </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
);

export const PromptDebugModal: React.FC<PromptDebugModalProps> = ({ isOpen, onClose, promptData }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsCopied(false);
        }
    }, [isOpen]);

    if (!isOpen || !promptData) return null;

    const handleCopy = () => {
        const jsonString = JSON.stringify(promptData, null, 2);
        navigator.clipboard.writeText(jsonString).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy prompt:', err);
        });
    };
    
    return (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                ref={modalRef}
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl p-6 relative flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">Generation Prompt (Debug)</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-500 hover:text-white rounded-full transition-colors"
                        aria-label="Close modal"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                     <pre className="bg-gray-900 text-sm text-cyan-300 p-4 rounded-md whitespace-pre-wrap break-words">
                        {JSON.stringify(promptData, null, 2)}
                    </pre>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end flex-shrink-0">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        disabled={isCopied}
                    >
                        {isCopied ? <CheckIcon className="h-5 w-5" /> : <ClipboardIcon className="h-5 w-5" />}
                        {isCopied ? 'Copied!' : 'Copy Prompt'}
                    </button>
                </div>
            </div>
        </div>
    );
};