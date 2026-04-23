"use client";
import React from "react";
import Layout from "@learner/components/Layout";
import LearnerCourse from "@learner/components/Content/LearnerCourse";
import {
  Box,
  Button,
  Grid,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { gredientStyle } from "@learner/utils/style";
import LTwoCourse from "@learner/components/Content/LTwoCourse";
import { useEffect, useState } from "react";
import { getTenantInfo } from "@learner/utils/API/ProgramService";
import ContentComponent from "@learner/components/Content/Content";
import { useTranslation } from "@shared-lib";
import { checkAuth } from "@shared-lib-v2/utils/AuthService";
import { CompleteProfileBanner } from "@learner/components/CompleteProfileBanner/CompleteProfileBanner";
import { profileComplitionCheck } from "@learner/utils/API/userService";
import { usePathname } from "next/navigation";
import { useSearchParams } from "next/navigation";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const MyComponent: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab"); // '1', '2', etc. as a string
  console.log("Current tab:", tab);
  const [filter, setFilter] = useState<Record<string, any> | null>(null);
  const [isLogin, setIsLogin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileCard, setIsProfileCard] = useState(false);
  const [filterFramework, setFilterFramework] = useState<any>(null);
  const [staticFilter, setStaticFilter] = useState<any>(null);
  const [dynamicFilterFields, setDynamicFilterFields] = useState<{
    onlyFields: string[];
    isOpenColapsed: string[];
  }>({
    onlyFields: [],
    isOpenColapsed: [],
  });
  const storedConfig =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("uiConfig") || "{}")
      : {};

  useEffect(() => {
    const fetchTenantInfo = async () => {
      try {
        if (checkAuth()) {
          setIsLogin(true);
          const result = await profileComplitionCheck();
          console.log("Profile completion check result:", result);
          setIsProfileCard(!result);
        } else {
          setIsLogin(false);
        }
        const res = await getTenantInfo();
        const youthnetContentFilter = res?.result.find(
          (program: any) => program.name === "YouthNet"
        );

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
        const collectionFramework =
          storedCollectionFramework ||
          youthnetContentFilter?.collectionFramework;
        if (collectionFramework && !storedCollectionFramework) {
          localStorage.setItem("collectionFramework", collectionFramework);
        }

        const channelId =
          localStorage.getItem("channelId") ||
          youthnetContentFilter?.channelId;

        // Fetch framework data for dynamic filters
        if (collectionFramework) {
          try {
            // Dynamically import lazy-loaded libraries
            const { filterContent, staticFilterContent } = await import(
              "@shared-lib-v2/utils/AuthService"
            );
            const { transformRenderForm } = await import(
              "@shared-lib-v2/lib/Filter/FilterForm"
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
                  frameworkData?.framework?.categories?.map(
                    (category: any) => {
                      const originalTerms = category.terms || [];
                      const filteredTerms = originalTerms.filter(
                        (term: any) => {
                          const hasTemplate =
                            term.code?.includes("{{") ||
                            term.name?.includes("{{");
                          const isLive = term.status === "Live";
                          const isValid = !hasTemplate && isLive;

                          return isValid;
                        }
                      );

                      return {
                        ...category,
                        terms: filteredTerms,
                      };
                    }
                  ) || [],
              },
            };

            setFilterFramework(cleanedFrameworkData);
            setStaticFilter(staticData);

            // Extract categories and transform to filter field codes
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

          
          } catch (error) {
            console.error("Error fetching framework data:", error);
            // Don't set fallback - let it be empty, framework will be fetched eventually
            // If framework fetch fails, onlyFields will be empty and FilterForm will show all available fields
          }
        }

        setTimeout(() => {
          setFilter({ filters: youthnetContentFilter?.contentFilter });
          localStorage.setItem(
            "filter",
            JSON.stringify(youthnetContentFilter?.contentFilter)
          );
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Failed to fetch tenant info:", error);
      }
    };
    fetchTenantInfo();
  }, [pathname]);

  return (
    <Layout isLoadingChildren={isLoading} sx={gredientStyle}>
      {isProfileCard && storedConfig.isCompleteProfile && (
        <CompleteProfileBanner />
      )}
      {isLogin && (
        <>
          <Box
            sx={{
              height: 24,
              display: "flex",
              alignItems: "center",
              py: "36px",
              px: "34px",
              bgcolor: "#fff",
            }}
          >
            <Typography
              variant="body1"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: 500,
                color: "#1F1B13",
                textTransform: "capitalize",
              }}
            >
              <span role="img" aria-label="wave">
                👋
              </span>
              Welcome, {localStorage.getItem("firstName")}!
            </Typography>
          </Box>
          {tab == "0" && <InProgressContent />}

          {localStorage.getItem("userProgram") === "YouthNet" && (
            <Grid container>
              <Grid
                item
                xs={12}
                md={12}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <LTwoCourse />
              </Grid>
            </Grid>
          )}
        </>
      )}

      <Grid container style={gredientStyle}>
        <Grid item xs={12}>
          {filter && (
            <LearnerCourse
              title={
                localStorage.getItem("userProgram") === "Camp to Club"
                  ? "LEARNER_APP.COURSE.GET_STARTED_CLUB_COURSES"
                  : "LEARNER_APP.COURSE.GET_STARTED"
              }
              _content={{
                pageName: "L1_Content",
                onlyFields: dynamicFilterFields.onlyFields, // Always use dynamic fields from framework
                isOpenColapsed: dynamicFilterFields.isOpenColapsed, // Always use dynamic collapse state
                filterFramework: filterFramework,
                staticFilter: {
                  ...(staticFilter || {}),
                  se_domains:
                    typeof filter.filters?.domain === "string"
                      ? [filter.filters?.domain]
                      : filter.filters?.domain,
                  program:
                    typeof filter.filters?.program === "string"
                      ? [filter.filters?.program]
                      : filter.filters?.program,
                },
                ...(Array.isArray(storedConfig.showContent) &&
                storedConfig.showContent.length === 2 &&
                storedConfig.showContent.includes("courses") &&
                storedConfig.showContent.includes("contents")
                  ? { contentTabs: ["courses", "content"] }
                  : {}),
              }}
            />
          )}
        </Grid>
      </Grid>
    </Layout>
  );
};

export default MyComponent;

const InProgressContent: React.FC = () => {
  const { t } = useTranslation();
  const [isShow, setIsShow] = useState(false);
  const theme = useTheme();
  // Detect if the screen size is medium or larger
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  return (
    <Grid
      container
      style={gredientStyle}
      sx={{ px: { xs: 0, sm: 0, md: 4 } }}
      {...(isShow ? {} : { sx: { display: "none" } })}
    >
      <Grid item xs={12} md={2.7}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { md: "column" },
            justifyContent: {
              xs: "space-between",
              sm: "space-between",
              md: "flex-start",
            },
            px: { xs: "16px" },
            py: { xs: "24px" },
            pb: { xs: 0, sm: 0 },
            gap: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: { xs: 0, sm: 0, md: 1 },
            }}
          >
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontFamily: "Poppins",
                fontWeight: 400,
                fontSize: { md: "22px", sm: "16px", xs: "16px" },
                lineHeight: { md: "28px", sm: "24px", xs: "24px" },
                letterSpacing: "0px",
                verticalAlign: "middle",
                color: "#06A816",
                mb: 0,
              }}
            >
              {t("LEARNER_APP.L_ONE_COURSE.IN_PROGRESS_TITLE")}
            </Typography>
            <Typography
              variant="body1"
              gutterBottom
              sx={{
                color: "#7C766F",
                fontSize: { xs: "12px", sm: "12px", md: "16px" },
              }}
            >
              {t("LEARNER_APP.L_ONE_COURSE.ONGOING_COURSES").replace(
                "{count}",
                isShow?.toString()
              )}
            </Typography>
          </Box>
          <Box
            sx={{
              display: { md: "flex" },
              justifyContent: { md: "flex-start" },
            }}
          >
            <Button
              variant={isMdUp ? "contained" : "text"}
              sx={
                !isMdUp
                  ? {
                      color: theme.palette.secondary.main,
                      minWidth: "100px",
                      fontWeight: 500,
                      fontSize: "14px",
                      lineHeight: "20px",
                      letterSpacing: "0.1px",
                      textAlign: "center",
                      verticalAlign: "middle",
                    }
                  : {}
              }
              endIcon={<ArrowForwardIcon />}
              color="primary"
              href="/in-progress"
            >
              {t("LEARNER_APP.L_ONE_COURSE.VIEW_ALL_BUTTON")}
            </Button>
          </Box>
        </Box>
      </Grid>
      <Grid item xs={12} md={9.3}>
        <ContentComponent
          getContentData={(e: any) => setIsShow(e.count)}
          _config={{
            isShowInCarousel: true,
            isHideNavigation: true,
            _subBox: { px: { xs: 2, sm: 2, md: 0 } },
            _carousel: { spaceBetween: isMdUp ? 16 : 8 },
          }}
        />
      </Grid>
    </Grid>
  );
};
