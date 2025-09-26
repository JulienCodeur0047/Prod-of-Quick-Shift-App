import React, { useState } from 'react';
import { useMobileData } from '../../contexts/MobileDataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Loader2, Send } from 'lucide-react';
import Modal from '../Modal';
import LanguageSwitcher from '../LanguageSwitcher';
import ThemeToggle from '../ThemeToggle';

const toInputDateString = (date: Date) => date.toISOString().split('T')[0];

const RequestsScreen: React.FC = () => {
    const { t } = useLanguage();
    const { absenceTypes, submitRequest } = useMobileData();
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

    const [isLoading, setIsLoading] = useState(false);
    const [modalInfo, setModalInfo] = useState<{ isOpen: boolean, title: string, body: string }>({ isOpen: false, title: '', body: '' });

    const handleAbsenceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const success = await submitRequest({
            type: 'absence-request',
            subject: `Absence Request: ${absenceTypes.find(at => at.id === absenceData.absenceTypeId)?.name || 'Unknown'}`,
            body: absenceData.body,
            absenceTypeId: absenceData.absenceTypeId,
            startDate: new Date(absenceData.startDate),
            endDate: new Date(absenceData.endDate),
        });
        setIsLoading(false);
        if (success) {
            setModalInfo({ isOpen: true, title: t('mobile.requestSuccessTitle'), body: t('mobile.requestSuccessBody') });
            setAbsenceData({ absenceTypeId: absenceTypes[0]?.id || '', startDate: toInputDateString(new Date()), endDate: toInputDateString(new Date()), body: '' });
        } else {
             setModalInfo({ isOpen: true, title: t('mobile.errorTitle'), body: t('mobile.errorBody') });
        }
    };

    const handleComplaintSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
         const success = await submitRequest({
            type: 'complaint',
            subject: t('mobile.complaint'),
            body: complaintData.body,
        });
        setIsLoading(false);
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
                    <button type="submit" disabled={isLoading} className={buttonStyle}>
                        {isLoading ? <Loader2 className="animate-spin" /> : <><Send size={16} className="mr-2"/> {t('mobile.submitRequest')}</>}
                    </button>
                </form>
            )}

            {activeTab === 'complaint' && (
                 <form onSubmit={handleComplaintSubmit} className="space-y-4 animate-slide-in-up">
                    <div>
                        <label className={labelStyle}>{t('mobile.message')}</label>
                        <textarea value={complaintData.body} onChange={e => setComplaintData({ body: e.target.value })} required placeholder={t('mobile.complaintPlaceholder')} rows={5} className={inputStyle}></textarea>
                    </div>
                    <button type="submit" disabled={isLoading} className={buttonStyle}>
                         {isLoading ? <Loader2 className="animate-spin" /> : <><Send size={16} className="mr-2"/> {t('mobile.submitComplaint')}</>}
                    </button>
                </form>
            )}
            
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