
import React from 'react';
import { Absence, Employee, AbsenceType } from '../types';
import Avatar from './Avatar';
import { UserMinus, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface AbsenceCardProps {
    absence: Absence;
    employee?: Employee;
    absenceType?: AbsenceType;
    onClick: () => void;
    onDelete: (absenceId: string) => void;
    zoomLevel: number;
    isLocked: boolean;
}

const getShortFirstName = (name: string): string => {
  if (!name) return '?';
  return name.split(' ')[0];
};

const getAbsenceTypeAbbr = (name: string): string => {
    if (!name) return '';
    const words = name.split(' ');
    if (words.length > 1) {
        return words.map(w => w[0]).join('').toUpperCase();
    }
    return name.slice(0, 3).toUpperCase();
};


const AbsenceCard: React.FC<AbsenceCardProps> = ({ absence, employee, absenceType, onClick, onDelete, zoomLevel, isLocked }) => {
    const { theme } = useTheme();
    if (!employee || !absenceType) return null;

    const { color, name: absenceName } = absenceType;
    const absenceColor = theme === 'dark' ? '#6c757d' : color;
    
    const handleCardClick = () => {
        if (isLocked) return;
        onClick();
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent onClick from firing
        if (window.confirm('Are you sure you want to delete this absence?')) {
            onDelete(absence.id);
        }
    };
    
    const title = `${employee.name} - ${absenceName}`;

    // --- COMPACT VIEW (level 0) ---
    if (zoomLevel === 0) {
        return (
            <div onClick={handleCardClick} title={title} className="transition-all duration-300 ease-in-out">
                <div className={`h-6 rounded flex items-center justify-between px-1.5 text-white overflow-hidden ${isLocked ? 'cursor-default' : 'cursor-pointer'}`} style={{ backgroundColor: absenceColor }}>
                    <span className="text-[11px] font-bold truncate">{getShortFirstName(employee.name)}</span>
                    <span className="text-[10px] font-mono font-semibold truncate">{getAbsenceTypeAbbr(absenceName)}</span>
                </div>
            </div>
        );
    }

    // --- DEFAULT & DETAILED VIEWS ---
    return (
        <div
            onClick={handleCardClick}
            style={{ borderLeftColor: absenceColor }}
            className={`rounded-lg mb-2 border-l-4 group relative bg-gray-100 dark:bg-blue-night-800/50 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out ${zoomLevel === 1 ? 'p-1.5' : 'p-2'} ${isLocked ? 'cursor-default' : 'cursor-pointer'}`}
        >
            <div className="flex items-center">
                <Avatar name={employee.name} src={employee.avatarUrl} className={`rounded-full mr-2 opacity-70 ${zoomLevel === 1 ? 'w-5 h-5' : 'w-6 h-6'}`}/>
                <div className="truncate">
                     <p className={`font-semibold text-gray-700 dark:text-gray-200 truncate ${zoomLevel === 1 ? 'text-sm' : ''}`}>{employee.name}</p>
                     <div className="flex items-center">
                        {zoomLevel === 2 && <UserMinus size={12} className="mr-1.5 text-gray-500 dark:text-gray-400"/>}
                        <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{absenceName}</p>
                    </div>
                </div>
            </div>
            {!isLocked && (
                <button 
                    onClick={handleDeleteClick}
                    className="absolute top-1/2 -translate-y-1/2 right-2 p-1 rounded-full bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900/80 text-red-600 dark:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete absence"
                >
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    );
};

export default AbsenceCard;