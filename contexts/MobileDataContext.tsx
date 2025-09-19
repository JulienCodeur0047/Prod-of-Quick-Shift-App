import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Shift, AbsenceType } from '../types';
import * as api from '../services/api';
import { useMobileAuth } from './MobileAuthContext';

interface MobileDataContextType {
    shifts: Shift[];
    absenceTypes: AbsenceType[];
    isLoading: boolean;
    error: string | null;
    refetchData: () => void;
    submitRequest: (data: any) => Promise<boolean>;
}

const MobileDataContext = createContext<MobileDataContextType | undefined>(undefined);

export const MobileDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { employee } = useMobileAuth();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [absenceTypes, setAbsenceTypes] = useState<AbsenceType[]>([]);
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
            return true;
        } catch (error) {
            console.error("Failed to submit request", error);
            return false;
        }
    };
    
    const value = {
        shifts,
        absenceTypes,
        isLoading,
        error,
        refetchData: fetchData,
        submitRequest
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