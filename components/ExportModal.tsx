import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Shift, Employee, Location, Department, Absence, AbsenceType, SpecialDay, SpecialDayType, Role } from '../types';
import { Calendar, List, Clock, Loader2, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Helper functions
const getWeekDays = (date: Date): Date[] => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        week.push(day);
    }
    return week;
};

const toInputDateString = (date: Date): string => {
    // Adjust for timezone to get correct local date in YYYY-MM-DD format
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
};

const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
const isDateBetween = (date: Date, start: Date, end: Date) => {
    const checkDate = new Date(date);
    checkDate.setHours(0,0,0,0);
    const startDate = new Date(start);
    startDate.setHours(0,0,0,0);
    const endDate = new Date(end);
    endDate.setHours(0,0,0,0);
    return checkDate >= startDate && checkDate <= endDate;
}

// Props interface
interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: Date;
    employees: Employee[];
    roles: Role[];
    shifts: Shift[];
    locations: Location[];
    departments: Department[];
    absences: Absence[];
    absenceTypes: AbsenceType[];
    specialDays: SpecialDay[];
    specialDayTypes: SpecialDayType[];
}

const ExportOptionCard: React.FC<{ title: string; description: string; icon: React.ReactNode; isSelected: boolean; onClick: () => void; }> = ({ title, description, icon, isSelected, onClick }) => (
    <div
        onClick={onClick}
        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 relative ${isSelected ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
    >
        <div className="flex items-center">
            <div className="mr-4 text-blue-600 dark:text-blue-400">{icon}</div>
            <div>
                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
        </div>
        {isSelected && <div className="absolute top-3 right-3 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white"><Check size={14} /></div>}
    </div>
);

const ExportModal: React.FC<ExportModalProps> = (props) => {
    const { isOpen, onClose, currentDate, ...data } = props;
    const { t } = useLanguage();
    const [exportType, setExportType] = useState<'calendar' | 'list' | 'timeline'>('calendar');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const weekDays = getWeekDays(currentDate);
            setStartDate(weekDays[0]);
            setEndDate(weekDays[6]);
            setExportType('calendar'); // Reset to default on open
        }
    }, [isOpen, currentDate]);
    
    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.value) return;
        const date = new Date(e.target.value + 'T00:00:00'); // Treat as local time
        const weekStart = getWeekDays(date)[0];
        setStartDate(weekStart);
        if (endDate && weekStart > endDate) {
            const newEndDate = getWeekDays(date)[6];
            setEndDate(newEndDate);
        }
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.value) return;
        const date = new Date(e.target.value + 'T00:00:00'); // Treat as local time
        const weekEnd = getWeekDays(date)[6];
        setEndDate(weekEnd);
        if (startDate && weekEnd < startDate) {
            const newStartDate = getWeekDays(date)[0];
            setStartDate(newStartDate);
        }
    };

    const getPrintableShiftCardHTML = (shift: Shift): string => {
        const employee = data.employees.find(e => e.id === shift.employeeId);
        if (!employee) return '';

        const location = data.locations.find(l => l.id === shift.locationId);
        const department = data.departments.find(d => d.id === shift.departmentId);
        
        const roleColors: { [key: string]: string } = {
            'Manager': 'border-red-500', 'Cashier': 'border-green-500',
            'Stocker': 'border-blue-500', 'Clerk': 'border-yellow-500',
        };
        const colorClass = roleColors[employee.role] || 'border-gray-500';

        const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        return `
            <div class="shift-card ${colorClass}">
                <p class="font-semibold text-sm truncate">${employee.name}</p>
                <p class="text-xs text-gray-600 font-mono mb-1">${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}</p>
                ${location ? `<div class="text-xs text-gray-500 truncate">Loc: ${location.name}</div>` : ''}
                ${department ? `<div class="text-xs text-gray-500 truncate">Dept: ${department.name}</div>` : ''}
            </div>
        `;
    };

    const getPrintableAbsenceCardHTML = (absence: Absence): string => {
        const employee = data.employees.find(e => e.id === absence.employeeId);
        const absenceType = data.absenceTypes.find(at => at.id === absence.absenceTypeId);
        if (!employee || !absenceType) return '';

        return `
            <div class="absence-card" style="border-left-color: ${absenceType.color};">
                <p class="font-semibold text-sm truncate">${employee.name}</p>
                <p class="text-xs text-gray-600 truncate">${absenceType.name}</p>
            </div>
        `;
    };

    const generateListExport = (shiftsToExport: Shift[], exportStartDate: Date) => {
        const employeeMap = new Map(data.employees.map(e => [e.id, e]));
        const locationMap = new Map(data.locations.map(l => [l.id, l]));
        const departmentMap = new Map(data.departments.map(d => [d.id, d]));

        let csvContent = "Date,Employee Name,Role,Start Time,End Time,Hours,Location,Department\n";
        
        const sortedShifts = [...shiftsToExport].sort((a,b) => a.startTime.getTime() - b.startTime.getTime());

        sortedShifts.forEach(shift => {
            if (!shift.employeeId) return;
            const employee = employeeMap.get(shift.employeeId);
            if (!employee) return;
            
            const date = shift.startTime.toLocaleDateString();
            const startTime = shift.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTime = shift.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const hours = ((shift.endTime.getTime() - shift.startTime.getTime()) / 3600000).toFixed(2);
            const location = locationMap.get(shift.locationId || '')?.name || '';
            const department = departmentMap.get(shift.departmentId || '')?.name || '';
            
            const row = [date, `"${employee.name}"`, employee.role, startTime, endTime, hours, `"${location}"`, `"${department}"`].join(',');
            csvContent += row + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `schedule_export_${exportStartDate.toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const generateCalendarExport = (shifts: Shift[], absences: Absence[], exportStartDate: Date, numWeeks: number) => {
        let allDays: Date[] = [];
        for (let i = 0; i < numWeeks; i++) {
            const weekStartDate = new Date(exportStartDate);
            weekStartDate.setDate(exportStartDate.getDate() + (i * 7));
            allDays = allDays.concat(getWeekDays(weekStartDate));
        }

        const weeks = [];
        for(let i = 0; i < numWeeks; i++) {
            weeks.push(allDays.slice(i * 7, (i * 7) + 7));
        }
        
        let bodyContent = '';
        weeks.forEach((week, index) => {
            bodyContent += `
                <div class="week-container">
                    <h2 class="week-title">Week of ${week[0].toLocaleDateString([], {month: 'long', day: 'numeric'})}</h2>
                    <div class="calendar-grid">
                        ${week.map(day => `
                            <div class="calendar-day">
                                <div class="day-header">
                                    <span class="font-semibold text-gray-500">${day.toLocaleDateString([], { weekday: 'short' }).toUpperCase()}</span>
                                    <span class="text-lg font-bold">${day.getDate()}</span>
                                </div>
                                <div class="day-content">
                                    ${absences.filter(a => isDateBetween(day, a.startDate, a.endDate)).map(getPrintableAbsenceCardHTML).join('')}
                                    ${shifts.filter(s => isSameDay(s.startTime, day) && s.employeeId).sort((a,b) => a.startTime.getTime() - b.startTime.getTime()).map(getPrintableShiftCardHTML).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        const html = `
            <!DOCTYPE html><html><head><title>Schedule Export</title><script src="https://cdn.tailwindcss.com"></script>
            <style>
                body { font-family: sans-serif; } .week-container { page-break-inside: avoid; margin-bottom: 2rem; }
                .week-title { font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; } .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; }
                .calendar-day { border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.5rem; background-color: #f7fafc; min-height: 150px; }
                .day-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.5rem; border-bottom: 1px solid #e2e8f0; margin-bottom: 0.5rem; }
                .day-content { display: flex; flex-direction: column; gap: 0.5rem; }
                .shift-card { padding: 0.5rem; border-radius: 0.25rem; border-left-width: 4px; background-color: white; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
                .absence-card { padding: 0.5rem; border-radius: 0.25rem; border-left-width: 4px; background-color: #f1f5f9; opacity: 0.8; }
                @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .week-container { page-break-after: always; } }
            </style></head>
            <body class="p-4"><h1 class="text-3xl font-bold mb-4">Schedule Export</h1>${bodyContent}</body></html>
        `;
        const newWindow = window.open('', '_blank');
        newWindow?.document.write(html);
        newWindow?.document.close();
        newWindow?.focus();
        setTimeout(() => newWindow?.print(), 500);
    };

    const generateTimelineExport = (shifts: Shift[], exportStartDate: Date, exportEndDate: Date) => {
        const sortedShifts = [...shifts].filter(s => s.employeeId).sort((a,b) => a.startTime.getTime() - b.startTime.getTime());
        const shiftsByDay = new Map<string, Shift[]>();

        for (let d = new Date(exportStartDate); d <= exportEndDate; d.setDate(d.getDate() + 1)) {
            const dateString = d.toISOString().split('T')[0];
            const shiftsForDay = sortedShifts.filter(s => isSameDay(s.startTime, d));
            if (shiftsForDay.length > 0) {
                 shiftsByDay.set(dateString, shiftsForDay);
            }
        }
        
        let bodyContent = '';
        shiftsByDay.forEach((dayShifts, dateString) => {
            const day = new Date(dateString);
            day.setUTCHours(12); // avoid timezone issues
            bodyContent += `
                <div class="timeline-day">
                    <h2 class="day-title">${day.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                    ${dayShifts.map(shift => getPrintableShiftCardHTML(shift)).join('')}
                </div>
            `;
        });

        const html = `
            <!DOCTYPE html><html><head><title>Schedule Timeline Export</title><script src="https://cdn.tailwindcss.com"></script>
            <style>
                body { font-family: sans-serif; max-width: 800px; margin: auto; padding: 1rem; }
                .timeline-day { page-break-inside: avoid; margin-bottom: 2rem; }
                .day-title { font-size: 1.25rem; font-weight: bold; padding-bottom: 0.5rem; border-bottom: 2px solid #e2e8f0; margin-bottom: 1rem; }
                .shift-card { padding: 0.5rem; border-radius: 0.25rem; border-left-width: 4px; background-color: #f7fafc; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); margin-bottom: 0.5rem; }
                @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            </style></head><body><h1 class="text-3xl font-bold mb-4">Schedule Timeline</h1>${bodyContent}</body></html>
        `;
        const newWindow = window.open('', '_blank');
        newWindow?.document.write(html);
        newWindow?.document.close();
        newWindow?.focus();
        setTimeout(() => newWindow?.print(), 500);
    };

    const handleExport = async () => {
        setIsGenerating(true);
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!startDate || !endDate) {
            setIsGenerating(false);
            console.error("Start or end date is not set for export.");
            return;
        }
        
        const exportStartDate = new Date(startDate);
        exportStartDate.setHours(0, 0, 0, 0);
        const exportEndDate = new Date(endDate);
        exportEndDate.setHours(23, 59, 59, 999);
        
        const filteredShifts = data.shifts.filter(s => s.startTime >= exportStartDate && s.startTime <= exportEndDate);
        const filteredAbsences = data.absences.filter(a => !(a.endDate < exportStartDate || a.startDate > exportEndDate));
        
        const numWeeks = Math.ceil(((exportEndDate.getTime() - exportStartDate.getTime()) / (1000 * 3600 * 24) + 1) / 7);

        switch (exportType) {
            case 'list':
                generateListExport(filteredShifts, exportStartDate);
                break;
            case 'calendar':
                generateCalendarExport(filteredShifts, filteredAbsences, exportStartDate, numWeeks);
                break;
            case 'timeline':
                generateTimelineExport(filteredShifts, exportStartDate, exportEndDate);
                break;
        }

        setIsGenerating(false);
        onClose();
    };

    const footer = (
         <button
            type="button"
            onClick={handleExport}
            disabled={isGenerating || !startDate || !endDate}
            className="w-full sm:w-auto flex justify-center items-center px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed"
        >
            {isGenerating ? <><Loader2 className="animate-spin mr-2" size={18} /> {t('modals.generating')}</> : t('modals.generateExport')}
        </button>
    );
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('modals.exportSchedule')} footer={footer}>
            <style>{`
                .dark input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.8); }
            `}</style>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('modals.exportFormat')}</label>
                    <div className="space-y-3">
                        <ExportOptionCard title={t('modals.calendarView')} description={t('modals.calendarViewDesc')} icon={<Calendar size={24} />} isSelected={exportType === 'calendar'} onClick={() => setExportType('calendar')} />
                        <ExportOptionCard title={t('modals.listView')} description={t('modals.listViewDesc')} icon={<List size={24} />} isSelected={exportType === 'list'} onClick={() => setExportType('list')} />
                        <ExportOptionCard title={t('modals.timelineView')} description={t('modals.timelineViewDesc')} icon={<Clock size={24} />} isSelected={exportType === 'timeline'} onClick={() => setExportType('timeline')} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('modals.timeRange')}</label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t('modals.timeRangeHint')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                             <label htmlFor="startDate" className="block text-xs font-medium text-slate-500 dark:text-slate-400">{t('modals.weekStart')}</label>
                            <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                value={startDate ? toInputDateString(startDate) : ''}
                                onChange={handleStartDateChange}
                                className="mt-1 block w-full px-3 py-2 text-base border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-xs font-medium text-slate-500 dark:text-slate-400">{t('modals.weekEnd')}</label>
                            <input
                                type="date"
                                id="endDate"
                                name="endDate"
                                value={endDate ? toInputDateString(endDate) : ''}
                                onChange={handleEndDateChange}
                                min={startDate ? toInputDateString(startDate) : ''}
                                className="mt-1 block w-full px-3 py-2 text-base border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ExportModal;