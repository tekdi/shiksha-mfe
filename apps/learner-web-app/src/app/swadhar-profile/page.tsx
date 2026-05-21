"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Container,
  Button,
  CircularProgress,
  Badge,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import CircleNotificationsRoundedIcon from "@mui/icons-material/CircleNotificationsRounded";
import { KeyboardArrowDown } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useTranslation } from "@shared-lib";
import { getUserDetails, editEditUser, uploadProfilePhoto } from "../../utils/API/services/ProfileService";
import { showToastMessage } from "../../components/ToastComponent/Toastify";
import ProfileAvatar from "../../components/Profile/ProfileAvatar";
import ProfileField from "../../components/Profile/ProfileField";
import NameEditField from "../../components/Profile/NameEditField";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import Layout from "../../components/Layout";
import { LANGUAGE_OPTIONS, LanguageCode } from "../../utils/constants/language";
import SwadhaarBottomNav from "../../components/Swadhaar/SwadhaarBottomNav";
import { getUnreadCount } from "../../utils/alertsStore";
import { telemetryFactory } from "../../utils/telemtery";

const ProfilePage = () => {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
    setUnreadCount(getUnreadCount());
    telemetryFactory.impression({
      edata: {
        type: 'workflow',
        subtype: '',
        pageid: 'swadhar-profile',
        uri: '/swadhar-profile'
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
          const imageUrl = userData.name || userData.basicDetails?.image || '';
          if (imageUrl) localStorage.setItem('profilePicture', imageUrl);
          if (userData.firstName) {
            localStorage.setItem('firstName', userData.firstName);
            localStorage.setItem('name', userData.firstName); // name is used as fallback in home page
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

  const capitalize = (str: string) => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleSaveName = async (newName: string) => {
    try {
      const userId = localStorage.getItem("userId");
      if (userId) {
        const trimmedName = newName.trim();
        const nameParts = trimmedName.split(/\s+/);
        const firstName = capitalize(nameParts[0] || "");
        const lastName = nameParts.length > 1 ? capitalize(nameParts.slice(1).join(" ")) : "";
        
        await editEditUser(userId, { firstName, lastName });
        showToastMessage(t("LEARNER_APP.PROFILE.NAME_UPDATED_SUCCESS"), "success");
        setIsEditingName(false);
        fetchProfile();
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
    import("../../utils/API/userService").then((module) => {
      module.updateLanguageInProfile(newLang);
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToastMessage(t("LEARNER_APP.PROFILE.FILE_TOO_LARGE"), "error");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToastMessage(t("LEARNER_APP.PROFILE.INVALID_FILE_TYPE"), "error");
      return;
    }

    setUploading(true);
    try {
      const userId = localStorage.getItem("userId");
      if (userId) {
        await uploadProfilePhoto(userId, file);
        showToastMessage(t("LEARNER_APP.PROFILE.PHOTO_UPLOADED_SUCCESS"), "success");
        fetchProfile();
      }
    } catch (error) {
      console.error("Error uploading photo", error);
      showToastMessage(t("LEARNER_APP.PROFILE.ERROR_UPLOADING_PHOTO"), "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
        pageid: 'swadhar-profile'
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

  const fullName = capitalize(`${profileData?.firstName || ""} ${profileData?.lastName || ""}`.trim());

  const getCustomFieldValue = (fieldId: string) => {
    const field = profileData?.customFields?.find((f: any) => f.fieldId === fieldId);
    return field ? field.value : "";
  };

  const cflLocation = getCustomFieldValue("cflLocation") || "CFL Jharkhand - Torpa";
  const joiningDate = profileData?.createdAt
    ? new Date(profileData.createdAt).toLocaleDateString("en-GB")
    : "12/03/2026";

  return (
    <Layout onlyHideElements={["footer", "topBar"]}>
      <Box sx={{ bgcolor: "#F9FAFB", minHeight: "100vh" }}>
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #E5E7EB",
            bgcolor: "#FFFFFF",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: "24px", color: "#1F2937", fontFamily: "Manrope" }}>
            Profile
          </Typography>
          <Box
            onClick={() => router.push("/alerts")}
            sx={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}
          >
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
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#E6873C", mt: 0.2, fontFamily: "Manrope" }}>
              Alerts
            </Typography>
          </Box>
        </Box>

        <Container maxWidth="sm" sx={{ py: 0,px:0 }}>
          {/* Avatar Section */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 3,
              p: 3,
              bgcolor: "#FFFFFF",
              border: '1px solid #E0E0E0'
              // borderRadius: "16px",
              // boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}
          >
            <Box sx={{ mb: 3 }}>
              <ProfileAvatar
                initials={getInitials(fullName)}
                imageUrl={profileData?.name || profileData?.basicDetails?.image || null}
                size={120}
              />
            </Box>
            <input
              type="file"
              hidden
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
            />
            <Button
              variant="contained"
              onClick={handleUploadClick}
              disabled={uploading}
              fullWidth
              sx={{
                borderRadius: "12px",
                backgroundColor: "#E6873C",
                color: "#FFFFFF",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "18px",
                fontFamily: "Manrope",
                height: "56px",
                boxShadow: "none",
                "&:hover": { backgroundColor: "#D97706", boxShadow: "none" },
              }}
            >
              {uploading ? (
                <CircularProgress size={24} sx={{ color: "#FFFFFF" }} />
              ) : (
                "Upload Photo"
              )}
            </Button>
          </Box>

          {/* Form Fields */}
          <Box sx={{ p: 3, bgcolor: "#FFFFFF", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            {/* Language Selector */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: "12px", color: "#6B7280", mb: 0.5, fontWeight: 500, fontFamily: "Manrope" }}>
                {t('LEARNER_APP.PROFILE.FIELD_LANGUAGE')}
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
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E7EB" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E7EB" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#E6873C" },
                  }}
                >
                  {LANGUAGE_OPTIONS.map((option: any) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {isEditingName ? (
              <NameEditField
                label={t('LEARNER_APP.PROFILE.FIELD_NAME')}
                initialValue={fullName}
                onSave={handleSaveName}
                onCancel={() => setIsEditingName(false)}
              />
            ) : (
              <ProfileField
                label={t('LEARNER_APP.PROFILE.FIELD_NAME')}
                value={fullName}
                isEditable={true}
                onEditClick={() => setIsEditingName(true)}
                readOnly={true}
              />
            )}

            <ProfileField label={t('LEARNER_APP.PROFILE.FIELD_DESIGNATION')} value={profileData?.role || "Trainer"} />
            <ProfileField label={t('LEARNER_APP.PROFILE.FIELD_CFL_LOCATION')} value={cflLocation} />
            <ProfileField label={t('LEARNER_APP.PROFILE.FIELD_MOBILE')} value={profileData?.mobile || ""} />
            <ProfileField label={t('LEARNER_APP.PROFILE.FIELD_EMAIL')} value={profileData?.email || ""} />
            <ProfileField label={t('LEARNER_APP.PROFILE.FIELD_JOINING_DATE')} value={joiningDate} />

            {/* Logout */}
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
              Logout
            </Button>
          </Box>
        </Container>

        <Box sx={{ height: "80px" }} />
      </Box>

      <ConfirmationModal
        modalOpen={logoutModalOpen}
        message="Are you sure you want to log out?"
        handleAction={confirmLogout}
        handleCloseModal={() => setLogoutModalOpen(false)}
        buttonNames={{ primary: "Logout", secondary: "Cancel" }}
      />

      <SwadhaarBottomNav />
    </Layout>
  );
};

export default ProfilePage;
