

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { User, BusinessType, ActivitySector } from '../types';
import Avatar from './Avatar';
// FIX: Import User as UserIcon from lucide-react to resolve name conflict with the User type.
import { Edit, Save, Lock, Gem, Building, MapPin, Briefcase, AlertTriangle, CheckCircle, User as UserIcon } from 'lucide-react';

const Profile: React.FC = () => {
    const { user, updateUser, changePassword } = useAuth();
    const { t } = useLanguage();
    
    const [formData, setFormData] = useState<Partial<User>>({});
    const [isEditing, setIsEditing] = useState(false);
    
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    
    const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' });
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                companyName: user.companyName,
                businessType: user.businessType,
                activitySector: user.activitySector,
                address: user.address || '',
            });
        }
    }, [user]);

    if (!user) {
        return null;
    }

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdateMessage({ type: '', text: '' });
        try {
            await updateUser(formData);
            setUpdateMessage({ type: 'success', text: t('profile.updateSuccess') });
            setIsEditing(false);
        } catch (error) {
            setUpdateMessage({ type: 'error', text: t('profile.updateError') });
        }
    };
    
    const handlePasswordDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };
    
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage({ type: '', text: '' });
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ type: 'error', text: t('profile.passwordMismatchError') });
            return;
        }
        if (passwordData.newPassword.length < 6) {
             setPasswordMessage({ type: 'error', text: t('profile.passwordLengthError') });
            return;
        }
        const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
        if(result.success) {
            setPasswordMessage({ type: 'success', text: t(result.messageKey) });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } else {
            setPasswordMessage({ type: 'error', text: t(result.messageKey) });
        }
    };

    const Message: React.FC<{ message: {type: string, text: string} }> = ({ message }) => {
        if (!message.text) return null;
        const isSuccess = message.type === 'success';
        const icon = isSuccess ? <CheckCircle size={16} className="mr-2"/> : <AlertTriangle size={16} className="mr-2"/>;
        const classes = isSuccess 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';

        return (
            <div className={`p-3 rounded-lg text-sm flex items-center ${classes}`}>
                {icon}
                {message.text}
            </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-slide-in-up">
            <header className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-md flex flex-col md:flex-row items-center gap-6">
                <Avatar name={user.name} src={user.avatarUrl} className="w-24 h-24 rounded-full" />
                <div className="text-center md:text-left">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{user.name}</h2>
                    <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
                    <div className="flex items-center justify-center md:justify-start mt-2 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 px-3 py-1 rounded-full text-sm font-semibold">
                        <Gem size={14} className="mr-2" />
                        <span>{t('profile.plan')}: {user.plan}</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile Details */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b dark:border-slate-800">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('profile.profileDetails')}</h3>
                        <button onClick={() => setIsEditing(!isEditing)} className="btn-secondary flex items-center">
                            {isEditing ? <Save size={16} className="mr-2"/> : <Edit size={16} className="mr-2"/>}
                            {isEditing ? t('profile.save') : t('profile.edit')}
                        </button>
                    </div>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        {updateMessage.text && <Message message={updateMessage} />}
                        <InfoItem icon={<UserIcon size={18}/>} label={t('profile.fullName')}>
                            <input name="name" value={formData.name || ''} onChange={handleFormChange} disabled={!isEditing} className="input-style"/>
                        </InfoItem>
                         <InfoItem icon={<Building size={18}/>} label={t('profile.companyName')}>
                            <input name="companyName" value={formData.companyName || ''} onChange={handleFormChange} disabled={!isEditing} className="input-style"/>
                        </InfoItem>
                         <InfoItem icon={<Briefcase size={18}/>} label={t('profile.businessType')}>
                             <select name="businessType" value={formData.businessType || ''} onChange={handleFormChange} disabled={!isEditing} className="input-style">
                                 {(['Individual', 'Company', 'Other'] as BusinessType[]).map(bt => <option key={bt} value={bt}>{t(`auth.businessType${bt}`)}</option>)}
                             </select>
                        </InfoItem>
                         <InfoItem icon={<Briefcase size={18}/>} label={t('profile.activitySector')}>
                            <select name="activitySector" value={formData.activitySector || ''} onChange={handleFormChange} disabled={!isEditing} className="input-style">
                                 <option value="">-- {t('modals.none')} --</option>
                                 {(['Individual', 'Health', 'Technology', 'Administration', 'Finance', 'Commerce', 'Social', 'Other'] as ActivitySector[]).map(as => <option key={as} value={as}>{t(`auth.activitySector${as}`)}</option>)}
                            </select>
                        </InfoItem>
                         <InfoItem icon={<MapPin size={18}/>} label={t('profile.address')}>
                            <input name="address" value={formData.address || ''} onChange={handleFormChange} disabled={!isEditing} className="input-style"/>
                        </InfoItem>
                        {isEditing && <button type="submit" className="w-full btn-primary mt-2">{t('profile.saveChanges')}</button>}
                    </form>
                </div>
                {/* Change Password */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md">
                     <div className="mb-4 pb-4 border-b dark:border-slate-800">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center"><Lock size={20} className="mr-2"/>{t('profile.changePassword')}</h3>
                    </div>
                     <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        {passwordMessage.text && <Message message={passwordMessage} />}
                         <div>
                            <label className="label-style">{t('profile.currentPassword')}</label>
                            <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordDataChange} className="input-style" required/>
                        </div>
                         <div>
                            <label className="label-style">{t('profile.newPassword')}</label>
                            <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordDataChange} className="input-style" required/>
                        </div>
                         <div>
                            <label className="label-style">{t('profile.confirmNewPassword')}</label>
                            <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordDataChange} className="input-style" required/>
                        </div>
                        <button type="submit" className="w-full btn-primary">{t('profile.updatePassword')}</button>
                    </form>
                </div>
            </div>
            <style>{`
                .label-style { display: block; margin-bottom: 0.25rem; font-size: 0.75rem; line-height: 1rem; font-weight: 500; color: #64748b; }
                .dark .label-style { color: #94a3b8; }
                .input-style { display: block; width: 100%; padding: 0.5rem 0.75rem; border-radius: 0.5rem; border: 1px solid #cbd5e1; background-color: #ffffff; color: #1e293b; }
                .dark .input-style { border-color: #475569; background-color: #1e293b; color: #f8fafc; }
                .input-style:disabled { background-color: #f1f5f9; cursor: not-allowed; }
                .dark .input-style:disabled { background-color: #334155; }
                .btn-primary { padding: 0.625rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; color: white; background-color: #2563eb; transition: background-color 0.2s; }
                .btn-primary:hover { background-color: #1d4ed8; }
                .btn-secondary { padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; color: #334155; background-color: #e2e8f0; }
                .dark .btn-secondary { color: #e2e8f0; background-color: #334155; }
                .btn-secondary:hover { background-color: #cbd5e1; }
                .dark .btn-secondary:hover { background-color: #475569; }
            `}</style>
        </div>
    );
};

const InfoItem: React.FC<{icon: React.ReactNode, label: string, children: React.ReactNode}> = ({ icon, label, children }) => (
    <div>
        <label className="label-style flex items-center">{icon} <span className="ml-2">{label}</span></label>
        {children}
    </div>
);

export default Profile;