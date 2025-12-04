"use client";
/* eslint-disable @next/next/no-img-element */

import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Container,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Image from "next/image";
import { Suspense, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Layout, useTranslation } from "@shared-lib";
import { useTenant } from "@learner/context/TenantContext";
import LanguageDropdown from "@learner/components/LanguageDropdown/LanguageDropdown";
import { getLocalizedText } from "@learner/utils/API/TenantService";

export default function Index() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const { tenant, contentFilter, isLoading: tenantLoading } = useTenant();
  const programCarouselRef = useRef<HTMLDivElement>(null);

  const primaryColor = contentFilter?.theme?.primaryColor || "#E6873C";
  const secondaryColor = contentFilter?.theme?.secondaryColor || "#1A1A1A";
  const backgroundColor = contentFilter?.backgroundColor || contentFilter?.theme?.backgroundColor || "#F5F5F5";
  const buttonTextColor = contentFilter?.buttonTextColor || contentFilter?.theme?.buttonTextColor || "#FFFFFF";
  
  // Get localized tenant name
  const tenantNameRaw = contentFilter?.title || tenant?.name || "Learner";
  const tenantName = typeof tenantNameRaw === "string" ? tenantNameRaw : getLocalizedText(tenantNameRaw, language, "Learner");
  
  const tenantIcon = contentFilter?.icon || "/logo.png";
  const tenantAlt = `${tenantName} logo`;
  
  // Get localized descriptions and taglines
  const description = getLocalizedText(
    contentFilter?.description || contentFilter?.homePageContent?.description,
    language,
    ""
  );
  const tagline = getLocalizedText(
    contentFilter?.tagline || contentFilter?.homePageContent?.tagline,
    language,
    ""
  );
  
  // Get localized button texts
  const chooseLanguageText = getLocalizedText(
    contentFilter?.homePageContent?.chooseLanguageText,
    language,
    t("LEARNER_APP.HOME.CHOOSE_LANGUAGE") || "Choose your language"
  );
  const continueButtonText = getLocalizedText(
    contentFilter?.homePageContent?.continueButtonText,
    language,
    t("LEARNER_APP.HOME.CONTINUE") || "Continue to Login"
  );
  const getStartedButtonText = getLocalizedText(
    contentFilter?.homePageContent?.getStartedButtonText,
    language,
    t("LEARNER_APP.HOME.LOGIN_LINK") || "Get Started"
  );
  
  const isSwadhaarTenant = tenantName.toLowerCase().includes("swadhaar");
  const uiPrimaryColor = primaryColor;
  const uiSecondaryColor = secondaryColor;
  const subtleTextColor = alpha(uiSecondaryColor, 0.65);
  const mutedTextColor = alpha(uiSecondaryColor, 0.55);

  const features = useMemo(
    () => {
      // Use tenant configuration if available, otherwise fall back to default features
      if (contentFilter?.ourSolutions && contentFilter.ourSolutions.length > 0) {
        return contentFilter.ourSolutions.map((solution) => ({
          icon: solution.icon,
          title: getLocalizedText(
            solution.title,
            language,
            typeof solution.title === "string" ? solution.title : ""
          ),
          description: getLocalizedText(
            solution.description,
            language,
            typeof solution.description === "string" ? solution.description : ""
          ),
        }));
      }
      
      // Fallback to default features
      return [
        {
          icon: "🎓",
          title:
            t("LEARNER_APP.HOME.FEATURES.EDUCATION.TITLE") || "Education",
          description:
            t("LEARNER_APP.HOME.FEATURES.EDUCATION.DESCRIPTION") ||
            "Learning solutions for institutions",
        },
        {
          icon: "🌱",
          title:
            t("LEARNER_APP.HOME.FEATURES.AGRICULTURE.TITLE") || "Agriculture",
          description:
            t("LEARNER_APP.HOME.FEATURES.AGRICULTURE.DESCRIPTION") ||
            "Farmer capacity building",
        },
        {
          icon: "🏥",
          title:
            t("LEARNER_APP.HOME.FEATURES.HEALTHCARE.TITLE") || "Healthcare",
          description:
            t("LEARNER_APP.HOME.FEATURES.HEALTHCARE.DESCRIPTION") ||
            "Professional development",
        },
        {
          icon: "⚡",
          title:
            t("LEARNER_APP.HOME.FEATURES.ALL_DOMAINS.TITLE") || "All Domains",
          description:
            t("LEARNER_APP.HOME.FEATURES.ALL_DOMAINS.DESCRIPTION") ||
            "Custom learning solutions",
        },
      ];
    },
    [t, contentFilter, language]
  );

  const swadhaarHighlights = useMemo(
    () => {
      // Use tenant configuration if available
      if (contentFilter?.homePageContent?.highlights && contentFilter.homePageContent.highlights.length > 0) {
        return contentFilter.homePageContent.highlights.map((highlight) => ({
          title: getLocalizedText(
            highlight.title,
            language,
            typeof highlight.title === "string" ? highlight.title : ""
          ),
          description: getLocalizedText(
            highlight.description,
            language,
            typeof highlight.description === "string" ? highlight.description : ""
          ),
        }));
      }
      
      // Fallback to default highlights
      return [
        {
          title: t("LEARNER_APP.HOME.HIGHLIGHTS.BILINGUAL_TITLE") || "Bilingual content",
          description:
            t("LEARNER_APP.HOME.HIGHLIGHTS.BILINGUAL_DESC") ||
            "Switch between English & Hindi any time",
        },
        {
          title: t("LEARNER_APP.HOME.HIGHLIGHTS.CERTIFIED_TITLE") || "Certified programs",
          description:
            t("LEARNER_APP.HOME.HIGHLIGHTS.CERTIFIED_DESC") ||
            "Earn shareable certificates on completion",
        },
        {
          title: t("LEARNER_APP.HOME.HIGHLIGHTS.SELF_PACED_TITLE") || "Self paced",
          description:
            t("LEARNER_APP.HOME.HIGHLIGHTS.SELF_PACED_DESC") ||
            "Learn at a speed that suits your routine",
        },
      ];
    },
    [t, contentFilter, language]
  );

  const renderLoadingState = (bg: string) => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: bg,
      }}
    >
      <Box sx={{ textAlign: "center" }}>
        <CircularProgress sx={{ color: uiPrimaryColor }} />
        <Typography sx={{ mt: 2, color: uiSecondaryColor }}>
          {t("LEARNER_APP.COMMON.LOADING") || "Loading..."}
        </Typography>
      </Box>
    </Box>
  );

  const handleLanguageSelect = (lang: string) => {
    if (isSwadhaarTenant) {
      setLanguage(lang);
      if (typeof window !== "undefined") {
        localStorage.setItem("lang", lang);
      }
    }
    router.push("/login");
  };

  if (tenantLoading) {
    return renderLoadingState(backgroundColor);
  }

  const SwadhaarLanguageButtons = ({ variant }: { variant: "header" | "body" }) => {
    const languages = [
      { code: "en", label: "ENGLISH" },
      { code: "hi", label: "हिन्दी" },
    ];

    if (variant === "header") {
      return null; // No language buttons in header for Swadhaar
    }

    return (
      <Box 
        sx={{ 
          display: "flex", 
          gap: { xs: 1.5, sm: 2 },
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        {languages.map((lang) => (
          <Button
            key={lang.code}
            onClick={() => handleLanguageSelect(lang.code)}
            sx={{
              px: { xs: 3, sm: 4 },
              py: 1.5,
              backgroundColor: language === lang.code ? uiPrimaryColor : "#E0E0E0",
              color: language === lang.code ? "#FFFFFF" : "#666666",
              fontSize: { xs: "14px", sm: "16px" },
              fontWeight: 400,
              textTransform: "none",
              borderRadius: "4px",
              minWidth: { xs: "100%", sm: "120px" },
              "&:hover": {
                backgroundColor: language === lang.code ? uiPrimaryColor : "#D0D0D0",
              },
            }}
          >
            {lang.label}
          </Button>
        ))}
      </Box>
    );
  };
  console.log(buttonTextColor);

  const renderSwadhaarHome = () => (
    <Layout onlyHideElements={["footer", "topBar"]} _topAppBar={undefined}>
      {/* Fixed Header */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          zIndex: 1000,
          backgroundColor: "white",
        }}
      >
        {/* Logo and Brand Name */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.5, sm: 1 },
          }}
        >
          <Box
            sx={{
              width: { xs: 28, sm: 32 },
              height: { xs: 28, sm: 32 },
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {tenantIcon.startsWith("data:") ? (
              <img
                src={tenantIcon}
                alt={tenantAlt}
                width={60}
                height={60}
                style={{ objectFit: "contain" }}
              />
            ) : (
              <Image
                src={tenantIcon}
                alt={tenantAlt}
                width={60}
                height={60}
                style={{ objectFit: "contain" }}
              />
            )}
          </Box>
          <Typography
            sx={{
              fontWeight: 400,
              marginLeft: { xs: 1, sm: 2 },
              fontSize: { xs: "16px", sm: "20px" },
              lineHeight: "28px",
              color: "#1A1A1A",
            }}
          >
            {tenantName}
          </Typography>
        </Box>
      </Box>

      <Suspense fallback={renderLoadingState(backgroundColor)}>
        <Box key={language} display="flex" flexDirection="column" sx={{ wordBreak: "break-word" }}>

          {/* Two Column Layout */}
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              pt: { xs: 8, sm: 10 },
            }}
          >
            {/* Left Column - Content */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: { xs: "flex-start", md: "center" },
                px: { xs: 2, sm: 3, md: 4, lg: 6 },
                py: { xs: 2, sm: 4 },
              }}
            >
              {/* Welcome Title */}
              <Typography
                sx={{
                  fontWeight: 700,
                  color: "#1A1A1A",
                  fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem", lg: "3rem" },
                  mb: { xs: 1.5, sm: 2 },
                  mt: { xs: 2, md: 0 },
                }}
              >
                {description || t("LEARNER_APP.HOME.WELCOME_TITLE") || `Welcome to ${tenantName}`}
              </Typography>

              {/* Description */}
              <Typography
                sx={{
                  fontWeight: 400,
                  color: "#666",
                  fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem", lg: "1.2rem" },
                  lineHeight: 1.6,
                  mb: { xs: 3, sm: 4 },
                  maxWidth: "500px",
                }}
              >
                {tagline || t("LEARNER_APP.HOME.MAIN_DESCRIPTION") || "Learn simple, practical finance skills in your language, at your own pace"}
              </Typography>

              {/* Language Selection Section */}
              <Typography
                sx={{
                  fontWeight: 400,
                  color: "#1A1A1A",
                  fontSize: { xs: "0.9rem", sm: "1rem" },
                  mb: { xs: 1.5, sm: 2 },
                }}
              >
                {chooseLanguageText}
              </Typography>

              {/* Language Buttons */}
              <SwadhaarLanguageButtons variant="body" />

              {/* Pagination Dots */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  mt: { xs: 4, sm: 6 },
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: uiPrimaryColor,
                  }}
                />
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#E0E0E0",
                  }}
                />
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#E0E0E0",
                  }}
                />
              </Box>
            </Box>

            {/* Right Column - Logo */}
            <Box
              sx={{
                flex: 1,
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                justifyContent: "center",
                px: 4,
                py: 4,
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: "80%",
                  backgroundColor: "#F5F5F5",
                  border: "1px solid #E0E0E0",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    p: 4,
                  }}
                >
                  {tenantIcon.startsWith("data:") ? (
                    <img
                      src={tenantIcon}
                      alt={tenantAlt}
                      width={300}
                      height={300}
                      style={{
                        objectFit: "contain",
                        maxWidth: "100%",
                        height: "auto",
                      }}
                    />
                  ) : (
                    <Image
                      src={tenantIcon}
                      alt={tenantAlt}
                      width={300}
                      height={300}
                      style={{
                        objectFit: "contain",
                        maxWidth: "100%",
                        height: "auto",
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Suspense>
    </Layout>
  );

  const renderDefaultHome = () => (
    <Layout onlyHideElements={["footer", "topBar"]}>
      <Suspense
        fallback={renderLoadingState("linear-gradient(135deg, #FFFDF7 0%, #F8EFDA 100%)")}
      >
        <Box key={language} display="flex" flexDirection="column" sx={{ wordBreak: "break-word" }}>
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: { xs: 2, sm: 3 },
              py: { xs: 1.5, sm: 2 },
              zIndex: 1000,
              backgroundColor: backgroundColor,
              borderBottom: `1px solid ${alpha(uiSecondaryColor, 0.1)}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 } }}>
              <Box
                sx={{
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 },
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${alpha(uiPrimaryColor, 0.3)}`,
                  boxShadow: `0 4px 8px ${uiPrimaryColor}22`,
                  overflow: "hidden",
                }}
              >
                {tenantIcon.startsWith("data:") ? (
                  <img
                    src={tenantIcon}
                    alt={tenantAlt}
                    width={40}
                    height={40}
                    style={{ objectFit: "contain" }}
                  />
                ) : (
                  <Image
                    src={tenantIcon}
                    alt={tenantAlt}
                    width={40}
                    height={40}
                    style={{ objectFit: "contain" }}
                  />
                )}
              </Box>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: "1rem", sm: "1.2rem" },
                  color: uiSecondaryColor,
                }}
              >
                {tenantName}
              </Typography>
            </Box>
            
            {/* Language Dropdown */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <LanguageDropdown
                primaryColor={uiPrimaryColor}
                secondaryColor={uiSecondaryColor}
                size="small"
                minWidth={150}
              />
            </Box>
          </Box>
          <Box
            sx={{
              background: `linear-gradient(135deg, ${backgroundColor} 0%, ${alpha(
                uiPrimaryColor,
                0.15
              )} 100%)`,
              minHeight: { xs: "85vh", md: "80vh" },
              display: "flex",
              alignItems: "center",
              position: "relative",
              overflow: "hidden",
              pt: { xs: 8, sm: 10 },
              pb: { xs: 4, md: 6 },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                  radial-gradient(circle at 10% 20%, ${alpha(uiPrimaryColor, 0.08)} 0%, transparent 40%),
                  radial-gradient(circle at 90% 80%, ${alpha(uiPrimaryColor, 0.05)} 0%, transparent 40%)
                `,
              },
            }}
          >
            <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
              <Grid container spacing={4} alignItems="center" justifyContent="center">
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      textAlign: { xs: "center", md: "left" },
                      display: "flex",
                      flexDirection: "column",
                      alignItems: { xs: "center", md: "flex-start" },
                      justifyContent: "center",
                      gap: { xs: 2, md: 2.5 },
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: "1.8rem", sm: "2.2rem", md: "2.5rem" },
                        lineHeight: 1.1,
                        mb: { xs: 1, md: 1.5 },
                        background: `linear-gradient(135deg, ${uiSecondaryColor} 0%, ${alpha(
                          uiSecondaryColor,
                          0.65
                        )} 100%)`,
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {description || t("LEARNER_APP.HOME.WELCOME_SUBTITLE") || tenantName}
                    </Typography>

                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 400,
                        color: alpha(uiSecondaryColor, 0.85),
                        fontSize: { xs: "0.95rem", sm: "1.05rem" },
                        lineHeight: 1.5,
                        mb: 1.5,
                        maxWidth: "500px",
                      }}
                    >
                      {tagline ||
                        t("LEARNER_APP.HOME.MAIN_DESCRIPTION") ||
                        "Learn practical skills in your language, at your own pace"}
                    </Typography>

                 
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        flexWrap: "wrap",
                        justifyContent: { xs: "center", md: "flex-start" },
                        width: { xs: "100%", sm: "auto" },
                      }}
                    >
                      <Button
                        variant="contained"
                        sx={{
                          px: { xs: 4, sm: 5 },
                          py: 1.5,
                          borderRadius: "50px",
                          backgroundColor: uiPrimaryColor,
                          color: `${buttonTextColor} !important`,
                          fontWeight: 600,
                          fontSize: { xs: "0.9rem", sm: "1rem" },
                          textTransform: "none",
                          boxShadow: `0 4px 12px ${uiPrimaryColor}44`,
                          minWidth: { xs: "160px", sm: "280px" },
                          flex: { xs: 1, sm: 0 },
                          maxWidth: { xs: "200px", sm: "280px" },
                          "&:hover": {
                            backgroundColor: uiPrimaryColor,
                            opacity: 0.9,
                            transform: "translateY(-2px)",
                            color: `${buttonTextColor} !important`,
                          },
                          transition: "all 0.3s ease",
                        }}
                        onClick={() => router.push("/login")}
                      >
                        {getStartedButtonText}
                      </Button>
                    </Box>

               
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      position: "relative",
                      mb: { xs: 0, md: 0 },
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: 200, sm: 240, md: 300 },
                        height: { xs: 200, sm: 240, md: 300 },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "white",
                        borderRadius: "50%",
                        boxShadow: `
                          0 12px 30px rgba(0, 0, 0, 0.08),
                          0 4px 16px ${uiPrimaryColor}30
                        `,
                        border: {
                          xs: `8px solid ${uiPrimaryColor}20`,
                          md: `12px solid ${uiPrimaryColor}20`,
                        },
                        position: "relative",
                      }}
                    >
                      {tenantIcon.startsWith("data:") ? (
                        <img
                          src={tenantIcon}
                          alt={tenantAlt}
                          width={140}
                          height={140}
                          style={{ objectFit: "contain", width: "60%", height: "auto" }}
                        />
                      ) : (
                        <Image
                          src={tenantIcon}
                          alt={tenantAlt}
                          width={140}
                          height={140}
                          priority
                          style={{ objectFit: "contain", width: "60%", height: "auto" }}
                        />
                      )}
                    </Box>
                    <Box
                      sx={{
                        position: "absolute",
                        top: "10%",
                        right: { xs: "5%", md: "15%" },
                        width: { xs: 40, md: 50 },
                        height: { xs: 40, md: 50 },
                        borderRadius: "50%",
                        backgroundColor: alpha(uiPrimaryColor, 0.1),
                        animation: "float 6s ease-in-out infinite",
                        display: { xs: "none", sm: "block" },
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: "15%",
                        left: { xs: "5%", md: "10%" },
                        width: { xs: 30, md: 40 },
                        height: { xs: 30, md: 40 },
                        borderRadius: "50%",
                        backgroundColor: alpha(uiPrimaryColor, 0.08),
                        animation: "float 4s ease-in-out infinite 1s",
                        display: { xs: "none", sm: "block" },
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Container>
          </Box>

          <Box
            ref={programCarouselRef}
            sx={{
              py: { xs: 6, md: 7 },
            }}
          >
            <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
              <Box sx={{ textAlign: "center", mb: { xs: 4, md: 5 } }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    color: uiSecondaryColor,
                    mb: 1.5,
                    fontSize: { xs: "1.5rem", sm: "1.8rem", md: "2rem" },
                  }}
                >
                  {getLocalizedText(
                    contentFilter?.ourSolutionsTitle || contentFilter?.homePageContent?.ourSolutionsTitle,
                    language,
                    t("LEARNER_APP.HOME.OUR_SOLUTIONS_TITLE") || "Our Solutions"
                  )}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 400,
                    color: mutedTextColor,
                    maxWidth: "500px",
                    mx: "auto",
                    fontSize: { xs: "0.85rem", sm: "0.95rem" },
                    lineHeight: 1.6,
                  }}
                >
                  {getLocalizedText(
                    contentFilter?.ourSolutionsDescription || contentFilter?.homePageContent?.ourSolutionsDescription,
                    language,
                    t("LEARNER_APP.HOME.OUR_SOLUTIONS_DESC") ||
                    "Empowering learning and development across multiple domains with our comprehensive platform"
                  )}
                </Typography>
              </Box>

              <Grid 
                container 
                spacing={3}
                justifyContent={features.length === 1 ? "center" : "flex-start"}
              >
                {features.map((feature) => (
                  <Grid 
                    item 
                    xs={12} 
                    sm={features.length === 1 ? 6 : 6} 
                    md={features.length === 1 ? 4 : features.length === 2 ? 6 : features.length === 3 ? 4 : 3} 
                    key={feature.title}
                  >
                    <Card
                      sx={{
                        height: "100%",
                        textAlign: "center",
                        border: "none",
                        boxShadow: `0 2px 12px ${alpha(uiPrimaryColor, 0.2)}`,
                        borderRadius: "16px",
                        transition: "all 0.3s ease",
                        backgroundColor: "white",
                        "&:hover": {
                          transform: "translateY(-5px)",
                          boxShadow: `0 8px 25px ${alpha(uiPrimaryColor, 0.3)}`,
                        },
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                        <Box
                          sx={{
                            fontSize: { xs: "2.5rem", sm: "3rem" },
                            mb: 2,
                            lineHeight: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: { xs: "2.5rem", sm: "3rem" },
                          }}
                        >
                          {feature.icon.startsWith("data:") || 
                           feature.icon.startsWith("http://") || 
                           feature.icon.startsWith("https://") || 
                           feature.icon.startsWith("/") ? (
                            <Box
                              sx={{
                                width: { xs: 48, sm: 56 },
                                height: { xs: 48, sm: 56 },
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {feature.icon.startsWith("data:") ? (
                                <img
                                  src={feature.icon}
                                  alt={feature.title}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                  }}
                                />
                              ) : (
                                <Image
                                  src={feature.icon}
                                  alt={feature.title}
                                  width={56}
                                  height={56}
                                  style={{
                                    objectFit: "contain",
                                  }}
                                />
                              )}
                            </Box>
                          ) : (
                            <>{feature.icon}</>
                          )}
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: uiSecondaryColor,
                            mb: 1.5,
                            fontSize: { xs: "1rem", sm: "1.1rem" },
                          }}
                        >
                          {feature.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: mutedTextColor,
                            lineHeight: 1.5,
                            fontSize: { xs: "0.8rem", sm: "0.85rem" },
                          }}
                        >
                          {feature.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Box>

          <style jsx global>{`
            @keyframes float {
              0%,
              100% {
                transform: translateY(0px) scale(1);
              }
              50% {
                transform: translateY(-8px) scale(1.02);
              }
            }
            @media (max-width: 768px) {
              button {
                -webkit-tap-highlight-color: transparent;
              }
              * {
                -webkit-overflow-scrolling: touch;
              }
            }
          `}</style>
        </Box>
      </Suspense>
    </Layout>
  );

  return isSwadhaarTenant ? renderSwadhaarHome() : renderDefaultHome();
}

