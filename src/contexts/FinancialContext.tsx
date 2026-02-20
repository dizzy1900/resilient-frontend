import { createContext, useContext, useState, ReactNode } from 'react';

export interface FinancialSettings {
  discountRate: number;
  analysisPeriod: number;
  currency: string;
  includeBusinessInterruption: boolean;
  dailyRevenue: number;
}

interface FinancialContextType {
  settings: FinancialSettings;
  updateSettings: (updates: Partial<FinancialSettings>) => void;
}

const defaultSettings: FinancialSettings = {
  discountRate: 15,
  analysisPeriod: 50,
  currency: 'USD',
  includeBusinessInterruption: false,
  dailyRevenue: 0,
};

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<FinancialSettings>(defaultSettings);

  const updateSettings = (updates: Partial<FinancialSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return (
    <FinancialContext.Provider value={{ settings, updateSettings }}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancialSettings = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancialSettings must be used within a FinancialProvider');
  }
  return context;
};
