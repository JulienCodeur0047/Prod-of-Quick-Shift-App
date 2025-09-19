import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Employee, Role } from '../types';
import { PlusCircle, Edit, Trash2, Phone, LayoutGrid, List, Upload, Gem, Mail, Filter, ChevronDown, X, Lightbulb, KeyRound } from 'lucide-react';
import Avatar from './Avatar';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import MultiSelectDropdown from './MultiSelectDropdown';
import FeatureTour, { TourStep } from './FeatureTour';

const ROLE_COLORS: { [key: string]: { border: string; bg: string; text: string } } = {
    'Manager': { border: 'border-red-500', bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-300' },
    'Cashier': { border: 'border-green-500', bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-300' },
    'Stocker': { border: 'border-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-300' },
    'Clerk': { border: 'border-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-800 dark:text-yellow-300' },
    'Default': { border: 'border-gray-400', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200' },
};

const getRoleColor = (roleName: string) => {
    return ROLE_COLORS[roleName] || ROLE_COLORS.Default;
};

interface EmployeeCardProps {
    employee: Employee;
    onEdit: (employee: Employee) => void;
    onDelete: (employeeId: string) => void;
    tourId?: string;
    showAccessCode?: boolean;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, onEdit, onDelete, tourId, showAccessCode }) => {
    const roleColor = getRoleColor(employee.role);
    return (
        <div 
            data-tour-id={tourId}
            className={`bg-white dark:bg-blue-night-900 rounded-xl shadow-md flex flex-col justify-between transition-all duration-300 group cursor-pointer border-t-4 ${roleColor.border} hover:shadow-xl hover:-translate-y-1`}
            onClick={() => onEdit(employee)}
        >
            <div className="p-4 text-center flex-grow">
                <Avatar name={employee.name} src={employee.avatarUrl} className="w-20 h-20 rounded-full mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate">{employee.name}</h3>
                <p className={`text-sm font-semibold ${roleColor.text}`}>{employee.role}</p>
                
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-blue-night-800 space-y-2 text-left">
                     <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <Mail size={12} className="mr-2.5 flex-shrink-0" />
                        <span className="truncate">{employee.email}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <Phone size={12} className="mr-2.5 flex-shrink-0" />
                        <span>{employee.phone || 'N/A'}</span>
                    </div>
                    {showAccessCode && employee.accessCode && (
                         <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <KeyRound size={12} className="mr-2.5 flex-shrink-0" />
                            <span className="font-mono tracking-wider">{employee.accessCode}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-2 flex justify-center space-x-2 h-12 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(employee); }} 
                    className="p-2 rounded-full bg-gray-200 dark:bg-blue-night-800 hover:bg-gray-300 dark:hover:bg-blue-night-700"
                    aria-label="Edit employee"
                >
                    <Edit size={16} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(employee.id); }} 
                    className="p-2 rounded-full bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900/80 text-red-600 dark:text-red-300"
                    aria-label="Delete employee"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

interface EmployeeListProps {
    employees: Employee[];
    roles: Role[];
    onAdd: () => void;
    onEdit: (employee: Employee) => void;
    onDelete: (employeeId: string) => void;
    onImport: () => void;
}

type SortOption = 'name-asc' | 'name-desc' | 'role';

const employeeTourSteps: TourStep[] = [
    { selector: "[data-tour-id='employee-view-toggle']", titleKey: 'tour.employees.viewToggleTitle', contentKey: 'tour.employees.viewToggleContent', position: 'bottom' },
    { selector: "[data-tour-id='employee-quick-edit']", titleKey: 'tour.employees.quickEditTitle', contentKey: 'tour.employees.quickEditContent', position: 'bottom' },
    { selector: "[data-tour-id='employee-filters']", titleKey: 'tour.employees.filterTitle', contentKey: 'tour.employees.filterContent', position: 'bottom' },
    { selector: "[data-tour-id='employee-import']", titleKey: 'tour.employees.importTitle', contentKey: 'tour.employees.importContent', position: 'left' },
];

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, roles, onAdd, onEdit, onDelete, onImport }) => {
    const { user, permissions } = useAuth();
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string[]>([]);
    const [genderFilter, setGenderFilter] = useState<string>('all');
    const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
    const [sortOption, setSortOption] = useState<SortOption>('name-asc');
    const [showFilters, setShowFilters] = useState(false);
    const [isTourActive, setIsTourActive] = useState(false);

    const atEmployeeLimit = employees.length >= permissions.employeeLimit;

    const handleDeleteWithConfirm = (employeeId: string) => {
        const employee = employees.find(e => e.id === employeeId);
        if(employee && window.confirm(t('modals.confirmDelete', { name: employee.name }))){
            onDelete(employeeId);
        }
    }

    const roleStats = useMemo(() => {
        return roles.map(role => ({
            name: role.name,
            count: employees.filter(e => e.role === role.name).length,
        })).filter(r => r.count > 0);
    }, [employees, roles]);

    const filteredAndSortedEmployees = useMemo(() => {
        let filtered = employees.filter(employee => {
            const searchLower = searchTerm.toLowerCase();
            const searchMatch = searchLower === '' || 
                                employee.name.toLowerCase().includes(searchLower) || 
                                employee.email.toLowerCase().includes(searchLower) ||
                                employee.phone.includes(searchTerm);
            const roleMatch = roleFilter.length === 0 || roleFilter.includes(employee.role);
            const genderMatch = genderFilter === 'all' || employee.gender === genderFilter;
            return searchMatch && roleMatch && genderMatch;
        });

        switch (sortOption) {
            case 'name-asc':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                filtered.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'role':
                filtered.sort((a, b) => a.role.localeCompare(b.role) || a.name.localeCompare(b.name));
                break;
        }

        return filtered;
    }, [employees, searchTerm, roleFilter, genderFilter, sortOption]);

    const roleOptions = useMemo(() => roles.map(r => ({id: r.name, name: r.name})), [roles]);

    return (
        <div>
            {isTourActive && <FeatureTour steps={employeeTourSteps} onClose={() => setIsTourActive(false)} />}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{t('employees.rosterTitle')}</h2>
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                        <div><strong>{t('employees.total')}:</strong> {employees.length}</div>
                        <div className="h-4 border-l border-gray-300 dark:border-gray-600"></div>
                        <div className="flex items-center gap-2 overflow-x-auto">
                            <strong>{t('employees.byRole')}:</strong>
                            {roleStats.map(role => {
                                const colors = getRoleColor(role.name);
                                return <span key={role.name} className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>{role.name}: {role.count}</span>
                            })}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Controls Bar */}
            <div data-tour-id="employee-filters" className="mb-6 p-4 bg-white dark:bg-blue-night-900 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                    <div className="lg:col-span-2">
                         <input 
                            type="text"
                            placeholder={t('employees.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-blue-night-800 dark:border-blue-night-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setShowFilters(s => !s)} className="w-full flex items-center justify-center p-2 border rounded-md bg-gray-50 dark:bg-blue-night-800 dark:border-blue-night-700"><Filter size={16} className="mr-2"/>{t('employees.filters')}</button>
                        <select value={sortOption} onChange={e => setSortOption(e.target.value as SortOption)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-blue-night-800 dark:border-blue-night-700">
                            <option value="name-asc">{t('employees.sortNameAsc')}</option>
                            <option value="name-desc">{t('employees.sortNameDesc')}</option>
                            <option value="role">{t('employees.sortRole')}</option>
                        </select>
                    </div>
                     <div className="flex items-center justify-end space-x-2">
                         <div data-tour-id="employee-view-toggle" className="flex items-center bg-gray-200 dark:bg-blue-night-800 rounded-lg p-1">
                            <button onClick={() => setDisplayMode('grid')} className={`p-1.5 rounded-md transition-colors ${displayMode === 'grid' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 dark:text-gray-400'}`} aria-label={t('employees.gridView')}><LayoutGrid size={20} /></button>
                            <button onClick={() => setDisplayMode('list')} className={`p-1.5 rounded-md transition-colors ${displayMode === 'list' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 dark:text-gray-400'}`} aria-label={t('employees.listView')}><List size={20} /></button>
                        </div>
                        <button 
                            data-tour-id="employee-import"
                            onClick={() => permissions.canImportEmployees && onImport()}
                            disabled={!permissions.canImportEmployees}
                            title={!permissions.canImportEmployees ? t('tooltips.proFeature') : ''}
                            className={`p-2 rounded-lg transition-colors duration-300 relative ${!permissions.canImportEmployees ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        >
                             {!permissions.canImportEmployees && <Gem size={14} className="absolute -top-1 -right-1 text-yellow-400" />}
                            <Upload size={20} />
                        </button>
                        <button 
                            onClick={onAdd} 
                            disabled={atEmployeeLimit}
                            title={atEmployeeLimit ? t('tooltips.employeeLimit', { limit: permissions.employeeLimit }) : ''}
                            className={`p-2 rounded-lg transition-colors duration-300 text-white ${atEmployeeLimit ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            <PlusCircle size={20} />
                        </button>
                        <button 
                            onClick={() => setIsTourActive(true)}
                            title={t('tour.quickTips')}
                            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors"
                            aria-label={t('tour.quickTips')}
                        >
                            <Lightbulb size={20} className="text-yellow-400" />
                        </button>
                    </div>
                </div>
                 {showFilters && (
                    <div className="mt-4 pt-4 border-t dark:border-blue-night-800 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <MultiSelectDropdown
                            label={t('employees.allRoles')}
                            options={roleOptions}
                            selectedIds={roleFilter}
                            onSelectionChange={setRoleFilter}
                            placeholder={t('employees.allRoles')}
                        />
                         <div className="md:col-span-1">
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('employees.allGenders')}</label>
                            <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-blue-night-800 dark:border-blue-night-700 min-h-[42px]">
                                <option value="all">{t('employees.allGenders')}</option>
                                <option value="Male">{t('gender.male')}</option>
                                <option value="Female">{t('gender.female')}</option>
                                <option value="Other">{t('gender.other')}</option>
                                <option value="Prefer not to say">{t('gender.preferNotToSay')}</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button onClick={() => {setRoleFilter([]); setGenderFilter('all')}} className="w-full flex items-center justify-center p-2 border rounded-md bg-gray-50 dark:bg-blue-night-800 dark:border-blue-night-700 text-sm"><X size={16} className="mr-2"/>Clear Filters</button>
                        </div>
                    </div>
                )}
            </div>
            
            {filteredAndSortedEmployees.length === 0 ? (
                 <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">{t('employees.noEmployeesFound')}</p>
                </div>
            ) : displayMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredAndSortedEmployees.map((employee, index) => (
                        <EmployeeCard 
                            key={employee.id} 
                            employee={employee} 
                            onEdit={onEdit} 
                            onDelete={handleDeleteWithConfirm}
                            tourId={index === 0 ? "employee-quick-edit" : undefined}
                            showAccessCode={user?.plan === 'Pro Plus'}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-blue-night-900 rounded-xl shadow-md overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-blue-night-800 text-xs uppercase text-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('employees.tableHeaderEmployee')}</th>
                                <th scope="col" className="px-6 py-3">{t('employees.tableHeaderContact')}</th>
                                <th scope="col" className="px-6 py-3">{t('employees.tableHeaderRole')}</th>
                                {user?.plan === 'Pro Plus' && <th scope="col" className="px-6 py-3">{t('employees.tableHeaderAccessCode')}</th>}
                                <th scope="col" className="px-6 py-3 text-right">{t('employees.tableHeaderActions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedEmployees.map((employee, index) => {
                                const roleColor = getRoleColor(employee.role);
                                return (
                                <tr 
                                    key={employee.id} 
                                    data-tour-id={index === 0 ? "employee-quick-edit" : undefined}
                                    className="border-b dark:border-blue-night-700 hover:bg-gray-50 dark:hover:bg-blue-night-800/50 cursor-pointer"
                                    onClick={() => onEdit(employee)}
                                >
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Avatar name={employee.name} src={employee.avatarUrl} className="w-10 h-10 rounded-full mr-3 flex-shrink-0" />
                                            {employee.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="truncate">{employee.email}</div>
                                        <div className="text-gray-500 dark:text-gray-400">{employee.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${roleColor.bg} ${roleColor.text}`}>{employee.role}</span>
                                    </td>
                                     {user?.plan === 'Pro Plus' && (
                                        <td className="px-6 py-4">
                                            <span className="font-mono tracking-wider bg-gray-100 dark:bg-blue-night-800 px-2 py-1 rounded-md text-gray-700 dark:text-gray-300">
                                                {employee.accessCode || 'N/A'}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <div 
                                            className="flex justify-end space-x-2"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button onClick={() => onEdit(employee)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-blue-night-700">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteWithConfirm(employee.id)} className="p-2 rounded-full text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default EmployeeList;