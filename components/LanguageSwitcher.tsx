import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    const buttonClasses = (lang: 'en' | 'fr') => 
        `px-3 py-1 text-sm font-bold rounded-md transition-colors duration-200 ${
            language === lang 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 dark:bg-blue-night-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-blue-night-700'
        }`;

    return (
        <div className="flex items-center space-x-1">
            <button onClick={() => setLanguage('en')} className={buttonClasses('en')}>
                EN
            </button>
            <button onClick={() => setLanguage('fr')} className={buttonClasses('fr')}>
                FR
            </button>
        </div>
    );
};

export default LanguageSwitcher;
