import React from 'react';
import ThemeToggle from './ThemeToggle';
import Inbox from './Inbox';
import { Employee, AbsenceType, InboxMessage } from '../types';
import LanguageSwitcher from './LanguageSwitcher';
import Clock from './Clock';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    employees: Employee[];
    absenceTypes: AbsenceType[];
    inboxMessages: InboxMessage[];
    onValidateRequest: (messageId: string) => void;
    onRefuseRequest: (messageId: string, reason: string) => void;
    onFollowUpComplaint: (messageId: string) => void;
}

const Header: React.FC<Partial<HeaderProps>> = (props) => {
  const { employees, absenceTypes, inboxMessages, onValidateRequest, onRefuseRequest, onFollowUpComplaint } = props;
  const { user } = useAuth();
  return (
    <header className="h-20 items-center justify-between flex px-6 bg-white dark:bg-blue-night-950 border-b border-gray-200 dark:border-blue-night-900">
        <Clock />
        <div className="flex items-center space-x-4">
            {user?.plan === 'Pro Plus' && inboxMessages && employees && absenceTypes && onValidateRequest && onRefuseRequest && onFollowUpComplaint && (
                <Inbox 
                    messages={inboxMessages}
                    employees={employees}
                    absenceTypes={absenceTypes}
                    onValidateRequest={onValidateRequest}
                    onRefuseRequest={onRefuseRequest}
                    onFollowUpComplaint={onFollowUpComplaint}
                />
            )}
           <LanguageSwitcher />
           <ThemeToggle />
        </div>
    </header>
  );
};

export default Header;