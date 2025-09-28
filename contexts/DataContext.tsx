import React, { createContext, useContext, useReducer, ReactNode, useEffect, useCallback } from 'react';
import { User, Employee, Shift, Role, Location, Department, Absence, AbsenceType, SpecialDay, SpecialDayType, InboxMessage, EmployeeAvailability, WeeklyAvailability } from '../types';
import * as api from '../services/api';
import { useAuth } from './AuthContext';

// All data related to a single company
interface CompanyDataContextType {
    employees: Employee[];
    shifts: Shift[];
    roles: Role[];
    locations: Location[];
    departments: Department[];
    absences: Absence[];
    absenceTypes: AbsenceType[];
    specialDays: SpecialDay[];
    specialDayTypes: SpecialDayType[];
    inboxMessages: InboxMessage[];
    employeeAvailabilities: EmployeeAvailability[];
}

interface DataState extends CompanyDataContextType {
    isLoading: boolean;
    error: string | null;
}

// All data modification handlers
interface DataHandlerContextType {
    handleSaveEmployee: (employee: Employee, isNew: boolean) => Promise<void>;
    handleDeleteEmployee: (employeeId: string) => Promise<void>;
    handleRegenerateAccessCode: (employeeId: string) => Promise<void>;
    handleSaveShift: (shift: Shift) => Promise<void>;
    handleDeleteShift: (shiftId: string) => Promise<void>;
    handleDeleteMultipleShifts: (shiftIds: string[]) => Promise<void>;
    handleUpdateShifts: (updatedShifts: Shift[]) => Promise<void>;
    handleAddRole: (name: string) => Promise<void>;
    handleUpdateRole: (id: string, name: string) => Promise<void>;
    handleDeleteRole: (id: string) => Promise<void>;
    handleAddLocation: (name: string, address?: string) => Promise<void>;
    handleUpdateLocation: (id: string, name: string, address?: string) => Promise<void>;
    handleDeleteLocation: (id: string) => Promise<void>;
    handleAddDepartment: (name: string) => Promise<void>;
    handleUpdateDepartment: (id: string, name: string) => Promise<void>;
    handleDeleteDepartment: (id: string) => Promise<void>;
    handleAddAbsenceType: (name: string, color: string) => Promise<void>;
    handleUpdateAbsenceType: (id: string, name: string, color: string) => Promise<void>;
    handleDeleteAbsenceType: (id: string) => Promise<void>;
    handleSaveAbsence: (absence: Absence) => Promise<void>;
    handleDeleteAbsence: (absenceId: string) => Promise<void>;
    handleAddSpecialDayType: (name: string, isHoliday: boolean) => Promise<void>;
    handleUpdateSpecialDayType: (id: string, name: string, isHoliday: boolean) => Promise<void>;
    handleDeleteSpecialDayType: (id: string) => Promise<void>;
    handleSaveSpecialDay: (specialDay: SpecialDay) => Promise<void>;
    handleDeleteSpecialDay: (specialDayId: string) => Promise<void>;
    handleValidateRequest: (messageId: string) => Promise<void>;
    handleRefuseRequest: (messageId: string, reason: string) => Promise<void>;
    handleFollowUpComplaint: (messageId: string) => Promise<void>;
    handleSaveEmployeeAvailability: (employeeId: string, availability: WeeklyAvailability) => Promise<void>;
    handleImportEmployees: (importedData: Array<Omit<Employee, 'id' | 'avatarUrl' | 'companyId'>>) => Promise<void>;
    handleBulkAddShifts: (newShifts: Array<Omit<Shift, 'id' | 'companyId'>>) => Promise<void>;
}

interface DataContextType extends DataState, DataHandlerContextType {}

const DataContext = createContext<DataContextType | undefined>(undefined);

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: CompanyDataContextType }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'SET_DATA'; payload: Partial<CompanyDataContextType> }
  | { type: 'CLEAR_DATA' };

const initialState: DataState = {
    employees: [], shifts: [], roles: [], locations: [], departments: [], absences: [],
    absenceTypes: [], specialDays: [], specialDayTypes: [], inboxMessages: [], employeeAvailabilities: [],
    isLoading: true, // Start in loading state
    error: null,
};

const dataReducer = (state: DataState, action: Action): DataState => {
    switch(action.type) {
        case 'FETCH_START':
            return { ...state, isLoading: true, error: null };
        case 'FETCH_SUCCESS':
            return { ...state, isLoading: false, ...action.payload };
        case 'FETCH_ERROR':
            return { ...state, isLoading: false, error: action.payload };
        case 'SET_DATA':
            return { ...state, ...action.payload };
        case 'CLEAR_DATA':
            return { ...initialState, isLoading: false };
        default:
            return state;
    }
};

const generateAccessCode = () => Math.floor(100000 + Math.random() * 900000).toString();

export const DataProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [state, dispatch] = useReducer(dataReducer, initialState);
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.companyId) return;
            if (!state.isLoading) dispatch({ type: 'FETCH_START' });
            try {
                const data = await api.getCompanyData(user.companyId);
                if (data.employeeAvailabilities) {
                    data.employeeAvailabilities = (data.employeeAvailabilities as any[]).map((av) => ({
                        ...av,
                        id: av.employeeId,
                    }));
                }
                dispatch({ type: 'FETCH_SUCCESS', payload: data });
            } catch (error) {
                dispatch({ type: 'FETCH_ERROR', payload: 'Failed to load company data.'});
            }
        };

        if (user) {
            fetchData();
        } else {
            dispatch({ type: 'CLEAR_DATA' });
        }
    }, [user]);

    useEffect(() => {
        if (!user?.companyId) {
            return;
        }

        const intervalId = setInterval(async () => {
            try {
                const messages = await api.apiGetInboxMessages(user.companyId);
                dispatch({ type: 'SET_DATA', payload: { inboxMessages: messages } });
            } catch (error) {
                console.error("Failed to refetch inbox messages:", error);
            }
        }, 60000); // Poll every 60 seconds (1 minute)

        return () => clearInterval(intervalId);
    }, [user]);

    // Automatic Clock-Out for Pro Plus users
    useEffect(() => {
        if (user?.plan !== 'Pro Plus' || !user?.companyId) {
            return;
        }

        const autoClockOutInterval = setInterval(async () => {
            const now = new Date();
            const shiftsToAutoClockOut: Shift[] = [];

            state.shifts.forEach(shift => {
                const thirtyMinsAfterEnd = new Date(new Date(shift.endTime).getTime() + 30 * 60 * 1000);
                if (shift.actualStartTime && !shift.actualEndTime && now > thirtyMinsAfterEnd) {
                    shiftsToAutoClockOut.push({
                        ...shift,
                        actualEndTime: shift.endTime, // Clock out at scheduled end time
                    });
                }
            });

            if (shiftsToAutoClockOut.length > 0) {
                console.log(`Auto-clocking out ${shiftsToAutoClockOut.length} shifts.`);
                
                const updatePromises = shiftsToAutoClockOut.map(s => 
                    api.apiUpdateItem('shifts', s.id, s)
                );
                
                try {
                    await Promise.all(updatePromises);

                    // Update local state
                    const updatedShifts = state.shifts.map(originalShift => {
                        const foundUpdate = shiftsToAutoClockOut.find(s => s.id === originalShift.id);
                        return foundUpdate || originalShift;
                    });
                    
                    dispatch({ type: 'SET_DATA', payload: { shifts: updatedShifts } });

                } catch (error) {
                    console.error("Failed to auto-clock out shifts:", error);
                }
            }
        }, 60000); // Check every minute

        return () => clearInterval(autoClockOutInterval);
    }, [user, state.shifts]);

    // Fix: Improve generic type safety for item handlers to prevent type mismatches.
    // Generic handler for saving (creating or updating) an item with optimistic UI
    const handleSaveItem = async <K extends keyof CompanyDataContextType>(
        dataType: K,
        item: CompanyDataContextType[K][0]
    ) => {
        if (!user?.companyId) {
            console.error("Cannot save item: user not authenticated or missing companyId.");
            return;
        }

        const originalData = state[dataType];
        const isNew = !originalData.some(i => i.id === item.id);
        const itemWithCompanyId = { ...item, companyId: user.companyId };

        const optimisticData = isNew
            ? [...originalData, itemWithCompanyId]
            : originalData.map(i => (i.id === item.id ? itemWithCompanyId : i));

        dispatch({ type: 'SET_DATA', payload: { [dataType]: optimisticData } });

        try {
            if (isNew) {
                const { id, ...dataToCreate } = itemWithCompanyId as any; 
                const savedItem = await api.apiCreateItem<CompanyDataContextType[K][0]>(dataType.toString(), dataToCreate);
                const finalData = optimisticData.map(i => (i.id === item.id ? savedItem : i));
                dispatch({ type: 'SET_DATA', payload: { [dataType]: finalData } });
            } else {
                await api.apiUpdateItem<CompanyDataContextType[K][0]>(dataType.toString(), item.id, itemWithCompanyId);
            }
        } catch (error) {
            dispatch({ type: 'SET_DATA', payload: { [dataType]: originalData } });
            console.error(`Failed to save ${dataType}:`, error);
        }
    };

    // Generic handler for deleting an item optimistically
    const handleDeleteItem = async <K extends keyof CompanyDataContextType>(dataType: K, itemId: string) => {
        const originalData = state[dataType];
        const optimisticData = originalData.filter(item => item.id !== itemId);
        dispatch({ type: 'SET_DATA', payload: { [dataType]: optimisticData } });
        try {
            await api.apiDeleteItem(dataType.toString(), itemId);
        } catch (error) {
            dispatch({ type: 'SET_DATA', payload: { [dataType]: originalData } });
            console.error(`Failed to delete ${dataType}:`, error);
        }
    };
    
    // --- Specific Handlers ---

    const handleSaveShift = (shift: Shift) => handleSaveItem('shifts', shift);
    const handleDeleteShift = (shiftId: string) => handleDeleteItem('shifts', shiftId);
    
    const handleSaveEmployee = async (employee: Employee, isNew: boolean) => {
        let employeeToSave = { ...employee };
        if (isNew && user?.plan === 'Pro Plus' && !employeeToSave.accessCode) {
            employeeToSave.accessCode = generateAccessCode();
        }
        await handleSaveItem('employees', employeeToSave);
    };

    const handleDeleteEmployee = async (employeeId: string) => {
        const originalState = { employees: state.employees, shifts: state.shifts, absences: state.absences };
        const newEmployees = state.employees.filter(e => e.id !== employeeId);
        const newShifts = state.shifts.filter(s => s.employeeId !== employeeId);
        const newAbsences = state.absences.filter(a => a.employeeId !== employeeId);
        
        dispatch({ type: 'SET_DATA', payload: { employees: newEmployees, shifts: newShifts, absences: newAbsences } });

        try {
            await api.apiDeleteItem('employees', employeeId);
        } catch (error) {
            dispatch({ type: 'SET_DATA', payload: originalState });
            console.error("Failed to delete employee", error);
        }
    };

    const handleRegenerateAccessCode = async (employeeId: string) => {
        const employee = state.employees.find(e => e.id === employeeId);
        if(!employee) return;
        const updatedEmployee = {...employee, accessCode: generateAccessCode()};
        await handleSaveItem('employees', updatedEmployee);
    };
    
    const handleUpdateShifts = async (updatedShifts: Shift[]) => {
        if (!user?.companyId) return;
        const originalShifts = state.shifts;
        dispatch({ type: 'SET_DATA', payload: { shifts: updatedShifts } });
        try {
            await api.apiUpdateAllShifts(updatedShifts, user.companyId);
        } catch (error) {
            dispatch({ type: 'SET_DATA', payload: { shifts: originalShifts }});
            console.error("Failed to update shifts", error);
        }
    };

    const handleDeleteMultipleShifts = async (shiftIds: string[]) => {
        const originalShifts = state.shifts;
        const optimisticShifts = originalShifts.filter(s => !shiftIds.includes(s.id));
        dispatch({ type: 'SET_DATA', payload: { shifts: optimisticShifts } });
        try {
            await api.apiBulkDeleteShifts(shiftIds);
        } catch (error) {
            dispatch({ type: 'SET_DATA', payload: { shifts: originalShifts } });
            console.error("Failed to delete multiple shifts", error);
        }
    };

    const handleAddRole = (name: string) => handleSaveItem('roles', { id: `new-role-${Date.now()}`, name, companyId: user!.companyId });
    const handleUpdateRole = (id: string, name: string) => handleSaveItem('roles', { id, name, companyId: user!.companyId });
    const handleDeleteRole = (id: string) => handleDeleteItem('roles', id);

    const handleAddLocation = (name: string, address?: string) => handleSaveItem('locations', { id: `new-loc-${Date.now()}`, name, address, companyId: user!.companyId });
    const handleUpdateLocation = (id: string, name: string, address?: string) => handleSaveItem('locations', { id, name, address, companyId: user!.companyId });
    const handleDeleteLocation = (id: string) => handleDeleteItem('locations', id);

    const handleAddDepartment = (name: string) => handleSaveItem('departments', { id: `new-dept-${Date.now()}`, name, companyId: user!.companyId });
    const handleUpdateDepartment = (id: string, name: string) => handleSaveItem('departments', { id, name, companyId: user!.companyId });
    const handleDeleteDepartment = (id: string) => handleDeleteItem('departments', id);
    
    const handleAddAbsenceType = (name: string, color: string) => handleSaveItem('absenceTypes', { id: `new-at-${Date.now()}`, name, color, companyId: user!.companyId });
    const handleUpdateAbsenceType = (id: string, name: string, color: string) => handleSaveItem('absenceTypes', { id, name, color, companyId: user!.companyId });
    const handleDeleteAbsenceType = (id: string) => handleDeleteItem('absenceTypes', id);
    
    const handleSaveAbsence = (absence: Absence) => handleSaveItem('absences', absence);
    const handleDeleteAbsence = (absenceId: string) => handleDeleteItem('absences', absenceId);
    
    const handleAddSpecialDayType = (name: string, isHoliday: boolean) => handleSaveItem('specialDayTypes', { id: `new-sdt-${Date.now()}`, name, isHoliday, companyId: user!.companyId });
    const handleUpdateSpecialDayType = (id: string, name: string, isHoliday: boolean) => handleSaveItem('specialDayTypes', { id, name, isHoliday, companyId: user!.companyId });
    const handleDeleteSpecialDayType = (id: string) => handleDeleteItem('specialDayTypes', id);

    const handleSaveSpecialDay = (specialDay: SpecialDay) => handleSaveItem('specialDays', specialDay);
    const handleDeleteSpecialDay = (specialDayId: string) => handleDeleteItem('specialDays', specialDayId);

    const handleValidateRequest = async (messageId: string) => {
        const message = state.inboxMessages.find(m => m.id === messageId);
        if (!message || !message.startDate || !message.endDate || !message.absenceTypeId) return;

        const hasConflict = state.shifts.some(shift => shift.employeeId === message.employeeId && shift.startTime < message.endDate! && shift.endTime > message.startDate!);
        if (hasConflict) {
            alert("Cannot approve absence due to a conflicting shift. Please resolve the shift conflict first.");
            return;
        }
        
        const newAbsence: Absence = { id: `new-absence-${Date.now()}`, employeeId: message.employeeId, absenceTypeId: message.absenceTypeId, startDate: message.startDate, endDate: message.endDate, companyId: user!.companyId };
        await handleSaveAbsence(newAbsence);
        
        const updatedMessage = { ...message, status: 'validated' as InboxMessage['status'] };
        await handleSaveItem('inboxMessages', updatedMessage);
        
        alert('Absence request approved and added to the schedule.');
    };
    
    // FIX: Make the function async and await the handleSaveItem call to match the required Promise<void> return type.
    const handleRefuseRequest = async (messageId: string, reason: string) => {
        const message = state.inboxMessages.find(m => m.id === messageId);
        if (!message) return;
        const updatedMessage = { ...message, status: 'refused' as const, refusalReason: reason };
        await handleSaveItem('inboxMessages', updatedMessage);
    };
    const handleFollowUpComplaint = (messageId: string) => handleSaveItem('inboxMessages', { ...state.inboxMessages.find(m=>m.id===messageId)!, status: 'followed-up' });

    const handleSaveEmployeeAvailability = (employeeId: string, availability: WeeklyAvailability) => handleSaveItem('employeeAvailabilities', { id: employeeId, employeeId, availability, companyId: user!.companyId });

    const handleImportEmployees = async (importedData: Array<Omit<Employee, 'id' | 'avatarUrl' | 'companyId'>>) => {
        if (!user?.companyId) return;
        
        const existingEmails = new Set(state.employees.map(e => e.email.toLowerCase()));
        const newEmployees: Omit<Employee, 'id' | 'companyId'>[] = [];
        
        importedData.forEach(data => {
            const email = data.email?.toLowerCase();
            if (email && data.name && !existingEmails.has(email)) {
                let accessCode = data.accessCode;
                if (user?.plan === 'Pro Plus' && !accessCode) {
                    accessCode = generateAccessCode();
                }
                newEmployees.push({
                    name: data.name, email: data.email, phone: data.phone || '',
                    gender: data.gender || 'Prefer not to say', role: data.role || 'Unassigned',
                    accessCode: accessCode,
                    avatarUrl: null,
                });
                existingEmails.add(email);
            }
        });
        
        if (newEmployees.length > 0) {
            try {
                const createdEmployees = await api.apiBulkCreateEmployees(newEmployees, user.companyId);
                const updatedEmployeeList = [...state.employees, ...createdEmployees];
                dispatch({ type: 'SET_DATA', payload: { employees: updatedEmployeeList } });
                alert(`${createdEmployees.length} new employee(s) imported.`);
            } catch (error) {
                console.error("Failed to import employees:", error);
                alert("An error occurred during import.");
            }
        } else {
            alert('No new employees to import.');
        }
    };
    
    const handleBulkAddShifts = async (newShiftsData: Array<Omit<Shift, 'id' | 'companyId'>>) => {
        if (!user?.companyId) return;

        try {
            const createdShifts = await api.apiBulkCreateShifts(newShiftsData, user.companyId);
            dispatch({ type: 'SET_DATA', payload: { shifts: [...state.shifts, ...createdShifts] } });
        } catch (error) {
            console.error("Failed to bulk add shifts:", error);
            alert("An error occurred while creating shifts. Please try again.");
            // No need to revert since we aren't doing an optimistic update here
        }
    };


    const value: DataContextType = {
        ...state,
        handleSaveEmployee,
        handleDeleteEmployee,
        handleRegenerateAccessCode,
        handleSaveShift,
        handleDeleteShift,
        handleDeleteMultipleShifts,
        handleUpdateShifts,
        handleAddRole,
        handleUpdateRole,
        handleDeleteRole,
        handleAddLocation,
        handleUpdateLocation,
        handleDeleteLocation,
        handleAddDepartment,
        handleUpdateDepartment,
        handleDeleteDepartment,
        handleAddAbsenceType,
        handleUpdateAbsenceType,
        handleDeleteAbsenceType,
        handleSaveAbsence,
        handleDeleteAbsence,
        handleAddSpecialDayType,
        handleUpdateSpecialDayType,
        handleDeleteSpecialDayType,
        handleSaveSpecialDay,
        handleDeleteSpecialDay,
        handleValidateRequest,
        handleRefuseRequest,
        handleFollowUpComplaint,
        handleSaveEmployeeAvailability,
        handleImportEmployees,
        handleBulkAddShifts,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}