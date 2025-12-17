/* eslint-disable @nx/enforce-module-boundaries */
"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Button,
  Skeleton,
  Paper,
  Chip,
  IconButton,
} from "@mui/material";
import Layout from "../../components/Layout";
import CourseCertificateCard from "@learner/components/CourseCertificateCard/CourseCertificateCard";
import { courseWiseLernerList } from "@shared-lib-v2/utils/CertificateService/coursesCertificates";
import { CertificateModal, get, useTranslation } from "@shared-lib";
import { useRouter } from "next/navigation";
import { checkAuth } from "@shared-lib-v2/utils/AuthService";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { AccountCircleOutlined, Phone } from "@mui/icons-material";
import Image from "next/image";

import { baseurl } from "@learner/utils/API/EndUrls";
import { showToastMessage } from "@learner/components/ToastComponent/Toastify";
import { transformImageUrl } from "@learner/utils/imageUtils";
import { useTenant } from "@learner/context/TenantContext";
import { alpha } from "@mui/material/styles";
import LanguageDropdown from "@learner/components/LanguageDropdown/LanguageDropdown";
import ProfileMenu from "../../components/ProfileMenu/ProfileMenu";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";

type FilterDetails = {
  status?: string[];
  tenantId?: string;
  userId?: string;
};
const ProfilePage = () => {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const { tenant, contentFilter } = useTenant();

  const primaryColor = contentFilter?.theme?.primaryColor || "#E6873C";
  const secondaryColor = contentFilter?.theme?.secondaryColor || "#1A1A1A";
  const backgroundColor = contentFilter?.theme?.backgroundColor || "#F5F5F5";
  const surfaceColor = "#FFFFFF";
  const subtleBg = alpha(primaryColor, 0.08);
  const tenantIcon = contentFilter?.icon || "/logo.png";
  const tenantName = contentFilter?.title || tenant?.name || "Tenant";
  const tenantAlt = `${tenantName} logo`;
  const isSwadhaarTenant = tenantName.toLowerCase().includes("swadhaar");
  const resolveText = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const [profileInfo, setProfileInfo] = useState({
    name: tenantName,
    username: "",
    phone: "",
  });

  const [filters] = useState<FilterDetails>({
    status: ["completed", "viewCertificate"],
    tenantId:
      (typeof window !== "undefined" && localStorage.getItem("tenantId")) || "",
    userId:
      (typeof window !== "undefined" && localStorage.getItem("userId")) || "",
  });
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateId, setCertificateId] = useState("");
  const [courseData, setCourseData] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  
  // Cache key for storing certificate data
  const cacheKey = `profile-certificates-${filters.userId}-${filters.tenantId}`;

  const handlePreview = async (id: string) => {
    try {
      if (!id || id === "null" || id === "undefined" || id.trim() === "") {
        showToastMessage(t("LEARNER_APP.PROFILE.CERTIFICATION_ID_NOT_FOUND"), "error");
        return;
      }
      console.log("Opening certificate with ID:", id);
      setCertificateId(id);
      setShowCertificate(true);
    } catch (error) {
      console.error("Error opening certificate:", error);
      showToastMessage(t("LEARNER_APP.PROFILE.ERROR_OPENING_CERTIFICATE"), "error");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setProfileInfo({
        name:
          localStorage.getItem("firstName") ||
          localStorage.getItem("userName") ||
          tenantName,
        username:
          localStorage.getItem("userIdName") ||
          localStorage.getItem("userName") ||
          "",
        phone:
          localStorage.getItem("phoneNumber") ||
          localStorage.getItem("mobileNumber") ||
          "",
      });
    }
  }, [tenantName]);

  useEffect(() => {
    const prepareCertificateData = async () => {
      try {
        setLoading(true);
        
        // Check if data is cached and still valid (cache for 5 minutes)
        const cachedData = localStorage.getItem(cacheKey);
        const cacheTimestamp = localStorage.getItem(`${cacheKey}-timestamp`);
        const now = Date.now();
        const cacheExpiry = 5 * 60 * 1000; // 5 minutes
        
        if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < cacheExpiry) {
          console.log("Using cached certificate data");
          setCourseData(JSON.parse(cachedData));
          setLoading(false);
          return;
        }
        
        const finalArray = [];

        const response = await courseWiseLernerList({ filters });
        console.log("response", response.data);
        console.log("Raw certificate data from API:", response.data);
        
        // Check for certificates with missing certificate IDs
        const certificatesWithMissingIds = response.data.filter((item: any) => 
          !item.certificateId || 
          item.certificateId === "null" || 
          item.certificateId === "undefined" || 
          item.certificateId.trim() === ""
        );
        
        if (certificatesWithMissingIds.length > 0) {
          console.warn("Found certificates with missing certificate IDs:", certificatesWithMissingIds);
        }

        // Process certificates in parallel instead of sequential
        const courseDetailsPromises = response.data.map(async (item: any) => {
          try {
            console.log(`Fetching details for courseId: ${item.courseId}`);
            const Details: any = await get(
              `${baseurl}/action/content/v3/read/${item.courseId}`,
              {
                tenantId: localStorage.getItem("tenantId") || "",
                Authorization: `Bearer ${
                  localStorage.getItem("accToken") || ""
                }`,
              }
            );
            console.log("courseDetails", Details);

            if (
              !Details.data ||
              !Details.data.result ||
              !Details.data.result.content
            ) {
              console.error("Invalid course details response:", Details);
              throw new Error("Invalid course details response");
            }

            const courseDetails = Details.data.result.content;
            console.log("Extracted course details:", {
              name: courseDetails.name,
              title: courseDetails.title,
              program: courseDetails.program,
              description: courseDetails.description,
              posterImage: courseDetails.posterImage,
            });

            // Try different possible field names for the course title
            const courseTitle =
              courseDetails.name ||
              courseDetails.title ||
              courseDetails.program ||
              `Course ${item.courseId.slice(-8)}`;

            const obj = {
              usercertificateId: item.usercertificateId,
              userId: item.userId,
              courseId: item.courseId,
              certificateId: item.certificateId,
              completedOn: item.issuedOn,
              description:
                courseDetails.description || t("LEARNER_APP.PROFILE.COURSE_COMPLETION_CERTIFICATE"),
              posterImage: transformImageUrl(courseDetails.posterImage) || null,
              program: courseTitle,
            };
            console.log("Created certificate object:", obj);
            return obj;
          } catch (error) {
            console.error(
              `Failed to fetch course details for courseId: ${item.courseId}`,
              error
            );
            // Create a basic certificate object even if course details fail
            const obj = {
              usercertificateId: item.usercertificateId,
              userId: item.userId,
              courseId: item.courseId,
              certificateId: item.certificateId,
              completedOn: item.issuedOn,
              description: t("LEARNER_APP.PROFILE.COURSE_COMPLETION_CERTIFICATE"),
              posterImage: null,
              program: `Course ${item.courseId.slice(-8)}`,
            };
            console.log("Created fallback certificate object:", obj);
            return obj;
          }
        });

        // Wait for all course details to be fetched in parallel
        const courseDetailsResults = await Promise.all(courseDetailsPromises);
        
        // Filter out certificates with invalid certificate IDs
        const validCertificates = courseDetailsResults.filter(cert => {
          const hasValidId = cert.certificateId && 
                            cert.certificateId !== "null" && 
                            cert.certificateId !== "undefined" && 
                            cert.certificateId.trim() !== "";
          
          if (!hasValidId) {
            console.warn(`Filtering out certificate with invalid ID:`, {
              courseId: cert.courseId,
              certificateId: cert.certificateId,
              program: cert.program
            });
          }
          
          return hasValidId;
        });
        
        finalArray.push(...validCertificates);

        console.log("finalArray (filtered):", finalArray);
        console.log(`Filtered out ${courseDetailsResults.length - validCertificates.length} certificates with invalid IDs`);

        setCourseData(finalArray);
        
        // Cache the data
        localStorage.setItem(cacheKey, JSON.stringify(finalArray));
        localStorage.setItem(`${cacheKey}-timestamp`, now.toString());
        console.log("Certificate data cached");
        
      } catch (error) {
        console.error("Error fetching certificate data:", error);
        showToastMessage(t("LEARNER_APP.PROFILE.ERROR_LOADING_CERTIFICATES"), "error");
      } finally {
        setLoading(false);
      }
    };
    prepareCertificateData();
  }, [filters, t]);

  useEffect(() => {
    if (!checkAuth()) {
      router.push("/login");
    }
  }, [router]);

  const isYouthNet =
    typeof window !== "undefined" &&
    localStorage.getItem("userProgram") === "YouthNet";

  // Debug logging
  // console.log("Profile page state:", {
  //   courseDataLength: courseData.length,
  //   isYouthNet,
  //   courseData: courseData,
  // });

  const handleProfileClick = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    setLogoutModalOpen(true);
    setAnchorEl(null);
  };

  const performLogout = () => {
    router.push("/logout");
  };

  return (
    <Layout onlyHideElements={["footer", "topBar"]}>
      {/* Hero Section with Gradient Background */}
      <Box
        sx={{
          background: `linear-gradient(180deg, ${backgroundColor} 0%, ${alpha(backgroundColor, 0.3)} 100%)`,
          py: { xs: 2, sm: 3, md: 4 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
        
        <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1, px: { xs: 2, sm: 3, md: 4 } }}>
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

          {/* Back Button */}
          <Box sx={{ mb: { xs: 2, sm: 3 } }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push("/dashboard")}
              sx={{
                color: secondaryColor,
                borderColor: "rgba(31,27,19,0.3)",
                backgroundColor: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(10px)",
                fontSize: { xs: "0.875rem", sm: "1rem" },
                padding: { xs: "6px 12px", sm: "8px 16px" },
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.9)",
                  borderColor: "rgba(31,27,19,0.5)",
                },
              }}
            >
              {t("LEARNER_APP.PROFILE.BACK_TO_DASHBOARD")}
            </Button>
          </Box>

          {/* Profile Header */}
      <Box sx={{ textAlign: "center", color: secondaryColor, mb: { xs: 3, sm: 4 }, px: { xs: 1, sm: 0 } }}>
            <Typography
              variant="h2"
              fontWeight={700}
              sx={{ 
                mb: { xs: 1.5, sm: 2 }, 
                fontSize: { xs: '20px', sm: '22px', md: '24px' },
                color: secondaryColor
              }}
            >
              {resolveText("LEARNER_APP.PROFILE.MY_PROFILE_DESCRIPTION", "My Profile")}
            </Typography>
            <Typography
              variant="h5"
              sx={{ 
                opacity: 0.8, 
                fontWeight: 400,
                fontSize: { xs: '14px', sm: '15px', md: '16px' },
                px: { xs: 1, sm: 0 }
              }}
            >
              {resolveText("LEARNER_APP.PROFILE.TRACK_LEARNING_JOURNEY", "Track your learning journey and achievements")}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, md: 4 } }}>
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                backgroundColor: surfaceColor,
                borderRadius: { xs: 2, sm: 3 },
                p: { xs: 2, sm: 2.5, md: 3 },
                boxShadow: "0px 20px 60px rgba(0,0,0,0.08)",
                border: `1px solid ${alpha(secondaryColor, 0.08)}`,
                display: "flex",
                flexDirection: "column",
                gap: { xs: 2, sm: 2.5, md: 3 },
                height: "100%",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 } }}>
                <Box
                  sx={{
                    width: { xs: 48, sm: 52, md: 56 },
                    height: { xs: 48, sm: 52, md: 56 },
                    borderRadius: { xs: "12px", sm: "14px", md: "16px" },
                    backgroundColor: subtleBg,
                    color: primaryColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: { xs: "18px", sm: "19px", md: "20px" },
                    flexShrink: 0,
                  }}
                >
                  {(profileInfo.name || tenantName).charAt(0).toUpperCase()}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography 
                    sx={{ 
                      fontWeight: 600, 
                      color: secondaryColor,
                      fontSize: { xs: "16px", sm: "17px", md: "18px" },
                      wordBreak: "break-word"
                    }}
                  >
                    {profileInfo.name || tenantName}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: { xs: 12, sm: 13, md: 14 },
                      color: alpha(secondaryColor, 0.7),
                      wordBreak: "break-word",
                    }}
                  >
                    {profileInfo.username
                      ? `@${profileInfo.username}`
                      : resolveText("LEARNER_APP.PROFILE.MY_PROFILE", "My Profile")}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography
                  sx={{
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    fontSize: { xs: 11, sm: 12 },
                    color: alpha(secondaryColor, 0.7),
                    mb: { xs: 0.75, sm: 1 },
                    fontWeight: 600,
                  }}
                >
                  {resolveText(
                    "LEARNER_APP.PROFILE.CONTACT_INFORMATION",
                    "Contact Information"
                  )}
                </Typography>
                <Box
                  sx={{
                    border: `1px solid ${alpha(secondaryColor, 0.12)}`,
                    borderRadius: { xs: 1.5, sm: 2 },
                    p: { xs: 1.5, sm: 2 },
                    backgroundColor: alpha(backgroundColor, 0.5),
                  }}
                >
                  <Typography sx={{ fontSize: { xs: 11, sm: 12 }, color: alpha(secondaryColor, 0.7), mb: 0.5 }}>
                    {resolveText("LEARNER_APP.PROFILE.PHONE_NUMBER", "Phone Number")}
                  </Typography>
                  <Typography sx={{ 
                    fontWeight: 600, 
                    color: secondaryColor,
                    fontSize: { xs: "14px", sm: "15px", md: "16px" },
                    wordBreak: "break-word"
                  }}>
                    {profileInfo.phone || resolveText("LEARNER_APP.PROFILE.NOT_AVAILABLE", "Not available")}
                  </Typography>
                </Box>
              </Box>

              {/* Need Help Card */}
              <Box
                sx={{
                  backgroundColor: surfaceColor,
                  borderRadius: { xs: 2, sm: 3 },
                  p: { xs: 2, sm: 2.5, md: 3 },
                  boxShadow: "0px 20px 60px rgba(0,0,0,0.08)",
                  border: `1px solid ${alpha(secondaryColor, 0.08)}`,
                  display: "flex",
                  alignItems: { xs: "flex-start", sm: "center" },
                  gap: { xs: 1.5, sm: 2 },
                  mt: { xs: 1.5, sm: 2 },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 48, sm: 52, md: 56 },
                    height: { xs: 48, sm: 52, md: 56 },
                    borderRadius: { xs: "12px", sm: "14px", md: "16px" },
                    backgroundColor: subtleBg,
                    color: primaryColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Phone sx={{ fontSize: { xs: 24, sm: 26, md: 28 } }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      color: secondaryColor,
                      fontSize: { xs: 16, sm: 17, md: 18 },
                      mb: { xs: 0.25, sm: 0.5 },
                    }}
                  >
                    {resolveText("LEARNER_APP.PROFILE.NEED_HELP", "Need Help?")}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: { xs: 12, sm: 13, md: 14 },
                      color: alpha(secondaryColor, 0.7),
                      mb: { xs: 0.75, sm: 1 },
                      wordBreak: "break-word",
                    }}
                  >
                    {resolveText(
                      "LEARNER_APP.PROFILE.GET_IN_TOUCH_SUPPORT",
                      "Get in touch with our Support Officers"
                    )}
                  </Typography>
                  {isSwadhaarTenant ? (
                    <Typography
                      component="a"
                      href="tel:+918754911609"
                      sx={{
                        fontSize: { xs: 14, sm: 15, md: 16 },
                        color: primaryColor,
                        fontWeight: 500,
                        textDecoration: "none",
                        wordBreak: "break-word",
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      {resolveText(
                        "LEARNER_APP.PROFILE.SUPPORT_PHONE",
                        "+91 8754911609"
                      )}
                    </Typography>
                  ) : (
                    <Typography
                      component="a"
                      href="https://www.tekdi.net/"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        fontSize: { xs: 14, sm: 15, md: 16 },
                        color: primaryColor,
                        fontWeight: 500,
                        textDecoration: "none",
                        wordBreak: "break-word",
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      {resolveText(
                        "LEARNER_APP.PROFILE.SUPPORT_LINK",
                        "https://www.tekdi.net/"
                      )}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                borderRadius: { xs: 2, sm: 3 },
                overflow: "hidden",
                boxShadow: "0px 20px 60px rgba(0,0,0,0.08)",
                border: `1px solid ${alpha(secondaryColor, 0.08)}`,
              }}
            >
              <Box
                sx={{
                  backgroundColor: alpha(primaryColor, 0.1),
                  p: { xs: 2, sm: 2.5, md: 3 },
                  display: "flex",
                  alignItems: "flex-start",
                  gap: { xs: 1.5, sm: 2 },
                }}
              >
                <EmojiEventsIcon
                  sx={{
                    fontSize: { xs: 28, sm: 30, md: 32 },
                    color: primaryColor,
                    flexShrink: 0,
                    mt: 0.5,
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {/* Title - single line where possible */}
                  <Typography
                    sx={{
                      fontWeight: 700,
                      color: secondaryColor,
                      fontSize: { xs: "16px", sm: "17px", md: "18px" },
                      mb: { xs: 0.5, sm: 0.75 },
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                    }}
                  >
                    {isYouthNet
                      ? t("LEARNER_APP.PROFILE.YOUTHNET_ACHIEVEMENTS")
                      : t("LEARNER_APP.PROFILE.MY_CERTIFICATES")}
                  </Typography>

                  {/* Description directly below the title */}
                  <Typography
                    sx={{
                      fontSize: { xs: 12, sm: 13, md: 14 },
                      color: alpha(secondaryColor, 0.8),
                      wordBreak: "break-word",
                      mb: { xs: 0.75, sm: 1 },
                    }}
                  >
                    {resolveText(
                      "LEARNER_APP.PROFILE.CERTIFICATES_DESCRIPTION",
                      "Your completed courses and earned certificates"
                    )}
                  </Typography>

                  {/* Certificate count below description */}
                  <Chip
                    label={`${courseData.length} ${
                      courseData.length === 1
                        ? t("LEARNER_APP.PROFILE.CERTIFICATE")
                        : t("LEARNER_APP.PROFILE.CERTIFICATES")
                    }`}
                    sx={{
                      backgroundColor: surfaceColor,
                      color: primaryColor,
                      fontWeight: 600,
                      fontSize: {
                        xs: "0.75rem",
                        sm: "0.8125rem",
                        md: "0.875rem",
                      },
                      height: { xs: 28, sm: 32 },
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, backgroundColor: alpha(backgroundColor, 0.4) }}>
                {loading ? (
                  <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                    {[1, 2, 3].map((index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Box sx={{ p: { xs: 0.5, sm: 1 } }}>
                          <Skeleton
                            variant="rounded"
                            sx={{ 
                              borderRadius: { xs: 1.5, sm: 2 },
                              height: { xs: 200, sm: 220 }
                            }}
                          />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                ) : courseData.length === 0 ? (
                  <Box
                    sx={{
                      backgroundColor: surfaceColor,
                      borderRadius: { xs: 2, sm: 3 },
                      p: { xs: 2.5, sm: 3, md: 4 },
                      border: `1px solid ${alpha(secondaryColor, 0.08)}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        mb: { xs: 2, sm: 3 },
                      }}
                    >
                      <Image
                        src="/Group 26817.svg"
                        alt="No Certificates"
                        width={180}
                        height={180}
                        style={{ objectFit: "contain", maxWidth: "100%", height: "auto" }}
                      />
                    </Box>
                    <Button
                      variant="contained"
                      onClick={() => router.push("/dashboard?tab=0")}
                      sx={{
                        backgroundColor: primaryColor,
                        color: "#FFFFFF",
                        px: { xs: 3, sm: 4 },
                        py: { xs: 1, sm: 1.25 },
                        fontWeight: 600,
                        borderRadius: "10px",
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                        "&:hover": { backgroundColor: alpha(primaryColor, 0.85) },
                      }}
                    >
                      {t("LEARNER_APP.PROFILE.GO_TO_COURSES")}
                    </Button>
                  </Box>
                ) : (
                  <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                    {courseData.map((cert: any, index: number) => {
                      const hasValidCertificateId =
                        cert.certificateId &&
                        cert.certificateId !== "null" &&
                        cert.certificateId !== "undefined" &&
                        cert.certificateId.trim() !== "";

                      return (
                        <Grid item xs={12} sm={6} key={`${cert.courseId}-${index}`}>
                          <CourseCertificateCard
                            variant="compact"
                            title={cert.program || t("LEARNER_APP.PROFILE.UNTITLED_COURSE")}
                            description={
                              cert.description ||
                              t("LEARNER_APP.PROFILE.NO_DESCRIPTION_AVAILABLE")
                            }
                            imageUrl={cert.posterImage || undefined}
                            completionDate={
                              cert.completedOn || new Date().toISOString()
                            }
                            onPreviewCertificate={() => {
                              if (!hasValidCertificateId) {
                                showToastMessage(
                                  t("LEARNER_APP.PROFILE.CERTIFICATE_ID_NOT_AVAILABLE"),
                                  "warning"
                                );
                                return;
                              }
                              handlePreview(cert.certificateId);
                            }}
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Certificate Modal */}
      <CertificateModal
        certificateId={certificateId}
        open={showCertificate}
        setOpen={setShowCertificate}
      />
      <ProfileMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        onProfileClick={handleProfileClick}
        onLogout={handleLogoutClick}
      />
      <ConfirmationModal
        modalOpen={logoutModalOpen}
        handleCloseModal={() => setLogoutModalOpen(false)}
        handleAction={performLogout}
        message={t("COMMON.SURE_LOGOUT")}
        buttonNames={{
          primary: t("COMMON.LOGOUT"),
          secondary: t("COMMON.CANCEL"),
        }}
      />
    </Layout>
  );
};

export default ProfilePage;
