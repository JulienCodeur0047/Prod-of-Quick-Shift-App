import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Employee } from '../types';
import * as api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface MobileAuthContextType {
  employee: Employee | null;
  isLoading: boolean;
  login: (email: string, accessCode: string) => Promise<boolean>;
  logout: () => void;
}

const MobileAuthContext = createContext<MobileAuthContextType | undefined>(undefined);

export const MobileAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedEmployee = localStorage.getItem('quickshift-employee');
      if (storedEmployee) {
        setEmployee(JSON.parse(storedEmployee));
      }
    } catch (error) {
      console.error("Failed to parse stored employee data:", error);
      localStorage.removeItem('quickshift-employee');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, accessCode: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const employeeData = await api.apiLoginEmployee(email, accessCode);
      if (employeeData) {
        setEmployee(employeeData);
        localStorage.setItem('quickshift-employee', JSON.stringify(employeeData));
        return true;
      }
      setEmployee(null);
      localStorage.removeItem('quickshift-employee');
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setEmployee(null);
    localStorage.removeItem('quickshift-employee');
  };
  
  const value = { employee, isLoading, login, logout };

  if (isLoading) {
      return <LoadingSpinner />;
  }

  return (
    <MobileAuthContext.Provider value={value}>
      {children}
    </MobileAuthContext.Provider>
  );
};

export const useMobileAuth = (): MobileAuthContextType => {
  const context = useContext(MobileAuthContext);
  if (context === undefined) {
    throw new Error('useMobileAuth must be used within a MobileAuthProvider');
  }
  return context;
};