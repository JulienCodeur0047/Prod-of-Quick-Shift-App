import React, { useState } from 'react';
import { Home, Calendar, PlusCircle, User } from 'lucide-react';
import TodayScreen from './TodayScreen';
import ScheduleScreen from './ScheduleScreen';
import RequestsScreen from './RequestsScreen';
import ProfileScreen from './ProfileScreen';
import { useLanguage } from '../../contexts/LanguageContext';

type ActiveView = 'today' | 'schedule' | 'requests' | 'profile';

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
  >
    {icon}
    <span className="text-xs mt-1">{label}</span>
  </button>
);

const MobileLayout: React.FC = () => {
    const [activeView, setActiveView] = useState<ActiveView>('today');
    const { t } = useLanguage();

    const renderView = () => {
        switch (activeView) {
            case 'today': return <TodayScreen />;
            case 'schedule': return <ScheduleScreen />;
            case 'requests': return <RequestsScreen />;
            case 'profile': return <ProfileScreen />;
            default: return <TodayScreen />;
        }
    };

    return (
        <div className="flex flex-col h-screen">
            <main className="flex-1 overflow-y-auto pb-16">
                {renderView()}
            </main>
            <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-blue-night-900 border-t border-slate-200 dark:border-slate-800 shadow-t-lg">
                <nav className="flex justify-around items-center h-16">
                    <NavItem icon={<Home size={24} />} label={t('mobile.today')} isActive={activeView === 'today'} onClick={() => setActiveView('today')} />
                    <NavItem icon={<Calendar size={24} />} label={t('mobile.schedule')} isActive={activeView === 'schedule'} onClick={() => setActiveView('schedule')} />
                    <NavItem icon={<PlusCircle size={24} />} label={t('mobile.requests')} isActive={activeView === 'requests'} onClick={() => setActiveView('requests')} />
                    <NavItem icon={<User size={24} />} label={t('mobile.profile')} isActive={activeView === 'profile'} onClick={() => setActiveView('profile')} />
                </nav>
            </footer>
        </div>
    );
};

export default MobileLayout;