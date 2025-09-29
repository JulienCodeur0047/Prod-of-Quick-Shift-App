
import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Edit, Upload, Lock, Gem, AlertTriangle, CheckCircle, LogOut, ExternalLink } from 'lucide-react';
import Avatar from './Avatar';
import { useCurrency } from '../contexts/CurrencyContext';
import { Plan } from '../types';
import Modal from './Modal';

const ProfileCard: React.FC<{ children: React.ReactNode, title: string }> = ({ children, title }) => (
    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl shadow-md">
        <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">{title}</h3>
        {children}
    </div>
);

const Illustration: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="bg-slate-100 dark:bg-blue-night-950/50 p-6 rounded-2xl text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center h-full">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-500 mb-2">
                <path d="M18 9.5C18 12.5376 15.3137 15 12 15C8.68629 15 6 12.5376 6 9.5C6 6.46243 8.68629 4 12 4C15.3137 4 18 6.46243 18 9.5Z" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M12 15V21" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M8 18H16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M3 21H21" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M12 4C11.3833 4 10.8333 3.41667 10.5 2.5C10.1667 1.58333 9.5 1 8.5 1C7.5 1 7 2 7 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M12 4C12.6167 4 13.1667 3.41667 13.5 2.5C13.8333 1.58333 14.5 1 15.5 1C16.5 1 17 2 17 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t('profile.illustrationTitle')}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('profile.illustrationDesc')}</p>
        </div>
    );
};


const Profile: React.FC = () => {
    const { user, subscription, paymentHistory, updateUser, changePassword, logout } = useAuth();
    const { t } = useLanguage();
    const { formatCurrency } = useCurrency();
    
    const [name, setName] = useState(user?.name || '');
    const [isEditingName, setIsEditingName] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const handleNameSave = () => {
        if (name.trim() && user) {
            updateUser({ name: name.trim() });
            setIsEditingName(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && user) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                updateUser({ avatarUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePasswordModalClose = () => {
        setIsPasswordModalOpen(false);
        setPasswordData({ current: '', new: '', confirm: '' });
        setPasswordError('');
        setPasswordSuccess('');
    };

    const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (!passwordData.new) {
            setPasswordError(t('profile.passwordEmptyError'));
            return;
        }
        if (passwordData.new !== passwordData.confirm) {
            setPasswordError(t('profile.passwordMismatchError'));
            return;
        }
        
        const result = await changePassword(passwordData.current, passwordData.new);
        if (result.success) {
            setPasswordSuccess(t(result.messageKey));
            setTimeout(handlePasswordModalClose, 1500); // Close after 1.5s
        } else {
            setPasswordError(t(result.messageKey));
        }
    };

    if (!user) {
        return <div>Loading profile...</div>;
    }

    const planPriceKeys: { [key in Plan]: string } = {
        'Gratuit': 'freePlanPrice',
        'Pro': 'proPlanPrice',
        'Pro Plus': 'proPlusPlanPrice'
    };
    
    const getPlanPrice = () => {
        if (!subscription) return 0;
        const priceKey = planPriceKeys[subscription.plan];
        return Number(t(`pricing.${priceKey}`));
    };
    
    const btnPrimary = "inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed";
    const btnSecondary = "inline-flex items-center justify-center px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500";
    const btnDangerOutline = "inline-flex items-center justify-center px-4 py-2 bg-transparent text-red-600 font-semibold rounded-lg transition-colors border border-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30";


    const passwordModalFooter = (
        <>
            <button type="button" onClick={handlePasswordModalClose} className={btnSecondary}>{t('modals.cancel')}</button>
            <button type="submit" form="password-change-form" className={btnPrimary}>{t('modals.save')}</button>
        </>
    );

    return (
        <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-8">{t('profile.title')}</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    <ProfileCard title={t('profile.profileDetails')}>
                        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                            <div className="relative">
                                <Avatar name={user.name} src={user.avatarUrl} className="w-24 h-24 rounded-full" />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors shadow" aria-label="Upload new avatar">
                                    <Upload size={16} />
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                            </div>
                            <div className="flex-grow text-center md:text-left">
                                {isEditingName ? (
                                    <div className="flex items-center space-x-2">
                                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-style" />
                                        <button onClick={handleNameSave} className={`${btnPrimary} text-sm`}>{t('modals.save')}</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-3 justify-center md:justify-start">
                                        <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{user.name}</h4>
                                        <button onClick={() => setIsEditingName(true)} className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400">
                                            <Edit size={18} />
                                        </button>
                                    </div>
                                )}
                                <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
                            </div>
                        </div>
                    </ProfileCard>
                    
                    <ProfileCard title={t('profile.companyInformation')}>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center py-2 border-b dark:border-slate-800">
                                <span className="font-medium text-slate-500 dark:text-slate-400">{t('profile.companyName')}</span>
                                <span className="font-semibold text-right text-slate-700 dark:text-slate-200">{user.companyName}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b dark:border-slate-800">
                                <span className="font-medium text-slate-500 dark:text-slate-400">{t('profile.businessType')}</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{t(`auth.businessType${user.businessType}`)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b dark:border-slate-800">
                                <span className="font-medium text-slate-500 dark:text-slate-400">{t('profile.activitySector')}</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{user.activitySector ? t(`auth.activitySector${user.activitySector.replace(/\s/g, '')}`) : t('profile.notProvided')}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="font-medium text-slate-500 dark:text-slate-400">{t('profile.address')}</span>
                                <span className="font-semibold text-right text-slate-700 dark:text-slate-200">{user.address || t('profile.notProvided')}</span>
                            </div>
                        </div>
                    </ProfileCard>
                    
                    {paymentHistory.length > 0 && (
                        <ProfileCard title={t('profile.paymentHistory')}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-slate-800 dark:text-slate-200">
                                    <thead className="text-xs text-slate-700 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">{t('profile.paymentDate')}</th>
                                            <th scope="col" className="px-6 py-3">{t('profile.paymentAmount')}</th>
                                            <th scope="col" className="px-6 py-3">{t('profile.paymentPlan')}</th>
                                            <th scope="col" className="px-6 py-3">{t('profile.paymentStatus')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentHistory.map(payment => (
                                            <tr key={payment.id} className="border-b dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50">
                                                <td className="px-6 py-4">{payment.date.toLocaleDateString()}</td>
                                                <td className="px-6 py-4">{formatCurrency(payment.amount)}</td>
                                                <td className="px-6 py-4">{payment.plan}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${payment.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800'}`}>
                                                        {t(`profile.paymentStatus${payment.status}`)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ProfileCard>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                    <Illustration />
                    
                    <ProfileCard title={t('profile.subscription')}>
                        <div className="bg-blue-50 dark:bg-slate-800/50 p-4 rounded-lg mb-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <Gem size={18} className="mr-2 text-yellow-500" />
                                    <p className="font-bold text-lg text-blue-800 dark:text-blue-300">{user.plan} {t('profile.plan')}</p>
                                </div>
                                {subscription && <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(getPlanPrice())}<span className="text-sm font-normal text-slate-500">/mo</span></p>}
                            </div>
                            {subscription && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('profile.renewsOn')} {subscription.renewalDate.toLocaleDateString()}</p>}
                        </div>
                        <div className="mt-4 flex justify-end">
                            {user.plan === 'Gratuit' ? (
                                <button onClick={() => window.location.href = '/#pricing'} className={btnPrimary}>
                                    {t('profile.upgradeToPro')}
                                </button>
                            ) : (
                                <button onClick={() => alert(t('profile.manageSubscriptionAlert'))} className={btnSecondary}>
                                    {t('profile.manageSubscription')} <ExternalLink size={16} className="ml-2"/>
                                </button>
                            )}
                        </div>
                    </ProfileCard>
                    
                    <ProfileCard title={t('profile.security')}>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium text-slate-700 dark:text-slate-200">{t('profile.password')}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t('profile.passwordLastChanged')}</p>
                            </div>
                            <button onClick={() => setIsPasswordModalOpen(true)} className={btnSecondary}>
                                <Lock size={16} className="mr-2" />
                                {t('profile.changePassword')}
                            </button>
                        </div>
                    </ProfileCard>

                     <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl shadow-md border-2 border-red-500/20">
                        <h3 className="text-xl font-bold mb-2 text-red-700 dark:text-red-400">{t('profile.dangerZone')}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('profile.dangerZoneDesc')}</p>
                        <div className="flex justify-between items-center">
                            <span className="font-medium">{t('profile.logout')}</span>
                            <button onClick={logout} className={btnDangerOutline}>
                                <LogOut size={16} className="mr-2" />
                                {t('profile.logout')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={isPasswordModalOpen} onClose={handlePasswordModalClose} title={t('profile.changePasswordTitle')} footer={passwordModalFooter}>
                <form id="password-change-form" onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                    {passwordError && <p className="text-red-600 dark:text-red-400 text-sm bg-red-100 dark:bg-red-900/30 p-3 rounded-lg flex items-center"><AlertTriangle size={16} className="mr-2"/>{passwordError}</p>}
                    {passwordSuccess && <p className="text-green-600 dark:text-green-400 text-sm bg-green-100 dark:bg-green-900/30 p-3 rounded-lg flex items-center"><CheckCircle size={16} className="mr-2"/>{passwordSuccess}</p>}
                    <div>
                        <label className="label-style">{t('profile.currentPassword')}</label>
                        <input type="password" value={passwordData.current} onChange={e => setPasswordData({...passwordData, current: e.target.value})} required className="input-style mt-1" />
                    </div>
                    <div>
                        <label className="label-style">{t('profile.newPassword')}</label>
                        <input type="password" value={passwordData.new} onChange={e => setPasswordData({...passwordData, new: e.target.value})} required className="input-style mt-1" />
                    </div>
                     <div>
                        <label className="label-style">{t('profile.confirmNewPassword')}</label>
                        <input type="password" value={passwordData.confirm} onChange={e => setPasswordData({...passwordData, confirm: e.target.value})} required className="input-style mt-1" />
                    </div>
                </form>
            </Modal>

            <style>{`
                .label-style { display: block; margin-bottom: 0.375rem; font-size: 0.875rem; line-height: 1.25rem; font-weight: 500; color: #475569; }
                .dark .label-style { color: #cbd5e1; }
                .input-style { display: block; width: 100%; padding: 0.625rem 0.75rem; border-radius: 0.5rem; border: 1px solid #cbd5e1; background-color: #ffffff; color: #1e293b; }
                .dark .input-style { border-color: #475569; background-color: #1e293b; color: #f8fafc; }
                .input-style:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4); }
            `}</style>
        </div>
    );
};

export default Profile;
