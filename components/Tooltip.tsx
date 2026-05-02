
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface TooltipProps {
    children: React.ReactElement<any>;
    content: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [style, setStyle] = useState<React.CSSProperties>({});
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const tooltipRoot = typeof document !== 'undefined' ? document.getElementById('tooltip-root') : null;

    const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
        if (!e.currentTarget || !content) return;
        setTriggerRect(e.currentTarget.getBoundingClientRect());
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
        setTriggerRect(null);
    };
    
    useEffect(() => {
        if (isVisible && tooltipRef.current && triggerRect) {
            const tooltipEl = tooltipRef.current;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const tooltipHeight = tooltipEl.offsetHeight;
            const tooltipWidth = tooltipEl.offsetWidth;
            const gap = 12; // Gap between the trigger and the tooltip

            // Default position: Above and centered
            let top = triggerRect.top - tooltipHeight - gap;
            
            // If not enough space above, position below
            if (top < gap) {
                top = triggerRect.bottom + gap;
            }

            // If it still goes off the bottom, clamp it to the viewport edge
            if (top + tooltipHeight > viewportHeight - gap) {
                 top = viewportHeight - tooltipHeight - gap;
            }

            // Horizontal positioning (centered on trigger)
            let left = triggerRect.left + (triggerRect.width / 2) - (tooltipWidth / 2);

            // Clamp to horizontal viewport boundaries
            if (left < gap) {
                left = gap;
            }
            if (left + tooltipWidth > viewportWidth - gap) {
                left = viewportWidth - tooltipWidth - gap;
            }

            setStyle({
                position: 'fixed',
                top: `${top}px`,
                left: `${left}px`,
            });
        }
    }, [isVisible, triggerRect]);

    const triggerElement = React.cloneElement(children, {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        'aria-describedby': 'portal-tooltip',
    });

    // The portal is always rendered to ensure the ref is available for measurement.
    // Visibility is controlled via CSS opacity for smooth transitions.
    return (
        <>
            {triggerElement}
            {tooltipRoot && ReactDOM.createPortal(
                <div
                    ref={tooltipRef}
                    id="portal-tooltip"
                    style={style}
                    className={`p-3 bg-gray-900 text-gray-200 text-sm rounded-lg shadow-xl z-[9999] pointer-events-none border border-gray-700 w-96 max-w-[calc(100vw-2rem)] transition-opacity duration-150 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                    role="tooltip"
                >
                    {content}
                </div>,
                tooltipRoot
            )}
        </>
    );
};
