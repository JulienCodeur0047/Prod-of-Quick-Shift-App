import React from 'react';
import { useMobileAuth } from '../../contexts/MobileAuthContext';
import MobileLogin from './MobileLogin';
import MobileLayout from './MobileLayout';

const MobileApp: React.FC = () => {
    const { employee, isLoading } = useMobileAuth();

    if (isLoading) {
        return null; // The auth provider already shows a spinner
    }

    return (
        <div className="bg-slate-100 dark:bg-blue-night-950 min-h-screen">
            {employee ? <MobileLayout /> : <MobileLogin />}
        </div>
    );
};

export default MobileApp;