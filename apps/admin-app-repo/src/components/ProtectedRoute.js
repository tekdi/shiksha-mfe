import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "next-i18next";

const ProtectedRoute = ({ children }) => {
  const { t } = useTranslation();
  let user;
  const router = useRouter();
  const { loading } = useAuth();
 
  useEffect(() => {
    let user;
    if (typeof window !== "undefined" && window.localStorage) {
      user = localStorage.getItem("token");
    }

    if (!loading && !user) {
      router.push("/home");
    }
  }, [loading, router]);

  if (loading) {
    return <p>{t("COMMON.LOADING")}</p>;
  }

  return children;
};

export default ProtectedRoute;
