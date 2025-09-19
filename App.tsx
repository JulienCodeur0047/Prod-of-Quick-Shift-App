import React, { useState, useEffect } from 'react';
import { View, Plan, Employee } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ScheduleCalendar from './components/ScheduleCalendar';
import EmployeeList from './components/EmployeeList';
import LandingPage from './components/LandingPage';
import { useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import EmployeeEditor from './components/EmployeeEditor';
import Settings from './components/Settings';
import CSVImportModal from './components/CSVImportModal';
import Profile from './components/Profile';
import { useLanguage } from './contexts/LanguageContext';
import { Gem } from 'lucide-react';
import { useData } from './contexts/DataContext';
import LoadingSpinner from './components/LoadingSpinner';

export default function App() {
  const { user, logout, permissions, isAuthLoading } = useAuth();
  const { 
    employees, shifts, roles, locations, departments, absences, absenceTypes, 
    specialDays, specialDayTypes, inboxMessages, employeeAvailabilities,
    handleSaveEmployee, handleDeleteEmployee, handleSaveShift, handleDeleteShift, 
    handleDeleteMultipleShifts, handleUpdateShifts, handleAddRole, handleUpdateRole, 
    handleDeleteRole, handleAddLocation, handleUpdateLocation, handleDeleteLocation, 
    handleAddDepartment, handleUpdateDepartment, handleDeleteDepartment, 
    handleAddAbsenceType, handleUpdateAbsenceType, handleDeleteAbsenceType, 
    handleSaveAbsence, handleDeleteAbsence, handleAddSpecialDayType, 
    handleUpdateSpecialDayType, handleDeleteSpecialDayType, handleSaveSpecialDay, 
    handleDeleteSpecialDay, handleValidateRequest, handleRefuseRequest, 
    handleFollowUpComplaint, handleSaveEmployeeAvailability, handleImportEmployees,
    handleRegenerateAccessCode,
    isLoading: isDataLoading
  } = useData();

  const { t } = useLanguage();
  const [view, setView] = useState<View>('schedule');
  const [authModal, setAuthModal] = useState<{isOpen: boolean, view: 'login' | 'register', plan?: Plan}>({isOpen: false, view: 'login'});
  const [employeeEditor, setEmployeeEditor] = useState<{isOpen: boolean, employee: Employee | null}>({isOpen: false, employee: null});
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    document.title = t('appName');
  }, [t]);

  useEffect(() => {
    if (user && view === 'dashboard' && !permissions.canAccessDashboard) {
      setView('schedule');
    }
  }, [view, permissions.canAccessDashboard, user]);

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
  const handleOpenLogin = () => setAuthModal({ isOpen: true, view: 'login' });
  const handleOpenRegister = (plan: Plan) => setAuthModal({ isOpen: true, view: 'register', plan });
  const handleCloseAuthModal = () => setAuthModal({ isOpen: false, view: 'login' });
  const handleOpenAddEmployee = () => setEmployeeEditor({ isOpen: true, employee: null });
  const handleOpenEditEmployee = (employee: Employee) => setEmployeeEditor({ isOpen: true, employee });
  const handleCloseEmployeeEditor = () => setEmployeeEditor({ isOpen: false, employee: null });

  const onSaveEmployee = (employee: Employee, isNew: boolean) => {
    if (isNew && employees.length >= permissions.employeeLimit) {
        alert(t('tooltips.employeeLimitFull', { limit: permissions.employeeLimit }));
        return;
    }
    handleSaveEmployee(employee, isNew);
    handleCloseEmployeeEditor();
  };

  const onDeleteEmployee = (employeeId: string) => {
    handleDeleteEmployee(employeeId);
    handleCloseEmployeeEditor();
  };

  const onImportEmployees = (importedData: any[]) => {
    handleImportEmployees(importedData);
    setIsCsvImportOpen(false);
  };

  if (isAuthLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <>
        <LandingPage onLoginClick={handleOpenLogin} onRegisterClick={handleOpenRegister} />
        <AuthModal 
          isOpen={authModal.isOpen}
          initialView={authModal.view}
          initialPlan={authModal.plan}
          onClose={handleCloseAuthModal}
        />
      </>
    );
  }

  if (isDataLoading) {
    return <LoadingSpinner />;
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return permissions.canAccessDashboard
          ? <Dashboard employees={employees} shifts={shifts} absences={absences} absenceTypes={absenceTypes} roles={roles} setView={setView} />
          : <div className="text-center p-8 bg-white dark:bg-blue-night-900 rounded-lg shadow-md max-w-lg mx-auto">
              <Gem size={48} className="mx-auto text-yellow-500 dark:text-blue-night-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('upgrade.dashboardTitle')}</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{t('upgrade.dashboardDesc')}</p>
              <button className="mt-6 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-night-200 dark:text-blue-night-900 dark:hover:bg-blue-night-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-300">{t('upgrade.upgradeButton')}</button>
            </div>;
      case 'schedule':
        return <ScheduleCalendar 
                    employees={employees} roles={roles} shifts={shifts} locations={locations} departments={departments}
                    absences={absences} absenceTypes={absenceTypes} specialDays={specialDays} specialDayTypes={specialDayTypes}
                    employeeAvailabilities={employeeAvailabilities} onSaveShift={handleSaveShift} onDeleteShift={handleDeleteShift}
                    onDeleteMultipleShifts={handleDeleteMultipleShifts} onUpdateShifts={handleUpdateShifts} onSaveAbsence={handleSaveAbsence}
                    onDeleteAbsence={handleDeleteAbsence} onSaveSpecialDay={handleSaveSpecialDay} onDeleteSpecialDay={handleDeleteSpecialDay}
                />;
      case 'employees':
        return <EmployeeList 
                    employees={employees} roles={roles} onAdd={handleOpenAddEmployee} onEdit={handleOpenEditEmployee}
                    onDelete={handleDeleteEmployee} onImport={() => setIsCsvImportOpen(true)}
                />;
      case 'settings':
        return <Settings
                  roles={roles} employees={employees} locations={locations} shifts={shifts} departments={departments}
                  absenceTypes={absenceTypes} absences={absences} specialDayTypes={specialDayTypes} specialDays={specialDays}
                  onAddRole={handleAddRole} onUpdateRole={handleUpdateRole} onDeleteRole={handleDeleteRole}
                  onAddLocation={handleAddLocation} onUpdateLocation={handleUpdateLocation} onDeleteLocation={handleDeleteLocation}
                  onAddDepartment={handleAddDepartment} onUpdateDepartment={handleUpdateDepartment} onDeleteDepartment={handleDeleteDepartment}
                  onAddAbsenceType={handleAddAbsenceType} onUpdateAbsenceType={handleUpdateAbsenceType} onDeleteAbsenceType={handleDeleteAbsenceType}
                  onAddSpecialDayType={handleAddSpecialDayType} onUpdateSpecialDayType={handleUpdateSpecialDayType} onDeleteSpecialDayType={handleDeleteSpecialDayType}
               />;
      case 'profile':
        return <Profile />;
      default:
        return <div>Error: View not found</div>;
    }
  };

  return (
    <>
      <div className="flex h-screen bg-gray-100 dark:bg-blue-night-950 text-gray-800 dark:text-gray-200 font-sans">
        <Sidebar currentView={view} setView={setView} onLogout={logout} isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            employees={employees} absenceTypes={absenceTypes} inboxMessages={inboxMessages}
            onValidateRequest={handleValidateRequest} onRefuseRequest={handleRefuseRequest} onFollowUpComplaint={handleFollowUpComplaint}
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-blue-night-950 p-6">
            {renderView()}
          </main>
        </div>
      </div>
      {employeeEditor.isOpen && (
          <EmployeeEditor 
              employee={employeeEditor.employee} roles={roles} onSave={onSaveEmployee}
              onClose={handleCloseEmployeeEditor} onDelete={onDeleteEmployee}
              employeeAvailability={employeeAvailabilities.find(a => a.employeeId === employeeEditor.employee?.id)}
              onSaveAvailability={handleSaveEmployeeAvailability}
              onRegenerateAccessCode={handleRegenerateAccessCode}
          />
      )}
      {isCsvImportOpen && (
        <CSVImportModal 
            onClose={() => setIsCsvImportOpen(false)} onImport={onImportEmployees}
        />
      )}
    </>
  );
}
