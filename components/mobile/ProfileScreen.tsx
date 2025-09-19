import React from 'react';
import { useMobileAuth } from '../../contexts/MobileAuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Avatar from '../Avatar';
import { LogOut, Mail, Phone, User } from 'lucide-react';

const InfoRow: React.FC<{ icon: React.ReactNode, label: string, value: string | undefined }> = ({ icon, label, value }) => (
    <div className="flex items-center p-3">
        <div className="text-slate-500 dark:text-slate-400 mr-4">{icon}</div>
        <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{value || 'N/A'}</p>
        </div>
    </div>
);

const ProfileScreen: React.FC = () => {
    const { employee, logout } = useMobileAuth();
    const { t } = useLanguage();

    if (!employee) return null;

    return (
        <div className="flex flex-col h-full relative">
             <header className="p-4 md:p-6 text-center pt-8">
                 <Avatar name={employee.name} src={employee.avatarUrl} className="w-24 h-24 rounded-full mx-auto" />
                 <h2 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-100">{employee.name}</h2>
                 <p className="text-sm text-slate-500 dark:text-slate-400">{employee.email}</p>
             </header>

            <div className="flex-grow p-4 md:p-6">
                <div className="bg-white dark:bg-blue-night-900 rounded-lg shadow-sm divide-y divide-slate-200 dark:divide-slate-800">
                    <InfoRow icon={<Mail size={20} />} label={t('mobile.email')} value={employee.email} />
                    <InfoRow icon={<Phone size={20} />} label={t('mobile.phone')} value={employee.phone} />
                    <InfoRow icon={<User size={20} />} label={t('mobile.gender')} value={t(`gender.${employee.gender.toLowerCase().replace(/ /g, '').replace(/[^a-zA-Z]/g, '')}`)} />
                </div>
            </div>

            <div className="p-4 md:p-6 mt-auto">
                 <button
                    onClick={logout}
                    className="w-full flex justify-center items-center px-4 py-3 font-semibold text-red-600 bg-red-100 hover:bg-red-200 dark:text-red-300 dark:bg-red-900/50 dark:hover:bg-red-900 rounded-lg"
                 >
                    <LogOut size={16} className="mr-2" />
                    {t('mobile.logout')}
                </button>
            </div>
        </div>
    );
};

export default ProfileScreen;