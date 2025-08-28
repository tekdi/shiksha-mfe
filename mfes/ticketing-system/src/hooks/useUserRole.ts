import { useState, useEffect } from "react";
import { getUserRoleFromLocalStorage } from "@/utils/roleUtils";

export const useUserRole = (overrideRole?: string) => {
  const [userRole, setUserRole] = useState<string>("user");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectUserRole = () => {
      try {
        if (overrideRole) {
          setUserRole(overrideRole);
        } else {
          const detectedRole = getUserRoleFromLocalStorage();
          setUserRole(detectedRole);
        }
      } catch (error) {
        console.error("Error detecting user role:", error);
        setUserRole("user");
      } finally {
        setIsLoading(false);
      }
    };

    detectUserRole();
  }, [overrideRole]);

  const updateUserRole = (newRole: string) => {
    setUserRole(newRole);
  };

  return {
    userRole,
    isLoading,
    updateUserRole,
  };
};
