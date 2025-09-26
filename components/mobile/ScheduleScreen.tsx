import React from 'react';
import { useMobileData } from '../../contexts/MobileDataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Shift, Location, Department } from '../../types';
import LoadingSpinner from '../LoadingSpinner';
import LanguageSwitcher from '../LanguageSwitcher';
import ThemeToggle from '../ThemeToggle';

const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

const ShiftRow: React.FC<{ shift: Shift, locations: Location[], departments: Department[] }> = ({ shift, locations, departments }) => {
    const formatTime = (date: Date) => new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    const location = locations.find(l => l.id === shift.locationId);
    const department = departments.find(d => d.id === shift.departmentId);
    return (
        <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg">
            <p className="font-mono font-semibold text-blue-800 dark:text-blue-200">{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</p>
            {(location || department) && (
                <div className="mt-1 pt-1 border-t border-blue-200 dark:border-blue-800/50 text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                    {location && <p>Loc: {location.name}</p>}
                    {department && <p>Dept: {department.name}</p>}
                </div>
            )}
        </div>
    );
};

const DayCard: React.FC<{ date: Date, shifts: Shift[], t: (key: string) => string, locations: Location[], departments: Department[] }> = ({ date, shifts, t, locations, departments }) => {
    const shiftsForDay = shifts.filter(s => isSameDay(new Date(s.startTime), date));
    
    return (
        <div className="bg-white dark:bg-blue-night-900 p-3 rounded-lg shadow-sm">
            <div className="flex justify-between items-baseline pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                <p className="font-semibold text-slate-800 dark:text-slate-100">{date.toLocaleDateString(undefined, { weekday: 'long' })}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
            </div>
            {shiftsForDay.length > 0 ? (
                <div className="space-y-2">
                    {shiftsForDay.map(shift => <ShiftRow key={shift.id} shift={shift} locations={locations} departments={departments} />)}
                </div>
            ) : (
                <p className="text-sm text-center py-3 text-slate-400 dark:text-slate-500">{t('mobile.dayOff')}</p>
            )}
        </div>
    );
};

const ScheduleScreen: React.FC = () => {
    const { shifts, isLoading, locations, departments } = useMobileData();
    const { t } = useLanguage();

    if (isLoading) {
        return <div className="p-4"><LoadingSpinner /></div>;
    }

    const getWeekDays = (startDate: Date): Date[] => {
        const week: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            week.push(day);
        }
        return week;
    };

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Monday as start of week

    const currentWeekDates = getWeekDays(startOfWeek);
    const nextWeekStartDate = new Date(startOfWeek);
    nextWeekStartDate.setDate(startOfWeek.getDate() + 7);
    const nextWeekDates = getWeekDays(nextWeekStartDate);

    return (
        <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('mobile.upcomingShifts')}</h1>
                <div className="flex items-center space-x-2">
                    <LanguageSwitcher />
                    <ThemeToggle />
                </div>
            </div>
            
            <div className="space-y-6">
                <div>
                    <h2 className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-3">{t('mobile.currentWeek')}</h2>
                    <div className="space-y-3">
                        {currentWeekDates.map(date => <DayCard key={date.toISOString()} date={date} shifts={shifts} t={t} locations={locations} departments={departments} />)}
                    </div>
                </div>
                <div>
                    <h2 className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-3">{t('mobile.nextWeek')}</h2>
                    <div className="space-y-3">
                        {nextWeekDates.map(date => <DayCard key={date.toISOString()} date={date} shifts={shifts} t={t} locations={locations} departments={departments} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleScreen;