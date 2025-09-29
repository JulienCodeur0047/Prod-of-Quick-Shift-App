
import React from 'react';
import { HelpCircle, LayoutDashboard, Calendar, Users, Settings as SettingsIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const UserGuide: React.FC = () => {
    const { t } = useLanguage();

    const sections = [
        {
            icon: <LayoutDashboard className="w-6 h-6 mr-3 text-blue-600 dark:text-blue-400" />,
            titleKey: 'userGuide.dashboard.title',
            contentKey: 'userGuide.dashboard.content',
        },
        {
            icon: <Calendar className="w-6 h-6 mr-3 text-green-600 dark:text-green-400" />,
            titleKey: 'userGuide.schedule.title',
            contentKey: 'userGuide.schedule.content',
        },
        {
            icon: <Users className="w-6 h-6 mr-3 text-yellow-600 dark:text-yellow-400" />,
            titleKey: 'userGuide.employees.title',
            contentKey: 'userGuide.employees.content',
        },
        {
            icon: <SettingsIcon className="w-6 h-6 mr-3 text-red-600 dark:text-red-400" />,
            titleKey: 'userGuide.settings.title',
            contentKey: 'userGuide.settings.content',
        }
    ];

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-md animate-slide-in-up">
            <div className="flex items-center mb-6 pb-4 border-b dark:border-slate-800">
                <HelpCircle className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('userGuide.title')}</h1>
            </div>
            
            <div className="space-y-8">
                <p className="text-lg text-slate-600 dark:text-slate-400">
                    {t('userGuide.intro')}
                </p>

                {sections.map((section, index) => (
                    <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex items-center">
                            {section.icon}
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t(section.titleKey)}</h2>
                        </div>
                        <p className="mt-2 text-slate-600 dark:text-slate-300">
                            {t(section.contentKey)}
                        </p>
                    </div>
                ))}

                <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    <p>{t('userGuide.outro')}</p>
                </div>
            </div>
        </div>
    );
};

export default UserGuide;
