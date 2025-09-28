import React, { useState, useMemo } from 'react';
import { Users, Clock, Hourglass, UserMinus, X, UserPlus, PieChart, TrendingDown, Calendar, ArrowRight, UserRound, Download, Info } from 'lucide-react';
import { Shift, Employee, Absence, AbsenceType, Role, View, Department } from '../types';
import Avatar from './Avatar';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import MultiSelectDropdown from './MultiSelectDropdown';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; isUnavailable?: boolean; }> = ({ title, value, icon, isUnavailable = false }) => {
    const { t } = useLanguage();
    const gradientClasses = 'from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500';
    return (
        <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg flex items-center space-x-4 relative transition-transform duration-300 hover:-translate-y-1 ${isUnavailable ? 'opacity-60 cursor-not-allowed' : ''}`}>
            {isUnavailable && <div className="absolute top-2 right-2 text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{t('dashboard.comingSoon')}</div>}
            <div className={`p-4 rounded-xl text-white bg-gradient-to-br ${gradientClasses}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
            </div>
        </div>
    );
};


interface DashboardProps {
    employees: Employee[];
    shifts: Shift[];
    absences: Absence[];
    absenceTypes: AbsenceType[];
    roles: Role[];
    departments: Department[];
    setView: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ employees, shifts, absences, absenceTypes, roles, departments, setView }) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const totalEmployees = employees.length;
    
    // This week's date range
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    startOfWeek.setHours(0,0,0,0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23,59,59,999);
    
    const currentWeekShifts = shifts.filter(s => {
        return s.startTime >= startOfWeek && s.startTime <= endOfWeek;
    });

    const totalShifts = currentWeekShifts.length;
    
    const totalHours = currentWeekShifts.reduce((acc, shift) => {
        const duration = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
        return acc + duration;
    }, 0);

    const absencesThisWeek = absences.filter(a => a.startDate <= endOfWeek && a.endDate >= startOfWeek).length;
    const openShiftsThisWeek = currentWeekShifts.filter(s => !s.employeeId).length;
    const assignedShiftsThisWeek = totalShifts - openShiftsThisWeek;
    const fulfillmentRate = totalShifts > 0 ? (assignedShiftsThisWeek / totalShifts) * 100 : 100;

    const activityItems = [
        ...shifts.filter(s => s.startTime > new Date()).map(s => ({ type: 'shift', data: s, date: s.startTime })),
        ...absences.filter(a => a.startDate > new Date()).map(a => ({ type: 'absence', data: a, date: a.startDate })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
        
    const hoursByRole = roles.map(role => {
        const hours = currentWeekShifts.reduce((acc, shift) => {
            const employee = employees.find(e => e.id === shift.employeeId);
            if (employee && employee.role === role.name) {
                return acc + (shift.endTime.getTime() - shift.startTime.getTime()) / 3600000;
            }
            return acc;
        }, 0);
        return { name: role.name, hours };
    }).filter(r => r.hours > 0);

    const maxHours = Math.max(...hoursByRole.map(r => r.hours), 1);
    
    const formatDateRange = (start: Date, end: Date) => {
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        if (start.getDate() === end.getDate()) {
            return start.toLocaleDateString(undefined, options);
        }
        return `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`;
    }
    
    // --- State for new Cumulative Hours Analysis ---
    const [hourAnalysisFilters, setHourAnalysisFilters] = useState({
        weeks: 1,
        roleNames: [] as string[],
        departmentIds: [] as string[],
    });

    const handleFilterChange = (change: Partial<typeof hourAnalysisFilters>) => {
        setHourAnalysisFilters(prev => ({ ...prev, ...change }));
    };

    const clearFilters = () => {
        setHourAnalysisFilters({ weeks: 1, roleNames: [], departmentIds: [] });
    };

    const cumulativeHoursData = useMemo(() => {
        const isProPlus = user?.plan === 'Pro Plus';

        const today = new Date();
        const startDate = new Date();
        startDate.setDate(today.getDate() - (hourAnalysisFilters.weeks * 7));
        startDate.setHours(0, 0, 0, 0);

        const employeeMap = new Map(employees.map(e => [e.id, e]));

        const shiftsInRange = shifts.filter(s => {
            // For Pro Plus, the relevant date is when the shift was actually worked
            const shiftDate = isProPlus && s.actualStartTime ? new Date(s.actualStartTime) : s.startTime;
            return s.employeeId && shiftDate >= startDate && shiftDate <= today;
        });
        
        const shiftsAfterDeptFilter = hourAnalysisFilters.departmentIds.length > 0
            ? shiftsInRange.filter(s => s.departmentId && hourAnalysisFilters.departmentIds.includes(s.departmentId))
            : shiftsInRange;
        
        const shiftsAfterRoleFilter = hourAnalysisFilters.roleNames.length > 0
            ? shiftsAfterDeptFilter.filter(s => {
                // FIX: Explicitly type the employee object from the map to resolve type errors.
                const employee: Employee | undefined = employeeMap.get(s.employeeId!);
                return employee && hourAnalysisFilters.roleNames.includes(employee.role);
              })
            : shiftsAfterDeptFilter;

        // Filter shifts for hour calculation based on plan
        const relevantShifts = isProPlus 
            ? shiftsAfterRoleFilter.filter(s => s.actualStartTime && s.actualEndTime) // Only completed, clocked shifts
            : shiftsAfterRoleFilter; // All scheduled shifts
        
        const hoursByEmployee: { [employeeId: string]: { name: string; email: string; phone: string; hours: number } } = {};
        
        const totalHours = relevantShifts.reduce((acc, shift) => {
            const duration = isProPlus
                ? (new Date(shift.actualEndTime!).getTime() - new Date(shift.actualStartTime!).getTime()) / 3600000
                : (shift.endTime.getTime() - shift.startTime.getTime()) / 3600000;
            
            if (shift.employeeId) {
                if (!hoursByEmployee[shift.employeeId]) {
                    // FIX: Explicitly type the employee object from the map to resolve type errors.
                    const employee: Employee | undefined = employeeMap.get(shift.employeeId);
                    hoursByEmployee[shift.employeeId] = {
                        name: employee?.name || 'Unknown',
                        email: employee?.email || '',
                        phone: employee?.phone || '',
                        hours: 0
                    };
                }
                hoursByEmployee[shift.employeeId].hours += duration;
            }
            
            return acc + duration;
        }, 0);
        
        const employeeHoursList = Object.values(hoursByEmployee).sort((a, b) => b.hours - a.hours);

        return { totalHours, employeeHoursList };
    }, [shifts, employees, hourAnalysisFilters, user?.plan]);
    
    const roleOptions = useMemo(() => roles.map(r => ({id: r.name, name: r.name})), [roles]);
    const departmentOptions = useMemo(() => departments.map(d => ({id: d.id, name: d.name})), [departments]);
    
    const handleExport = () => {
        if (cumulativeHoursData.employeeHoursList.length === 0) return;
        const { employeeHoursList, totalHours } = cumulativeHoursData;

        const isProPlus = user?.plan === 'Pro Plus';
        const hoursHeader = isProPlus ? t('dashboard.csvHeaderActualHours') : t('dashboard.csvHeaderHours');
        const headers = [t('dashboard.csvHeaderStaff'), t('dashboard.csvHeaderEmail'), t('dashboard.csvHeaderPhone'), hoursHeader];

        let csvContent = headers.join(',') + '\n';
    
        employeeHoursList.forEach(emp => {
            const row = [
                `"${emp.name.replace(/"/g, '""')}"`,
                `"${emp.email.replace(/"/g, '""')}"`,
                `"${emp.phone.replace(/"/g, '""')}"`,
                emp.hours.toFixed(1)
            ].join(',');
            csvContent += row + '\n';
        });
        
        csvContent += '\n'; 
        const totalRow = [`"${t('dashboard.csvTotal')}"`, '', '', totalHours.toFixed(1)].join(',');
        csvContent += totalRow + '\n';

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            const today = new Date().toISOString().split('T')[0];
            link.setAttribute("href", url);
            link.setAttribute("download", `staff_hours_analysis_${today}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };


    return (
        <div className="animate-slide-in-up">
            <div className="mb-8">
                 <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{t('dashboard.greeting', { name: user?.name.split(' ')[0] })}</h2>
                 <p className="text-slate-500 dark:text-slate-400">{t('dashboard.subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t('dashboard.totalEmployees')} value={totalEmployees.toString()} icon={<Users />} />
                <StatCard title={t('dashboard.shiftsThisWeek')} value={totalShifts.toString()} icon={<Clock />} />
                <StatCard title={t('dashboard.openShifts')} value={openShiftsThisWeek.toString()} icon={<UserPlus />} />
                <StatCard title={t('dashboard.fulfillmentRate')} value={`${fulfillmentRate.toFixed(0)}%`} icon={<PieChart />} />
                <StatCard title={t('dashboard.absencesThisWeek')} value={absencesThisWeek.toString()} icon={<UserMinus />} />
                <StatCard title={t('dashboard.totalHoursScheduled')} value={`${totalHours.toFixed(1)}h`} icon={<Hourglass />} />
                <StatCard title={t('dashboard.turnoverRate')} value="--" icon={<TrendingDown />} isUnavailable />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <div className="lg:col-span-2 space-y-6">
                     <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">{t('dashboard.hoursDistribution')}</h3>
                        <div className="space-y-4">
                            {hoursByRole.length > 0 ? hoursByRole.map(role => (
                                <div key={role.name} className="flex items-center">
                                    <span className="font-semibold w-28 truncate text-sm text-slate-600 dark:text-slate-300">{role.name}</span>
                                    <div className="flex-grow bg-slate-200 dark:bg-slate-800 rounded-full h-4">
                                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 h-4 rounded-full flex items-center justify-end pr-2" style={{width: `${(role.hours / maxHours) * 100}%`}}>
                                            <span className="text-xs font-bold text-white">{role.hours.toFixed(1)}h</span>
                                        </div>
                                    </div>
                                </div>
                            )) : <p className="text-slate-500 dark:text-slate-400">{t('dashboard.noHoursByRole')}</p>}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg">
                         <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">{t('dashboard.quickActions')}</h3>
                         <div className="space-y-3">
                             <button onClick={() => setView('schedule')} className="w-full flex items-center p-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                                <Calendar size={20} className="mr-3 text-blue-500"/>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{t('dashboard.addShiftAction')}</span>
                                <ArrowRight size={16} className="ml-auto text-slate-400"/>
                            </button>
                             <button onClick={() => setView('schedule')} className="w-full flex items-center p-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                                <UserMinus size={20} className="mr-3 text-orange-500"/>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{t('dashboard.logAbsenceAction')}</span>
                                <ArrowRight size={16} className="ml-auto text-slate-400"/>
                            </button>
                             <button onClick={() => setView('employees')} className="w-full flex items-center p-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                                <UserRound size={20} className="mr-3 text-green-500"/>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{t('dashboard.viewStaffAction')}</span>
                                <ArrowRight size={16} className="ml-auto text-slate-400"/>
                            </button>
                         </div>
                    </div>
                </div>

                 <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">{t('dashboard.activityFeed')}</h3>
                    <div className="space-y-4">
                        {activityItems.length > 0 ? activityItems.map(item => {
                            if (item.type === 'shift') {
                                const shift = item.data as Shift;
                                const employee = employees.find(e => e.id === shift.employeeId);
                                if (!employee) return null;
                                return (
                                    <div key={`shift-${shift.id}`} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                        <div className="flex items-center">
                                            <Avatar name={employee.name} src={employee.avatarUrl} className="w-8 h-8 rounded-full mr-3"/>
                                            <span className="font-medium text-slate-700 dark:text-slate-200">{employee.name}</span>
                                        </div>
                                        <span className="text-sm text-slate-500 dark:text-slate-400">{shift.startTime.toLocaleDateString()}</span>
                                        <span className="text-sm font-mono bg-blue-100 dark:bg-slate-950 px-2 py-1 rounded">
                                            {shift.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {shift.endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                );
                            } else {
                                const absence = item.data as Absence;
                                const employee = employees.find(e => e.id === absence.employeeId);
                                const absenceType = absenceTypes.find(at => at.id === absence.absenceTypeId);
                                if (!employee || !absenceType) return null;
                                return (
                                    <div key={`absence-${absence.id}`} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                        <div className="flex items-center">
                                            <Avatar name={employee.name} src={employee.avatarUrl} className="w-8 h-8 rounded-full mr-3"/>
                                            <span className="font-medium text-slate-700 dark:text-slate-200">{employee.name}</span>
                                        </div>
                                        <span style={{color: absenceType.color}} className="font-semibold text-sm">{absenceType.name}</span>
                                        <span className="text-sm text-slate-500 dark:text-slate-400">{formatDateRange(absence.startDate, absence.endDate)}</span>
                                    </div>
                                );
                            }
                        }) : <p className="text-slate-500 dark:text-slate-400 text-center py-4">{t('dashboard.noUpcomingActivity')}</p>}
                    </div>
                </div>
                
                <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('dashboard.hourAnalysisTitle')}</h3>
                        <button
                            onClick={handleExport}
                            disabled={cumulativeHoursData.employeeHoursList.length === 0}
                            className="flex items-center px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download size={16} className="mr-2" />
                            {t('dashboard.exportCSV')}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border dark:border-slate-800">
                        <div>
                            <label htmlFor="weeks-filter" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('dashboard.timeRange')}</label>
                            <select 
                                id="weeks-filter"
                                value={hourAnalysisFilters.weeks} 
                                onChange={e => handleFilterChange({ weeks: Number(e.target.value) })}
                                className="w-full p-2 border rounded-md bg-white dark:bg-slate-900 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value={1}>{t('dashboard.last1Week')}</option>
                                <option value={2}>{t('dashboard.last2Weeks')}</option>
                                <option value={3}>{t('dashboard.last3Weeks')}</option>
                                <option value={4}>{t('dashboard.last4Weeks')}</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                             <MultiSelectDropdown 
                                label={t('dashboard.filterByRole')}
                                options={roleOptions}
                                selectedIds={hourAnalysisFilters.roleNames}
                                onSelectionChange={roleNames => handleFilterChange({ roleNames })}
                                placeholder={t('employees.allRoles')}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <MultiSelectDropdown 
                                label={t('dashboard.filterByDepartment')}
                                options={departmentOptions}
                                selectedIds={hourAnalysisFilters.departmentIds}
                                onSelectionChange={departmentIds => handleFilterChange({ departmentIds })}
                                placeholder={t('calendarFilter.allDepartments')}
                            />
                        </div>
                        <div className="flex items-end">
                            <button onClick={clearFilters} className="w-full flex items-center justify-center p-2 border rounded-md bg-white dark:bg-slate-900 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 min-h-[42px]">
                                <X size={16} className="mr-2"/>{t('calendarFilter.clearAll')}
                            </button>
                        </div>
                    </div>
                    
                    {user?.plan === 'Pro Plus' && (
                        <div className="text-center text-xs text-slate-500 dark:text-slate-400 mb-4 -mt-2 italic flex items-center justify-center">
                           <Info size={12} className="mr-1.5 flex-shrink-0" />
                           {t('dashboard.hourAnalysisProPlusNote')}
                        </div>
                    )}


                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col items-center justify-center p-6 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.totalHoursFiltered')}</p>
                            <p className="text-5xl font-bold text-blue-600 dark:text-blue-400 my-2">{cumulativeHoursData.totalHours.toFixed(1)}h</p>
                        </div>
                        <div className="md:col-span-2 p-6 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <h4 className="font-semibold mb-3 text-slate-700 dark:text-slate-200">{t('dashboard.hoursByStaff')}</h4>
                            <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                                {cumulativeHoursData.employeeHoursList.length > 0 ? (
                                    cumulativeHoursData.employeeHoursList.map(emp => (
                                        <div key={emp.name} className="flex justify-between items-center text-sm">
                                            <span className="font-medium text-slate-600 dark:text-slate-300">{emp.name}</span>
                                            <span className="font-bold font-mono bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">{emp.hours.toFixed(1)}h</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">{t('dashboard.noDataForFilters')}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;