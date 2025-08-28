import { useState, useEffect } from "react";
import { AppConfig } from "@/types/config.types";
import { ConfigService } from "@/services/configService";

export const useAppConfig = (
  appName?: string,
  customConfig?: Partial<AppConfig>
) => {
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let config: AppConfig;

        if (customConfig && appName) {
          // Merge custom config with app defaults
          config = ConfigService.mergeConfig(customConfig, appName);
        } else if (appName) {
          // Use default config for app
          config = ConfigService.initializeConfig(appName);
        } else if (customConfig) {
          // Use custom config as-is (assuming it's complete)
          config = customConfig as AppConfig;
        } else {
          // Fallback to default
          config = ConfigService.getAppConfig("learner-web-app");
        }

        // Validate configuration
        const validation = ConfigService.validateAppConfig(config);
        if (!validation.isValid) {
          console.warn("Invalid app configuration:", validation.errors);
          setError(
            `Configuration validation failed: ${validation.errors.join(", ")}`
          );
        }

        setAppConfig(config);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load configuration";
        console.error("Error loading app config:", err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [appName, customConfig]);

  const updateConfig = (newConfig: Partial<AppConfig>) => {
    if (appConfig) {
      const mergedConfig = { ...appConfig, ...newConfig };
      setAppConfig(mergedConfig);
    }
  };

  const resetConfig = () => {
    if (appName) {
      const defaultConfig = ConfigService.getAppConfig(appName);
      setAppConfig(defaultConfig);
    }
  };

  return {
    appConfig,
    isLoading,
    error,
    updateConfig,
    resetConfig,
  };
};
