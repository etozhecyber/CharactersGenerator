
import React, { useState } from 'react';
import { Tooltip } from './Tooltip';

interface AccordionProps {
    title: string;
    children: React.ReactNode;
    description?: string;
}

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);


export const Accordion: React.FC<AccordionProps> = ({ title, children, description }) => {
    const [isOpen, setIsOpen] = useState(false);

    const button = (
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex justify-between items-center p-3 text-left font-medium text-gray-200 hover:bg-gray-700/50 transition-colors rounded-t-md"
            aria-expanded={isOpen}
        >
            <span>{title}</span>
            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
    );

    return (
        <div className="bg-gray-800/70 rounded-md">
            {description ? (
                <Tooltip content={description}>
                    {button}
                </Tooltip>
            ) : (
                button
            )}
            
            {isOpen && (
                <div>
                    {children}
                </div>
            )}
        </div>
    );
};