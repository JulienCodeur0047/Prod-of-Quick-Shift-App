import React from 'react';
import { View } from '../types';
import { LayoutDashboard, Calendar, Users, LogOut, Gem, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Avatar from './Avatar';
import Logo from './Logo';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
    isCollapsed: boolean;
    isDisabled?: boolean;
}> = ({ icon, label, isActive, onClick, isCollapsed, isDisabled }) => {
    const activeClasses = 'bg-blue-night-900 text-white';
    const inactiveClasses = 'text-blue-night-200 hover:bg-blue-night-900 hover:text-white';
    const disabledClasses = 'text-blue-night-700 cursor-not-allowed opacity-50';

    const handleItemClick = () => {
      if (!isDisabled) {
        onClick();
      } else {
        alert("Please upgrade to a Pro plan to access this feature.");
      }
    }

    return (
        <li
            className={`flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${isDisabled ? disabledClasses : (isActive ? activeClasses : inactiveClasses)}`}
            onClick={handleItemClick}
        >
            {icon}
            <span className={`ml-4 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>{label}</span>
        </li>
    );
};


const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onLogout, isCollapsed, onToggle }) => {
  const { user, permissions } = useAuth();
  const { t } = useLanguage();
  
  return (
    <aside className={`bg-blue-night-950 text-white flex flex-col border-r border-blue-night-900 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-center h-20 border-b border-blue-night-900">
        <Logo className="w-8 h-8 flex-shrink-0" />
        <h1 className={`text-2xl font-bold ml-3 whitespace-nowrap overflow-hidden transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>{t('appName')}</h1>
      </div>
      <nav className="flex-1 px-2 py-4">
        <ul>
            <NavItem 
              icon={<LayoutDashboard size={20} />} 
              label={t('sidebar.dashboard')} 
              isActive={currentView === 'dashboard'} 
              onClick={() => setView('dashboard')} 
              isCollapsed={isCollapsed}
              isDisabled={!permissions.canAccessDashboard} 
            />
            <NavItem icon={<Calendar size={20} />} label={t('sidebar.schedule')} isActive={currentView === 'schedule'} onClick={() => setView('schedule')} isCollapsed={isCollapsed} />
            <NavItem icon={<Users size={20} />} label={t('sidebar.employees')} isActive={currentView === 'employees'} onClick={() => setView('employees')} isCollapsed={isCollapsed} />
            <NavItem icon={<Settings size={20} />} label={t('sidebar.settings')} isActive={currentView === 'settings'} onClick={() => setView('settings')} isCollapsed={isCollapsed} />
        </ul>
      </nav>
      
      <div className={`px-4 py-2 border-t border-blue-night-900 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <button 
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-md hover:bg-blue-night-800 text-blue-night-300 hover:text-white transition-colors"
          aria-label="Toggle Sidebar"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <div className="px-2 py-4 border-t border-blue-night-900">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div 
                className={`flex items-center overflow-hidden cursor-pointer rounded-md transition-colors ${!isCollapsed ? 'p-2 -ml-2 hover:bg-blue-night-900' : ''}`}
                onClick={() => setView('profile')}
            >
                {user && <Avatar name={user.name} src={user.avatarUrl} className="w-10 h-10 rounded-full flex-shrink-0" />}
                <div className={`ml-3 truncate transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
                    <p className="font-semibold text-sm truncate">{user?.name}</p>
                    <p className="text-xs text-blue-night-300 truncate">{user?.email}</p>
                    <div className="flex items-center mt-1">
                      <Gem size={12} className="text-yellow-400 dark:text-blue-night-400 mr-1.5"/>
                      <p className="text-xs font-bold text-yellow-400 dark:text-blue-night-400">{user?.plan}</p>
                    </div>
                </div>
            </div>
             <button 
                onClick={onLogout} 
                className={`p-2 rounded-md hover:bg-blue-night-800 text-blue-night-300 hover:text-white transition-colors flex-shrink-0 ${isCollapsed ? 'hidden' : 'block'}`}
                aria-label="Logout"
             >
                <LogOut size={20} />
            </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
