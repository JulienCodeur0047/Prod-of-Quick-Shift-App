import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { CalendarDays } from 'lucide-react';

const Clock: React.FC = () => {
    const { language } = useLanguage();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => {
            clearInterval(timerId);
        };
    }, []);

    const formatDate = () => {
        return currentTime.toLocaleDateString(language, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = () => {
        return currentTime.toLocaleTimeString(language, {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="hidden md:flex items-center space-x-3 text-gray-700 dark:text-gray-300">
            <CalendarDays size={24} className="text-gray-500 dark:text-gray-400" />
            <div>
                <p className="font-semibold text-sm leading-tight">{formatDate()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{formatTime()}</p>
            </div>
        </div>
    );
};

export default Clock;
