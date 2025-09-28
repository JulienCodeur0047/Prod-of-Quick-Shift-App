import React, { useState, useMemo } from 'react';
import { Shift, Employee, Location, Department, Absence, SpecialDay, SpecialDayType } from '../types';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';
import MultiSelectDropdown from './MultiSelectDropdown';

interface BulkShiftEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onBulkSave: (newShifts: Array<Omit<Shift, 'id' | 'companyId'>>) => Promise<void>;
    employees: Employee[];
    locations: Location[];
    departments: Department[];
    allShifts: Shift[];
    allAbsences: Absence[];
    allSpecialDays: SpecialDay[];
    allSpecialDayTypes: SpecialDayType[];
}

const toInputDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
const isDateBetween = (date: Date, start: Date, end: Date) => {
    const checkDate = new Date(date); checkDate.setHours(0,0,0,0);
    const startDate = new Date(start); startDate.setHours(0,0,0,0);
    const endDate = new Date(end); endDate.setHours(0,0,0,0);
    return checkDate >= startDate && checkDate <= endDate;
}

const BulkShiftEditor: React.FC<BulkShiftEditorProps> = (props) => {
    const { isOpen, onClose, onBulkSave, employees, locations, departments, allShifts, allAbsences, allSpecialDays, allSpecialDayTypes } = props;
    const { t } = useLanguage();
    const { user } = useAuth();
    
    const [employeeIds, setEmployeeIds] = useState<string[]>([]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [locationId, setLocationId] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [startDate, setStartDate] = useState(toInputDateString(new Date()));
    const [endDate, setEndDate] = useState(toInputDateString(new Date()));
    const [daysOfWeek, setDaysOfWeek] = useState([true, true, true, true, true, false, false]); // Mon-Fri
    
    const [error, setError] = useState('');
    const [conflicts, setConflicts] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const employeeOptions = useMemo(() => employees.map(e => ({ id: e.id, name: e.name })), [employees]);
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    const handleDayToggle = (index: number) => {
        const newDays = [...daysOfWeek];
        newDays[index] = !newDays[index];
        setDaysOfWeek(newDays);
    };

    const resetForm = () => {
        setEmployeeIds([]);
        setStartTime('09:00');
        setEndTime('17:00');
        setLocationId('');
        setDepartmentId('');
        const today = toInputDateString(new Date());
        setStartDate(today);
        setEndDate(today);
        setDaysOfWeek([true, true, true, true, true, false, false]);
        setError('');
        setConflicts([]);
        setIsSaving(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setConflicts([]);
        setIsSaving(true);

        // --- 1. VALIDATION ---
        if (employeeIds.length === 0) {
            setError(t('modals.errorNoEmployees'));
            setIsSaving(false);
            return;
        }
        if (!daysOfWeek.some(day => day)) {
            setError(t('modals.errorNoDays'));
            setIsSaving(false);
            return;
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
            setError(t('modals.errorEndDate'));
            setIsSaving(false);
            return;
        }

        // --- 2. GENERATE DATES ---
        const targetDates: Date[] = [];
        let currentDate = new Date(startDate + 'T00:00:00');
        const finalDate = new Date(endDate + 'T00:00:00');
        while (currentDate <= finalDate) {
            const dayIndex = (currentDate.getDay() + 6) % 7; // Monday = 0
            if (daysOfWeek[dayIndex]) {
                targetDates.push(new Date(currentDate));
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // --- 3. CONFLICT CHECKING ---
        const newShifts: Array<Omit<Shift, 'id' | 'companyId'>> = [];
        const foundConflicts: string[] = [];
        const employeeMap = new Map(employees.map(e => [e.id, e]));

        for (const empId of employeeIds) {
            // FIX: Explicitly type the employee object from the map to resolve type errors.
            const employee: Employee | undefined = employeeMap.get(empId);
            if (!employee) continue;

            for (const date of targetDates) {
                const newStartTime = new Date(date);
                newStartTime.setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]), 0, 0);

                const newEndTime = new Date(date);
                newEndTime.setHours(parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1]), 0, 0);
                
                // Fix: Use string comparison for time to avoid Date object timezone issues when checking for overnight shifts.
                if (endTime <= startTime) {
                    newEndTime.setDate(newEndTime.getDate() + 1);
                }

                // Check for Holiday
                const holidayOnDay = allSpecialDays.find(sd => {
                    const type = allSpecialDayTypes.find(sdt => sdt.id === sd.typeId);
                    return isSameDay(sd.date, date) && type?.isHoliday && sd.coverage === 'all-day';
                });
                if (holidayOnDay) {
                    foundConflicts.push(`${employee.name} on ${date.toLocaleDateString()}: Holiday`);
                    continue;
                }

                // Check for Absence
                const absence = allAbsences.find(a => a.employeeId === empId && isDateBetween(date, a.startDate, a.endDate));
                if (absence) {
                    foundConflicts.push(`${employee.name} on ${date.toLocaleDateString()}: Absent`);
                    continue;
                }

                // Check for Overlapping Shift
                const hasOverlap = allShifts.some(s => s.employeeId === empId && newEndTime > s.startTime && newStartTime < s.endTime);
                if (hasOverlap) {
                    foundConflicts.push(`${employee.name} on ${date.toLocaleDateString()}: Overlapping shift`);
                    continue;
                }
                
                const shiftToAdd: Omit<Shift, 'id' | 'companyId'> = {
                    employeeId: empId,
                    startTime: newStartTime,
                    endTime: newEndTime,
                };

                if (locationId) {
                    shiftToAdd.locationId = locationId;
                }
                if (departmentId) {
                    shiftToAdd.departmentId = departmentId;
                }

                newShifts.push(shiftToAdd);
            }
        }

        if (foundConflicts.length > 0) {
            setError(t('modals.errorConflictTitle'));
            setConflicts(foundConflicts);
            setIsSaving(false);
            return;
        }

        if(newShifts.length > 0) {
            await onBulkSave(newShifts);
        }
        
        setIsSaving(false);
        handleClose();
    };
    
    const footer = (
        <>
            <button type="button" onClick={handleClose} className="btn-secondary">{t('modals.cancel')}</button>
            <button type="submit" form="bulk-shift-form" disabled={isSaving} className="btn-primary w-36 flex justify-center">
                {isSaving ? <Loader2 size={20} className="animate-spin" /> : t('modals.createShifts')}
            </button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={t('modals.bulkAddShifts')} footer={footer} size="2xl">
            <form id="bulk-shift-form" onSubmit={handleSubmit} className="space-y-6">
                <p className="text-sm text-slate-600 dark:text-slate-400 -mt-2">{t('modals.bulkAddShiftsDesc')}</p>
                 {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <p className="text-sm text-red-700 dark:text-red-300 font-semibold flex items-center"><AlertTriangle size={16} className="mr-2"/>{error}</p>
                        {conflicts.length > 0 && (
                            <ul className="mt-2 list-disc list-inside text-xs text-red-600 dark:text-red-400 space-y-1 max-h-24 overflow-y-auto">
                                {conflicts.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                        )}
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MultiSelectDropdown
                        label={t('modals.selectStaff')}
                        options={employeeOptions}
                        selectedIds={employeeIds}
                        onSelectionChange={setEmployeeIds}
                        placeholder={t('modals.allStaff')}
                    />
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-style">{t('modals.startTimeLabel')}</label>
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required className="input-style" />
                        </div>
                        <div>
                            <label className="label-style">{t('modals.endTimeLabel')}</label>
                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required className="input-style" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label-style">{t('modals.locationLabel')}</label>
                        <select value={locationId} onChange={e => setLocationId(e.target.value)} className="input-style">
                            <option value="">{t('modals.none')}</option>
                            {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label-style">{t('modals.departmentLabel')}</label>
                        <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} className="input-style">
                            <option value="">{t('modals.none')}</option>
                            {departments.map(dep => <option key={dep.id} value={dep.id}>{dep.name}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="label-style">{t('modals.dateRange')}</label>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="input-style"/>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} required className="input-style"/>
                    </div>
                </div>

                <div>
                    <label className="label-style">{t('modals.daysOfWeek')}</label>
                    <div className="flex justify-center space-x-1 rounded-lg bg-slate-200 dark:bg-slate-800 p-1">
                        {dayLabels.map((label, index) => (
                             <button
                                type="button"
                                key={index}
                                onClick={() => handleDayToggle(index)}
                                className={`w-10 h-10 rounded-md font-bold text-sm transition-colors ${daysOfWeek[index] ? 'bg-blue-600 text-white' : 'hover:bg-slate-300 dark:hover:bg-slate-700'}`}
                             >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <style>{`
                    .label-style { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; line-height: 1.25rem; font-weight: 500; color: #475569; }
                    .dark .label-style { color: #cbd5e1; }
                    .input-style { display: block; width: 100%; padding: 0.625rem 0.75rem; border-radius: 0.5rem; border: 1px solid #cbd5e1; background-color: #ffffff; color: #1e293b; }
                    .dark .input-style { border-color: #475569; background-color: #1e293b; color: #f8fafc; }
                    .input-style:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4); }
                    .btn-primary { padding: 0.625rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; color: white; background-color: #2563eb; transition: background-color 0.2s; }
                    .btn-primary:hover:not(:disabled) { background-color: #1d4ed8; }
                    .btn-primary:disabled { background-color: #93c5fd; cursor: not-allowed; }
                    .btn-secondary { padding: 0.625rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; color: #334155; background-color: #e2e8f0; }
                    .dark .btn-secondary { color: #e2e8f0; background-color: #334155; }
                    .btn-secondary:hover { background-color: #cbd5e1; }
                    .dark .btn-secondary:hover { background-color: #475569; }
                `}</style>
            </form>
        </Modal>
    );
};

export default BulkShiftEditor;