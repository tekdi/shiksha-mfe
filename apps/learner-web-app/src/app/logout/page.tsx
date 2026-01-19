"use client";
import { useEffect } from "react";
import { logout } from "@learner/utils/API/LoginService";
import { useRouter } from "next/navigation";
import { preserveLocalStorage } from "@learner/utils/helper";
import { Loader, useTranslation } from "@shared-lib";
import { Telemetry } from "@shared-lib-v2/DynamicForm/utils/app.constant";
import { telemetryFactory } from "../../utils/telemtery";

// Helper function to clear cookies
const clearCookies = () => {
  if (typeof document !== "undefined") {
    // List of cookies to clear
    const cookiesToClear = [
      "token",
      "authToken",
      "userData",
      "adminInfo",
      "userId",
      "tenantId",
      "userProgram",
      "channelId",
      "collectionFramework",
      "uiConfig",
      "templtateId",
      "userIdName",
      "firstName",
      "academicYearId",
    ];

    cookiesToClear.forEach((cookieName) => {
      // Clear cookie for current domain
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      // Clear cookie for localhost domain
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`;
      // Clear cookie without domain
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;`;
    });

  }
};

function Logout() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const userLogout = async () => {
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          await logout(refreshToken);
        }
        const telemetryInteract = {
          context: {
            env: "sign-out",
            cdata: [],
          },
          edata: {
            id: "logout-success",
            type: Telemetry.CLICK,
            subtype: "",
            pageid: "sign-out",
          },
        };
        telemetryFactory.interact(telemetryInteract);
      } catch (error) {
        console.log(error);
      }
    };
    userLogout();
    if (typeof window !== "undefined" && window.localStorage) {
      // Clear cookies first
      clearCookies();
      // Specify the keys you want to keep
      preserveLocalStorage();
    }
    router.replace("/home");
  }, []);

  return <Loader isLoading={true} />;
}

export default Logout;
