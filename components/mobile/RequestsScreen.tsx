import React, { useState } from 'react';
import { useMobileData } from '../../contexts/MobileDataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Loader2, Send } from 'lucide-react';
import Modal from '../Modal';
import LanguageSwitcher from '../LanguageSwitcher';
import ThemeToggle from '../ThemeToggle';
import { AbsenceType, InboxMessage } from '../../types';
import LoadingSpinner from '../LoadingSpinner';

const toInputDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};

const getStatusStyles = (status: InboxMessage['status']) => {
    switch (status) {
        case 'validated': return { borderColor: 'border-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-800 dark:text-green-300' };
        case 'refused': return { borderColor: 'border-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-800 dark:text-red-300' };
        case 'followed-up': return { borderColor: 'border-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-800 dark:text-blue-300' };
        default: return { borderColor: 'border-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-800', textColor: 'text-slate-800 dark:text-slate-300' };
    }
};

const RequestHistoryItem: React.FC<{ message: InboxMessage; absenceTypes: AbsenceType[] }> = ({ message, absenceTypes }) => {
    const { t } = useLanguage();
    const styles = getStatusStyles(message.status);
    const absenceType = message.absenceTypeId ? absenceTypes.find(at => at.id === message.absenceTypeId) : null;

    let statusLabelKey = `inbox.status${message.status.charAt(0).toUpperCase() + message.status.slice(1).replace('-', '')}`;
    if (message.type === 'complaint' && message.status === 'pending') {
        statusLabelKey = 'inbox.statusNotYetFollowed';
    }
    const statusLabel = t(statusLabelKey);

    return (
        <div className={`bg-white dark:bg-blue-night-900 p-3 rounded-lg shadow-sm border-l-4 ${styles.borderColor}`}>
            <div className="flex justify-between items-start text-xs">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{message.subject}</p>
                <p className="text-slate-500 dark:text-slate-400">{timeAgo(message.date)}</p>
            </div>

            {message.type === 'absence-request' && message.startDate && message.endDate && absenceType && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {absenceType.name}: {new Date(message.startDate).toLocaleDateString()} - {new Date(message.endDate).toLocaleDateString()}
                </p>
            )}

            {message.type === 'complaint' && (
                 <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic truncate">"{message.body}"</p>
            )}

            <div className="mt-2 flex flex-col items-start">
                 <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles.bgColor} ${styles.textColor}`}>
                    {statusLabel}
                </span>
                {message.status === 'refused' && message.refusalReason && (
                    <div className="mt-1.5 p-1.5 bg-red-50 dark:bg-red-900/20 rounded-md text-xs w-full">
                        <p className="font-semibold text-red-800 dark:text-red-300">{t('inbox.refusalReason')}:</p>
                        <p className="text-red-700 dark:text-red-400">{message.refusalReason}</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const RequestsScreen: React.FC = () => {
    const { t } = useLanguage();
    const { absenceTypes, submitRequest, inboxMessages, isLoading: isDataLoading } = useMobileData();
    const [activeTab, setActiveTab] = useState<'absence' | 'complaint'>('absence');

    const [absenceData, setAbsenceData] = useState({
        absenceTypeId: absenceTypes[0]?.id || '',
        startDate: toInputDateString(new Date()),
        endDate: toInputDateString(new Date()),
        body: '',
    });

    const [complaintData, setComplaintData] = useState({
        body: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalInfo, setModalInfo] = useState<{ isOpen: boolean, title: string, body: string }>({ isOpen: false, title: '', body: '' });

    const handleAbsenceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const endDateObj = new Date(absenceData.endDate + 'T00:00:00');
        endDateObj.setHours(23, 59, 59, 999);
        const success = await submitRequest({
            type: 'absence-request',
            subject: `Absence Request: ${absenceTypes.find(at => at.id === absenceData.absenceTypeId)?.name || 'Unknown'}`,
            body: absenceData.body,
            absenceTypeId: absenceData.absenceTypeId,
            startDate: new Date(absenceData.startDate + 'T00:00:00'),
            endDate: endDateObj,
        });
        setIsSubmitting(false);
        if (success) {
            setModalInfo({ isOpen: true, title: t('mobile.requestSuccessTitle'), body: t('mobile.requestSuccessBody') });
            setAbsenceData({ absenceTypeId: absenceTypes[0]?.id || '', startDate: toInputDateString(new Date()), endDate: toInputDateString(new Date()), body: '' });
        } else {
             setModalInfo({ isOpen: true, title: t('mobile.errorTitle'), body: t('mobile.errorBody') });
        }
    };

    const handleComplaintSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
         const success = await submitRequest({
            type: 'complaint',
            subject: t('mobile.complaint'),
            body: complaintData.body,
        });
        setIsSubmitting(false);
        if (success) {
            setModalInfo({ isOpen: true, title: t('mobile.requestSuccessTitle'), body: t('mobile.requestSuccessBody') });
            setComplaintData({ body: '' });
        } else {
             setModalInfo({ isOpen: true, title: t('mobile.errorTitle'), body: t('mobile.errorBody') });
        }
    };
    
    const inputStyle = "w-full px-3 py-2 text-sm border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg bg-white dark:bg-slate-900";
    const labelStyle = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";
    const buttonStyle = "w-full flex justify-center items-center px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400";


    return (
        <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('mobile.makeRequest')}</h1>
                <div className="flex items-center space-x-2">
                    <LanguageSwitcher />
                    <ThemeToggle />
                </div>
            </div>

            <div className="mb-4 border-b border-slate-200 dark:border-slate-800">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('absence')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'absence' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        {t('mobile.absenceRequest')}
                    </button>
                    <button
                        onClick={() => setActiveTab('complaint')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'complaint' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        {t('mobile.complaint')}
                    </button>
                </nav>
            </div>
            
            {activeTab === 'absence' && (
                <form onSubmit={handleAbsenceSubmit} className="space-y-4 animate-slide-in-up">
                    <div>
                        <label className={labelStyle}>{t('modals.absenceTypeLabel')}</label>
                        <select value={absenceData.absenceTypeId} onChange={e => setAbsenceData({...absenceData, absenceTypeId: e.target.value})} className={inputStyle}>
                            {absenceTypes.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelStyle}>{t('mobile.startDate')}</label>
                            <input type="date" value={absenceData.startDate} onChange={e => setAbsenceData({...absenceData, startDate: e.target.value})} className={inputStyle}/>
                        </div>
                        <div>
                            <label className={labelStyle}>{t('mobile.endDate')}</label>
                            <input type="date" value={absenceData.endDate} onChange={e => setAbsenceData({...absenceData, endDate: e.target.value})} min={absenceData.startDate} className={inputStyle}/>
                        </div>
                    </div>
                    <div>
                        <label className={labelStyle}>{t('mobile.message')}</label>
                        <textarea value={absenceData.body} onChange={e => setAbsenceData({...absenceData, body: e.target.value})} placeholder={t('mobile.messagePlaceholder')} rows={3} className={inputStyle}></textarea>
                    </div>
                    <button type="submit" disabled={isSubmitting} className={buttonStyle}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={16} className="mr-2"/> {t('mobile.submitRequest')}</>}
                    </button>
                </form>
            )}

            {activeTab === 'complaint' && (
                 <form onSubmit={handleComplaintSubmit} className="space-y-4 animate-slide-in-up">
                    <div>
                        <label className={labelStyle}>{t('mobile.message')}</label>
                        <textarea value={complaintData.body} onChange={e => setComplaintData({ body: e.target.value })} required placeholder={t('mobile.complaintPlaceholder')} rows={5} className={inputStyle}></textarea>
                    </div>
                    <button type="submit" disabled={isSubmitting} className={buttonStyle}>
                         {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={16} className="mr-2"/> {t('mobile.submitComplaint')}</>}
                    </button>
                </form>
            )}
            
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">Recent Requests</h2>
                {isDataLoading && <div className="flex justify-center py-4"><LoadingSpinner /></div>}
                {!isDataLoading && inboxMessages.length === 0 && (
                    <p className="text-sm text-center text-slate-500 dark:text-slate-400 py-4">No recent requests found.</p>
                )}
                {!isDataLoading && inboxMessages.length > 0 && (
                    <div className="space-y-3">
                        {inboxMessages.map(msg => (
                            <RequestHistoryItem key={msg.id} message={msg} absenceTypes={absenceTypes} />
                        ))}
                    </div>
                )}
            </div>

            <Modal
                isOpen={modalInfo.isOpen}
                onClose={() => setModalInfo({ isOpen: false, title: '', body: '' })}
                title={modalInfo.title}
                footer={<button onClick={() => setModalInfo({isOpen: false, title: '', body: ''})} className="btn-primary">{t('mobile.close')}</button>}
            >
                <p>{modalInfo.body}</p>
            </Modal>
        </div>
    );
};

export default RequestsScreen;