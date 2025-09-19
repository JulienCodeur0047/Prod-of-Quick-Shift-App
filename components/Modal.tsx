

import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'lg' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-center items-center p-4 animate-fade-in-backdrop backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className={`bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh] animate-modal-content-slide-in ${sizeClasses[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-5 md:p-6 overflow-y-auto flex-grow">
          {children}
        </div>
        {footer && (
          <div className="flex justify-end items-center space-x-3 p-5 md:p-6 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;