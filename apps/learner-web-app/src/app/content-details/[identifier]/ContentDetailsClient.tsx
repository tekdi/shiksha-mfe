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

const ContentEnrollDetails = dynamic(() => import("@ContentEnrollDetails"), {
  ssr: false,
});

const ContentDetailsClient = () => {
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
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 3, md: 5 },
            background: `linear-gradient(180deg, ${backgroundColor} 0%, ${alpha(
              backgroundColor,
              0.25
            )} 100%)`,
          }}
        >
          {/* Logo + Tenant Name (hidden on mobile) + Language + Profile - All in one line */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: { xs: 1, sm: 1.5, md: 2 },
              flexWrap: "nowrap",
              mb: { xs: 2, sm: 3 },
              width: "100%",
            }}
          >
            {/* Logo */}
            <Box
              sx={{
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                borderRadius: "50%",
                backgroundColor: alpha("#FFFFFF", 0.35),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                flexShrink: 0,
                cursor: "pointer",
                "&:hover": {
                  opacity: 0.8,
                },
              }}
              onClick={() => router.push("/dashboard?tab=1")}
            >
              <Image
                src={tenantIcon}
                alt={tenantAlt}
                width={48}
                height={48}
                style={{ objectFit: "contain" }}
              />
            </Box>

            {/* Tenant Name - Hidden on mobile */}
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: { xs: "18px", sm: "22px" },
                lineHeight: 1.3,
                color: secondaryColor,
                display: { xs: "none", sm: "block" },
                flexShrink: 0,
                cursor: "pointer",
                "&:hover": {
                  opacity: 0.8,
                },
              }}
              onClick={() => router.push("/dashboard?tab=1")}
            >
              {tenantName}
            </Typography>

            {/* Spacer to push language and profile to the right */}
            <Box sx={{ flex: 1, minWidth: 0 }} />

            {/* Language Dropdown */}
            <Box sx={{ flexShrink: 0 }}>
              <LanguageDropdown
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                size="small"
                minWidth={150}
              />
            </Box>

            {/* Profile Icon */}
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                border: `1px solid ${alpha(secondaryColor, 0.2)}`,
                color: secondaryColor,
                flexShrink: 0,
                "&:hover": {
                  backgroundColor: alpha(primaryColor, 0.08),
                },
              }}
            >
              <AccountCircleOutlined />
            </IconButton>
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
          <ContentEnrollDetails
            isShowLayout={false}
            _config={{
              default_img: "/images/image_ver.png",
              _infoCard: {
                _cardMedia: { maxHeight: { xs: "200px", sm: "280px" } },
                default_img: "/images/image_ver.png",
              },
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

export default ContentDetailsClient;
