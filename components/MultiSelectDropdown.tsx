import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Option {
    id: string;
    name: string;
}

interface MultiSelectDropdownProps {
    label: string;
    options: Option[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    placeholder: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ label, options, selectedIds, onSelectionChange, placeholder }) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleToggleOption = (id: string) => {
        const newSelectedIds = selectedIds.includes(id)
            ? selectedIds.filter(selectedId => selectedId !== id)
            : [...selectedIds, id];
        onSelectionChange(newSelectedIds);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectionChange([]);
    };

    const selectedCount = selectedIds.length;
    let buttonText = placeholder;
    if (selectedCount > 0) {
        if (selectedCount === 1) {
            const selectedOption = options.find(opt => opt.id === selectedIds[0]);
            buttonText = selectedOption ? selectedOption.name : `1 ${t('calendarFilter.selected')}`;
        } else {
            buttonText = `${selectedCount} ${t('calendarFilter.selectedPlural')}`;
        }
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-2 border rounded-md bg-gray-50 dark:bg-blue-night-800 dark:border-blue-night-700 text-left min-h-[42px]"
            >
                <span className="truncate">{buttonText}</span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-blue-night-800 border dark:border-blue-night-700 rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 border-b dark:border-blue-night-700">
                        <button
                            onClick={handleClear}
                            disabled={selectedCount === 0}
                            className="w-full text-left text-sm p-1 rounded-sm text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 disabled:hover:bg-transparent"
                        >
                            {t('calendarFilter.clearSelection')}
                        </button>
                    </div>
                    {options.map(option => (
                        <label
                            key={option.id}
                            className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-blue-night-700"
                        >
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(option.id)}
                                onChange={() => handleToggleOption(option.id)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span>{option.name}</span>
                        </label>
                    ))}
                    {options.length === 0 && (
                        <div className="px-3 py-2 text-gray-500">{t('calendarFilter.noOptions')}</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MultiSelectDropdown;
