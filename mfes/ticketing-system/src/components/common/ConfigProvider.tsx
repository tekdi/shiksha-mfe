import React, { createContext, useContext, ReactNode } from "react";
import { AppConfig } from "@/types/config.types";
import { useAppConfig } from "@/hooks/useAppConfig";

interface ConfigContextType {
  appConfig: AppConfig | null;
  isLoading: boolean;
  error: string | null;
  updateConfig: (newConfig: Partial<AppConfig>) => void;
  resetConfig: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
  appName?: string;
  config?: Partial<AppConfig>;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({
  children,
  appName,
  config,
}) => {
  const { appConfig, isLoading, error, updateConfig, resetConfig } =
    useAppConfig(appName, config);

  const contextValue: ConfigContextType = {
    appConfig,
    isLoading,
    error,
    updateConfig,
    resetConfig,
  };

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};
