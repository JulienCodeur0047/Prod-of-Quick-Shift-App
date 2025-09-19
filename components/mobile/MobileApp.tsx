import React from 'react';
import { useMobileAuth } from '../../contexts/MobileAuthContext';
import MobileLogin from './MobileLogin';
import MobileLayout from './MobileLayout';
import FloatingControls from './FloatingControls';

const MobileApp: React.FC = () => {
    const { employee, isLoading } = useMobileAuth();

    if (isLoading) {
        return null; // The auth provider already shows a spinner
    }

    return (
        <div className="bg-slate-100 dark:bg-blue-night-950 min-h-screen">
            {employee ? <MobileLayout /> : <MobileLogin />}
            <FloatingControls />
        </div>
    );
};

export default MobileApp;