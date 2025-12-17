/* eslint-disable no-empty */
/* eslint-disable @nx/enforce-module-boundaries */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-empty-function */
"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import Layout from "@learner/components/Layout";
import Image from "next/image";
import { Tabs, Tab, Typography, Box, Grid, Button, IconButton, CircularProgress } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { checkAuth } from "@shared-lib-v2/utils/AuthService";
import { profileComplitionCheck } from "@learner/utils/API/userService";
import { getTenantInfo } from "@learner/utils/API/ProgramService";
import { gredientStyle } from "@learner/utils/style";
import LearnerCourse from "@learner/components/Content/LearnerCourse";
import GroupsManager from "@learner/components/Content/GroupsManager";
import { AccountCircleOutlined } from "@mui/icons-material";
import ProfileMenu from "../../components/ProfileMenu/ProfileMenu";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import { useTenant } from "@learner/context/TenantContext";
import { useTranslation } from "@shared-lib";
import LanguageDropdown from "@learner/components/LanguageDropdown/LanguageDropdown";

const DashboardContent = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenant, contentFilter } = useTenant();
  const { t, language, setLanguage } = useTranslation();
  
  // Get tenant colors
  const primaryColor = contentFilter?.theme?.primaryColor || "#E6873C";
  const secondaryColor = contentFilter?.theme?.secondaryColor || "#1A1A1A";
  const backgroundColor = contentFilter?.theme?.backgroundColor || "#F5F5F5";
  const tenantIcon = contentFilter?.icon || "/logo.png";
  const tenantName = contentFilter?.title || tenant?.name || "Tenant";
  const tenantAlt = `${tenantName} logo`;
  
  const [activeTab, setActiveTab] = React.useState("content");
  const [filter, setFilter] = useState<Record<string, any>>({});
  const [isLogin, setIsLogin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileCard, setIsProfileCard] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // For menu positioning
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [storedConfig, setStoredConfig] = useState({});
  const [firstName, setFirstName] = useState("");
  const [userProgram, setUserProgram] = useState("");
  const [dynamicFilterFields, setDynamicFilterFields] = useState<{
    onlyFields: string[];
    isOpenColapsed: string[];
  }>({
    onlyFields: [],
    isOpenColapsed: [],
  });
  const hasInitialized = useRef(false);

  // Get tab visibility from tenant config
  const showGroups = contentFilter?.showGroups ?? false;
  const showAttendance = contentFilter?.showAttendance ?? false; // Default to false if not specified
  
  // Immediate authentication check and redirect
  React.useLayoutEffect(() => {
    if (typeof window !== "undefined" && !checkAuth()) {
      const currentPath = window.location.pathname + window.location.search;
      if (
        currentPath !== "/login" &&
        currentPath !== "/login-simple" &&
        !currentPath.startsWith("/login")
      ) {
        sessionStorage.setItem("redirectAfterLogin", currentPath);
      }
      window.location.replace("/login");
    }
  }, []);
  
  // Don't render content if not authenticated
  if (typeof window !== "undefined" && !checkAuth()) {
    return null;
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const config = JSON.parse(localStorage.getItem("uiConfig") || "{}");
      setStoredConfig(config);
      setFirstName(localStorage.getItem("firstName") || "");
      setUserProgram(localStorage.getItem("userProgram") || "");
    }
  }, []);

  // Watch for URL parameter changes and update active tab
  useEffect(() => {
    const updateTabFromURL = () => {
      // Read from both useSearchParams and window.location for reliability
      const tabParam = searchParams.get("tab") || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") : null);
      
      if (tabParam === "1") {
        setActiveTab("content");
      } else if (tabParam === "2") {
        setActiveTab("Course");
      } else if (tabParam === "3") {
        setActiveTab("groups");
      } else if (tabParam === "4") {
        setActiveTab("attendance");
      } else if (tabParam === "5") {
        setActiveTab("myClasses");
      } else if (tabParam === "0" || !tabParam) {
        // Default to Content tab (first tab) if no tab parameter or tab=0
        setActiveTab("content");
      }
    };

    updateTabFromURL();

    // Also listen for popstate events (browser back/forward)
    if (typeof window !== "undefined") {
      window.addEventListener("popstate", updateTabFromURL);
      return () => {
        window.removeEventListener("popstate", updateTabFromURL);
      };
    }
  }, [searchParams, pathname]);

  useEffect(() => {
    // Prevent duplicate API calls in React StrictMode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Don't make any API calls if not authenticated
    if (typeof window !== "undefined" && !checkAuth()) {
      return;
    }

    const fetchTenantInfo = async () => {
      try {
        if (checkAuth()) {
          setIsLogin(true);
          const result = await profileComplitionCheck();
          setIsProfileCard(!result);
        } else {
          setIsLogin(false);
          return; // Exit early if not authenticated
        }
        const res = await getTenantInfo();
        const youthnetContentFilter = res?.result.find(
          (program: any) => program.name === "YouthNet"
        );

        if (typeof window !== "undefined") {
          const storedChannelId = localStorage.getItem("channelId");
          if (!storedChannelId) {
            const channelId = youthnetContentFilter?.channelId;
            if (channelId) {
              localStorage.setItem("channelId", channelId);
            }
          }

          const storedTenantId = localStorage.getItem("tenantId");
          if (!storedTenantId) {
            const tenantId = youthnetContentFilter?.tenantId;
            if (tenantId) {
              localStorage.setItem("tenantId", tenantId);
            }
          }

          const storedCollectionFramework = localStorage.getItem(
            "collectionFramework"
          );
          if (!storedCollectionFramework) {
            const collectionFramework =
              youthnetContentFilter?.collectionFramework;
            if (collectionFramework) {
              localStorage.setItem("collectionFramework", collectionFramework);
            }
          }
        }
        // Fetch framework data for dynamic filters
        let filterFramework = null;
        let staticFilter = null;

        try {
          const storedCollectionFramework = localStorage.getItem(
            "collectionFramework"
          );
          const collectionFramework =
            storedCollectionFramework ||
            youthnetContentFilter?.collectionFramework;
          const storedChannelId = localStorage.getItem("channelId");
          const channelId = storedChannelId || youthnetContentFilter?.channelId;

          if (collectionFramework) {
            const { filterContent, staticFilterContent } = await import(
              "@shared-lib-v2/utils/AuthService"
            );

            const [frameworkData, staticData] = await Promise.all([
              filterContent({ instantId: collectionFramework }),
              channelId
                ? staticFilterContent({ instantFramework: channelId })
                : null,
            ]);

            // Filter out invalid terms with template placeholders
            const cleanedFrameworkData = {
              ...frameworkData,
              framework: {
                ...frameworkData?.framework,
                categories:
                  frameworkData?.framework?.categories?.map((category: any) => {
                    const originalTerms = category.terms || [];
                    const filteredTerms = originalTerms.filter((term: any) => {
                      const hasTemplate =
                        term.code?.includes("{{") || term.name?.includes("{{");
                      const isLive = term.status === "Live";
                      const isValid = !hasTemplate && isLive;

                      if (!isValid) {
                      
                      }

                      return isValid;
                    });

                   

                    return {
                      ...category,
                      terms: filteredTerms,
                    };
                  }) || [],
              },
            };

            filterFramework = cleanedFrameworkData;
            staticFilter = staticData;

            // Extract categories and transform to filter field codes
            const { transformRenderForm } = await import(
              "@shared-lib-v2/lib/Filter/FilterForm"
            );
            const categories =
              cleanedFrameworkData?.framework?.categories ?? [];
            const transformedFields = transformRenderForm(categories);

            // Generate onlyFields and isOpenColapsed dynamically from framework categories
            const onlyFields = transformedFields.map(
              (field: any) => field.code
            );
            // Also include contentLanguage if it exists (static filter)
            if (!onlyFields.includes("contentLanguage")) {
              onlyFields.push("contentLanguage");
            }

            setDynamicFilterFields({
              onlyFields,
              isOpenColapsed: onlyFields, // Open all filters by default
            });

            // Debug: Log framework data
         
          

            // Log each category with its terms
            if (frameworkData?.framework?.categories) {
              frameworkData.framework.categories.forEach(
                (category: any, index: number) => {
                
                  if (category.terms) {
                    category.terms.forEach((term: any, termIndex: number) => {
                   
                    });
                  }
                }
              );
            }
          }
        } catch (error) {
          console.error("Error fetching framework data:", error);
          // Don't set fallback - let it be empty, framework will be fetched eventually
          // If framework fetch fails, onlyFields will be empty and FilterForm will show all available fields
        }

        setFilter({
          filters: youthnetContentFilter?.contentFilter,
          filterFramework,
          staticFilter,
        });
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "filter",
            JSON.stringify(youthnetContentFilter?.contentFilter)
          );
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch tenant info:", error);
      }
    };
    fetchTenantInfo();
  }, []);

  const handleTabChange = (tab: string) => {
    if (tab === "attendance") {
      router.push("/attandence");
      return;
    }
    if (tab === "myClasses") {
      router.push("/my-classes");
      return;
    }
    setActiveTab(tab);

    // Update URL with tab parameter
    const url = new URL(window.location.href);
    let tabIndex = 1; // Default to Content (first tab)
    if (tab === "content") {
      tabIndex = 1;
    } else if (tab === "Course") {
      tabIndex = 2;
    } else if (tab === "groups") {
      tabIndex = 3;
    }
    url.searchParams.set("tab", tabIndex.toString());
    router.replace(url.pathname + url.search);
  };
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
        <Box sx={{ 
          px: { xs: 2, md: 4 }, 
          pb: { xs: 4, md: 6 },
          width: "100%",
          maxWidth: "100%",
          overflowX: "hidden",
          boxSizing: "border-box",
        }}>
        <Tabs
          value={activeTab}
          onChange={(_event, newValue) => handleTabChange(newValue)}
          aria-label="Dashboard Tabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            width: "100%",
            maxWidth: "100%",
            "& .MuiTab-root": {
              color: secondaryColor,
              minWidth: { xs: "auto", sm: "auto" },
              padding: { xs: "12px 16px", sm: "12px 24px" },
              fontSize: { xs: "0.875rem", sm: "1rem" },
              textTransform: "none",
              fontWeight: 500,
              "&.Mui-selected": {
                color: primaryColor,
                fontWeight: 600,
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: primaryColor,
            },
            "& .MuiTabs-scrollButtons": {
              color: secondaryColor,
              width: { xs: 40, sm: 48 },
              "&.Mui-disabled": {
                opacity: 0.3,
              },
            },
            "& .MuiTabs-flexContainer": {
              gap: 0,
            },
            overflowX: { xs: "auto", sm: "visible" },
          }}
        >
          <Tab label={t("LEARNER_APP.COMMON.CONTENT")} value="content" />
          <Tab label={t("LEARNER_APP.COMMON.COURSES")} value="Course" />
          {showGroups && <Tab label={t("LEARNER_APP.COMMON.GROUPS")} value="groups" />}
          {showAttendance && <Tab label={t("LEARNER_APP.COMMON.ATTENDANCE")} value="attendance" />}
          {showAttendance && <Tab label={t("LEARNER_APP.COMMON.MY_CLASSES") || "My Classes"} value="myClasses" />}
        </Tabs>
        <Grid container style={gredientStyle}>
          <Grid item xs={12}>
            {activeTab === "groups" ? (
              <GroupsManager isLoading={isLoading} />
            ) : (
              <LearnerCourse
                title={
                  userProgram === "Camp to Club"
                    ? "LEARNER_APP.COURSE.GET_STARTED_CLUB_COURSES"
                    : "LEARNER_APP.COURSE.GET_STARTED"
                }
                activeTab={activeTab}
                isLoading={false}
                _content={{
                  pageName: "L1_Content",
                  onlyFields: dynamicFilterFields.onlyFields, // Always use dynamic fields from framework
                  isOpenColapsed: dynamicFilterFields.isOpenColapsed, // Always use dynamic collapse state
                  // Fix: Only spread if showContent exists and is an array
                  ...(Array.isArray((storedConfig as any).showContent) &&
                  (storedConfig as any).showContent.length === 2 &&
                  (storedConfig as any).showContent.includes("courses")
                    ? {}
                    : {}),
                  //   contentTabs:
                  //     activeTab === "courses"
                  //       ? ["Course"]
                  //       : ["Learning Resource"],
                  // }),
                  //   storedConfig.showContent.includes("contents")
                  //     ? { contentTabs: ["courses", "content"] }
                  //     : {}),
                  staticFilter: {
                    se_domains:
                      typeof filter.filters?.domain === "string"
                        ? [filter.filters?.domain]
                        : filter.filters?.domain,
                    program:
                      typeof filter.filters?.program === "string"
                        ? [filter.filters?.program]
                        : filter.filters?.program,
                    ...filter.staticFilter,
                  },
                  filterFramework: filter.filterFramework,
                  tab: activeTab === "Course" ? "Course" : "content",
                }}
              />
            )}
          </Grid>
        </Grid>
      </Box>
      <ProfileMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        onProfileClick={handleProfileClick}
        onLogout={() => handleLogoutClick()}
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
      </Box>
    </Layout>
  );
};

const DashboardPage = () => {
  return (
    <Suspense
      fallback={
        <Layout onlyHideElements={["footer", "topBar"]}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "100vh",
            }}
          >
            <CircularProgress />
          </Box>
        </Layout>
      }
    >
      <DashboardContent />
    </Suspense>
  );
};

export default DashboardPage;
