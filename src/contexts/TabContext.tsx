import React, { createContext, useContext, useState } from 'react';

type TabType = 'HomeMain' | 'ForYou' | 'food' | 'Grocery' | 'Collections' | 'Pharmacy';

interface TabContextType {
  selectedTab: TabType;
  setSelectedTab: (tab: TabType) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export const TabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedTab, setSelectedTab] = useState<TabType>('ForYou');

  return (
    <TabContext.Provider value={{ selectedTab, setSelectedTab }}>{children}</TabContext.Provider>
  );
};

export const useTab = () => {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTab must be used within a TabProvider');
  }
  return context;
};
