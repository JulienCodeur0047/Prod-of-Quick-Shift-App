import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-blue-night-950">
            <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
    );
};

export default LoadingSpinner;
