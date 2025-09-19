import React, { useState } from 'react';
import { InboxMessage, Employee, AbsenceType } from '../types';
import Avatar from './Avatar';
import { Check, X, Send, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface MessageItemProps {
    message: InboxMessage;
    employee: Employee;
    absenceType?: AbsenceType;
    onValidate: (messageId: string) => void;
    onRefuse: (messageId: string, reason: string) => void;
    onFollowUp: (messageId: string) => void;
}

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
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

const StatusBadge: React.FC<{ status: InboxMessage['status'] }> = ({ status }) => {
    const { t } = useLanguage();
    const styles = {
        validated: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        refused: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        'followed-up': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    };
    
    if (status === 'pending') return null;
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}>{t(`inbox.status${status.charAt(0).toUpperCase() + status.slice(1).replace('-','')}`)}</span>;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, employee, absenceType, onValidate, onRefuse, onFollowUp }) => {
    const { t } = useLanguage();
    const [isRefusing, setIsRefusing] = useState(false);
    const [refusalReason, setRefusalReason] = useState('');

    const handleRefuseClick = () => {
        if(isRefusing && refusalReason.trim()) {
            onRefuse(message.id, refusalReason.trim());
            setIsRefusing(false);
            setRefusalReason('');
        } else {
            setIsRefusing(true);
        }
    };

    const handleCancelRefuse = () => {
        setIsRefusing(false);
        setRefusalReason('');
    };

    return (
        <div className="p-3 border-b border-gray-200 dark:border-blue-night-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-blue-night-800/50">
            <div className="flex items-start space-x-3">
                <Avatar name={employee.name} src={employee.avatarUrl} className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{employee.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{message.subject}</p>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{timeAgo(message.date)}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{message.body}</p>
                    
                    {message.type === 'absence-request' && message.startDate && message.endDate && absenceType && (
                        <div className="mt-2 p-2 bg-gray-100 dark:bg-blue-night-950/50 rounded-md text-xs">
                            <span className="font-semibold">{t('inbox.requestDetails')}:</span>
                            <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: absenceType.color }}></span>
                                <span>{absenceType.name} {t('inbox.from')} {message.startDate.toLocaleDateString()} {t('inbox.to')} {message.endDate.toLocaleDateString()}</span>
                            </div>
                        </div>
                    )}

                    {message.status === 'pending' ? (
                        <div className="mt-2">
                             {isRefusing ? (
                                <div className="flex items-center space-x-2">
                                    <input 
                                        type="text"
                                        value={refusalReason}
                                        onChange={(e) => setRefusalReason(e.target.value)}
                                        placeholder={t('inbox.refusalReasonPlaceholder')}
                                        className="w-full text-sm p-1.5 border rounded-md bg-gray-50 dark:bg-blue-night-800 dark:border-blue-night-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <button onClick={handleRefuseClick} className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"><Send size={14}/></button>
                                    <button onClick={handleCancelRefuse} className="p-2 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300"><X size={14}/></button>
                                </div>
                             ) : (
                                <div className="flex items-center space-x-2">
                                    {message.type === 'absence-request' && (
                                        <>
                                            <button onClick={() => onValidate(message.id)} className="flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900">
                                                <Check size={14} className="mr-1"/> {t('inbox.validate')}
                                            </button>
                                            <button onClick={handleRefuseClick} className="flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900">
                                                <X size={14} className="mr-1"/> {t('inbox.refuse')}
                                            </button>
                                        </>
                                    )}
                                    {message.type === 'complaint' && (
                                        <button onClick={() => onFollowUp(message.id)} className="flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900">
                                            <ArrowRight size={14} className="mr-1"/> {t('inbox.followUp')}
                                        </button>
                                    )}
                                </div>
                             )}
                        </div>
                    ) : (
                        <div className="mt-2">
                            <StatusBadge status={message.status} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageItem;