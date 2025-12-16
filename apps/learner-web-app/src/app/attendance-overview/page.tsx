"use client";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputBase,
  Paper,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Image from "next/image";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { AccountCircleOutlined } from "@mui/icons-material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import Layout from "@learner/components/Layout";
import { getCohortList } from "@learner/utils/API/services/CohortServices";
import { getUserDetails } from "@learner/utils/API/services/ProfileService";
import {
  getCohortAttendance,
  classesMissedAttendancePercentList,
} from "@learner/utils/API/services/AttendanceService";
import { getMyCohortMemberList } from "@learner/utils/API/services/MyClassDetailsService";
import { AttendanceAPILimit } from "../../../app.config";
import { getTodayDate, shortDateFormat, filterMembersExcludingCurrentUser } from "@learner/utils/attendance/helper";
import ProfileMenu from "../../components/ProfileMenu/ProfileMenu";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import DateRangePopup from "../../components/DateRangePopup/DateRangePopup";
import { useTenant } from "@learner/context/TenantContext";
import { useTranslation } from "@shared-lib";
import LanguageDropdown from "@learner/components/LanguageDropdown/LanguageDropdown";

const AttendanceOverviewContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get("classId");
  const { tenant, contentFilter } = useTenant();
  const { t } = useTranslation();
  
  // Get tenant colors
  const primaryColor = contentFilter?.theme?.primaryColor || "#E6873C";
  const secondaryColor = contentFilter?.theme?.secondaryColor || "#1A1A1A";
  const backgroundColor = contentFilter?.theme?.backgroundColor || "#F5F5F5";
  const tenantIcon = contentFilter?.icon || "/logo.png";
  const tenantName = contentFilter?.title || tenant?.name || "Tenant";
  const tenantAlt = `${tenantName} logo`;
  
  const [classId, setClassId] = useState(initialClassId || "");
  const [centersData, setCentersData] = useState<Array<any>>([]);
  const [batchesData, setBatchesData] = useState<Array<any>>([]);
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [presentPercentage, setPresentPercentage] = useState<string | number>("");
  const [lowAttendanceLearnerList, setLowAttendanceLearnerList] = useState<any[]>([]);
  const [learnerData, setLearnerData] = useState<Array<any>>([]);
  const [displayLearnerData, setDisplayLearnerData] = useState<Array<any>>([]);
  const [searchWord, setSearchWord] = useState("");
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [firstName, setFirstName] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [userDetailsModalOpen, setUserDetailsModalOpen] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  
  const today = new Date();
  const currentMonth = today.toLocaleString("default", {
    month: "long",
  });
  const currentYear = today.getFullYear();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFirstName(localStorage.getItem("firstName") || "");
      
      // Initialize date range to last 7 days
      const today = new Date();
      const last7Days = new Date(today);
      last7Days.setDate(today.getDate() - 6);
      const fromDateStr = shortDateFormat(last7Days);
      const toDateStr = getTodayDate();
      setFromDate(fromDateStr);
      setToDate(toDateStr);
      setDateRange(`${fromDateStr} to ${toDateStr}`);
      setSelectedDateRange(`Last 7 Days (${fromDateStr} to ${toDateStr})`);
    }
  }, []);

  const fetchUserCohorts = useCallback(async (userId: string | null) => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await getCohortList(userId, {
        customField: "true",
        children: "true",
      });
      await getUserDetails(userId, true);
      
      if (response && response.length > 0) {
        // Filter centers: items with parentId === null (SCHOOL type)
        const centers = response
          .filter((item: any) => item.parentId === null && item.type === "SCHOOL")
          .map((center: any) => ({
            centerId: center.cohortId,
            centerName: center.cohortName,
            childData: center.childData || [],
          }));
        
        setCentersData(centers);
        
        if (centers.length > 0) {
          const defaultCenter = centers[0];
          setSelectedCenterId(defaultCenter.centerId);

          const batches = defaultCenter.childData.map((batch: any) => ({
            batchId: batch.cohortId,
            batchName: batch.name,
            parentId: batch.parentId,
          }));
          setBatchesData(batches);

          if (batches.length > 0 && !initialClassId) {
            setClassId(batches[0].batchId);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching cohorts:", error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const initializePage = async () => {
      if (typeof window !== "undefined" && window.localStorage) {
        const token = localStorage.getItem("token");
        const storedUserId = localStorage.getItem("userId");
        
        if (!token) {
          router.push("/login");
          return;
        }

        if (storedUserId) {
          await fetchUserCohorts(storedUserId);
          if (initialClassId) {
            setClassId(initialClassId);
          }
        }
      }
    };

    initializePage();
  }, [router, initialClassId, fetchUserCohorts]);

  const handleCenterChange = (event: any) => {
    const centerId = event.target.value;
    setSelectedCenterId(centerId);

    const selectedCenter = centersData.find(
      (center) => center.centerId === centerId
    );
    if (selectedCenter) {
      const batches = selectedCenter.childData.map((batch: any) => ({
        batchId: batch.cohortId,
        batchName: batch.name,
        parentId: batch.parentId,
      }));
      setBatchesData(batches);

      if (batches.length > 0) {
        setClassId(batches[0].batchId);
      } else {
        setClassId("");
      }
    }
  };

  const handleBatchChange = (event: any) => {
    const batchId = event.target.value;
    setClassId(batchId);
  };

  const applySortAndFilter = (list: Array<any>, searchTerm: string, sortOption: string) => {
    // First apply search filter
    let filtered = list;
    if (searchTerm.trim() !== "") {
      filtered = list.filter((learner: any) =>
        learner.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Then apply sort
    const sorted = [...filtered].sort((a: any, b: any) => {
      if (sortOption === "name-asc") {
        return a.name.localeCompare(b.name);
      } else if (sortOption === "name-desc") {
        return b.name.localeCompare(a.name);
      } else if (sortOption === "attendance-asc") {
        // Sort by attendance percentage ascending
        return parseFloat(a.present_percent || "0") - parseFloat(b.present_percent || "0");
      } else if (sortOption === "attendance-desc") {
        // Sort by attendance percentage descending
        return parseFloat(b.present_percent || "0") - parseFloat(a.present_percent || "0");
      }
      return 0;
    });

    return sorted;
  };

  const fetchAttendanceData = useCallback(async () => {
    if (!classId) return;

    try {
      setLoading(true);
      
      // Get cohort members
      const memberResponse = await getMyCohortMemberList({
        limit: 300,
        page: 0,
        filters: { cohortId: classId },
        includeArchived: true,
      });

      const members = memberResponse?.result?.userDetails || [];
      const filteredMembers = filterMembersExcludingCurrentUser(members);
      const nameUserIdArray = filteredMembers.map((entry: any) => ({
        userId: entry.userId,
        name: `${entry.firstName || ""} ${entry.lastName || ""}`.trim(),
        memberStatus: entry.status,
      }));

      // Get attendance statistics - use date range from state
      const attendanceFilters: any = {
        scope: "student",
        contextId: classId,
        fromDate: fromDate || shortDateFormat(new Date(new Date().setDate(new Date().getDate() - 6))),
        toDate: toDate || getTodayDate(),
      };

      // Get cohort attendance percentage
      const cohortAttendanceData = {
        limit: AttendanceAPILimit,
        page: 0,
        filters: attendanceFilters,
        facets: ["contextId"],
        sort: ["present_percentage", "asc"],
      };

      const cohortRes = await getCohortAttendance(cohortAttendanceData);
      const contextData = cohortRes?.data?.result?.contextId?.[classId];
      
      if (contextData?.present_percentage) {
        setPresentPercentage(contextData.present_percentage);
      } else if (contextData?.absent_percentage) {
        setPresentPercentage(0);
      } else {
        setPresentPercentage(t("LEARNER_APP.ATTENDANCE.NO_ATTENDANCE"));
      }

      // Get low attendance learners
      const lowAttendanceResponse = await classesMissedAttendancePercentList({
        filters: attendanceFilters,
        facets: ["userId"],
        sort: ["present_percentage", "asc"],
      });

      const userIdData = lowAttendanceResponse?.data?.result?.userId || {};
      const filteredData = Object.keys(userIdData).map((userId) => ({
        userId,
        absent: userIdData[userId]?.absent || "0",
        present: userIdData[userId]?.present || "0",
        present_percent: userIdData[userId]?.present_percentage || "0",
        absent_percent: userIdData[userId]?.absent_percentage || "0",
      }));

      const mergedArray = filteredData.map((attendance) => {
        const user = nameUserIdArray.find(
          (user: { userId: string }) => user.userId === attendance.userId
        );
        return {
          ...attendance,
          name: user ? user.name : "Unknown",
          memberStatus: user ? user.memberStatus : "Unknown",
        };
      }).filter((item) => item.name !== "Unknown");

      setLearnerData(mergedArray);

      // Get low attendance learners (less than 50%)
      const lowAttendance = mergedArray.filter(
        (user) => parseFloat(user.present_percent) < 50
      );
      setLowAttendanceLearnerList(
        lowAttendance.map((student) => student.name)
      );
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  }, [classId, fromDate, toDate, t]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchWord(event.target.value);
  };

  const handleSearchClear = () => {
    setSearchWord("");
  };

  const handleSortToggle = (column: "name" | "attendance") => {
    setSortBy((prev) => {
      const isSameColumn = prev.startsWith(column);
      const nextSort =
        !isSameColumn || prev.endsWith("desc")
          ? `${column}-asc`
          : `${column}-desc`;
      return nextSort;
    });
  };

  const getSortDirection = (column: "name" | "attendance") => {
    if (!sortBy.startsWith(column)) return null;
    return sortBy.endsWith("asc") ? "asc" : "desc";
  };

  useEffect(() => {
    const sorted = applySortAndFilter(learnerData, searchWord, sortBy);
    setDisplayLearnerData(sorted);
  }, [learnerData, searchWord, sortBy]);

  useEffect(() => {
    if (classId && fromDate && toDate) {
      fetchAttendanceData();
    }
  }, [classId, fromDate, toDate, fetchAttendanceData]);

  const handleDateRangeSelected = ({ fromDate: newFromDate, toDate: newToDate }: { fromDate: string; toDate: string }) => {
    setFromDate(newFromDate);
    setToDate(newToDate);
    const dateRangeStr = `${newFromDate} to ${newToDate}`;
    setDateRange(dateRangeStr);
    
    // Update selected date range display based on the dates
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 6);
    const last7DaysStr = shortDateFormat(last7Days);
    const todayStr = getTodayDate();
    
    if (newFromDate === last7DaysStr && newToDate === todayStr) {
      setSelectedDateRange(`Last 7 Days (${dateRangeStr})`);
    } else if (newFromDate === todayStr && newToDate === todayStr) {
      setSelectedDateRange(`As of Today (${newToDate})`);
    } else {
      setSelectedDateRange(`Custom Range (${dateRangeStr})`);
    }
  };

  const handleLogout = () => {
    setLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
      router.push("/home");
    }
  };

  const handleLearnerClick = async (userId: string) => {
    try {
      setLoadingUserDetails(true);
      setUserDetailsModalOpen(true);
      
      // Fetch user details
      const response = await getUserDetails(userId, true);
      // API response structure: response.result.userData
      const userData = response?.result?.userData || response?.result || response?.data?.result?.userData || response?.data?.result || response;
      
      setSelectedUserDetails(userData);
    } catch (error) {
      console.error("Error fetching user details:", error);
      setSelectedUserDetails(null);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleCloseUserDetailsModal = () => {
    setUserDetailsModalOpen(false);
    setSelectedUserDetails(null);
  };

  return (
    <Layout onlyHideElements={["footer", "topBar"]}>
      <Box sx={{ backgroundColor: backgroundColor, minHeight: "100vh" }}>
        {/* Header Section - Matching Dashboard */}
        <Box
          sx={{
            px: { xs: 2, md: 4 },
            py: { xs: 3, md: 4 },
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
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

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
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

          {/* Welcome Message */}
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: { xs: "18px", sm: "22px" },
                lineHeight: 1.3,
                color: secondaryColor,
              }}
            >
              <span style={{ fontSize: "24px", marginRight: "8px" }}>👋</span>
              {t("LEARNER_APP.PROFILE.MY_PROFILE") || "Welcome"},{" "}
              {firstName || t("LEARNER_APP.COMMON.LEARNER") || "Learner"}!
            </Typography>
          </Box>

          {/* Back Button */}
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/attandence")}
            sx={{
              mb: 2,
              color: secondaryColor,
              "&:hover": {
                backgroundColor: alpha(primaryColor, 0.08),
              },
            }}
          >
            {t("LEARNER_APP.ATTENDANCE.BACK_TO_ATTENDANCE")}
          </Button>
        </Box>

        {/* Main Content */}
        <Box sx={{ px: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}>
          <Box
            sx={{
              backgroundColor: alpha(backgroundColor, 0.95),
              borderRadius: "12px 12px 0 0",
              padding: { xs: "1rem", md: "2rem 2.5rem 1.5rem 1.5rem" },
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              mb: 0,
            }}
          >
            <Box
              display={"flex"}
              flexDirection={{ xs: "column", md: "row" }}
              justifyContent={"space-between"}
              alignItems={{ xs: "flex-start", md: "center" }}
              marginBottom={"16px"}
              gap={{ xs: 2, md: 0 }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: "18px", md: "20px" },
                  fontWeight: "700",
                  color: secondaryColor,
                  letterSpacing: "0.3px",
                }}
              >
                {t("LEARNER_APP.ATTENDANCE.DAY_WISE_ATTENDANCE")}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: { xs: "0.5rem", md: "1rem" },
                  alignItems: "center",
                  flexDirection: { xs: "column", sm: "row" },
                  width: { xs: "100%", md: "auto" },
                }}
              >
                {/* Center Selection */}
                {centersData.length > 0 && (
                  <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
                    <FormControl
                      fullWidth
                      size="small"
                      sx={{
                        minWidth: { xs: "100%", sm: "150px" },
                        maxWidth: { xs: "100%", md: "200px" },
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        "& .MuiOutlinedInput-root": {
                          "&:hover fieldset": {
                            borderColor: primaryColor,
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: primaryColor,
                          },
                        },
                      }}
                    >
                      <InputLabel sx={{ color: secondaryColor }}>{t("LEARNER_APP.COMMON.CENTER")}</InputLabel>
                      <Select
                        value={selectedCenterId}
                        label={t("LEARNER_APP.COMMON.CENTER")}
                        onChange={handleCenterChange}
                        disabled={loading}
                        sx={{
                          color: secondaryColor,
                          "& .MuiSelect-select": {
                            color: secondaryColor,
                          },
                          "& .MuiSvgIcon-root": {
                            color: secondaryColor,
                          },
                        }}
                      >
                        {centersData.map((center) => (
                          <MenuItem
                            key={center.centerId}
                            value={center.centerId}
                            sx={{ color: secondaryColor }}
                          >
                            {center.centerName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}

                {/* Batch Selection */}
                {batchesData.length > 0 && (
                  <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
                    <FormControl
                      fullWidth
                      size="small"
                      sx={{
                        minWidth: { xs: "100%", sm: "150px" },
                        maxWidth: { xs: "100%", md: "200px" },
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        "& .MuiOutlinedInput-root": {
                          "&:hover fieldset": {
                            borderColor: primaryColor,
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: primaryColor,
                          },
                        },
                      }}
                    >
                      <InputLabel sx={{ color: secondaryColor }}>{t("LEARNER_APP.COMMON.BATCH")}</InputLabel>
                      <Select
                        value={classId}
                        label={t("LEARNER_APP.COMMON.BATCH")}
                        onChange={handleBatchChange}
                        disabled={loading || !selectedCenterId}
                        sx={{
                          color: secondaryColor,
                          "& .MuiSelect-select": {
                            color: secondaryColor,
                          },
                          "& .MuiSvgIcon-root": {
                            color: secondaryColor,
                          },
                        }}
                      >
                        {batchesData.map((batch) => (
                          <MenuItem key={batch.batchId} value={batch.batchId} sx={{ color: secondaryColor }}>
                            {batch.batchName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}

                {/* Date Display */}
                <Box
                  display={"flex"}
                  sx={{
                    cursor: "pointer",
                    gap: { xs: "4px", sm: "6px", md: "8px" },
                    alignItems: "center",
                    backgroundColor: "white",
                    padding: { xs: "6px 12px", sm: "7px 14px", md: "8px 16px" },
                    borderRadius: { xs: "6px", md: "8px" },
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    border: "1px solid rgba(0,0,0,0.05)",
                    transition: "all 0.2s",
                    width: { xs: "100%", sm: "auto" },
                    justifyContent: { xs: "space-between", sm: "flex-start" },
                    "&:hover": {
                      boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                      transform: { xs: "none", md: "translateY(-1px)" },
                    },
                  }}
                  onClick={() => router.push(`/attendance-history?classId=${classId}`)}
                >
                  <Typography
                    sx={{
                      fontWeight: "600",
                      minWidth: { xs: "auto", sm: "120px", md: "140px" },
                      textAlign: "center",
                      fontSize: { xs: "13px", sm: "14px", md: "15px" },
                      color: secondaryColor,
                      flex: { xs: 1, sm: "none" },
                    }}
                  >
                    {currentMonth} {currentYear}
                  </Typography>
                  <CalendarMonthIcon
                    sx={{
                      fontSize: { xs: "14px", sm: "15px", md: "16px" },
                      ml: { xs: 0, sm: 0.5 },
                      cursor: "pointer",
                      color: secondaryColor,
                      display: { xs: "none", sm: "block" },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
          
          <Box
            sx={{
              backgroundColor: alpha("#FFFFFF", 0.9),
              borderRadius: "0 0 12px 12px",
              p: 3,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              mt: 0,
            }}
          >
            <Typography
              variant="h4"
              gutterBottom
              sx={{ fontWeight: 600, color: secondaryColor, mb: 3 }}
            >
              {t("LEARNER_APP.ATTENDANCE.ATTENDANCE_OVERVIEW")}
            </Typography>

            {/* Date Range Filter */}
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "flex-start" }}>
              <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 auto", md: "0 0 auto" }, minWidth: { xs: "100%", sm: "200px", md: "250px" } }}>
                <DateRangePopup
                  selectedValue={selectedDateRange}
                  setSelectedValue={setSelectedDateRange}
                  onDateRangeSelected={handleDateRangeSelected}
                  dateRange={dateRange}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                />
              </Box>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress sx={{ color: primaryColor }} />
              </Box>
            ) : (
              <>
                {/* Overview Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <Card
                      sx={{
                        backgroundColor: alpha("#FFFFFF", 0.9),
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    >
                      <CardContent>
                        <Typography
                          variant="body2"
                          component="div"
                          sx={{ color: alpha(secondaryColor, 0.6), mb: 1 }}
                        >
                          {t("LEARNER_APP.ATTENDANCE.CENTER_ATTENDANCE")}
                        </Typography>
                        <Typography
                          variant="h4"
                          component="div"
                          fontWeight="bold"
                          sx={{ color: primaryColor }}
                        >
                          {typeof presentPercentage === "number"
                            ? `${presentPercentage}%`
                            : presentPercentage}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Card
                      sx={{
                        backgroundColor: alpha("#FFFFFF", 0.9),
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    >
                      <CardContent>
                        <Typography
                          variant="body2"
                          component="div"
                          sx={{ color: alpha(secondaryColor, 0.6), mb: 1 }}
                        >
                          {t("LEARNER_APP.ATTENDANCE.LOW_ATTENDANCE_LEARNERS")}
                        </Typography>
                        <Typography variant="body1" component="div" sx={{ color: secondaryColor }}>
                          {lowAttendanceLearnerList.length > 0
                            ? lowAttendanceLearnerList.slice(0, 3).join(", ") +
                              (lowAttendanceLearnerList.length > 3
                                ? ` and ${lowAttendanceLearnerList.length - 3} more`
                                : "")
                            : t("LEARNER_APP.ATTENDANCE.NO_LEARNERS_LOW_ATTENDANCE")}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Learner List */}
                {learnerData.length > 0 && (
                  <Box>
                    <Typography
                      variant="h6"
                      component="div"
                      sx={{ color: secondaryColor, mb: 2,fontSize: '16px' }}
                    >
                      {t("LEARNER_APP.ATTENDANCE.LEARNER_ATTENDANCE_DETAILS")}
                    </Typography>
                    
                    {/* Search and Sort */}
                    <Box sx={{ mb: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={8}>
                          <Paper
                            component="form"
                            onSubmit={(e) => {
                              e.preventDefault();
                            }}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              borderRadius: "100px",
                              background: "white",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              border: `2px solid ${alpha(primaryColor, 0.2)}`,
                              transition: "all 0.2s",
                              "&:hover": {
                                boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                                borderColor: alpha(primaryColor, 0.4),
                              },
                            }}
                          >
                            <InputBase
                              value={searchWord}
                              sx={{
                                flex: 1,
                                mb: "0",
                                fontSize: "14px",
                                color: secondaryColor,
                                px: "16px",
                              }}
                              placeholder={t("LEARNER_APP.ATTENDANCE.SEARCH_STUDENT") || "Search student..."}
                              inputProps={{ "aria-label": "search student" }}
                              onChange={handleSearch}
                              autoFocus={false}
                            />
                            <IconButton
                              type="button"
                              sx={{ p: "10px", color: secondaryColor }}
                              aria-label="search"
                            >
                              <SearchIcon />
                            </IconButton>
                            <IconButton
                              type="button"
                              aria-label="Clear"
                              onClick={handleSearchClear}
                              sx={{
                                p: "10px",
                                color: secondaryColor,
                                opacity: searchWord?.length > 0 ? 1 : 0,
                                visibility: searchWord?.length > 0 ? "visible" : "hidden",
                                transition: "opacity 0.2s",
                              }}
                            >
                              <ClearIcon />
                            </IconButton>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>
                    
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        px: 1,
                        pb: 1,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography
                          sx={{
                            color: secondaryColor,
                            fontSize: "13px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          {t("LEARNER_APP.ATTENDANCE.LEARNER_NAME")}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleSortToggle("name")}
                          sx={{
                            color:
                              getSortDirection("name") === "desc"
                                ? secondaryColor
                                : alpha(secondaryColor, 0.6),
                          }}
                        >
                          {getSortDirection("name") === "desc" ? (
                            <ArrowDownwardIcon fontSize="small" />
                          ) : (
                            <ArrowUpwardIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography
                          sx={{
                            color: secondaryColor,
                            fontSize: "13px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          {t("LEARNER_APP.ATTENDANCE.ATTENDANCE_PERCENTAGE")}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleSortToggle("attendance")}
                          sx={{
                            color:
                              getSortDirection("attendance") === "desc"
                                ? secondaryColor
                                : alpha(secondaryColor, 0.6),
                          }}
                        >
                          {getSortDirection("attendance") === "desc" ? (
                            <ArrowDownwardIcon fontSize="small" />
                          ) : (
                            <ArrowUpwardIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Box sx={{ maxHeight: "500px", overflowY: "auto" }}>
                      {displayLearnerData.map((learner) => (
                        <Card
                          key={learner.userId}
                          sx={{
                            mb: 1,
                            backgroundColor: alpha("#FFFFFF", 0.9),
                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                          }}
                        >
                          <CardContent>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Typography
                                variant="body1"
                                component="div"
                                fontWeight="500"
                                onClick={() => handleLearnerClick(learner.userId)}
                                sx={{ 
                                  color: primaryColor,
                                  cursor: "pointer",
                                  textDecoration: "underline",
                                  "&:hover": {
                                    color: secondaryColor,
                                  },
                                }}
                              >
                                {learner.name}
                              </Typography>
                              <Box sx={{ textAlign: "right" }}>
                                <Typography
                                  variant="body2"
                                  component="div"
                                  sx={{ color: alpha(secondaryColor, 0.6) }}
                                >
                                  {t("LEARNER_APP.COMMON.PRESENT")}: {learner.present} | {t("LEARNER_APP.COMMON.ABSENT")}:{" "}
                                  {learner.absent}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  component="div"
                                  fontWeight="bold"
                                  sx={{ color: primaryColor }}
                                >
                                  {Math.floor(parseFloat(learner.present_percent))}%
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Profile Menu */}
      <ProfileMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        onLogout={handleLogout}
      />

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        modalOpen={logoutModalOpen}
        handleCloseModal={() => setLogoutModalOpen(false)}
        handleAction={handleConfirmLogout}
        message={t("LEARNER_APP.COMMON.SURE_LOGOUT") || "Are you sure you want to logout?"}
        buttonNames={{
          primary: t("LEARNER_APP.COMMON.LOGOUT") || "Logout",
          secondary: t("LEARNER_APP.COMMON.CANCEL") || "Cancel",
        }}
      />

      {/* User Details Modal */}
      <Dialog
        open={userDetailsModalOpen}
        onClose={handleCloseUserDetailsModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: alpha(primaryColor, 0.1),
            color: secondaryColor,
            fontWeight: 600,
            fontSize: "20px",
            pb: 2,
          }}
        >
          {t("LEARNER_APP.ATTENDANCE.LEARNER_ATTENDANCE_DETAILS")}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          {loadingUserDetails ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress sx={{ color: primaryColor }} />
            </Box>
          ) : selectedUserDetails ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Full Name - Full Width */}
                <Box sx={{ mt: 2 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: alpha(secondaryColor, 0.6),
                    mb: 0.5,
                    fontWeight: 500,
                  }}
                >
                  {t("LEARNER_APP.COMMON.FULL_NAME")}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: secondaryColor,
                    fontWeight: 500,
                  }}
                >
                  {(() => {
                    const firstName = selectedUserDetails.firstName || "";
                    const lastName = selectedUserDetails.lastName || "";
                    const fullName = `${firstName} ${lastName}`.trim();
                    return fullName || "-";
                  })()}
                </Typography>
              </Box>

              {/* Email and Mobile Number - Side by Side */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                  },
                  gap: 2,
                  columnGap: 3,
                }}
              >
                {/* Email */}
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: alpha(secondaryColor, 0.6),
                      mb: 0.5,
                      fontWeight: 500,
                    }}
                  >
                    {t("LEARNER_APP.COMMON.EMAIL")}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: secondaryColor,
                    }}
                  >
                    {selectedUserDetails.email || selectedUserDetails.emailId || "-"}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: alpha(secondaryColor, 0.6),
                      mt: 1,
                      mb: 0.5,
                      fontWeight: 500,
                    }}
                  >
                    {t("ENROLLMENT_NUMBER") || t("LEARNER_APP.COMMON.ENROLLMENT_NUMBER") || "Enrollment ID"}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: secondaryColor,
                    }}
                  >
                    {selectedUserDetails.enrollmentId ||
                      selectedUserDetails.enrollmentID ||
                      selectedUserDetails.enrollmentNumber ||
                      selectedUserDetails.enrollment_no ||
                      "-"}
                  </Typography>
                </Box>

                {/* Mobile Number */}
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: alpha(secondaryColor, 0.6),
                      mb: 0.5,
                      fontWeight: 500,
                    }}
                  >
                    {t("LEARNER_APP.COMMON.MOBILE_NUMBER")}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: secondaryColor,
                    }}
                  >
                    {selectedUserDetails.phoneNumber ||
                      selectedUserDetails.phone ||
                      selectedUserDetails.mobileNumber ||
                      selectedUserDetails.mobile ||
                      "-"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: alpha(secondaryColor, 0.6),
                textAlign: "center",
                py: 4,
              }}
            >
              Unable to load user details
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={handleCloseUserDetailsModal}
            sx={{
              color: secondaryColor,
              "&:hover": {
                backgroundColor: alpha(primaryColor, 0.08),
              },
            }}
          >
            {t("LEARNER_APP.COMMON.CLOSE")}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};
const AttendanceOverviewPage = () => {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            fontWeight: 500,
          }}
        >
          {t("LEARNER_APP.ATTENDANCE.LOADING_ATTENDANCE_OVERVIEW")}
        </Box>
      }
    >
      <AttendanceOverviewContent />
    </Suspense>
  );
};

export default AttendanceOverviewPage;
