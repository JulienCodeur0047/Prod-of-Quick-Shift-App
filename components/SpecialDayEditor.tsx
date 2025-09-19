import React, { useState, useEffect } from 'react';
import { SpecialDay, SpecialDayType } from '../types';
import { Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';

interface SpecialDayEditorProps {
    date: Date;
    specialDay: SpecialDay | null;
    specialDayTypes: SpecialDayType[];
    onSave: (specialDay: SpecialDay) => void;
    onCancel: () => void;
    onDelete?: (specialDayId: string) => void;
}

const toInputDateString = (date: Date) => date.toISOString().split('T')[0];

const SpecialDayEditor: React.FC<SpecialDayEditorProps> = ({ date, specialDay, specialDayTypes, onSave, onCancel, onDelete }) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    
    const getInitialState = () => ({
        typeId: specialDay?.typeId || (specialDayTypes[0]?.id || ''),
        coverage: specialDay?.coverage || 'all-day',
    });

    const [formData, setFormData] = useState(getInitialState);

    useEffect(() => {
        setFormData(getInitialState());
    }, [specialDay, specialDayTypes]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedSpecialDay: SpecialDay = {
            id: specialDay?.id || `sd-${date.getTime()}`,
            date: date,
            typeId: formData.typeId,
            coverage: formData.coverage as SpecialDay['coverage'],
            companyId: user!.companyId,
        };
        onSave(updatedSpecialDay);
    };

    const handleDelete = () => {
        if (specialDay && onDelete && window.confirm('Are you sure you want to remove this special day?')) {
            onDelete(specialDay.id);
        }
    };
    
    const title = specialDay ? t('schedule.editSpecialDay') : t('schedule.markSpecialDay');

    const modalFooter = (
        <div className="flex justify-between items-center w-full">
            <div>
                {specialDay && onDelete && (
                    <button type="button" onClick={handleDelete} className="btn-danger p-2">
                        <Trash2 size={20} />
                    </button>
                )}
            </div>
            <div className="flex space-x-2">
                <button type="button" onClick={onCancel} className="btn-secondary">{t('modals.cancel')}</button>
                <button type="submit" form="special-day-form" className="btn-primary">{t('modals.save')}</button>
            </div>
        </div>
    );

    return (
        <Modal isOpen={true} onClose={onCancel} title={title} footer={modalFooter}>
            <form id="special-day-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="label-style">{t('modals.dateLabel')}</label>
                    <input type="text" value={date.toLocaleDateString()} disabled className="input-style mt-1 bg-slate-100 dark:bg-slate-800" />
                </div>

                <div>
                    <label htmlFor="typeId" className="label-style">{t('modals.typeLabel')}</label>
                    <select id="typeId" name="typeId" value={formData.typeId} onChange={handleChange} className="input-style mt-1">
                        {specialDayTypes.map(sdt => <option key={sdt.id} value={sdt.id}>{sdt.name}</option>)}
                    </select>
                </div>
                
                <div>
                    <label htmlFor="coverage" className="label-style">{t('modals.coverageLabel')}</label>
                    <select id="coverage" name="coverage" value={formData.coverage} onChange={handleChange} className="input-style mt-1">
                        <option value="all-day">{t('modals.coverageAllDay')}</option>
                        <option value="morning">{t('modals.coverageMorning')}</option>
                        <option value="afternoon">{t('modals.coverageAfternoon')}</option>
                        <option value="evening">{t('modals.coverageEvening')}</option>
                    </select>
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

export default SpecialDayEditor;