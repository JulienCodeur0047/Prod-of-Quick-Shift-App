import React, { useState, useEffect, useRef } from 'react';
import { Employee, Role, EmployeeAvailability, WeeklyAvailability } from '../types';
import { Trash2, Upload, KeyRound, RefreshCw } from 'lucide-react';
import Modal from './Modal';
import Avatar from './Avatar';
import { useLanguage } from '../contexts/LanguageContext';
import AvailabilityEditor from './AvailabilityEditor';
import { useAuth } from '../contexts/AuthContext';

interface EmployeeEditorProps {
    employee: Employee | null;
    roles: Role[];
    onSave: (employee: Employee, isNew: boolean) => void;
    onClose: () => void;
    onDelete?: (employeeId: string) => void;
    employeeAvailability?: EmployeeAvailability;
    onSaveAvailability: (employeeId: string, availability: WeeklyAvailability) => void;
    onRegenerateAccessCode: (employeeId: string) => void;
}

const GENDERS: Employee['gender'][] = ['Male', 'Female', 'Other', 'Prefer not to say'];
const generateAccessCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const getInitialFormData = (employee: Employee | null, roles: Role[]): Partial<Employee> => ({
    name: employee?.name || '',
    email: employee?.email || '',
    role: employee?.role || (roles[0]?.name || ''),
    avatarUrl: employee?.avatarUrl || null,
    phone: employee?.phone || '',
    gender: employee?.gender || 'Prefer not to say',
    accessCode: employee?.accessCode || '',
});

const EmployeeEditor: React.FC<EmployeeEditorProps> = ({ employee, roles, onSave, onClose, onDelete, employeeAvailability, onSaveAvailability, onRegenerateAccessCode }) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [formData, setFormData] = useState<Partial<Employee>>(getInitialFormData(employee, roles));
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'availability'>('details');


    useEffect(() => {
        const initialData = getInitialFormData(employee, roles);
        // If it's a new employee for a Pro Plus user, generate an access code
        if (!employee && user?.plan === 'Pro Plus') {
            initialData.accessCode = generateAccessCode();
        }
        setFormData(initialData);
        setError('');
        setActiveTab('details');
    }, [employee, roles, user?.plan]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prevFormData => ({ ...prevFormData, avatarUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email) {
            setError('Name and email are required.');
            return;
        }

        const isNew = !employee;
        const employeeToSave: Employee = {
            id: employee?.id || `emp-${Date.now()}`,
            name: formData.name!,
            email: formData.email!,
            role: formData.role || (roles[0]?.name || 'Unassigned'),
            avatarUrl: formData.avatarUrl || null,
            phone: formData.phone || '',
            gender: formData.gender || 'Prefer not to say',
            companyId: user!.companyId,
            accessCode: formData.accessCode,
        };
        onSave(employeeToSave, isNew);
    };

    const handleDelete = () => {
        if (employee && onDelete && window.confirm(t('modals.confirmDelete', { name: employee.name }))) {
            onDelete(employee.id);
        }
    };

    const handleRegenerate = () => {
        if (employee && window.confirm(t('profile.confirmRegenerateCode', { name: employee.name }))) {
            const newCode = generateAccessCode();
            setFormData(prev => ({ ...prev, accessCode: newCode }));
            // We call the main save function to persist this, which gives the user a chance to cancel
        }
    }
    
    const title = employee ? t('modals.editEmployee') : t('modals.addEmployee');

    const tabClasses = (tabName: 'details' | 'availability') => 
        `px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === tabName
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
        }`;

    const detailsFooter = (
        <div className="flex justify-between items-center w-full">
            <div>
                {employee && onDelete && (
                    <button type="button" onClick={handleDelete} className="btn-danger p-2">
                        <Trash2 size={20} />
                    </button>
                )}
            </div>
            <div className="flex space-x-2">
                <button type="button" onClick={onClose} className="btn-secondary">{t('modals.cancel')}</button>
                <button type="submit" form="employee-editor-form" className="btn-primary">{t('modals.save')}</button>
            </div>
        </div>
    );


    return (
        <Modal isOpen={true} onClose={onClose} title={title} footer={activeTab === 'details' ? detailsFooter : undefined}>
            <div className="border-b border-slate-200 dark:border-slate-700 -mt-6 -mx-6 mb-6">
                <nav className="flex space-x-2 px-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('details')} className={tabClasses('details')}>
                        {t('modals.details')}
                    </button>
                    {employee && ( // Only show availability tab for existing employees
                         <button onClick={() => setActiveTab('availability')} className={tabClasses('availability')}>
                            {t('modals.availability')}
                        </button>
                    )}
                </nav>
            </div>
            
            {activeTab === 'details' && (
                <form id="employee-editor-form" onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-red-500 text-sm bg-red-100 dark:bg-red-900/30 p-2 rounded-md">{error}</p>}
                    
                    <div className="flex flex-col items-center space-y-2">
                        <div className="relative">
                            <Avatar name={formData.name || ''} src={formData.avatarUrl} className="w-24 h-24 rounded-full" />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors">
                                <Upload size={16} />
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <div>
                            <label htmlFor="name" className="label-style">{t('modals.fullNameLabel')}</label>
                            <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required className="input-style mt-1" />
                        </div>
                        <div>
                            <label htmlFor="email" className="label-style">{t('modals.emailLabel')}</label>
                            <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required className="input-style mt-1" />
                        </div>
                         <div>
                            <label htmlFor="phone" className="label-style">{t('modals.phoneLabel')}</label>
                            <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} className="input-style mt-1" />
                        </div>
                        <div>
                            <label htmlFor="gender" className="label-style">{t('modals.genderLabel')}</label>
                            <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className="input-style mt-1">
                                {GENDERS.map(g => <option key={g} value={g}>{t(`gender.${g.toLowerCase().replace(/ /g, '').replace(/[^a-zA-Z]/g, '')}`)}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="role" className="label-style">{t('modals.roleLabel')}</label>
                            <select id="role" name="role" value={formData.role} onChange={handleChange} className="input-style mt-1">
                                {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                            </select>
                        </div>
                    </div>
                     {user?.plan === 'Pro Plus' && (
                        <div className="pt-4 mt-4 border-t dark:border-slate-800">
                             <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300 flex items-center mb-2"><KeyRound size={18} className="mr-2 text-blue-500" />{t('profile.mobileAccess')}</h4>
                            <div>
                                <label htmlFor="accessCode" className="label-style">{t('profile.accessCode')}</label>
                                <div className="flex items-center space-x-2">
                                    <input id="accessCode" name="accessCode" type="text" value={formData.accessCode} readOnly className="input-style mt-1 font-mono tracking-widest bg-slate-100 dark:bg-slate-800" />
                                    <button type="button" onClick={handleRegenerate} title={t('profile.regenerateCode')} className="p-2.5 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('profile.accessCodeDescription')}</p>
                            </div>
                        </div>
                    )}
                </form>
            )}

            {activeTab === 'availability' && employee && (
                <AvailabilityEditor
                    employeeId={employee.id}
                    initialAvailability={employeeAvailability?.availability}
                    onSave={onSaveAvailability}
                />
            )}

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
        </Modal>
    );
};

export default EmployeeEditor;