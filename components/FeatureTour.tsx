import React, { useState, useLayoutEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export interface TourStep {
  selector: string;
  titleKey: string;
  contentKey: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface FeatureTourProps {
  steps: TourStep[];
  onClose: () => void;
}

const FeatureTour: React.FC<FeatureTourProps> = ({ steps, onClose }) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];

  useLayoutEffect(() => {
    const targetElement = document.querySelector(step.selector);
    let previousElement: Element | null = null;
    if (currentStep > 0) {
      previousElement = document.querySelector(steps[currentStep - 1].selector);
    }

    if (previousElement) {
        previousElement.classList.remove('tour-highlight-active');
    }

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      
      const updatePosition = () => {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
        setHighlightStyle({
            width: `${rect.width + 12}px`,
            height: `${rect.height + 12}px`,
            top: `${rect.top - 6}px`,
            left: `${rect.left - 6}px`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
            transition: 'all 0.3s ease-in-out',
        });
        targetElement.classList.add('tour-highlight-active');
      };
      
      const timer = setTimeout(updatePosition, 300); 
      return () => clearTimeout(timer);

    } else {
        setTargetRect(null);
        setHighlightStyle({ display: 'none' });
    }
    
    return () => {
        if (targetElement) {
            targetElement.classList.remove('tour-highlight-active');
        }
    };

  }, [currentStep, step.selector, steps]);

  const handleClose = () => {
    onClose();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getTooltipPosition = () => {
    if (!tooltipRef.current) return { top: '-9999px', left: '-9999px' };

    const tooltipHeight = tooltipRef.current.offsetHeight;
    const tooltipWidth = tooltipRef.current.offsetWidth;
    const spacing = 16;
    
    if (!targetRect) {
        return {
            top: `calc(50% - ${tooltipHeight / 2}px)`,
            left: `calc(50% - ${tooltipWidth / 2}px)`,
        };
    }

    let top = 0, left = 0;
    
    switch (step.position) {
      case 'top':
        top = targetRect.top - tooltipHeight - spacing;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
        left = targetRect.left - tooltipWidth - spacing;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
        left = targetRect.right + spacing;
        break;
      default: // bottom
        top = targetRect.bottom + spacing;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        break;
    }
    
    if (top < spacing) top = spacing;
    if (left < spacing) left = spacing;
    if (left + tooltipWidth > window.innerWidth) left = window.innerWidth - tooltipWidth - spacing;
    if (top + tooltipHeight > window.innerHeight) top = window.innerHeight - tooltipHeight - spacing;

    return { top: `${top}px`, left: `${left}px` };
  };

  return ReactDOM.createPortal(
    <>
      <div className="fixed inset-0 z-50 animate-fade-in-backdrop" style={targetRect ? { backgroundColor: 'transparent' } : { backgroundColor: 'rgba(0,0,0,0.6)'}}></div>
      <div className="fixed pointer-events-none z-[60] border-2 border-blue-500 rounded-lg" style={highlightStyle}></div>
      <style>{`
        .tour-highlight-active {
          position: relative;
          z-index: 60;
        }
      `}</style>
      <div
        ref={tooltipRef}
        style={getTooltipPosition()}
        className="fixed z-[70] w-80 bg-slate-50 dark:bg-slate-900 rounded-lg shadow-2xl p-4 animate-slide-in-up transition-all duration-300"
      >
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t(step.titleKey)}</h4>
          <button onClick={handleClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
            <X size={18} />
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t(step.contentKey)}</p>
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs font-semibold text-slate-400">{currentStep + 1} / {steps.length}</span>
          <div className="flex space-x-2">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="p-2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-50"
              aria-label="Previous tip"
            >
              <ChevronLeft size={16} />
            </button>
            <button onClick={handleNext} className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold text-sm flex items-center" aria-label="Next tip">
              {currentStep === steps.length - 1 ? t('tour.done') : t('tour.next')} <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default FeatureTour;
