import React from 'react';
import { useMobileAuth } from '../../contexts/MobileAuthContext';
import { useMobileData } from '../../contexts/MobileDataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Clock, MapPin, Briefcase, Coffee } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import LanguageSwitcher from '../LanguageSwitcher';
import ThemeToggle from '../ThemeToggle';

const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

const TodayScreen: React.FC = () => {
    const { employee } = useMobileAuth();
    const { shifts, isLoading } = useMobileData();
    const { t } = useLanguage();

    if (isLoading) {
        return <div className="p-4"><LoadingSpinner /></div>;
    }

    const today = new Date();
    const todaysShift = shifts.find(shift => isSameDay(new Date(shift.startTime), today));

    const formatTime = (date: Date) => new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });

    return (
        <div className="p-4 md:p-6">
            <header className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('mobile.greeting', { name: employee?.name.split(' ')[0] })}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                    <LanguageSwitcher />
                    <ThemeToggle />
                </div>
            </header>

            <div className="bg-white dark:bg-blue-night-900 p-5 rounded-xl shadow-md">
                <h2 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200">{t('mobile.todaysShift')}</h2>
                {todaysShift ? (
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <Clock size={20} className="text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t('mobile.time')}</p>
                                <p className="font-mono font-semibold text-slate-800 dark:text-slate-100">{formatTime(todaysShift.startTime)} - {formatTime(todaysShift.endTime)}</p>
                            </div>
                        </div>
                        {todaysShift.locationId && (
                            <div className="flex items-center">
                                <MapPin size={20} className="text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('mobile.location')}</p>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{todaysShift.locationId || t('mobile.notAssigned')}</p>
                                </div>
                            </div>
                        )}
                         {todaysShift.departmentId && (
                            <div className="flex items-center">
                                <Briefcase size={20} className="text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('mobile.department')}</p>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{todaysShift.departmentId || t('mobile.notAssigned')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <Coffee size={32} className="mx-auto text-slate-400 dark:text-slate-500" />
                        <p className="mt-2 font-semibold text-slate-600 dark:text-slate-300">{t('mobile.noShiftToday')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TodayScreen;