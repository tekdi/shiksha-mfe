"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  styled,
  Chip,
  Avatar,
} from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { alpha, useTheme } from "@mui/material/styles";
import { getCohortList, getCohortDetails } from "../../utils/API/services/CohortServices";
import { getMyCohortMemberList } from "../../utils/API/services/MyClassDetailsService";
import { getUserDetails } from "../../utils/API/services/ProfileService";
import Layout from "@learner/components/Layout";
import { AccountCircleOutlined, SchoolOutlined, GroupsOutlined, PersonOutlined } from "@mui/icons-material";
import ProfileMenu from "../../components/ProfileMenu/ProfileMenu";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import { gredientStyle } from "@learner/utils/style";
import { useTenant } from "@learner/context/TenantContext";
import { useTranslation } from "@shared-lib";
import LanguageDropdown from "@learner/components/LanguageDropdown/LanguageDropdown";
import { showToastMessage } from "../attandence/toast";

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
    transform: "translateY(-4px)",
  },
}));

const ContentWrapper = styled(Box)({
  paddingBottom: "25px",
  width: "100%",
  background: "linear-gradient(180deg, var(--background-color, #F5F5F5) 0%, rgba(255,255,255,0.9) 100%)",
  borderRadius: "8px",
});

const MyClassesPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const { tenant, contentFilter } = useTenant();
  const { t } = useTranslation();
  
  // Get tenant colors
  const primaryColor = contentFilter?.theme?.primaryColor || "#E6873C";
  const secondaryColor = contentFilter?.theme?.secondaryColor || "#1A1A1A";
  const backgroundColor = contentFilter?.theme?.backgroundColor || "#F5F5F5";
  const tenantIcon = contentFilter?.icon || "/logo.png";
  const tenantName = contentFilter?.title || tenant?.name || "Tenant";
  const tenantAlt = `${tenantName} logo`;
  
  const [cohortsData, setCohortsData] = useState<Array<any>>([]);
  const [centersData, setCentersData] = useState<Array<any>>([]);
  const [selectedBatchForCenter, setSelectedBatchForCenter] = useState<string | null>(null);
  const [batchMembers, setBatchMembers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    const initializePage = async () => {
      const token = localStorage.getItem("token");
      const storedUserId = localStorage.getItem("userId");
      const storedFirstName = localStorage.getItem("firstName");
      
      if (storedFirstName) {
        setFirstName(storedFirstName);
      }
      
      if (token && storedUserId) {
        await fetchUserCohorts(storedUserId);
      } else {
        router.push("/login");
      }
    };

    initializePage();
  }, [router]);

  const fetchUserCohorts = async (userId: string | null) => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await getCohortList(userId, {
        customField: "true",
        children: "true",
      });
      await getUserDetails(userId, true);
      if (response && response.length > 0) {
        setCohortsData(response);
        
        // Extract unique parent IDs from the cohorts
        const uniqueParentIds = [...new Set(
          response
            .filter((item: any) => item.parentId && item.type === "COHORT")
            .map((item: any) => item.parentId)
        )];
        
        // Fetch hierarchy data for each unique parent ID
        const centersWithHierarchy = await Promise.all(
          uniqueParentIds.map(async (parentId: any) => {
            try {
              const hierarchyData = await getCohortDetails(parentId, {
                children: "true",
                customField: "true",
              });
              
              const centerData = Array.isArray(hierarchyData) ? hierarchyData[0] : hierarchyData;
              
              return {
                centerId: centerData?.cohortId || parentId,
                centerName: centerData?.cohortName || centerData?.name || "Unknown Center",
                childData: centerData?.childData || [],
                hierarchyData: centerData,
              };
            } catch (error) {
              console.error(`Error fetching hierarchy for ${parentId}:`, error);
              return null;
            }
          })
        );
        
        const validCenters = centersWithHierarchy.filter((center) => center !== null);
        setCentersData(validCenters);
      }
    } catch (error) {
      console.error("Error fetching cohorts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchMembers = async (batchId: string) => {
    setLoadingMembers(true);
    setSelectedUser(null);
    try {
      const limit = 300;
      const page = 0;
      const filters = { cohortId: batchId };
      const response = await getMyCohortMemberList({
        limit,
        page,
        filters,
        includeArchived: true,
      });

      const members = response?.result?.userDetails || [];
      setBatchMembers(members);
    } catch (error) {
      console.error("Error fetching batch members:", error);
      showToastMessage(t("LEARNER_APP.COMMON.ERROR_FETCHING_MEMBERS") || "Error fetching batch members", "error");
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleBatchClickForCenter = (batchId: string) => {
    setSelectedBatchForCenter(batchId);
    fetchBatchMembers(batchId);
  };

  const handleUserClick = (user: any) => {
    setSelectedUser(user);
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
    router.push("/logout");
  };

  const handleTopTabChange = (
    _: React.SyntheticEvent,
    value: string
  ) => {
    switch (value) {
      case "Course":
        router.push("/dashboard?tab=0");
        break;
      case "content":
        router.push("/dashboard?tab=1");
        break;
      case "groups":
        router.push("/dashboard?tab=2");
        break;
      case "attendance":
        router.push("/attandence");
        break;
      default:
        break;
    }
  };

  return (
    <Layout onlyHideElements={["footer", "topBar"]}>
      <Box sx={{ backgroundColor, minHeight: "100vh" }}>
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
              gap: 2,
              flexWrap: "wrap",
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
                  width: { xs: 32, sm: 36, md: 40 },
                  height: { xs: 32, sm: 36, md: 40 },
                  borderRadius: "8px",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                <Image
                  src={tenantIcon}
                  alt={tenantAlt}
                  width={32}
                  height={32}
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
          <Box
            sx={{
              mt: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography
              variant="body1"
              component="h2"
              sx={{
                fontWeight: 600,
                color: secondaryColor,
                textTransform: "capitalize",
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontSize: { xs: "18px", sm: "20px" },
                lineHeight: 1.3,
              }}
            >
              <span role="img" aria-label="wave">
                👋
              </span>
              {t("LEARNER_APP.PROFILE.MY_PROFILE") || "Welcome"},{" "}
              {firstName || t("LEARNER_APP.COMMON.LEARNER") || "Learner"}!
            </Typography>
          </Box>
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
            value="myClasses"
            onChange={handleTopTabChange}
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
            <Tab label={t("LEARNER_APP.COMMON.GROUPS")} value="groups" />
            <Tab label={t("LEARNER_APP.COMMON.ATTENDANCE")} value="attendance" />
            <Tab label={t("LEARNER_APP.COMMON.MY_CLASSES") || "My Classes"} value="myClasses" />
          </Tabs>
          <Grid container style={gredientStyle}>
            <Grid item xs={12}>
              <Box sx={{ minHeight: "100vh", backgroundColor, marginRight: { xs: 0, md: "20px" } }}>
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <ContentWrapper>
                    <Box
                      sx={{
                        p: { xs: 2, md: 3 },
                        background: `linear-gradient(135deg, ${alpha(backgroundColor, 0.3)} 0%, ${alpha(primaryColor, 0.05)} 100%)`,
                      }}
                    >
                      
                      <Grid container spacing={{ xs: 2, md: 3 }}>
                        {/* Left Panel - Centers and Batches */}
                        <Grid item xs={12} md={4}>
                          <StyledCard>
                            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                                <SchoolOutlined sx={{ color: primaryColor, fontSize: 28 }} />
                                <Typography variant="h6" sx={{ color: primaryColor, fontWeight: 700 }}>
                                  {t("LEARNER_APP.COMMON.MANAGEMENT") || "Management"}
                                </Typography>
                              </Box>
                              
                              {loading ? (
                                <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
                                  <CircularProgress sx={{ color: primaryColor }} />
                                </Box>
                              ) : centersData.length === 0 ? (
                                <Box
                                  sx={{
                                    textAlign: "center",
                                    p: 4,
                                    backgroundColor: alpha(backgroundColor, 0.5),
                                    borderRadius: 2,
                                  }}
                                >
                                  <SchoolOutlined sx={{ fontSize: 48, color: alpha(secondaryColor, 0.3), mb: 1 }} />
                                  <Typography sx={{ color: alpha(secondaryColor, 0.6), fontStyle: "italic" }}>
                                    {t("LEARNER_APP.COMMON.NO_CENTERS_AVAILABLE") || "No centers available"}
                                  </Typography>
                                </Box>
                              ) : (
                                <Box sx={{ maxHeight: "600px", overflowY: "auto", pr: 1 }}>
                                  {centersData.map((center, index) => (
                                    <Box key={center.centerId} sx={{ mb: 3 }}>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 1,
                                          mb: 1.5,
                                          p: 1.5,
                                          borderRadius: 2,
                                          background: `linear-gradient(135deg, ${alpha(primaryColor, 0.1)} 0%, ${alpha(primaryColor, 0.05)} 100%)`,
                                        }}
                                      >
                                        <SchoolOutlined sx={{ color: primaryColor, fontSize: 20 }} />
                                        <Typography
                                          variant="subtitle1"
                                          sx={{
                                            fontWeight: 700,
                                            color: secondaryColor,
                                            fontSize: { xs: "0.95rem", md: "1rem" },
                                          }}
                                        >
                                          {center.centerName}
                                        </Typography>
                                      </Box>
                                      
                                      <Box sx={{ pl: { xs: 1, md: 2 } }}>
                                        {cohortsData
                                          .filter(
                                            (cohort: any) =>
                                              cohort.type === "COHORT" &&
                                              cohort.parentId === center.centerId &&
                                              cohort.cohortStatus === "active"
                                          )
                                          .map((batch: any) => (
                                            <Box
                                              key={batch.cohortId}
                                              onClick={() => handleBatchClickForCenter(batch.cohortId)}
                                              sx={{
                                                p: { xs: 1.25, md: 1.5 },
                                                my: 1,
                                                borderRadius: 2,
                                                cursor: "pointer",
                                                backgroundColor:
                                                  selectedBatchForCenter === batch.cohortId
                                                    ? alpha(primaryColor, 0.15)
                                                    : "white",
                                                border:
                                                  selectedBatchForCenter === batch.cohortId
                                                    ? `2px solid ${primaryColor}`
                                                    : `1px solid ${alpha(secondaryColor, 0.15)}`,
                                                "&:hover": {
                                                  backgroundColor: alpha(primaryColor, 0.08),
                                                  borderColor: primaryColor,
                                                  transform: "translateX(4px)",
                                                  boxShadow: `0 4px 12px ${alpha(primaryColor, 0.2)}`,
                                                },
                                                transition: "all 0.3s ease",
                                                boxShadow:
                                                  selectedBatchForCenter === batch.cohortId
                                                    ? `0 4px 16px ${alpha(primaryColor, 0.25)}`
                                                    : "0 2px 8px rgba(0,0,0,0.05)",
                                              }}
                                            >
                                              <Typography
                                                sx={{
                                                  fontSize: { xs: "0.875rem", md: "0.95rem" },
                                                  color:
                                                    selectedBatchForCenter === batch.cohortId
                                                      ? primaryColor
                                                      : secondaryColor,
                                                  fontWeight:
                                                    selectedBatchForCenter === batch.cohortId ? 700 : 500,
                                                }}
                                              >
                                                {batch.cohortName}
                                              </Typography>
                                            </Box>
                                          ))}
                                      </Box>
                                    </Box>
                                  ))}
                                </Box>
                              )}
                            </CardContent>
                          </StyledCard>
                        </Grid>

                        {/* Middle Panel - User List */}
                        <Grid item xs={12} md={4}>
                          <StyledCard sx={{ height: "100%" }}>
                            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                                <GroupsOutlined sx={{ color: primaryColor, fontSize: 28 }} />
                                <Typography variant="h6" sx={{ color: primaryColor, fontWeight: 700 }}>
                                  {t("LEARNER_APP.COMMON.MEMBERS") || "Members"}
                                </Typography>
                                {batchMembers.length > 0 && (
                                  <Chip
                                    label={batchMembers.length}
                                    size="small"
                                    sx={{
                                      backgroundColor: primaryColor,
                                      color: "white",
                                      fontWeight: 600,
                                      ml: "auto",
                                    }}
                                  />
                                )}
                              </Box>
                              
                              {!selectedBatchForCenter ? (
                                <Box
                                  sx={{
                                    textAlign: "center",
                                    p: { xs: 3, md: 5 },
                                    backgroundColor: alpha(backgroundColor, 0.5),
                                    borderRadius: 2,
                                  }}
                                >
                                  <GroupsOutlined sx={{ fontSize: 48, color: alpha(secondaryColor, 0.3), mb: 1 }} />
                                  <Typography sx={{ color: alpha(secondaryColor, 0.6), fontStyle: "italic" }}>
                                    {t("LEARNER_APP.COMMON.SELECT_BATCH_TO_VIEW_MEMBERS") || "Select a batch to view members"}
                                  </Typography>
                                </Box>
                              ) : loadingMembers ? (
                                <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
                                  <CircularProgress sx={{ color: primaryColor }} />
                                </Box>
                              ) : batchMembers.length === 0 ? (
                                <Box
                                  sx={{
                                    textAlign: "center",
                                    p: 4,
                                    backgroundColor: alpha(backgroundColor, 0.5),
                                    borderRadius: 2,
                                  }}
                                >
                                  <PersonOutlined sx={{ fontSize: 48, color: alpha(secondaryColor, 0.3), mb: 1 }} />
                                  <Typography sx={{ color: alpha(secondaryColor, 0.6) }}>
                                    {t("LEARNER_APP.COMMON.NO_MEMBERS_FOUND") || "No members found"}
                                  </Typography>
                                </Box>
                              ) : (
                                <Box sx={{ maxHeight: "600px", overflowY: "auto", pr: 1 }}>
                                  {batchMembers.map((member: any, index: number) => (
                                    <Box
                                      key={member.userId}
                                      onClick={() => handleUserClick(member)}
                                      sx={{
                                        p: { xs: 1.5, md: 2 },
                                        my: 1,
                                        borderRadius: 2,
                                        cursor: "pointer",
                                        background:
                                          selectedUser?.userId === member.userId
                                            ? `linear-gradient(135deg, ${alpha(primaryColor, 0.15)} 0%, ${alpha(primaryColor, 0.08)} 100%)`
                                            : "white",
                                        border:
                                          selectedUser?.userId === member.userId
                                            ? `2px solid ${primaryColor}`
                                            : `1px solid ${alpha(secondaryColor, 0.15)}`,
                                        "&:hover": {
                                          backgroundColor: alpha(primaryColor, 0.05),
                                          borderColor: primaryColor,
                                          transform: "translateX(4px)",
                                          boxShadow: `0 4px 12px ${alpha(primaryColor, 0.2)}`,
                                        },
                                        transition: "all 0.3s ease",
                                        boxShadow:
                                          selectedUser?.userId === member.userId
                                            ? `0 4px 16px ${alpha(primaryColor, 0.25)}`
                                            : "0 2px 8px rgba(0,0,0,0.05)",
                                      }}
                                    >
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                        <Avatar
                                          sx={{
                                            width: { xs: 36, md: 42 },
                                            height: { xs: 36, md: 42 },
                                            backgroundColor: selectedUser?.userId === member.userId ? primaryColor : alpha(primaryColor, 0.2),
                                            color: selectedUser?.userId === member.userId ? "white" : primaryColor,
                                            fontWeight: 700,
                                            fontSize: { xs: "0.9rem", md: "1rem" },
                                          }}
                                        >
                                          {(member.firstName?.[0] || member.username?.[0] || "U").toUpperCase()}
                                        </Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                          <Typography
                                            sx={{
                                              fontWeight:
                                                selectedUser?.userId === member.userId ? 700 : 600,
                                              color:
                                                selectedUser?.userId === member.userId
                                                  ? primaryColor
                                                  : secondaryColor,
                                              fontSize: { xs: "0.9rem", md: "0.95rem" },
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {`${member.firstName || ""} ${member.lastName || ""}`.trim() ||
                                              member.username}
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              color: alpha(secondaryColor, 0.6),
                                              display: "block",
                                              fontSize: { xs: "0.75rem", md: "0.8rem" },
                                            }}
                                          >
                                            @{member.role}
                                          </Typography>
                                        </Box>
                                        {selectedUser?.userId === member.userId && (
                                          <Box
                                            sx={{
                                              width: 8,
                                              height: 8,
                                              borderRadius: "50%",
                                              backgroundColor: primaryColor,
                                            }}
                                          />
                                        )}
                                      </Box>
                                    </Box>
                                  ))}
                                </Box>
                              )}
                            </CardContent>
                          </StyledCard>
                        </Grid>

                        {/* Right Panel - User Details */}
                        <Grid item xs={12} md={4}>
                          <StyledCard sx={{ height: "100%" }}>
                            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                                <PersonOutlined sx={{ color: primaryColor, fontSize: 28 }} />
                                <Typography variant="h6" sx={{ color: primaryColor, fontWeight: 700 }}>
                                  {t("LEARNER_APP.COMMON.USER_DETAILS") || "User Details"}
                                </Typography>
                              </Box>
                              
                              {!selectedUser ? (
                                <Box
                                  sx={{
                                    textAlign: "center",
                                    p: { xs: 3, md: 5 },
                                    backgroundColor: alpha(backgroundColor, 0.5),
                                    borderRadius: 2,
                                  }}
                                >
                                  <PersonOutlined sx={{ fontSize: 48, color: alpha(secondaryColor, 0.3), mb: 1 }} />
                                  <Typography sx={{ color: alpha(secondaryColor, 0.6), fontStyle: "italic" }}>
                                    {t("LEARNER_APP.COMMON.SELECT_MEMBER_TO_VIEW_DETAILS") || "Select a member to view details"}
                                  </Typography>
                                </Box>
                              ) : (
                                <Box>
                                  {/* Profile Header */}
                                  <Box
                                    sx={{
                                      mb: 3,
                                      p: { xs: 2, md: 3 },
                                      textAlign: "center",
                                      background: `linear-gradient(135deg, ${alpha(primaryColor, 0.15)} 0%, ${alpha(primaryColor, 0.05)} 100%)`,
                                      borderRadius: 3,
                                      border: `2px solid ${alpha(primaryColor, 0.2)}`,
                                    }}
                                  >
                                    <Avatar
                                      sx={{
                                        width: { xs: 80, md: 96 },
                                        height: { xs: 80, md: 96 },
                                        backgroundColor: primaryColor,
                                        color: "white",
                                        fontSize: { xs: "2rem", md: "2.5rem" },
                                        fontWeight: 700,
                                        margin: "0 auto",
                                        mb: 2,
                                        boxShadow: `0 6px 20px ${alpha(primaryColor, 0.4)}`,
                                        border: `4px solid white`,
                                      }}
                                    >
                                      {(selectedUser.firstName?.[0] || selectedUser.username?.[0] || "U").toUpperCase()}
                                    </Avatar>
                                    <Typography
                                      variant="h5"
                                      sx={{
                                        color: secondaryColor,
                                        fontWeight: 700,
                                        fontSize: { xs: "1.15rem", md: "1.35rem" },
                                        mb: 0.5,
                                      }}
                                    >
                                      {`${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim() || selectedUser.username}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: alpha(secondaryColor, 0.7),
                                        fontSize: { xs: "0.85rem", md: "0.9rem" },
                                        fontWeight: 500,
                                      }}
                                    >
                                      @{selectedUser.username}
                                    </Typography>
                                  </Box>

                                  {/* Details Grid */}
                                  <Box sx={{ "& > div": { mb: 2 } }}>
                                    <Box
                                      sx={{
                                        p: { xs: 1.5, md: 2 },
                                        borderRadius: 2,
                                        background: `linear-gradient(135deg, ${alpha(primaryColor, 0.05)} 0%, ${alpha(backgroundColor, 0.8)} 100%)`,
                                        border: `1px solid ${alpha(primaryColor, 0.15)}`,
                                        transition: "all 0.2s",
                                        "&:hover": {
                                          borderColor: primaryColor,
                                          boxShadow: `0 4px 12px ${alpha(primaryColor, 0.15)}`,
                                        },
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: primaryColor,
                                          display: "block",
                                          mb: 0.75,
                                          fontWeight: 700,
                                          textTransform: "uppercase",
                                          fontSize: "0.7rem",
                                          letterSpacing: "0.8px",
                                        }}
                                      >
                                        {t("LEARNER_APP.COMMON.USER_ID") || "User ID"}
                                      </Typography>
                                      <Typography
                                        sx={{
                                          color: secondaryColor,
                                          fontWeight: 600,
                                          fontSize: { xs: "0.75rem", md: "0.8rem" },
                                          wordBreak: "break-all",
                                          fontFamily: "monospace",
                                          backgroundColor: alpha(backgroundColor, 0.8),
                                          p: 1,
                                          borderRadius: 1,
                                        }}
                                      >
                                        {selectedUser.userId || "N/A"}
                                      </Typography>
                                    </Box>

                                    <Box
                                      sx={{
                                        p: { xs: 1.5, md: 2 },
                                        borderRadius: 2,
                                        background: `linear-gradient(135deg, ${alpha(primaryColor, 0.05)} 0%, ${alpha(backgroundColor, 0.8)} 100%)`,
                                        border: `1px solid ${alpha(primaryColor, 0.15)}`,
                                        transition: "all 0.2s",
                                        "&:hover": {
                                          borderColor: primaryColor,
                                          boxShadow: `0 4px 12px ${alpha(primaryColor, 0.15)}`,
                                        },
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: primaryColor,
                                          display: "block",
                                          mb: 0.75,
                                          fontWeight: 700,
                                          textTransform: "uppercase",
                                          fontSize: "0.7rem",
                                          letterSpacing: "0.8px",
                                        }}
                                      >
                                        {t("LEARNER_APP.COMMON.STATUS") || "Status"}
                                      </Typography>
                                      <Chip
                                        label={selectedUser.status || "N/A"}
                                        size="medium"
                                        sx={{
                                          backgroundColor:
                                            selectedUser.status === "ACTIVE"
                                              ? "#4caf50"
                                              : selectedUser.status === "ARCHIVED"
                                              ? "#ff9800"
                                              : "#f44336",
                                          color: "white",
                                          fontWeight: 700,
                                          fontSize: { xs: "0.8rem", md: "0.85rem" },
                                          height: "auto",
                                          py: 0.75,
                                          px: 1.5,
                                        }}
                                      />
                                    </Box>

                                    {selectedUser.role && (
                                      <Box
                                        sx={{
                                          p: { xs: 1.5, md: 2 },
                                          borderRadius: 2,
                                          background: `linear-gradient(135deg, ${alpha(primaryColor, 0.05)} 0%, ${alpha(backgroundColor, 0.8)} 100%)`,
                                          border: `1px solid ${alpha(primaryColor, 0.15)}`,
                                          transition: "all 0.2s",
                                          "&:hover": {
                                            borderColor: primaryColor,
                                            boxShadow: `0 4px 12px ${alpha(primaryColor, 0.15)}`,
                                          },
                                        }}
                                      >
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color: primaryColor,
                                            display: "block",
                                            mb: 0.75,
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            fontSize: "0.7rem",
                                            letterSpacing: "0.8px",
                                          }}
                                        >
                                          {t("LEARNER_APP.COMMON.ROLE") || "Role"}
                                        </Typography>
                                        <Typography sx={{ color: secondaryColor, fontWeight: 600, fontSize: { xs: "0.9rem", md: "0.95rem" } }}>
                                          {selectedUser.role}
                                        </Typography>
                                      </Box>
                                    )}

                                    {selectedUser.createdAt && (
                                      <Box
                                        sx={{
                                          p: { xs: 1.5, md: 2 },
                                          borderRadius: 2,
                                          background: `linear-gradient(135deg, ${alpha(primaryColor, 0.05)} 0%, ${alpha(backgroundColor, 0.8)} 100%)`,
                                          border: `1px solid ${alpha(primaryColor, 0.15)}`,
                                          transition: "all 0.2s",
                                          "&:hover": {
                                            borderColor: primaryColor,
                                            boxShadow: `0 4px 12px ${alpha(primaryColor, 0.15)}`,
                                          },
                                        }}
                                      >
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color: primaryColor,
                                            display: "block",
                                            mb: 0.75,
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            fontSize: "0.7rem",
                                            letterSpacing: "0.8px",
                                          }}
                                        >
                                          {t("LEARNER_APP.COMMON.CREATED_AT") || "Created At"}
                                        </Typography>
                                        <Typography sx={{ color: secondaryColor, fontWeight: 600, fontSize: { xs: "0.9rem", md: "0.95rem" } }}>
                                          {new Date(selectedUser.createdAt).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                          })}
                                        </Typography>
                                      </Box>
                                    )}

                                    {selectedUser.updatedAt && (
                                      <Box
                                        sx={{
                                          p: { xs: 1.5, md: 2 },
                                          borderRadius: 2,
                                          background: `linear-gradient(135deg, ${alpha(primaryColor, 0.05)} 0%, ${alpha(backgroundColor, 0.8)} 100%)`,
                                          border: `1px solid ${alpha(primaryColor, 0.15)}`,
                                          transition: "all 0.2s",
                                          "&:hover": {
                                            borderColor: primaryColor,
                                            boxShadow: `0 4px 12px ${alpha(primaryColor, 0.15)}`,
                                          },
                                        }}
                                      >
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color: primaryColor,
                                            display: "block",
                                            mb: 0.75,
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            fontSize: "0.7rem",
                                            letterSpacing: "0.8px",
                                          }}
                                        >
                                          {t("LEARNER_APP.COMMON.UPDATED_AT") || "Updated At"}
                                        </Typography>
                                        <Typography sx={{ color: secondaryColor, fontWeight: 600, fontSize: { xs: "0.9rem", md: "0.95rem" } }}>
                                          {new Date(selectedUser.updatedAt).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                          })}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              )}
                            </CardContent>
                          </StyledCard>
                        </Grid>
                      </Grid>
                    </Box>
                  </ContentWrapper>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
      
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
        buttonNames={{ primary: t("COMMON.LOGOUT"), secondary: t("COMMON.CANCEL") }}
      />
    </Layout>
  );
};

export default MyClassesPage;

