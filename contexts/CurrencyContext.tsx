import React, { createContext, useContext, ReactNode, useCallback } from 'react';

interface CurrencyContextType {
  formatCurrency: (amount: number) => string;
  currency: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const locale = 'en-US'; // Use en-US to ensure a generic "$" symbol
  const currency = 'USD';

  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }, [locale, currency]);

  const value = { formatCurrency, currency };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
