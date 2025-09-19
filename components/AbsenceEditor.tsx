import React, { useState, useEffect } from 'react';
import { Absence, Employee, AbsenceType, Shift, SpecialDay, SpecialDayType } from '../types';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';

interface AbsenceEditorProps {
    absence: Absence | null;
    employees: Employee[];
    absenceTypes: AbsenceType[];
    allShifts: Shift[];
    allSpecialDays: SpecialDay[];
    allSpecialDayTypes: SpecialDayType[];
    onSave: (absence: Absence) => void;
    onCancel: () => void;
    onDelete?: (absenceId: string) => void;
}

const toInputDateString = (date: Date) => date.toISOString().split('T')[0];

const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

const AbsenceEditor: React.FC<AbsenceEditorProps> = (props) => {
    const { absence, employees, absenceTypes, allShifts, allSpecialDays, allSpecialDayTypes, onSave, onCancel, onDelete } = props;
    const { t } = useLanguage();
    const { user } = useAuth();
    
    const getInitialState = () => {
        const today = new Date();
        return {
            employeeId: absence?.employeeId || (employees[0]?.id || ''),
            absenceTypeId: absence?.absenceTypeId || (absenceTypes[0]?.id || ''),
            startDate: toInputDateString(absence?.startDate || today),
            endDate: toInputDateString(absence?.endDate || today),
        };
    };

    const [formData, setFormData] = useState(getInitialState);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setFormData(getInitialState());
    }, [absence, employees, absenceTypes]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newStartDate = new Date(formData.startDate);
        newStartDate.setHours(0,0,0,0);
        const newEndDate = new Date(formData.endDate);
        newEndDate.setHours(23,59,59,999);

        if (newEndDate < newStartDate) {
            setError("End date must be after start date.");
            return;
        }
        
        if (!formData.employeeId || !formData.absenceTypeId) {
             setError("Please select an employee and an absence type.");
            return;
        }

        // Holiday conflict
        for (let d = new Date(newStartDate); d <= newEndDate; d.setDate(d.getDate() + 1)) {
            const holidayOnDay = allSpecialDays.find(sd => {
                const type = allSpecialDayTypes.find(sdt => sdt.id === sd.typeId);
                return isSameDay(sd.date, d) && type?.isHoliday && sd.coverage === 'all-day';
            });
            if (holidayOnDay) {
                const typeName = allSpecialDayTypes.find(sdt => sdt.id === holidayOnDay.typeId)?.name || 'Holiday';
                setError(`Cannot schedule absence on a ${typeName} (${d.toLocaleDateString()}).`);
                return;
            }
        }

        // Conflict detection with shifts
        const conflictingShift = allShifts.find(shift => {
            if (shift.employeeId !== formData.employeeId) return false;
            // Check if the shift range overlaps with the absence range
            const shiftStart = new Date(shift.startTime);
            const shiftEnd = new Date(shift.endTime);
            return shiftStart < newEndDate && shiftEnd > newStartDate;
        });

        if (conflictingShift) {
            const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setError(`This employee has a conflicting shift from ${formatTime(conflictingShift.startTime)} to ${formatTime(conflictingShift.endTime)}.`);
            return;
        }

        const updatedAbsence: Absence = {
            id: absence?.id || `absence-${Date.now()}`,
            employeeId: formData.employeeId,
            absenceTypeId: formData.absenceTypeId,
            startDate: newStartDate,
            endDate: newEndDate,
            companyId: user!.companyId,
        };
        onSave(updatedAbsence);
    };

    const handleDelete = () => {
        if (absence && onDelete && window.confirm('Are you sure you want to delete this absence entry?')) {
            onDelete(absence.id);
        }
    };
    
    const title = absence ? t('schedule.editAbsence') : t('schedule.addAbsenceTitle');

    const modalFooter = (
        <div className="flex justify-between items-center w-full">
            <div>
                {absence && onDelete && (
                     <button type="button" onClick={handleDelete} className="btn-danger p-2">
                        <Trash2 size={20} />
                    </button>
                )}
            </div>
            <div className="flex space-x-2">
                <button type="button" onClick={onCancel} className="btn-secondary">{t('modals.cancel')}</button>
                <button type="submit" form="absence-editor-form" className="btn-primary">{t('modals.saveAbsence')}</button>
            </div>
        </div>
    );


    return (
        <Modal isOpen={true} onClose={onCancel} title={title} footer={modalFooter}>
            <form id="absence-editor-form" onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-600 dark:text-red-400 text-sm bg-red-100 dark:bg-red-900/30 p-3 rounded-lg flex items-center"><AlertTriangle size={16} className="mr-2"/>{error}</p>}
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="employeeId" className="label-style">{t('modals.employeeLabel')}</label>
                        <select id="employeeId" name="employeeId" value={formData.employeeId} onChange={handleChange} className="input-style mt-1">
                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="absenceTypeId" className="label-style">{t('modals.absenceTypeLabel')}</label>
                        <select id="absenceTypeId" name="absenceTypeId" value={formData.absenceTypeId} onChange={handleChange} className="input-style mt-1">
                            {absenceTypes.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startDate" className="label-style">{t('modals.startDateLabel')}</label>
                        <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} className="input-style mt-1" />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="label-style">{t('modals.endDateLabel')}</label>
                        <input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} className="input-style mt-1" />
                    </div>
                </div>
                <style>{`
                    .label-style { display: block; margin-bottom: 0.375rem; font-size: 0.875rem; line-height: 1.25rem; font-weight: 500; color: #475569; }
                    .dark .label-style { color: #cbd5e1; }
                    .input-style { display: block; width: 100%; padding: 0.625rem 0.75rem; border-radius: 0.5rem; border: 1px solid #cbd5e1; background-color: #ffffff; color: #1e293b; }
                    .dark .input-style { border-color: #475569; background-color: #1e293b; color: #f8fafc; }
                    .input-style:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4); }
                    .btn-primary { padding: 0.625rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; color: white; background-color: #2563eb; transition: background-color 0.2s; }
                    .btn-primary:hover { background-color: #1d4ed8; }
                    .btn-secondary { padding: 0.625rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; color: #334155; background-color: #e2e8f0; }
                    .dark .btn-secondary { color: #e2e8f0; background-color: #334155; }
                    .btn-secondary:hover { background-color: #cbd5e1; }
                    .dark .btn-secondary:hover { background-color: #475569; }
                    .btn-danger { padding: 0.625rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; color: #dc2626; background-color: #fee2e2; }
                    .dark .btn-danger { color: #f87171; background-color: rgba(153, 27, 27, 0.4); }
                    .btn-danger:hover { background-color: #fecaca; }
                    .dark .btn-danger:hover { background-color: rgba(153, 27, 27, 0.6); }
                `}</style>
            </form>
        </Modal>
    );
};

export default AbsenceEditor;