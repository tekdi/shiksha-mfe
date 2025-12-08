"use client";
import React, { useState, useEffect } from "react";
import Layout from "../../../components/Layout";
import dynamic from "next/dynamic";
import { Box, Typography, Button, IconButton } from "@mui/material";
import { alpha } from "@mui/material/styles";
import Image from "next/image";
import { AccountCircleOutlined } from "@mui/icons-material";
import ProfileMenu from "../../../components/ProfileMenu/ProfileMenu";
import ConfirmationModal from "../../../components/ConfirmationModal/ConfirmationModal";
import { useTenant } from "@learner/context/TenantContext";
import { useTranslation } from "@shared-lib";
import { useRouter } from "next/navigation";
import LanguageDropdown from "@learner/components/LanguageDropdown/LanguageDropdown";

const CourseUnitDetails = dynamic(() => import("@CourseUnitDetails"), {
  ssr: false,
});

const ContentCourseClient = () => {
  const router = useRouter();
  const { tenant, contentFilter } = useTenant();
  const { t, language, setLanguage } = useTranslation();
  
  // Get tenant colors
  const primaryColor = contentFilter?.theme?.primaryColor || "#E6873C";
  const secondaryColor = contentFilter?.theme?.secondaryColor || "#1A1A1A";
  const backgroundColor = contentFilter?.theme?.backgroundColor || "#F5F5F5";
  const tenantIcon = contentFilter?.icon || "/logo.png";
  const tenantName = contentFilter?.title || tenant?.name || "Tenant";
  const tenantAlt = `${tenantName} logo`;
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFirstName(localStorage.getItem("firstName") || "");
    }
  }, []);

  const handleProfileClick = () => {
    router.push("/profile");
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    setLogoutModalOpen(true);
    setAnchorEl(null);
  };

  const performLogout = () => {
    // Redirect to proper logout page which handles API logout and cookie clearing
    router.push("/logout");
  };

  return (
    <Layout onlyHideElements={["footer", "topBar"]}>
      <Box sx={{ backgroundColor: backgroundColor, minHeight: "100vh" }}>
        <Box
          sx={{
            px: { xs: 2, md: 4 },
            py: { xs: 4, md: 6 },
            background: `linear-gradient(180deg, ${backgroundColor} 0%, ${alpha(
              backgroundColor,
              0.25
            )} 100%)`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
              mb: 3,
            }}
          >
            <Box 
              sx={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 1.5,
                cursor: "pointer",
                "&:hover": {
                  opacity: 0.8,
                },
              }}
              onClick={() => router.push("/dashboard?tab=1")}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  backgroundColor: alpha("#FFFFFF", 0.35),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                }}
              >
                <Image
                  src={tenantIcon}
                  alt={tenantAlt}
                  width={48}
                  height={48}
                  style={{ objectFit: "contain" }}
                />
              </Box>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "18px", sm: "22px" },
                  lineHeight: 1.3,
                  color: secondaryColor,
                }}
              >
                {tenantName}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <LanguageDropdown
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                size="small"
                minWidth={150}
              />
              <IconButton
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  border: `1px solid ${alpha(secondaryColor, 0.2)}`,
                  color: secondaryColor,
                  "&:hover": {
                    backgroundColor: alpha(primaryColor, 0.08),
                  },
                }}
              >
                <AccountCircleOutlined />
              </IconButton>
            </Box>
          </Box>

          <Typography
            variant="body1"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: secondaryColor,
              textTransform: "capitalize",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <span role="img" aria-label="wave">
              👋
            </span>
            {t("LEARNER_APP.PROFILE.MY_PROFILE") || "Welcome"},{" "}
            {firstName || "Learner"}!
          </Typography>
        </Box>
        <Box sx={{ px: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}>
          <CourseUnitDetails
            isShowLayout={false}
            _config={{
              default_img: "/images/unit.png",
              _card: { isHideProgress: true },
              _infoCard: {
                _cardMedia: { maxHeight: { xs: "200px", sm: "280px" } },
                default_img: "/images/image_ver.png",
              },
              _grid: { xs: 6, sm: 4, md: 3, lg: 2.5 },
            }}
          />
        </Box>
      </Box>
      <ProfileMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        onProfileClick={handleProfileClick}
        onLogout={handleLogoutClick}
      />

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        modalOpen={logoutModalOpen}
        message={t("COMMON.SURE_LOGOUT")}
        handleAction={performLogout}
        buttonNames={{
          primary: t("COMMON.LOGOUT"),
          secondary: t("COMMON.CANCEL"),
        }}
        handleCloseModal={() => setLogoutModalOpen(false)}
      />
    </Layout>
  );
};

export default ContentCourseClient;

