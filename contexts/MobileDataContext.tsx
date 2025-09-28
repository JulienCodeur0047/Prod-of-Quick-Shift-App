import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Shift, AbsenceType, Location, Department, InboxMessage } from '../types';
import * as api from '../services/api';
import { useMobileAuth } from './MobileAuthContext';

interface MobileDataContextType {
    shifts: Shift[];
    absenceTypes: AbsenceType[];
    locations: Location[];
    departments: Department[];
    inboxMessages: InboxMessage[];
    isLoading: boolean;
    error: string | null;
    refetchData: () => void;
    submitRequest: (data: any) => Promise<boolean>;
    updateShift: (shift: Shift) => Promise<void>;
}

const MobileDataContext = createContext<MobileDataContextType | undefined>(undefined);

export const MobileDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { employee } = useMobileAuth();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [absenceTypes, setAbsenceTypes] = useState<AbsenceType[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!employee) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await api.apiGetMobileData(employee.id, employee.companyId);
            setShifts(data.shifts);
            setAbsenceTypes(data.absenceTypes);
            setLocations(data.locations);
            setDepartments(data.departments);
            setInboxMessages(data.inboxMessages);
        } catch (err) {
            console.error(err);
            setError("Failed to load schedule data.");
        } finally {
            setIsLoading(false);
        }
    }, [employee]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const submitRequest = async (requestData: any): Promise<boolean> => {
        if (!employee) return false;
        try {
            const dataToSend = {
                ...requestData,
                employeeId: employee.id,
                companyId: employee.companyId,
            };
            await api.apiSubmitRequest(dataToSend);
            // After submitting, refetch data to show the new request in history
            fetchData();
            return true;
        } catch (error) {
            console.error("Failed to submit request", error);
            return false;
        }
    };

    const updateShift = async (updatedShift: Shift) => {
        if (!employee) return;
        const originalShifts = [...shifts];

        // Optimistic update
        setShifts(prevShifts => 
            prevShifts.map(s => s.id === updatedShift.id ? updatedShift : s)
        );

        try {
            await api.apiUpdateItem('shifts', updatedShift.id, updatedShift);
        } catch (error) {
            console.error("Failed to update shift:", error);
            // Revert on failure
            setShifts(originalShifts);
            setError("Failed to update your shift. Please try again.");
        }
    };
    
    const value = {
        shifts,
        absenceTypes,
        locations,
        departments,
        inboxMessages,
        isLoading,
        error,
        refetchData: fetchData,
        submitRequest,
        updateShift
    };

    return (
        <MobileDataContext.Provider value={value}>
            {children}
        </MobileDataContext.Provider>
    );
};


export const useMobileData = (): MobileDataContextType => {
    const context = useContext(MobileDataContext);
    if (context === undefined) {
        throw new Error('useMobileData must be used within a MobileDataProvider');
    }
    return context;
};