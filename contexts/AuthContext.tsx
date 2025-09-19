import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { User, Plan, Subscription, Payment } from '../types';
import * as api from '../services/api';

export interface Permissions {
  canAccessDashboard: boolean;
  canExport: boolean;
  canAddAbsence: boolean;
  canImportEmployees: boolean;
  employeeLimit: number;
}

type LoginResult = {
    success: boolean;
    reason?: 'invalid' | 'unverified';
}

interface AuthContextType {
  user: User | null;
  subscription: Subscription | null;
  paymentHistory: Payment[];
  permissions: Permissions;
  isAuthLoading: boolean;
  login: (email: string, pass: string) => Promise<LoginResult>;
  loginWithGoogle: () => Promise<{ success: boolean }>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'avatarUrl' | 'isVerified' | 'companyId' | 'password'>, pass: string, price: number) => Promise<boolean>;
  updateUser: (updatedData: Partial<User>) => void;
  verifyUser: (email: string) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; messageKey: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; messageKey: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = api.onAuthStateChangedListener(async (firebaseUser) => {
        if (firebaseUser) {
            try {
                const userData = await api.getUserData(firebaseUser.uid);
                if (userData) {
                    // Sync Firestore `isVerified` with Firebase Auth `emailVerified`
                    if (userData.user.isVerified !== firebaseUser.emailVerified) {
                        const updatedUser = await api.apiUpdateUser(firebaseUser.uid, { isVerified: firebaseUser.emailVerified });
                        setUser(updatedUser);
                    } else {
                        setUser(userData.user);
                    }
                    setSubscription(userData.subscription || null);
                    setPaymentHistory(userData.paymentHistory || []);
                } else {
                    setUser(null);
                    setSubscription(null);
                    setPaymentHistory([]);
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error);
                setUser(null);
            }
        } else {
            setUser(null);
            setSubscription(null);
            setPaymentHistory([]);
        }
        setIsAuthLoading(false);
    });

    return unsubscribe;
  }, []);


  const permissions: Permissions = useMemo(() => {
    const plan = user?.plan || 'Gratuit';
    return {
      'Gratuit': { canAccessDashboard: false, canExport: false, canAddAbsence: false, canImportEmployees: false, employeeLimit: 10 },
      'Pro': { canAccessDashboard: true, canExport: true, canAddAbsence: true, canImportEmployees: true, employeeLimit: 100 },
      'Pro Plus': { canAccessDashboard: true, canExport: true, canAddAbsence: true, canImportEmployees: true, employeeLimit: 300 },
    }[plan];
  }, [user?.plan]);

  const login = async (email: string, pass: string): Promise<LoginResult> => {
    const result = await api.apiLogin(email, pass);
    // Auth state change will be handled by the onAuthStateChanged listener
    return result;
  };
  
  const loginWithGoogle = async (): Promise<{ success: boolean }> => {
    const result = await api.apiLoginWithGoogle();
    // Auth state will be handled by the listener
    return result;
  };

  const logout = () => {
    api.apiLogout();
    // State will be cleared by the onAuthStateChanged listener
  };

  const register = async (userData: Omit<User, 'id' | 'avatarUrl' | 'isVerified' | 'companyId' | 'password'>, pass: string, price: number): Promise<boolean> => {
    const result = await api.apiRegister(userData, pass, price);
    return result.success;
  };
  
  const verifyUser = (email: string) => {
      // In a real app, this would trigger an API call to resend verification.
      console.log(`Verification requested for ${email}`);
      // Consider implementing api.resendVerificationEmail(email);
  };

  const updateUser = async (updatedData: Partial<User>) => {
      if (!user) return;
      try {
        const updatedUser = await api.apiUpdateUser(user.id, updatedData);
        setUser(updatedUser);
      } catch (error) {
        console.error("Failed to update user:", error);
      }
  };
  
  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; messageKey: string }> => {
    if (!user) {
        return { success: false, messageKey: 'auth.notLoggedIn' };
    }
    return await api.apiChangePassword(currentPassword, newPassword);
  };
  
  const forgotPassword = async (email: string): Promise<{ success: boolean; messageKey: string }> => {
    return await api.apiForgotPassword(email);
  };

  const value = { 
    user, permissions, login, logout, register, updateUser, verifyUser, changePassword,
    subscription, paymentHistory, isAuthLoading, forgotPassword, loginWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};