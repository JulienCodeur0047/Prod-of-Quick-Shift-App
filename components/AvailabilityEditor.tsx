import React, { useState } from 'react';
import { WeeklyAvailability, AvailabilityStatus, TimeBlock, DayAvailability } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface AvailabilityEditorProps {
    employeeId: string;
    initialAvailability?: WeeklyAvailability;
    onSave: (employeeId: string, availability: WeeklyAvailability) => void;
}

const createDefaultAvailability = (): WeeklyAvailability => {
    const defaultDay: DayAvailability = { morning: 'available', afternoon: 'available', evening: 'available' };
    return Array(7).fill(defaultDay).map(() => ({...defaultDay})) as WeeklyAvailability;
};

const STATUS_CYCLE: AvailabilityStatus[] = ['available', 'preferred', 'unavailable'];

const AvailabilityEditor: React.FC<AvailabilityEditorProps> = ({ employeeId, initialAvailability, onSave }) => {
    const { t } = useLanguage();
    const [availability, setAvailability] = useState<WeeklyAvailability>(initialAvailability || createDefaultAvailability());
    const [isSaved, setIsSaved] = useState(false);

    const handleBlockClick = (dayIndex: number, timeBlock: TimeBlock) => {
        setIsSaved(false);
        const newAvailability = [...availability] as WeeklyAvailability;
        const currentStatus = newAvailability[dayIndex][timeBlock];
        const nextIndex = (STATUS_CYCLE.indexOf(currentStatus) + 1) % STATUS_CYCLE.length;
        newAvailability[dayIndex][timeBlock] = STATUS_CYCLE[nextIndex];
        setAvailability(newAvailability);
    };

    const handleSave = () => {
        onSave(employeeId, availability);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000); // Hide message after 2s
    };
    
    const dayLabels = [
        t('availability.monday'), t('availability.tuesday'), t('availability.wednesday'),
        t('availability.thursday'), t('availability.friday'), t('availability.saturday'), t('availability.sunday')
    ];
    const timeBlockLabels: { [key in TimeBlock]: string } = {
        morning: t('availability.morning'),
        afternoon: t('availability.afternoon'),
        evening: t('availability.evening')
    };

    const getStatusClasses = (status: AvailabilityStatus) => {
        switch (status) {
            case 'preferred': return 'bg-green-200 dark:bg-green-800/50 hover:bg-green-300';
            case 'unavailable': return 'bg-red-200 dark:bg-red-800/50 hover:bg-red-300';
            default: return 'bg-gray-100 dark:bg-blue-night-800/50 hover:bg-gray-200';
        }
    };
    
    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('availability.description')}</p>
            <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 border dark:border-blue-night-700"></th>
                            {dayLabels.map(day => (
                                <th key={day} className="p-2 border dark:border-blue-night-700 font-semibold">{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {(Object.keys(timeBlockLabels) as TimeBlock[]).map(block => (
                            <tr key={block}>
                                <td className="p-2 border dark:border-blue-night-700 font-semibold">{timeBlockLabels[block]}</td>
                                {availability.map((day, dayIndex) => (
                                    <td key={dayIndex} className="p-1 border dark:border-blue-night-700">
                                        <button
                                            type="button"
                                            onClick={() => handleBlockClick(dayIndex, block)}
                                            className={`w-full h-12 rounded-md transition-colors text-xs font-bold ${getStatusClasses(day[block])}`}
                                        >
                                            {t(`availability.status${day[block].charAt(0).toUpperCase() + day[block].slice(1)}`)}
                                        </button>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="flex justify-end items-center">
                 {isSaved && <span className="text-sm text-green-600 dark:text-green-400 mr-4">{t('availability.savedMessage')}</span>}
                <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    {t('availability.saveButton')}
                </button>
            </div>
        </div>
    );
};

export default AvailabilityEditor;