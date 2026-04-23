import { useEffect } from "react";
import { useRouter } from "next/router";
import { logout } from "../services/LoginService";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Loader from "@/components/Loader";
import { useTranslation } from "next-i18next";
import { useQueryClient } from '@tanstack/react-query';
import { preserveLocalStorage } from "@/utils/Helper";

function Logout() {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const userLogout = async () => {
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          await logout(refreshToken);
        }
      } catch (error) {
        console.log(error);
      }
    };
    userLogout();
    if (typeof window !== 'undefined' && window.localStorage) {
      // Specify the keys you want to keep
     preserveLocalStorage();
    }
    queryClient.clear();
  router.replace("/home");
  }, []);

  return <Loader showBackdrop={true} loadingText={t("COMMON.LOADING")} />;
}

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export default Logout;
