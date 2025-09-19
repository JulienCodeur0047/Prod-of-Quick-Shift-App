import React, { useState, useEffect } from 'react';
import { Clock, PieChart, User, UsersRound } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const CalendarDemo: React.FC = () => (
    <div className="relative grid grid-cols-4 gap-2 p-2 rounded-lg bg-white dark:bg-blue-night-900 shadow-inner">
        {/* Days of the week */}
        {['MON', 'TUE', 'WED', 'THU'].map((day, i) => (
            <div key={day} className="text-center">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500">{day}</p>
                <p className="text-lg font-bold text-gray-700 dark:text-gray-200">{12 + i}</p>
            </div>
        ))}

        {/* Shift cards background */}
        <div className="h-10 bg-gray-100 dark:bg-blue-night-800/60 rounded flex items-center justify-center p-1 col-start-1">
             <div className="w-full h-full bg-blue-200 dark:bg-blue-900/50 rounded-sm"></div>
        </div>
        <div className="h-10 bg-gray-100 dark:bg-blue-night-800/60 rounded flex items-center justify-center p-1 col-start-4">
             <div className="w-full h-full bg-green-200 dark:bg-green-900/50 rounded-sm"></div>
        </div>

        {/* Animated Shift Card */}
        <div className="absolute top-10 left-3 w-1/4 animate-drag-shift">
             <div className="p-1.5 rounded-md bg-blue-500 shadow-lg text-white">
                <p className="text-xs font-bold whitespace-nowrap">A. Johnson</p>
                <p className="text-[10px] opacity-80 whitespace-nowrap">09:00 - 17:00</p>
            </div>
        </div>
    </div>
);

const DashboardDemo: React.FC = () => {
    const [fulfillmentWidth, setFulfillmentWidth] = useState('10%');
    const [hoursWidth, setHoursWidth] = useState('10%');

    useEffect(() => {
        // Trigger animation shortly after mount
        const timer = setTimeout(() => {
            setFulfillmentWidth('95%');
            setHoursWidth('60%');
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-white dark:bg-blue-night-900 shadow-inner space-y-3">
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <PieChart size={16} className="mr-2 text-green-500"/>
                    <span className="text-sm font-semibold">Fulfillment Rate</span>
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">95%</p>
                <div className="w-full bg-gray-200 dark:bg-blue-night-800 rounded-full h-2">
                    <div 
                        className="bg-green-500 h-2 rounded-full transition-all ease-out" 
                        style={{ width: fulfillmentWidth, transitionDuration: '2000ms' }}
                    ></div>
                </div>
            </div>
            <div className="p-4 rounded-lg bg-white dark:bg-blue-night-900 shadow-inner space-y-3">
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Clock size={16} className="mr-2 text-blue-500"/>
                    <span className="text-sm font-semibold">Hours Scheduled</span>
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">182h</p>
                <div className="w-full bg-gray-200 dark:bg-blue-night-800 rounded-full h-2">
                    <div 
                        className="bg-blue-500 h-2 rounded-full transition-all ease-out"
                        style={{ width: hoursWidth, transitionDuration: '1500ms' }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

const RosterDemo: React.FC = () => {
    const employees = [
        { name: 'Alice Johnson', role: 'Manager' },
        { name: 'Bob Williams', role: 'Cashier' },
        { name: 'Charlie Brown', role: 'Stocker' },
    ];
    return (
        <div className="p-4 rounded-lg bg-white dark:bg-blue-night-900 shadow-inner space-y-2">
            <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
                 <UsersRound size={16} className="mr-2"/>
                <span className="text-sm font-semibold">Employee Roster</span>
            </div>
            {employees.map((emp, i) => (
                <div key={emp.name} className={`flex items-center p-2 rounded-md ${i === 1 ? 'bg-blue-100 dark:bg-blue-900/50 animate-pulse-light' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-blue-night-800 flex items-center justify-center">
                        <User size={16} className="text-gray-500"/>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{emp.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{emp.role}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const FeatureSummaryAnimation: React.FC = () => {
    const { t } = useLanguage();
    const [activeView, setActiveView] = useState(0);
    const demos = [
        { component: <CalendarDemo />, name: t('sidebar.schedule') },
        { component: <DashboardDemo />, name: t('sidebar.dashboard') },
        { component: <RosterDemo />, name: t('sidebar.employees') }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveView((prev) => (prev + 1) % demos.length);
        }, 4000); // Cycle every 4 seconds
        return () => clearInterval(interval);
    }, [demos.length]);

    return (
        <div>
            {/* Tab-like navigation */}
            <div className="flex items-center space-x-2 px-4 pt-2 bg-gray-50 dark:bg-blue-night-950/50">
               {demos.map((demo, index) => (
                   <div key={demo.name} className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors duration-300 ${activeView === index ? 'bg-white dark:bg-blue-night-900 text-gray-800 dark:text-white' : 'text-gray-500 bg-gray-100 dark:bg-blue-night-800/60'}`}>
                       {demo.name}
                   </div>
               ))}
            </div>
            {/* Animated content area */}
            <div className="relative bg-white dark:bg-blue-night-900 h-48 flex items-center justify-center">
                {demos.map((demo, index) => (
                    <div 
                        key={index} 
                        className={`transition-opacity duration-500 ease-in-out absolute inset-x-4 inset-y-2 flex items-center justify-center ${activeView === index ? 'opacity-100' : 'opacity-0'}`}
                        style={{ transitionDelay: activeView === index ? '200ms' : '0ms' }}
                    >
                        <div className="w-full max-w-sm">
                            {demo.component}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const AppWindow: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="w-full h-auto rounded-xl shadow-2xl bg-white dark:bg-blue-night-900 ring-1 ring-black/5 overflow-hidden">
                <div className="p-2.5 border-b border-gray-200 dark:border-blue-night-800 flex items-center space-x-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <FeatureSummaryAnimation />
            </div>
        </div>
    );
};

const AnimatedDemos = {
    AppWindow,
    CalendarDemo,
    DashboardDemo,
    RosterDemo,
};

export default AnimatedDemos;