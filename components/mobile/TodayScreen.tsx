import React, { useState, useEffect } from 'react';
import { useMobileAuth } from '../../contexts/MobileAuthContext';
import { useMobileData } from '../../contexts/MobileDataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Clock, MapPin, Briefcase, Coffee, LogIn, LogOut, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import LanguageSwitcher from '../LanguageSwitcher';
import ThemeToggle from '../ThemeToggle';

const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

const TodayScreen: React.FC = () => {
    const { employee } = useMobileAuth();
    const { shifts, isLoading, updateShift, locations, departments } = useMobileData();
    const { t } = useLanguage();
    const [now, setNow] = useState(new Date());

     useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return <div className="p-4"><LoadingSpinner /></div>;
    }

    const today = new Date();
    const todaysShift = shifts.find(shift => isSameDay(new Date(shift.startTime), today));

    const locationName = locations.find(l => l.id === todaysShift?.locationId)?.name;
    const departmentName = departments.find(d => d.id === todaysShift?.departmentId)?.name;

    const formatTime = (date: Date) => new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const handleClockIn = () => {
        if (todaysShift) {
            const updatedShift = { ...todaysShift, actualStartTime: new Date() };
            updateShift(updatedShift);
        }
    };

    const handleClockOut = () => {
        if (todaysShift) {
            const updatedShift = { ...todaysShift, actualEndTime: new Date() };
            updateShift(updatedShift);
        }
    };
    
    const renderTimeClock = () => {
        if (!todaysShift) {
            return null;
        }

        const scheduledStartTime = new Date(todaysShift.startTime);
        const { actualStartTime, actualEndTime } = todaysShift;

        const clockInGracePeriod = 10 * 60 * 1000;
        const clockInTimeStart = new Date(scheduledStartTime.getTime() - clockInGracePeriod);
        
        const canClockIn = now.getTime() >= clockInTimeStart.getTime();
        
        if (actualStartTime && actualEndTime) {
            return (
                <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <CheckCircle className="mx-auto text-green-500 mb-2" size={24}/>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('mobile.clockedOut')}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('mobile.clockInTime')}: {formatTime(new Date(actualStartTime))} | {t('mobile.clockOutTime')}: {formatTime(new Date(actualEndTime))}
                    </p>
                </div>
            );
        }

        if (actualStartTime) {
            return (
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                     <p className="text-sm text-slate-600 dark:text-slate-300">{t('mobile.clockedInAt', { time: formatTime(new Date(actualStartTime)) })}</p>
                    <button onClick={handleClockOut} className="mt-2 w-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-transform hover:scale-105">
                        <LogOut size={18} className="mr-2"/>
                        {t('mobile.clockOut')}
                    </button>
                </div>
            )
        }
        
        return (
            <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                 {!canClockIn && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        {t('mobile.canClockInAt', { time: formatTime(clockInTimeStart)})}
                    </p>
                )}
                <button onClick={handleClockIn} disabled={!canClockIn} className="w-full flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-transform hover:scale-105">
                    <LogIn size={18} className="mr-2"/>
                    {t('mobile.clockIn')}
                </button>
            </div>
        )
    };

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
            
            {todaysShift && (
                <div className="mb-6 bg-white dark:bg-blue-night-900 p-5 rounded-xl shadow-md">
                    <h2 className="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-200">{t('mobile.timeClockTitle')}</h2>
                    {renderTimeClock()}
                </div>
            )}

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
                        {locationName && (
                            <div className="flex items-center">
                                <MapPin size={20} className="text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('mobile.location')}</p>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{locationName || t('mobile.notAssigned')}</p>
                                </div>
                            </div>
                        )}
                         {departmentName && (
                            <div className="flex items-center">
                                <Briefcase size={20} className="text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('mobile.department')}</p>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{departmentName || t('mobile.notAssigned')}</p>
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