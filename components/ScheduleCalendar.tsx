import React, { useState, useMemo } from 'react';
import { Shift, Employee, Role, Location, Department, Absence, AbsenceType, SpecialDay, SpecialDayType, EmployeeAvailability, ClockingStatus } from '../types';
import ShiftCard from './ShiftCard';
import AbsenceCard from './AbsenceCard';
import Modal from './Modal';
import ShiftEditor from './ShiftEditor';
import AbsenceEditor from './AbsenceEditor';
import CalendarFilter from './CalendarFilter';
import SpecialDayEditor from './SpecialDayEditor';
import ExportModal from './ExportModal';
import FeatureTour, { TourStep } from './FeatureTour';
import { ChevronLeft, ChevronRight, Plus, Trash2, CheckSquare, XSquare, UserMinus, Star, Download, ZoomIn, ZoomOut, Lock, Unlock, Lightbulb, Repeat } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import BulkShiftEditor from './BulkShiftEditor';

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

const getMonthGridDays = (date: Date): Date[] => {
    const month = date.getMonth();
    const year = date.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1);
    
    const days: Date[] = [];
    const startDate = new Date(firstDayOfMonth);
    const dayOfWeek = startDate.getDay();
    // Adjust start date to the beginning of the week (Monday)
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; 
    startDate.setDate(startDate.getDate() - offset);

    // Always render 6 weeks for a consistent grid layout
    for (let i = 0; i < 42; i++) { 
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        days.push(day);
    }
    return days;
};


const formatDay = (date: Date) => date.toLocaleDateString([], { weekday: 'short' }).toUpperCase();
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


interface ScheduleCalendarProps {
    employees: Employee[];
    roles: Role[];
    shifts: Shift[];
    locations: Location[];
    departments: Department[];
    absences: Absence[];
    absenceTypes: AbsenceType[];
    specialDays: SpecialDay[];
    specialDayTypes: SpecialDayType[];
    employeeAvailabilities: EmployeeAvailability[];
    onSaveShift: (shift: Shift) => void;
    onDeleteShift: (shiftId: string) => void;
    onDeleteMultipleShifts: (shiftIds: string[]) => void;
    onUpdateShifts: (shifts: Shift[]) => void;
    onSaveAbsence: (absence: Absence) => void;
    onDeleteAbsence: (absenceId: string) => void;
    onSaveSpecialDay: (specialDay: SpecialDay) => void;
    onDeleteSpecialDay: (specialDayId: string) => void;
    onBulkAddShifts: (newShifts: Array<Omit<Shift, 'id' | 'companyId'>>) => Promise<void>;
}

const scheduleTourSteps: TourStep[] = [
    { selector: "[data-tour-id='schedule-drag-shift']", titleKey: 'tour.schedule.dragDropTitle', contentKey: 'tour.schedule.dragDropContent', position: 'right' },
    { selector: "[data-tour-id='schedule-quick-add']", titleKey: 'tour.schedule.quickAddTitle', contentKey: 'tour.schedule.quickAddContent', position: 'bottom' },
    { selector: "[data-tour-id='schedule-multiselect']", titleKey: 'tour.schedule.multiSelectTitle', contentKey: 'tour.schedule.multiSelectContent', position: 'left' },
    { selector: "[data-tour-id='schedule-zoom']", titleKey: 'tour.schedule.zoomTitle', contentKey: 'tour.schedule.zoomContent', position: 'bottom' },
    { selector: "[data-tour-id='schedule-lock']", titleKey: 'tour.schedule.lockTitle', contentKey: 'tour.schedule.lockContent', position: 'left' },
    { selector: "[data-tour-id='schedule-filters']", titleKey: 'tour.schedule.filterTitle', contentKey: 'tour.schedule.filterContent', position: 'bottom' },
];


const ScheduleCalendar: React.FC<ScheduleCalendarProps> = (props) => {
    const { 
        employees, roles, shifts, locations, departments, absences, absenceTypes, specialDays, specialDayTypes,
        employeeAvailabilities, onSaveShift, onDeleteShift, onDeleteMultipleShifts, onUpdateShifts, onSaveAbsence, onDeleteAbsence,
        onSaveSpecialDay, onDeleteSpecialDay, onBulkAddShifts
    } = props;
    
    const { user, permissions } = useAuth();
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [draggedShiftId, setDraggedShiftId] = useState<string | null>(null);
    const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
    const [view, setView] = useState<'week' | 'month'>('week');
    const [zoomLevel, setZoomLevel] = useState(1); // 0: compact, 1: default, 2: detailed
    const [isLocked, setIsLocked] = useState(false);
    
    // Modal States
    const [shiftEditorState, setShiftEditorState] = useState<{isOpen: boolean, shift: Shift | null, date?: Date}>({isOpen: false, shift: null});
    const [absenceEditorState, setAbsenceEditorState] = useState<{isOpen: boolean, absence: Absence | null}>({isOpen: false, absence: null});
    const [specialDayEditorState, setSpecialDayEditorState] = useState<{isOpen: boolean, specialDay: SpecialDay | null, date: Date | null}>({isOpen: false, specialDay: null, date: null});
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
    const [dayDetailModal, setDayDetailModal] = useState<{isOpen: boolean, date: Date | null}>({isOpen: false, date: null});

    const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
    const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);
    
    const [filters, setFilters] = useState<{ employeeIds: string[], roleNames: string[], departmentIds: string[] }>({ employeeIds: [], roleNames: [], departmentIds: [] });
    const [isTourActive, setIsTourActive] = useState(false);

    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
    const monthGridDays = useMemo(() => getMonthGridDays(currentDate), [currentDate]);
    
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const filteredCalendarItems = useMemo(() => {
        const employeeMap = new Map(employees.map(e => [e.id, e]));

        const filteredShifts = shifts.filter(shift => {
            // Always include open shifts, they are filtered out later if needed but should bypass employee filters
            if (!shift.employeeId) return true;

            const employee: Employee | undefined = employeeMap.get(shift.employeeId);
            if (!employee) return false;

            const employeeMatch = filters.employeeIds.length === 0 || filters.employeeIds.includes(employee.id);
            const roleMatch = filters.roleNames.length === 0 || filters.roleNames.includes(employee.role);
            const departmentMatch = filters.departmentIds.length === 0 || (shift.departmentId && filters.departmentIds.includes(shift.departmentId));

            return employeeMatch && roleMatch && departmentMatch;
        });
        
        const filteredAbsences = absences.filter(absence => {
            const employee: Employee | undefined = employeeMap.get(absence.employeeId);
            if (!employee) return false;

            const employeeMatch = filters.employeeIds.length === 0 || filters.employeeIds.includes(employee.id);
            const roleMatch = filters.roleNames.length === 0 || filters.roleNames.includes(employee.role);

            return employeeMatch && roleMatch;
        });

        return { shifts: filteredShifts, absences: filteredAbsences };

    }, [shifts, absences, employees, filters]);

    const firstShiftTargetInfo = useMemo(() => {
        for (const day of weekDays) {
            const shift = filteredCalendarItems.shifts.find(s => !!s.employeeId && isDateBetween(day, s.startTime, s.endTime));
            if (shift) {
                return { day: day, shiftId: shift.id };
            }
        }
        return null;
    }, [weekDays, filteredCalendarItems.shifts]);


    const handlePrev = () => {
        if (view === 'week') {
            setCurrentDate(d => {
                const newDate = new Date(d);
                newDate.setDate(newDate.getDate() - 7);
                return newDate;
            });
        } else {
            setCurrentDate(d => {
                const newDate = new Date(d);
                newDate.setMonth(newDate.getMonth() - 1);
                return newDate;
            });
        }
    };
    const handleNext = () => {
        if (view === 'week') {
            setCurrentDate(d => {
                const newDate = new Date(d);
                newDate.setDate(newDate.getDate() + 7);
                return newDate;
            });
        } else {
            setCurrentDate(d => {
                const newDate = new Date(d);
                newDate.setMonth(newDate.getMonth() + 1);
                return newDate;
            });
        }
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, day: Date) => {
        e.preventDefault();
        setDragOverDate(null);
        setDraggedShiftId(null);
        if (isLocked) return;
        const shiftId = e.dataTransfer.getData('shiftId');
        if (!shiftId) return;
    
        const originalShift = shifts.find(s => s.id === shiftId);
        if (!originalShift) return;
    
        // --- Conflict Checks ---
        const holidayOnDay = specialDays.find(sd => {
            const type = specialDayTypes.find(sdt => sdt.id === sd.typeId);
            return isSameDay(sd.date, day) && type?.isHoliday && sd.coverage === 'all-day';
        });
    
        if (holidayOnDay) {
            alert("Cannot move shift to a holiday.");
            return;
        }
    
        // Calculate new times once for all checks
        const duration = originalShift.endTime.getTime() - originalShift.startTime.getTime();
        const newStartTime = new Date(day);
        newStartTime.setHours(originalShift.startTime.getHours(), originalShift.startTime.getMinutes(), originalShift.startTime.getSeconds(), originalShift.startTime.getMilliseconds());
        const newEndTime = new Date(newStartTime.getTime() + duration);

        if (originalShift.employeeId) {
            // Absence conflict
            const hasAbsenceConflict = absences.some(absence => 
                absence.employeeId === originalShift.employeeId && isDateBetween(day, absence.startDate, absence.endDate)
            );
            if (hasAbsenceConflict) {
                alert("Cannot move shift to a day where the employee is absent.");
                return;
            }

            // Overlapping shift conflict
            const hasOverlap = shifts.some(s => {
                if (s.id === originalShift.id) return false; // Don't compare with self
                if (s.employeeId !== originalShift.employeeId) return false;
        
                const existingStartTime = new Date(s.startTime);
                const existingEndTime = new Date(s.endTime);
        
                return newStartTime < existingEndTime && newEndTime > existingStartTime;
            });

            if (hasOverlap) {
                alert(t('schedule.errorShiftConflictAlert'));
                return;
            }
        }
    
        // --- Update Shift ---
        const updatedShift = { ...originalShift, startTime: newStartTime, endTime: newEndTime };
        onSaveShift(updatedShift);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, shiftId: string) => {
        if (isLocked) return;
        e.dataTransfer.setData('shiftId', shiftId);
        setDraggedShiftId(shiftId);
    };

    // Modal Openers
    const openAddShiftModal = (date: Date) => { 
        const isPastDay = date < today;
        if (isLocked || isPastDay) return;
        setShiftEditorState({isOpen: true, shift: null, date}); 
    }
    const openEditShiftModal = (shift: Shift) => { 
        const isShiftLocked = shift.endTime < new Date() || !!shift.actualStartTime;
        if (isLocked || isShiftLocked) return;
        setShiftEditorState({isOpen: true, shift: shift}); 
    }
    const openAddAbsenceModal = () => { if (!isLocked) setAbsenceEditorState({isOpen: true, absence: null}); }
    const openEditAbsenceModal = (absence: Absence) => { if (!isLocked) setAbsenceEditorState({isOpen: true, absence: absence}); }
    const openSpecialDayModal = (date: Date) => {
        if (isLocked) return;
        const existing = specialDays.find(sd => isSameDay(sd.date, date));
        setSpecialDayEditorState({ isOpen: true, specialDay: existing || null, date });
    }
    const openDayDetailModal = (date: Date) => { if (!isLocked) setDayDetailModal({isOpen: true, date: date}); }

    const handleShiftSave = (shift: Shift) => { 
        onSaveShift(shift); 
        setShiftEditorState({isOpen: false, shift: null}); 
    }
    const handleShiftDelete = (shiftId: string) => { 
        onDeleteShift(shiftId); 
        setShiftEditorState({isOpen: false, shift: null}); 
    }
     const handleDeleteSelected = () => {
        if(selectedShiftIds.length > 0 && window.confirm(t('modals.confirmDeleteMultiple', { count: selectedShiftIds.length }))) {
            onDeleteMultipleShifts(selectedShiftIds);
            setSelectedShiftIds([]);
            setIsSelectionModeActive(false);
        }
    }
    
    // Regular savers/deleters
    const handleAbsenceSave = (absence: Absence) => { onSaveAbsence(absence); setAbsenceEditorState({isOpen: false, absence: null}); }
    const handleSpecialDaySave = (specialDay: SpecialDay) => { onSaveSpecialDay(specialDay); setSpecialDayEditorState({isOpen: false, specialDay: null, date: null}); }
    const handleAbsenceDelete = (absenceId: string) => { onDeleteAbsence(absenceId); setAbsenceEditorState({isOpen: false, absence: null}); }
    const handleSpecialDayDelete = (specialDayId: string) => { onDeleteSpecialDay(specialDayId); setSpecialDayEditorState({isOpen: false, specialDay: null, date: null}); }
    
    const toggleSelectionMode = () => { setIsSelectionModeActive(!isSelectionModeActive); setSelectedShiftIds([]); }
    const toggleShiftSelection = (shiftId: string) => setSelectedShiftIds(prev => prev.includes(shiftId) ? prev.filter(id => id !== shiftId) : [...prev, shiftId]);
    
    const handleZoomIn = () => setZoomLevel(level => Math.min(level + 1, 2));
    const handleZoomOut = () => setZoomLevel(level => Math.max(level - 1, 0));
    const toggleLock = () => setIsLocked(prev => !prev);

    const getShiftEditorTitle = () => {
        if (shiftEditorState.shift) {
            return shiftEditorState.shift.employeeId ? t('schedule.editShift') : t('schedule.assignShift');
        }
        return t('schedule.addShiftTitle');
    };

    const getClockingStatus = (shift: Shift): ClockingStatus => {
        if (user?.plan !== 'Pro Plus' || !shift.employeeId) {
            return 'future';
        }

        const now = new Date();
        const employeeAbsence = filteredCalendarItems.absences.find(a =>
            a.employeeId === shift.employeeId &&
            isDateBetween(shift.startTime, a.startDate, a.endDate)
        );

        if (employeeAbsence) return 'absent';
        if (shift.actualStartTime) return 'present';
        if (new Date(shift.startTime) < now && !shift.actualStartTime) return 'not-clocked-in';

        return 'future';
    };

    const HeaderDisplay = () => {
        if (view === 'week') {
            const startDate = weekDays[0];
            const endDate = weekDays[6];
    
            const startMonth = startDate.toLocaleDateString(language, { month: 'long' });
            const endMonth = endDate.toLocaleDateString(language, { month: 'long' });
            const startDay = startDate.getDate();
            const endDay = endDate.getDate();
            const startYear = startDate.getFullYear();
            const endYear = endDate.getFullYear();
    
            let mainText, yearText;
    
            if (startYear !== endYear) {
                mainText = `${startDate.toLocaleDateString(language, { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString(language, { month: 'short', day: 'numeric', year: 'numeric' })}`;
                yearText = null;
            } else if (startMonth !== endMonth) {
                mainText = `${startDate.toLocaleDateString(language, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(language, { month: 'short', day: 'numeric' })}`;
                yearText = startYear.toString();
            } else {
                if (language === 'fr') {
                    mainText = `${startDay} - ${endDay} ${startMonth}`;
                } else {
                    mainText = `${startMonth} ${startDay} - ${endDay}`;
                }
                yearText = startYear.toString();
            }
            
            return (
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white whitespace-nowrap">
                    <span>{mainText}</span>
                    {yearText && <span className="ml-2 font-semibold text-gray-400 dark:text-gray-500">{yearText}</span>}
                </h2>
            );
        }
    
        // Month view
        return (
             <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                {currentDate.toLocaleDateString(language, { month: 'long', year: 'numeric' })}
            </h2>
        );
    };
    
    const zoomLevelLabels: { [key: number]: string } = {
        0: t('schedule.zoomLevelCompact'),
        1: t('schedule.zoomLevelDefault'),
        2: t('schedule.zoomLevelDetailed'),
    };
    
    const dayDetailFooter = (
        <button 
            onClick={() => { setDayDetailModal({isOpen: false, date: null}); openAddShiftModal(dayDetailModal.date!); }} 
            disabled={isLocked || (dayDetailModal.date && dayDetailModal.date < today)} 
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
            <Plus size={20} className="mr-2" />
            {t('schedule.addShift')}
        </button>
    );


    return (
        <div className="h-full flex flex-col">
            {isTourActive && <FeatureTour steps={scheduleTourSteps} onClose={() => setIsTourActive(false)} />}
             <header className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
                <div className="flex items-center space-x-2">
                    <button onClick={handlePrev} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-blue-night-800 transition-colors"><ChevronLeft /></button>
                    <div className="text-center w-72 flex items-center justify-center">
                        <HeaderDisplay />
                    </div>
                    <button onClick={handleNext} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-blue-night-800 transition-colors"><ChevronRight /></button>
                     <div className="flex items-center bg-gray-200 dark:bg-blue-night-800 rounded-lg p-1 ml-4">
                        <button onClick={() => setView('week')} className={`px-3 py-1 text-sm rounded-md transition-colors ${view === 'week' ? 'bg-blue-600 dark:bg-blue-night-200 dark:text-blue-night-900 text-white shadow' : 'text-gray-600 dark:text-gray-300'}`}>{t('schedule.week')}</button>
                        <button onClick={() => setView('month')} className={`px-3 py-1 text-sm rounded-md transition-colors ${view === 'month' ? 'bg-blue-600 dark:bg-blue-night-200 dark:text-blue-night-900 text-white shadow' : 'text-gray-600 dark:text-gray-300'}`}>{t('schedule.month')}</button>
                    </div>
                     {view === 'week' && (
                        <div data-tour-id="schedule-zoom" className="flex items-center bg-gray-200 dark:bg-blue-night-800 rounded-lg p-1 ml-2">
                            <button onClick={handleZoomOut} disabled={zoomLevel === 0} title={t('schedule.zoomOut')} className="p-1.5 rounded-md disabled:opacity-50 text-gray-600 dark:text-gray-300"><ZoomOut size={18}/></button>
                            <span className="text-xs font-semibold w-20 text-center text-gray-600 dark:text-gray-300">{zoomLevelLabels[zoomLevel]}</span>
                            <button onClick={handleZoomIn} disabled={zoomLevel === 2} title={t('schedule.zoomIn')} className="p-1.5 rounded-md disabled:opacity-50 text-gray-600 dark:text-gray-300"><ZoomIn size={18}/></button>
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                     <button 
                        onClick={() => permissions.canExport && setIsExportModalOpen(true)}
                        disabled={!permissions.canExport}
                        title={!permissions.canExport ? t('tooltips.proFeature') : ''}
                        className="flex items-center text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 relative bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                     >
                        <Download size={20} className="mr-2" />
                        {t('schedule.export')}
                    </button>
                    <button 
                        onClick={() => permissions.canAddAbsence && openAddAbsenceModal()}
                        disabled={!permissions.canAddAbsence || isLocked}
                        title={!permissions.canAddAbsence ? t('tooltips.proFeature') : ''}
                        className="flex items-center text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 relative bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                    >
                        <UserMinus size={20} className="mr-2" />
                        {t('schedule.addAbsence')}
                    </button>
                    <button onClick={() => setIsBulkAddModalOpen(true)} disabled={isLocked} className="flex items-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        <Repeat size={20} className="mr-2" />
                        {t('schedule.bulkAdd')}
                    </button>
                    <button onClick={() => openAddShiftModal(new Date())} disabled={isLocked} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        <Plus size={20} className="mr-2" />
                        {t('schedule.addShift')}
                    </button>
                    <button 
                        onClick={() => setIsTourActive(true)}
                        title={t('tour.quickTips')}
                        className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors"
                        aria-label={t('tour.quickTips')}
                     >
                        <Lightbulb size={20} className="text-yellow-400" />
                    </button>
                </div>
            </header>
            
            <div className="flex items-center justify-end mb-4">
                 <div className="flex items-center space-x-2">
                    <button data-tour-id="schedule-multiselect" onClick={toggleSelectionMode} disabled={isLocked} className="flex items-center bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed">
                       {isSelectionModeActive ? <XSquare size={18} className="mr-2"/> : <CheckSquare size={18} className="mr-2"/>}
                       <span className="text-sm">{isSelectionModeActive ? t('schedule.cancelSelection') : t('schedule.selectShifts')}</span>
                    </button>
                    {isSelectionModeActive && selectedShiftIds.length > 0 && (
                        <button onClick={handleDeleteSelected} className="flex items-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-300">
                           <Trash2 size={18} className="mr-2" />
                           <span className="text-sm">{t('schedule.deleteSelected', { count: selectedShiftIds.length })}</span>
                        </button>
                    )}
                </div>
            </div>

            <div data-tour-id="schedule-filters">
                <CalendarFilter employees={employees} roles={roles} departments={departments} onFilterChange={setFilters} />
            </div>

            <div className="flex justify-end my-4">
                <button
                    data-tour-id="schedule-lock"
                    onClick={toggleLock}
                    title={isLocked ? t('schedule.unlock') : t('schedule.lock')}
                    className={`flex items-center text-sm font-semibold py-2 px-3 rounded-lg transition-colors duration-300 ${
                        isLocked
                        ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                        : 'bg-gray-200 hover:bg-gray-300 dark:bg-blue-night-700 dark:hover:bg-blue-night-600'
                    }`}
                >
                    {isLocked ? <Lock size={18} className="mr-2" /> : <Unlock size={18} className="mr-2" />}
                    {isLocked ? t('schedule.locked') : t('schedule.unlocked')}
                </button>
            </div>

            {view === 'week' ? (
                 <div className="flex-1 grid grid-cols-7 gap-2">
                    {weekDays.map((day, dayIndex) => {
                        const openShiftsForDay = filteredCalendarItems.shifts.filter(s => !s.employeeId && isSameDay(s.startTime, day)).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
                        const assignedShiftsForDay = filteredCalendarItems.shifts.filter(s => !!s.employeeId && isDateBetween(day, s.startTime, s.endTime)).sort((a,b) => a.startTime.getTime() - b.startTime.getTime());
                        const absencesForDay = filteredCalendarItems.absences.filter(a => isDateBetween(day, a.startDate, a.endDate));
                        
                        const isDragOver = dragOverDate && isSameDay(dragOverDate, day);
                        const specialDayForDay = specialDays.find(sd => isSameDay(sd.date, day));
                        const specialDayType = specialDayForDay ? specialDayTypes.find(sdt => sdt.id === specialDayForDay.typeId) : null;
                        const isHoliday = specialDayType?.isHoliday && specialDayForDay?.coverage === 'all-day';
                        const isPastDay = day < today;

                        return (
                            <div key={day.toISOString()}
                                onDragOver={(e) => { if (isLocked) return; e.preventDefault(); setDragOverDate(day); }}
                                onDragLeave={() => setDragOverDate(null)}
                                onDrop={(e) => handleDrop(e, day)}
                                onDoubleClick={isLocked || isPastDay ? undefined : () => openAddShiftModal(day)}
                                data-tour-id={dayIndex === 2 ? "schedule-quick-add" : undefined}
                                className={`rounded-lg p-2 flex flex-col transition-colors duration-200 
                                    ${isDragOver ? 'bg-blue-100 dark:bg-blue-night-800' : 'bg-gray-50 dark:bg-blue-night-900'}
                                    ${isHoliday ? 'bg-gray-200 dark:bg-blue-night-950/50' : ''}
                                    ${isLocked || isPastDay ? 'cursor-not-allowed' : ''}
                                `}
                            >
                                <div className="flex justify-between items-center text-center mb-2 pb-2 border-b-2 dark:border-blue-night-800">
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{formatDay(day)}</p>
                                        <p className="text-lg font-bold">{day.getDate()}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <button onClick={(e) => { e.stopPropagation(); openSpecialDayModal(day); }} disabled={isLocked} className="p-1 rounded-full text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors disabled:opacity-50 disabled:hover:bg-transparent">
                                            <Star size={16} className={specialDayForDay ? 'fill-current' : ''}/>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2 h-full overflow-y-auto pr-1">
                                    {isHoliday && <div className="text-center p-2 text-sm font-semibold text-gray-500 dark:text-gray-400">{specialDayType?.name}</div>}

                                    {openShiftsForDay.length > 0 && (
                                        <div className="pt-2">
                                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 text-center border-b dark:border-blue-night-800 pb-1">{t('schedule.openShifts')}</h4>
                                            <div className="space-y-2 pt-1">
                                                {openShiftsForDay.map(shift => {
                                                    const isShiftLocked = shift.endTime < new Date() || !!shift.actualStartTime;
                                                    return (
                                                        <div
                                                            key={shift.id}
                                                            className={`transition-opacity duration-300 ${draggedShiftId === shift.id ? 'opacity-30' : 'opacity-100'}`}
                                                        >
                                                            <ShiftCard shift={shift} location={locations.find(l => l.id === shift.locationId)} department={departments.find(d => d.id === shift.departmentId)} onClick={() => openEditShiftModal(shift)} onDelete={handleShiftDelete} isSelectionModeActive={false} isSelected={false} onToggleSelect={() => {}} onDragStart={handleDragStart} zoomLevel={zoomLevel} isLocked={isLocked || isShiftLocked} />
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {(openShiftsForDay.length > 0 && (assignedShiftsForDay.length > 0 || absencesForDay.length > 0)) && <hr className="border-gray-200 dark:border-blue-night-800 my-2"/>}
                                    
                                    {absencesForDay.map(absence => {
                                        const isAbsenceLocked = absence.endDate < new Date();
                                        return <AbsenceCard key={absence.id} absence={absence} employee={employees.find(e => e.id === absence.employeeId)} absenceType={absenceTypes.find(at => at.id === absence.absenceTypeId)} onClick={() => openEditAbsenceModal(absence)} onDelete={onDeleteAbsence} zoomLevel={zoomLevel} isLocked={isLocked || isAbsenceLocked} />
                                    })}
                                    {assignedShiftsForDay.map(shift => {
                                        const isShiftLocked = shift.endTime < new Date() || !!shift.actualStartTime;
                                        return (
                                            <div 
                                                key={shift.id} 
                                                className={`transition-opacity duration-300 ${draggedShiftId === shift.id ? 'opacity-30' : 'opacity-100'}`}
                                                data-tour-id={firstShiftTargetInfo && isSameDay(day, firstShiftTargetInfo.day) && shift.id === firstShiftTargetInfo.shiftId ? 'schedule-drag-shift' : undefined}
                                            >
                                                <ShiftCard shift={shift} employee={employees.find(e => e.id === shift.employeeId)} location={locations.find(l => l.id === shift.locationId)} department={departments.find(d => d.id === shift.departmentId)} onDragStart={handleDragStart} onClick={() => openEditShiftModal(shift)} onDelete={handleShiftDelete} isSelectionModeActive={isSelectionModeActive} isSelected={selectedShiftIds.includes(shift.id)} onToggleSelect={toggleShiftSelection} zoomLevel={zoomLevel} isLocked={isLocked || isShiftLocked} clockingStatus={getClockingStatus(shift)} />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-1 border-l border-t dark:border-blue-night-800">
                    {/* Month header */}
                    {weekDays.map(day => <div key={day.getDay()} className="text-center py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 border-b dark:border-blue-night-800">{formatDay(day)}</div>)}
                    {/* Month grid */}
                    {monthGridDays.map((day, index) => {
                         const shiftsForDay = filteredCalendarItems.shifts.filter(s => s.employeeId && isSameDay(s.startTime, day));
                         const absencesForDay = filteredCalendarItems.absences.filter(a => isDateBetween(day, a.startDate, a.endDate));
                         const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                         const isTodayDate = isSameDay(day, new Date());
                         const isPastDay = day < today;
                         return (
                            <div 
                                key={index}
                                onClick={() => openDayDetailModal(day)}
                                onDoubleClick={isLocked || isPastDay ? undefined : () => openAddShiftModal(day)}
                                className={`relative border-r border-b dark:border-blue-night-800 p-2 flex flex-col transition-colors
                                ${isCurrentMonth ? 'bg-white dark:bg-blue-night-900' : 'bg-gray-50 dark:bg-blue-night-950 text-gray-400'}
                                ${isLocked || isPastDay ? 'cursor-default' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-blue-night-800'}`}>
                                <div className={`flex justify-center items-center w-6 h-6 rounded-full text-sm ${isTodayDate ? 'bg-blue-600 dark:bg-blue-night-200 text-white dark:text-blue-night-900' : ''}`}>
                                    {day.getDate()}
                                </div>
                                <div className="flex-grow mt-2 space-y-1">
                                     {shiftsForDay.slice(0, 2).map(shift => {
                                        const emp = employees.find(e => e.id === shift.employeeId);
                                        const roleColor = emp ? (roles.find(r => r.name === emp.role) ? 'bg-blue-500 dark:bg-blue-night-500' : 'bg-gray-400 dark:bg-blue-night-700') : 'bg-gray-400 dark:bg-blue-night-700';
                                        return <div key={shift.id} className={`h-1.5 w-full rounded-full ${roleColor}`}></div>
                                     })}
                                     {absencesForDay.slice(0, 1).map(absence => {
                                         const at = absenceTypes.find(t => t.id === absence.absenceTypeId);
                                         const absenceColor = theme === 'dark' ? '#adb5bd' : at?.color;
                                         return <div key={absence.id} className={`h-1.5 w-full rounded-full`} style={{backgroundColor: absenceColor || '#ccc'}}></div>
                                     })}
                                     {shiftsForDay.length + absencesForDay.length > 3 && 
                                        <div className="text-xs text-gray-500 dark:text-gray-400">+{shiftsForDay.length + absencesForDay.length - 3} more</div>
                                     }
                                </div>
                            </div>
                         );
                    })}
                </div>
            )}
            
            {shiftEditorState.isOpen && (
                <ShiftEditor 
                    shift={shiftEditorState.shift} 
                    employees={employees}
                    locations={locations}
                    departments={departments}
                    selectedDate={shiftEditorState.date}
                    onSave={handleShiftSave}
                    onCancel={() => setShiftEditorState({isOpen: false, shift: null})}
                    onDelete={shiftEditorState.shift ? handleShiftDelete : undefined}
                    allAbsences={absences}
                    absenceTypes={absenceTypes}
                    allSpecialDays={specialDays}
                    allSpecialDayTypes={specialDayTypes}
                    allEmployeeAvailabilities={employeeAvailabilities}
                    allShifts={shifts}
                />
            )}
             {absenceEditorState.isOpen && (
                <AbsenceEditor
                    absence={absenceEditorState.absence}
                    employees={employees}
                    absenceTypes={absenceTypes}
                    onSave={handleAbsenceSave}
                    onCancel={() => setAbsenceEditorState({isOpen: false, absence: null})}
                    onDelete={absenceEditorState.absence ? handleAbsenceDelete : undefined}
                    allShifts={shifts}
                    allSpecialDays={specialDays}
                    allSpecialDayTypes={specialDayTypes}
                />
            )}
            {specialDayEditorState.isOpen && specialDayEditorState.date && (
                <SpecialDayEditor 
                    date={specialDayEditorState.date}
                    specialDay={specialDayEditorState.specialDay}
                    specialDayTypes={specialDayTypes}
                    onSave={handleSpecialDaySave}
                    onCancel={() => setSpecialDayEditorState({isOpen: false, specialDay: null, date: null})}
                    onDelete={specialDayEditorState.specialDay ? handleSpecialDayDelete : undefined}
                />
            )}
             <Modal 
                isOpen={dayDetailModal.isOpen} 
                onClose={() => setDayDetailModal({isOpen: false, date: null})} 
                title={t('schedule.dayScheduleTitle', { date: dayDetailModal.date?.toLocaleDateString() || '' })}
                footer={dayDetailFooter}
             >
                {dayDetailModal.date && (
                    <div>
                        <div className="max-h-96 overflow-y-auto space-y-2 pr-2 -mr-2">
                            {filteredCalendarItems.absences.filter(a => isDateBetween(dayDetailModal.date!, a.startDate, a.endDate)).map(absence => {
                                const isAbsenceLocked = absence.endDate < new Date();
                                return <AbsenceCard key={absence.id} absence={absence} employee={employees.find(e => e.id === absence.employeeId)} absenceType={absenceTypes.find(at => at.id === absence.absenceTypeId)} onClick={() => openEditAbsenceModal(absence)} onDelete={onDeleteAbsence} zoomLevel={2} isLocked={isLocked || isAbsenceLocked}/>
                            })}
                            {filteredCalendarItems.shifts.filter(s => isSameDay(s.startTime, dayDetailModal.date!)).sort((a,b)=>a.startTime.getTime() - b.startTime.getTime()).map(shift => {
                                const isShiftLocked = shift.endTime < new Date() || !!shift.actualStartTime;
                                return <ShiftCard key={shift.id} shift={shift} employee={employees.find(e => e.id === shift.employeeId)} location={locations.find(l => l.id === shift.locationId)} department={departments.find(d => d.id === shift.departmentId)} onDragStart={()=>{}} onClick={() => openEditShiftModal(shift)} onDelete={handleShiftDelete} isSelectionModeActive={false} isSelected={false} onToggleSelect={()=>{}} zoomLevel={2} isLocked={isLocked || isShiftLocked} clockingStatus={getClockingStatus(shift)} />
                            })}
                             {(filteredCalendarItems.shifts.filter(s => isSameDay(s.startTime, dayDetailModal.date!)).length === 0 &&
                               filteredCalendarItems.absences.filter(a => isDateBetween(dayDetailModal.date!, a.startDate, a.endDate)).length === 0) &&
                                <p className="text-center text-gray-500 py-4">No events scheduled for this day.</p>
                             }
                        </div>
                    </div>
                )}
             </Modal>
             <ExportModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                currentDate={currentDate}
                employees={employees}
                roles={roles}
                shifts={shifts}
                locations={locations}
                departments={departments}
                absences={absences}
                absenceTypes={absenceTypes}
                specialDays={specialDays}
                specialDayTypes={specialDayTypes}
            />
            <BulkShiftEditor
                isOpen={isBulkAddModalOpen}
                onClose={() => setIsBulkAddModalOpen(false)}
                onBulkSave={onBulkAddShifts}
                employees={employees}
                locations={locations}
                departments={departments}
                allShifts={shifts}
                allAbsences={absences}
                allSpecialDays={specialDays}
                allSpecialDayTypes={specialDayTypes}
            />
        </div>
    );
};

export default ScheduleCalendar;