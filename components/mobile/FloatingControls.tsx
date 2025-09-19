import React from 'react';
import LanguageSwitcher from '../LanguageSwitcher';
import ThemeToggle from '../ThemeToggle';

const FloatingControls: React.FC = () => {
  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end space-y-2">
      <div className="p-1 bg-white/80 dark:bg-blue-night-800/80 backdrop-blur-sm rounded-full shadow-lg transition-transform hover:scale-110">
        <LanguageSwitcher />
      </div>
      <div className="p-0.5 bg-white/80 dark:bg-blue-night-800/80 backdrop-blur-sm rounded-full shadow-lg transition-transform hover:scale-110">
        <ThemeToggle />
      </div>
    </div>
  );
};

export default FloatingControls;