"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Container,
  Button,
  IconButton,
  CircularProgress,
  Divider,
  Badge,
} from "@mui/material";
import CircleNotificationsRoundedIcon from "@mui/icons-material/CircleNotificationsRounded";
import { KeyboardArrowDown } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useTranslation } from "@shared-lib";
import { getUserDetails, editEditUser } from "../utils/API/services/ProfileService";
import { showToastMessage } from "../components/ToastComponent/Toastify";
import ProfileAvatar from "../components/Profile/ProfileAvatar";
import ProfileField from "../components/Profile/ProfileField";
import NameEditField from "../components/Profile/NameEditField";
import ConfirmationModal from "../components/ConfirmationModal/ConfirmationModal";
import Layout from "../components/Layout";
import { LANGUAGE_OPTIONS, LanguageCode } from "../utils/constants/language";
import { Select, MenuItem, FormControl } from "@mui/material";
import SwadhaarBottomNav from "../components/Swadhaar/SwadhaarBottomNav";
import { getUnreadCount } from "../utils/alertsStore";
import { telemetryFactory } from "../utils/telemtery";

const ProfilePage = () => {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchProfile();
    setUnreadCount(getUnreadCount());
    telemetryFactory.impression({
      edata: {
        type: 'workflow',
        subtype: '',
        pageid: 'profile',
        uri: '/profile'
      }
    });
  }, []);


  const fetchProfile = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      if (userId) {
        const response = await getUserDetails(userId, true);
        if (response?.result?.userData) {
          const userData = response.result.userData;
          setProfileData(userData);

          // Sync localStorage for consistency across pages
          const imageUrl = userData.name || userData.basicDetails?.image || "";
          if (imageUrl) localStorage.setItem("profilePicture", imageUrl);
          if (userData.firstName) {
            localStorage.setItem("firstName", userData.firstName);
            localStorage.setItem("name", userData.firstName);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching profile", error);
      showToastMessage(t("LEARNER_APP.PROFILE.ERROR_FETCHING"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async (newName: string) => {
    try {
      const userId = localStorage.getItem("userId");
      if (userId) {
        const nameParts = newName.trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
        
        await editEditUser(userId, { firstName, lastName });
        showToastMessage(t("LEARNER_APP.PROFILE.NAME_UPDATED_SUCCESS"), "success");
        setIsEditingName(false);
        fetchProfile(); // Refresh data
      }
    } catch (error) {
      console.error("Error updating name", error);
      showToastMessage(t("LEARNER_APP.PROFILE.ERROR_UPDATING_NAME"), "error");
      throw error;
    }
  };

  const handleLanguageChange = (event: any) => {
    const newLang = event.target.value as LanguageCode;
    setLanguage(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", newLang);
    }
  };

  const handleLogout = () => {
    setLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    telemetryFactory.interact({
      edata: {
        id: 'logout-confirm-click',
        type: 'CLICK',
        pageid: 'profile'
      }
    });
    localStorage.clear();
    router.push("/swadhaar-login");
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  if (loading && !profileData) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress sx={{ color: "#E6873C" }} />
      </Box>
    );
  }

  const fullName = `${profileData?.firstName || ""} ${profileData?.lastName || ""}`.trim();

  // Extraction of custom fields based on spec
  const getCustomFieldValue = (fieldId: string) => {
    const field = profileData?.customFields?.find((f: any) => f.fieldId === fieldId);
    return field ? field.value : "";
  };

  const cflLocation = getCustomFieldValue("cflLocation") || "CFL Jharkhand - Torpa";
  const joiningDate = profileData?.createdOn ? new Date(profileData.createdOn).toLocaleDateString("en-GB") : "12/03/2026";

  const getDisplayRole = (role: string) => {
    if (!role) return t("CFL_DASHBOARD.TRAINER");
    const r = role.trim().toUpperCase();
    if (r === "ARM" || r === "DI" || r === "DISTRICT INCHARGE") return "ARM";
    if (r === "CFL" || r === "CFL INCHARGE") return t("CFL_DASHBOARD.DISTRICT_INCHARGE");
    if (r === "TRAINER" || r === "LEARNER") return t("CFL_DASHBOARD.TRAINER");
    return role;
  };

  return (
    <Layout onlyHideElements={["footer", "topBar"]}>
      <Box sx={{ bgcolor: "#F9FAFB", minHeight: "100vh" }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #E5E7EB",
            bgcolor: "#FFFFFF",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "20px", color: "#1F2937" }}>
            {t("CFL_DASHBOARD.PROFILE")}
          </Typography>
          <Box onClick={() => router.push("/alerts")} sx={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
            <Badge
              badgeContent={unreadCount > 0 ? unreadCount : null}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: 9,
                  height: 16,
                  minWidth: 16,
                  backgroundColor: '#FFFFFF',
                  color: '#E6873C',
                  border: '1px solid #E6873C',
                  top: 2,
                  right: 2
                }
              }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(230,135,60,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CircleNotificationsRoundedIcon sx={{ fontSize: 24, color: '#E6873C' }} />
              </Box>
            </Badge>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#E6873C", mt: 0.5 }}>{t("CFL_DASHBOARD.ALERTS")}</Typography>
          </Box>
        </Box>


        <Container maxWidth="sm" sx={{ py: 3 }}>
          {/* Avatar Section */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 4,
              p: 3,
              bgcolor: "#FFFFFF",
              borderRadius: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <ProfileAvatar
              initials={getInitials(fullName)}
              imageUrl={profileData?.name || profileData?.basicDetails?.image || null}
              size={100}
            />
            <Button
              variant="contained"
              sx={{
                mt: 2,
                borderRadius: "10px",
                backgroundColor: "#E6873C",
                color: "#FFFFFF",
                textTransform: "none",
                fontWeight: 600,
                width: "200px",
                height: "45px",
                "&:hover": {
                  backgroundColor: "#D97706",
                },
              }}
            >
              {t("CFL_DASHBOARD.UPLOAD_PHOTO")}
            </Button>
          </Box>

          {/* Form Fields */}
          <Box sx={{ p: 3, bgcolor: "#FFFFFF", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            {/* Language Field with Dropdown */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: "12px", color: "#6B7280", mb: 0.5, fontWeight: 400 }}>
                {t("CFL_DASHBOARD.LANGUAGE")}
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={language || "en"}
                  onChange={handleLanguageChange}
                  IconComponent={KeyboardArrowDown}
                  sx={{
                    height: "48px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    color: "#1F2937",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#E5E7EB",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#E5E7EB",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#E6873C",
                    },
                  }}
                >
                  {LANGUAGE_OPTIONS.map((option:any) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {isEditingName ? (
              <NameEditField
                label="Name"
                initialValue={fullName}
                onSave={handleSaveName}
                onCancel={() => setIsEditingName(false)}
              />
            ) : (
              <ProfileField
                label="Name"
                value={fullName}
                isEditable={true}
                onEditClick={() => setIsEditingName(true)}
                readOnly={true}
              />
            )}

            <ProfileField label="Designation" value={getDisplayRole(profileData?.role)} />
            <ProfileField label="CFL Location" value={cflLocation} />
            <ProfileField label="Mobile Number" value={profileData?.mobile || ""} />
            <ProfileField label="Email" value={profileData?.email || ""} />
            <ProfileField label="Joining Date" value={joiningDate} />

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="outlined"
              fullWidth
              sx={{
                mt: 4,
                borderRadius: "10px",
                borderColor: "#FF6B6B",
                color: "#FF6B6B",
                textTransform: "none",
                fontWeight: 600,
                height: "48px",
                fontSize: "16px",
                "&:hover": {
                  borderColor: "#EE5253",
                  backgroundColor: "rgba(255, 107, 107, 0.04)",
                },
              }}
            >
              {t("CFL_DASHBOARD.LOGOUT")}
            </Button>
          </Box>
        </Container>

        {/* Bottom Nav Spacer */}
        <Box sx={{ height: "80px" }} />
      </Box>

      {/* Confirmation Modal */}
      <ConfirmationModal
        modalOpen={logoutModalOpen}
        message={t("COMMON.SURE_LOGOUT")}
        handleAction={confirmLogout}
        handleCloseModal={() => setLogoutModalOpen(false)}
        buttonNames={{
          primary: t("COMMON.LOGOUT"),
          secondary: t("COMMON.CANCEL"),
        }}
      />
      
      <SwadhaarBottomNav />
    </Layout>


  );
};

export default ProfilePage;
