
import React from 'react';

interface TagProps {
    label: string;
    onRemove: () => void;
}

const XMarkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


export const Tag: React.FC<TagProps> = ({ label, onRemove }) => {
    return (
        <div className="flex items-center bg-indigo-600 text-white text-sm font-medium pl-3 pr-2 py-1 rounded-full">
            <span>{label}</span>
            <button
                onClick={onRemove}
                className="ml-2 flex-shrink-0 bg-indigo-400 hover:bg-indigo-300 p-0.5 rounded-full focus:outline-none"
                aria-label={`Remove ${label} tag`}
            >
                <XMarkIcon className="h-3 w-3 text-indigo-800" />
            </button>
        </div>
    );
};
