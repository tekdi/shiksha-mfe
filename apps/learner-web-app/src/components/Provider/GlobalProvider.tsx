'use client';
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { getTenantInfo } from '@learner/utils/API/ProgramService';
import { filterContent } from '@shared-lib-v2/utils/AuthService';

export const GlobalProviderContext = React.createContext<{
  globalData: any;
  setGlobalData: React.Dispatch<React.SetStateAction<any>>;
  loading: boolean;
}>({ globalData: {}, setGlobalData: () => {}, loading: true });

export interface GlobalProviderProps {
  children: React.ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  const [globalData, setGlobalData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const channelId = localStorage.getItem('channelId');
      const tenantId = localStorage.getItem('tenantId');
      const collectionFramework = localStorage.getItem('collectionFramework');

      const res = await getTenantInfo();
      const currentDomain = window.location.hostname;
      const tenantInfo =
        res?.result.find((program: any) => program.domain === currentDomain) ??
        res?.result.find(
          (program: any) =>
            program.domain === process.env.NEXT_PUBLIC_POS_DOMAIN
        );

      if (tenantInfo) {
        localStorage.setItem('channelId', tenantInfo.channelId);
        localStorage.setItem('tenantId', tenantInfo.tenantId);
        localStorage.setItem(
          'collectionFramework',
          tenantInfo.collectionFramework
        );
        const filterFramework = await filterContent({
          instantId: tenantInfo.collectionFramework,
        });
        setGlobalData({ tenantInfo, filterFramework });
        setLoading(false);
      } else {
        // If no tenant info found, just set loading to false to prevent infinite reload
        console.warn('No tenant info found, but not reloading to prevent loop');
        setLoading(false);
      }
    };
    init();
  }, []);

  return (
    <GlobalProviderContext.Provider
      value={useMemo(
        () => ({ loading, globalData, setGlobalData }),
        [loading, globalData, setGlobalData]
      )}
    >
      {children}
    </GlobalProviderContext.Provider>
  );
};

export const useGlobalData = (): any => {
  const context = useContext(GlobalProviderContext);

  if (!context) {
    const stack = new Error().stack;
    throw new Error(
      `useGlobalData must be used within a GlobalProvider.\nCall stack:\n${stack}`
    );
  }
  return context;
};
