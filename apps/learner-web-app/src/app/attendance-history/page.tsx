"use client";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef, Suspense, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  InputBase,
  IconButton,
  Stack,
  CircularProgress,
} from "@mui/material";
import KeyboardBackspaceOutlinedIcon from "@mui/icons-material/KeyboardBackspaceOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { AccountCircleOutlined } from "@mui/icons-material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import Layout from "@learner/components/Layout";
import ProfileMenu from "@learner/components/ProfileMenu/ProfileMenu";
import ConfirmationModal from "@learner/components/ConfirmationModal/ConfirmationModal";
import { getCohortList } from "@learner/utils/API/services/CohortServices";
import { getUserDetails } from "@learner/utils/API/services/ProfileService";
import {
  attendanceStatusList,
  getCohortAttendance,
} from "@learner/utils/API/services/AttendanceService";
import { getMyCohortMemberList } from "@learner/utils/API/services/MyClassDetailsService";
import { ICohort } from "@learner/utils/attendance/interfaces";
import {
  shortDateFormat,
  filterMembersExcludingCurrentUser,
  isDateWithinPastDays,
  getDayDifferenceFromToday,
} from "@learner/utils/attendance/helper";
import { fetchAttendanceDetails } from "@learner/app/attandence/fetchAttendanceDetails";
import { getContrastTextColor } from "@learner/utils/colorUtils";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import MarkBulkAttendance from "@learner/app/attandence/components/MarkBulkAttendance";
import "../global.css";
import { useTranslation } from "@shared-lib";
import { useTenant } from "@learner/context/TenantContext";
import Image from "next/image";
import LanguageDropdown from "@learner/components/LanguageDropdown/LanguageDropdown";
import { showToastMessage } from "@learner/components/ToastComponent/Toastify";

const MAX_BACKDATED_MARK_DAYS = 7;

const AttendanceHistoryPageContent = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { tenant, contentFilter } = useTenant();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const initialClassId = searchParams.get("classId");
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get tenant colors
  const primaryColor = contentFilter?.theme?.primaryColor || "#E6873C";
  const secondaryColor = contentFilter?.theme?.secondaryColor || "#1A1A1A";
  const backgroundColor = contentFilter?.theme?.backgroundColor || "#F5F5F5";
  const tenantIcon = contentFilter?.icon || "/logo.png";
  const tenantName = contentFilter?.title || tenant?.name || "Tenant";
  const tenantAlt = `${tenantName} logo`;
  
  const [classId, setClassId] = useState(initialClassId || "");
  const [cohortsData, setCohortsData] = useState<Array<ICohort>>([]);
  const [centersData, setCentersData] = useState<Array<any>>([]);
  const [batchesData, setBatchesData] = useState<Array<any>>([]);
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchWord, setSearchWord] = useState("");
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [displayStudentList, setDisplayStudentList] = useState<Array<any>>([]);
  const [cohortMemberList, setCohortMemberList] = useState<Array<any>>([]);
  const [percentageAttendance, setPercentageAttendance] = useState<any>({});
  const [attendanceProgressBarData, setAttendanceProgressBarData] = useState<any>({});
  const [openMarkAttendance, setOpenMarkAttendance] = useState(false);
  const [loadingModalData, setLoadingModalData] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [firstName, setFirstName] = useState("");

  const selectedDateDiffFromToday = useMemo(
    () => getDayDifferenceFromToday(selectedDate),
    [selectedDate]
  );
  const isSelectedDateWithinAllowedWindow = useMemo(
    () => isDateWithinPastDays(selectedDate, MAX_BACKDATED_MARK_DAYS),
    [selectedDate]
  );
  const [nameUserIdArrayForModal, setNameUserIdArrayForModal] = useState<Array<any>>([]);
  const [attendanceData, setAttendanceData] = useState({
    cohortMemberList: [] as any[],
    presentCount: 0,
    absentCount: 0,
    numberOfCohortMembers: 0,
    dropoutMemberList: [] as any[],
    dropoutCount: 0,
    bulkAttendanceStatus: "",
  });
  
  const today = new Date();
  const currentMonth = today.toLocaleString("default", {
    month: "long",
  });
  const currentYear = today.getFullYear();

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
    router.push("/logout");
  };

  useEffect(() => {
    const initializePage = async () => {
      if (typeof window !== "undefined" && window.localStorage) {
        const token = localStorage.getItem("token");
        const storedUserId = localStorage.getItem("userId");
        
        if (!token) {
          router.push("/home");
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
  }, [router, initialClassId]);

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
  };

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

  useEffect(() => {
    if (classId && selectedDate) {
      console.log("[useEffect] Triggering fetchAttendanceForDate", { classId, selectedDate: shortDateFormat(selectedDate) });
      fetchAttendanceForDate();
      fetchAttendanceStats();
    } else {
      console.log("[useEffect] Skipping fetch - missing classId or selectedDate", { classId, selectedDate });
    }
  }, [classId, selectedDate]);

  const fetchAttendanceStats = async () => {
    if (!classId) return;

    try {
      const currentDate = selectedDate || new Date();
      const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const lastDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
      const fromDate = shortDateFormat(firstDayOfMonth);
      const toDate = shortDateFormat(lastDayOfMonth);

      // Get cohort members count
      const memberResponse = await getMyCohortMemberList({
        limit: 300,
        page: 0,
        filters: { cohortId: classId },
        includeArchived: true,
      });
      const rawMembers = memberResponse?.result?.userDetails || [];
      const filteredMembers = filterMembersExcludingCurrentUser(rawMembers);
      const totalMembers = filteredMembers.length;

      // Get attendance data for the month
      const attendanceRequest = {
        limit: 300,
        page: 0,
        filters: {
          contextId: classId,
          fromDate,
          toDate,
          scope: "student",
        },
        facets: ["attendanceDate"],
      };

      // Fetch attendance percentage for each date
      const attendanceRes = await getCohortAttendance(attendanceRequest);
      const attendanceDateData = attendanceRes?.data?.result?.attendanceDate || {};

      // Process attendance data for calendar
      const processedData: any = {};
      Object.keys(attendanceDateData).forEach((dateStr) => {
        const dateData = attendanceDateData[dateStr];
        const present = dateData.present || 0;
        const total = present + (dateData.absent || 0);
        const percentage = totalMembers > 0 ? (present / totalMembers) * 100 : 0;
        processedData[dateStr] = {
          present_percentage: Math.round(percentage),
          totalcount: totalMembers,
          present_students: present,
        };
      });

      setPercentageAttendance(processedData);
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
      setPercentageAttendance({});
    }
  };

  const fetchAttendanceForDate = async () => {
    if (!classId || !selectedDate) {
      console.log("[fetchAttendanceForDate] Skipping - missing classId or selectedDate", { classId, selectedDate });
      return;
    }

    try {
      setLoading(true);
      const selectedDateStr = shortDateFormat(selectedDate);
      const selectedDateObj = new Date(selectedDateStr);
      selectedDateObj.setHours(0, 0, 0, 0);
      console.log("[fetchAttendanceForDate] Fetching attendance for date:", selectedDateStr);
      
      // Get cohort members
      const memberResponse = await getMyCohortMemberList({
        limit: 300,
        page: 0,
        filters: { cohortId: classId },
        includeArchived: true,
      });
      const members = memberResponse?.result?.userDetails || [];
      const filteredMembers = filterMembersExcludingCurrentUser(members);
      const nameUserIdArray = filteredMembers
        .map((entry: any) => ({
          userId: entry.userId,
          name: `${entry.firstName || ""} ${entry.lastName || ""}`.trim() || entry.firstName,
          memberStatus: entry.status,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          userName: entry.username,
        }))
        .filter((member: any) => {
          try {
            if (member.memberStatus === "ACTIVE") {
              return true;
            }

            if (member.memberStatus === "ARCHIVED" || member.memberStatus === "DROPOUT") {
              if (!member.updatedAt) {
                console.warn("[fetchAttendanceForDate] Member missing updatedAt. Including by default:", {
                  userId: member.userId,
                  name: member.name,
                  status: member.memberStatus,
                });
                return true;
              }

              const updatedAt = new Date(member.updatedAt);
              if (isNaN(updatedAt.getTime())) {
                console.warn("[fetchAttendanceForDate] Invalid updatedAt date. Including member:", {
                  userId: member.userId,
                  name: member.name,
                  status: member.memberStatus,
                  updatedAt: member.updatedAt,
                });
                return true;
              }

              updatedAt.setHours(0, 0, 0, 0);
              return updatedAt > selectedDateObj;
            }

            return true;
          } catch (error) {
            console.error("[fetchAttendanceForDate] Error filtering member. Including by default:", error, member);
            return true;
          }
        });

      // Get attendance status list
      const attendanceStatusData = {
        limit: 300,
        page: 0,
        filters: {
          fromDate: selectedDateStr,
          toDate: selectedDateStr,
          contextId: classId,
          scope: "student",
        },
      };

      const attendanceResponse = await attendanceStatusList(attendanceStatusData);
      const attendanceList = attendanceResponse?.data?.attendanceList || [];
      
      console.log("[fetchAttendanceForDate] Attendance API response:", {
        attendanceListLength: attendanceList.length,
        selectedDateStr,
        sampleAttendance: attendanceList.slice(0, 3),
      });

      // Merge member data with attendance - ensure empty string if not marked
      const mergedList = nameUserIdArray.map((member: any) => {
        const attendance = attendanceList.find(
          (a: any) => a.userId === member.userId
        );
        // Explicitly set to empty string if attendance is not found
        return {
          ...member,
          attendance: attendance?.attendance || "",
        };
      });

      // Ensure all members have attendance field (empty string if not marked)
      const cleanedMergedList = mergedList.map((member: any) => ({
        ...member,
        // Force empty string if attendance is falsy (null, undefined, empty string)
        attendance: (member.attendance && member.attendance.trim() !== "") ? member.attendance : "",
      }));
      
      console.log("[fetchAttendanceForDate] Setting lists:", {
        cleanedMergedListLength: cleanedMergedList.length,
        nameUserIdArrayLength: nameUserIdArray.length,
        attendanceListLength: attendanceList.length,
        sampleMembers: cleanedMergedList.slice(0, 5).map((m: any) => ({
          userId: m.userId,
          name: m.name,
          attendance: m.attendance || "EMPTY",
        })),
      });
      
      // Always set the lists, even if empty, so the UI can render appropriately
      setCohortMemberList(cleanedMergedList);
      const sorted = applySortAndFilter(cleanedMergedList, searchWord, sortBy);
      setDisplayStudentList(sorted);
      // Store nameUserIdArray without attendance for modal use
      setNameUserIdArrayForModal(nameUserIdArray);

      // Fetch attendance details for progress bar
      if (nameUserIdArray.length > 0) {
        await fetchAttendanceDetails(
          nameUserIdArray,
          selectedDateStr,
          classId,
          (data: any) => {
            setAttendanceData(data);
            const attendanceInfo = {
              present_students: data.presentCount,
              totalcount: data.numberOfCohortMembers,
              present_percentage:
                data.numberOfCohortMembers === 0
                  ? 0
                  : parseFloat(((data.presentCount / data.numberOfCohortMembers) * 100).toFixed(2)),
            };
            setAttendanceProgressBarData({
              [selectedDateStr]: attendanceInfo,
            });
          }
        );
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      // Even on error, ensure lists are set (might be empty but should still render)
      setCohortMemberList([]);
      setDisplayStudentList([]);
    } finally {
      setLoading(false);
    }
  };

  const applySortAndFilter = (list: Array<any>, searchTerm: string, sortOption: string) => {
    // First apply search filter
    let filtered = list;
    if (searchTerm.trim() !== "") {
      filtered = list.filter((user: any) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Then apply sort
    const sorted = [...filtered].sort((a: any, b: any) => {
      if (sortOption === "name-asc") {
        return a.name.localeCompare(b.name);
      } else if (sortOption === "name-desc") {
        return b.name.localeCompare(a.name);
      } else if (sortOption.startsWith("attendance")) {
        const attendanceOrderAsc: { [key: string]: number } = {
          present: 1,
          absent: 2,
          "": 3,
        };
        const attendanceOrderDesc: { [key: string]: number } = {
          present: 1,
          absent: 2,
          "": 3,
        };
        const orderMap =
          sortOption === "attendance-asc"
            ? attendanceOrderAsc
            : attendanceOrderDesc;
        const aOrder = orderMap[a.attendance?.toLowerCase() || ""] || 3;
        const bOrder = orderMap[b.attendance?.toLowerCase() || ""] || 3;
        return sortOption === "attendance-asc" ? aOrder - bOrder : bOrder - aOrder;
      }
      return 0;
    });

    return sorted;
  };

  const getSortDirection = (column: "name" | "attendance") => {
    if (!sortBy.startsWith(column)) return null;
    return sortBy.endsWith("asc") ? "asc" : "desc";
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchWord(value);
    const sorted = applySortAndFilter(cohortMemberList, value, sortBy);
    setDisplayStudentList(sorted);
  };

  const handleSearchClear = () => {
    setSearchWord("");
    const sorted = applySortAndFilter(cohortMemberList, "", sortBy);
    setDisplayStudentList(sorted);
  };

  const handleSortToggle = (column: "name" | "attendance") => {
    setSortBy((prev) => {
      const isSameColumn = prev.startsWith(column);
      const nextSort =
        !isSameColumn || prev.endsWith("desc")
          ? `${column}-asc`
          : `${column}-desc`;
      const sorted = applySortAndFilter(cohortMemberList, searchWord, nextSort);
      setDisplayStudentList(sorted);
      return nextSort;
    });
  };

  const handleDateChange = (value: any) => {
    const date = value as Date | Date[] | null;
    if (date && !Array.isArray(date)) {
      setSelectedDate(date);
      // Reset attendance data when date changes to ensure fresh data
      setAttendanceData({
        cohortMemberList: [] as any[],
        presentCount: 0,
        absentCount: 0,
        numberOfCohortMembers: 0,
        dropoutMemberList: [] as any[],
        dropoutCount: 0,
        bulkAttendanceStatus: "",
      });
      // Don't clear the lists here - let fetchAttendanceForDate handle it
      // This ensures the list remains visible while new data is being fetched
    }
  };

  const handleActiveStartDateChange = ({ activeStartDate }: any) => {
    // Handle month change
  };

  const showHistoryBackDateRestrictionMessage = () => {
    if (selectedDateDiffFromToday !== null && selectedDateDiffFromToday < 0) {
      showToastMessage(
        t("LEARNER_APP.ATTENDANCE.FUTURE_DATE_CANT_MARK") ||
          "You cannot mark attendance for a future date.",
        "warning"
      );
    } else {
      showToastMessage(
        `You can only mark attendance for the last ${MAX_BACKDATED_MARK_DAYS} days.`,
        "warning"
      );
    }
  };

  const handleOpen = async () => {
    if (!isSelectedDateWithinAllowedWindow) {
      showHistoryBackDateRestrictionMessage();
      return;
    }
    // Ensure attendanceData is up-to-date before opening modal
    // Use nameUserIdArrayForModal (without attendance) to fetch fresh attendance data
    if (nameUserIdArrayForModal.length > 0) {
      setLoadingModalData(true);
      const selectedDateStr = shortDateFormat(selectedDate);
      
      // Reset attendance data first to ensure clean state
      setAttendanceData({
        cohortMemberList: [] as any[],
        presentCount: 0,
        absentCount: 0,
        numberOfCohortMembers: 0,
        dropoutMemberList: [] as any[],
        dropoutCount: 0,
        bulkAttendanceStatus: "",
      });
      
      // Fetch fresh attendance data using nameUserIdArray without attendance merged
      // Wait for the data to be set before opening the modal
      await new Promise<void>((resolve) => {
        fetchAttendanceDetails(
          nameUserIdArrayForModal,
          selectedDateStr,
          classId,
          (data: any) => {
            console.log("[handleOpen] Attendance data received:", {
              cohortMemberListLength: data.cohortMemberList?.length,
              presentCount: data.presentCount,
              absentCount: data.absentCount,
              sampleMembers: data.cohortMemberList?.slice(0, 5).map((m: any) => ({
                userId: m.userId,
                name: m.name,
                attendance: m.attendance || "empty",
              })),
            });
            // Ensure all members have attendance field, defaulting to empty string if not marked
            const cleanedData = {
              ...data,
              cohortMemberList: data.cohortMemberList?.map((member: any) => ({
                ...member,
                attendance: member.attendance || "",
              })) || [],
            };
            setAttendanceData(cleanedData);
            // Use multiple frames to ensure state is fully updated
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setTimeout(() => {
                  setLoadingModalData(false);
                  resolve();
                }, 100);
              });
            });
          }
        );
      });
    } else {
      console.warn("[handleOpen] nameUserIdArrayForModal is empty");
      setLoadingModalData(false);
    }
    setOpenMarkAttendance(true);
  };

  const handleClose = () => {
    setOpenMarkAttendance(false);
    fetchAttendanceForDate();
  };

  const selectedDateStr = shortDateFormat(selectedDate);
  const attendanceInfo = attendanceProgressBarData[selectedDateStr];
  const presentPercentage = attendanceInfo?.present_percentage
    ? parseFloat(attendanceInfo.present_percentage)
    : 0;

  const determinePathColor = (percentage: number) => {
    if (percentage >= 75) return "#4caf50";
    if (percentage >= 50) return "#ff9800";
    return "#f44336";
  };

  const pathColor = determinePathColor(presentPercentage);
  const backgroundGradient = `linear-gradient(180deg, ${backgroundColor} 0%, ${alpha(backgroundColor, 0.25)} 100%)`;
  const attendanceColumnStyles = {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "32px",
    minWidth: { xs: "auto", sm: "220px" },
  } as const;

  return (
    <Layout onlyHideElements={["footer", "topBar"]}>
      <Box sx={{ backgroundColor: backgroundColor, minHeight: "100vh" }}>
        <Box
          sx={{
            px: { xs: 2, md: 4 },
            py: { xs: 4, md: 6 },
            background: backgroundGradient,
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
          <Box minHeight="100vh" textAlign="center" sx={{ backgroundColor: backgroundColor }}>
        {loading && (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        <Box display="flex" justifyContent="center">
          <Box
            sx={{
              width: "100%",
              maxWidth: "1400px",
              "@media (max-width: 700px)": {
                width: "100%",
              },
            }}
          >
            {/* Header */}
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
                <Box display="flex" gap="10px" alignItems="center">
                  <Box
                    onClick={() => {
                      router.push("/attandence");
                    }}
                    sx={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      padding: "4px",
                      borderRadius: "50%",
                      "&:hover": {
                        backgroundColor: "rgba(0,0,0,0.05)",
                      },
                    }}
                  >
                    <KeyboardBackspaceOutlinedIcon
                      sx={{
                        color: secondaryColor,
                        fontSize: "24px",
                      }}
                    />
                  </Box>
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
                </Box>
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

          {/* Sticky Header with Attendance Status */}
          <Box
            pl={3}
            pr={3}
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 1000,
              backgroundColor: alpha(backgroundColor, 0.95),
              boxShadow: "0px 4px 16px rgba(0,0,0,0.12)",
              borderTop: `2px solid ${alpha(primaryColor, 0.2)}`,
              borderBottom: `2px solid ${alpha(primaryColor, 0.2)}`,
              padding: "18px 24px",
              marginTop: "12px",
              borderRadius: "12px 12px 0 0",
            }}
          >
            <Grid container display="flex" justifyContent="space-between" alignItems="center">
              <Grid item xs={12} md={8}>
                <Box display="flex" width="100%" alignItems="center" gap={3} flexWrap="wrap">
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      backgroundColor: "white",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                    }}
                  >
                    <Typography
                      fontSize="16px"
                      fontWeight="700"
                      color={secondaryColor}
                      sx={{ letterSpacing: "0.3px" }}
                    >
                      {format(selectedDate, "dd MMMM yyyy")}
                    </Typography>
                  </Box>
                  {attendanceInfo && (
                    <Box
                      display="flex"
                      gap="8px"
                      alignItems="center"
                      sx={{
                        backgroundColor: "white",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                      }}
                    >
                      <Box width="32px" height="32px">
                        <CircularProgressbar
                          value={presentPercentage}
                          styles={buildStyles({
                            textColor: pathColor,
                            pathColor: pathColor,
                            trailColor: "#E6E6E6",
                            strokeLinecap: "round",
                          })}
                          strokeWidth={18}
                        />
                      </Box>
                      <Box display="flex" flexDirection="column">
                        <Typography
                          fontSize="14px"
                          fontWeight="700"
                          color={secondaryColor}
                          sx={{ lineHeight: 1.2 }}
                        >
                          {presentPercentage}%
                        </Typography>
                        <Typography
                          fontSize="11px"
                          fontWeight="500"
                          color={alpha(secondaryColor, 0.6)}
                          sx={{ lineHeight: 1.2 }}
                        >
                          Present
                        </Typography>
                        <Typography
                          fontSize="12px"
                          fontWeight={600}
                          color={pathColor}
                          sx={{ lineHeight: 1.2, mt: 0.2 }}
                        >
                          {presentPercentage >= 75
                            ? "Good Attendance"
                            : presentPercentage >= 50
                            ? "Average Attendance"
                            : "Low Attendance"}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={4} display="flex" justifyContent="flex-end" mt={{ xs: 2, md: 0 }}>
                <Button
                  variant="contained"
                  onClick={handleOpen}
                  sx={{
                    minWidth: "140px",
                    height: "2.75rem",
                    fontWeight: "600",
                    fontSize: "14px",
                    borderRadius: "8px",
                    backgroundColor:
                      attendanceData.presentCount > 0
                        ? theme.palette.success.main
                        : primaryColor,
                    color: getContrastTextColor(
                      attendanceData.presentCount > 0
                        ? theme.palette.success.main
                        : primaryColor
                    ),
                    boxShadow: `0 4px 12px ${alpha(primaryColor, 0.4)}`,
                    "&:hover": {
                      backgroundColor:
                        attendanceData.presentCount > 0
                          ? alpha(theme.palette.success.main, 0.9)
                          : primaryColor,
                      opacity: 0.9,
                      boxShadow: `0 6px 16px ${alpha(primaryColor, 0.5)}`,
                      transform: "translateY(-1px)",
                    },
                    transition: "all 0.2s",
                  }}
                >
                  {attendanceData.presentCount > 0
                    ? t("LEARNER_APP.ATTENDANCE.MODIFY")
                    : t("LEARNER_APP.ATTENDANCE.MARK_ATTENDANCE")}
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Calendar */}
          <Box
            className="calender-container"
            sx={{
              padding: "28px 24px",
              backgroundColor: alpha(backgroundColor, 0.95),
              marginTop: "12px",
              borderRadius: "0 0 12px 12px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
            }}
          >
            <Box className="day-tile-wrapper custom-calendar-container">
              <Calendar
                onChange={handleDateChange}
                value={selectedDate}
                maxDate={new Date()}
                calendarType="gregory"
                className="calender-body"
                formatShortWeekday={(locale, date) => {
                  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
                  return weekdays[date.getDay()];
                }}
                onActiveStartDateChange={handleActiveStartDateChange}
                tileContent={({ date, view }) => {
                  if (view === "month") {
                    const dateStr = shortDateFormat(date);
                    const attendance = percentageAttendance[dateStr];
                    if (attendance && attendance.present_percentage !== undefined) {
                      const pathColor = determinePathColor(attendance.present_percentage || 0);
                      return (
                        <div className="circularProgressBar">
                          <CircularProgressbar
                            value={attendance.present_percentage || 0}
                            styles={buildStyles({
                              textColor: pathColor,
                              pathColor: pathColor,
                              trailColor: "#E6E6E6",
                              strokeLinecap: "round",
                            })}
                            strokeWidth={20}
                          />
                        </div>
                      );
                    }
                  }
                  return null;
                }}
                tileClassName={({ date, view }) => {
                  if (view !== "month") return null;
                  const classes = ["tile-day"];
                  if (date.toDateString() === new Date().toDateString()) {
                    classes.push("today");
                  }
                  const dateStr = shortDateFormat(date);
                  if (dateStr === selectedDateStr) {
                    classes.push("react-calendar__tile--active");
                  }
                  const attendance = percentageAttendance[dateStr];
                  const pct = attendance?.present_percentage;
                  if (pct !== undefined) {
                    if (pct >= 75) {
                      classes.push("high-attendance");
                    } else if (pct >= 50) {
                      classes.push("medium-attendance");
                    } else {
                      classes.push("low-attendance");
                    }
                  }
                  return classes.join(" ");
                }}
              />
            </Box>
          </Box>
        </Box>
        </Box>

          {/* Search and Student List */}
          <Box
            mt={3}
            sx={{
              backgroundColor: alpha(backgroundColor, 0.95),
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
            }}
          >
            <Stack mr={1} ml={1}>
              <Box
                mt="16px"
                mb={3}
                sx={{ padding: "0 10px" }}
                boxShadow="none"
              >
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
                    ref={inputRef}
                    value={searchWord}
                    sx={{
                      flex: 1,
                      mb: "0",
                      fontSize: "14px",
                      color: secondaryColor,
                      px: "16px",
                    }}
                    placeholder="Search student (Present / Absent)"
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
              </Box>

              {/* Student List Header */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "18px 24px",
                  borderBottom: `1px solid ${primaryColor}`,
                  bgcolor: "white",
                  borderRadius: "12px 12px 0 0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  background: `linear-gradient(180deg, ${alpha(backgroundColor, 0.95)} 0%, #ffffff 100%)`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography
                    sx={{
                      color: secondaryColor,
                      fontSize: "14px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
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
                <Box sx={attendanceColumnStyles}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography
                      sx={{
                        color: secondaryColor,
                        fontSize: "14px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      {t("LEARNER_APP.ATTENDANCE.ATTENDANCE_LABEL")}
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
                  <Box width="40px" />
                </Box>
              </Box>

              {/* Student List */}
              {displayStudentList.length > 0 ? (
                <Box
                  sx={{
                    backgroundColor: "white",
                    borderRadius: "0 0 12px 12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    overflow: "hidden",
                  }}
                >
                  {displayStudentList.map((user: any, index: number) => (
                    <Box
                      key={user.userId}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "18px 24px",
                        borderBottom: index < displayStudentList.length - 1
                          ? `1px solid ${alpha(primaryColor, 0.1)}`
                          : "none",
                        opacity: user.attendance ? 1 : 0.6,
                        borderLeft:
                          user.attendance?.toLowerCase() === "present"
                            ? `4px solid ${theme.palette.success.main}`
                            : user.attendance?.toLowerCase() === "absent"
                            ? `4px solid ${theme.palette.error.main}`
                            : "4px solid transparent",
                        "&:hover": {
                          backgroundColor: alpha(primaryColor, 0.08),
                          transform: "translateX(4px)",
                        },
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          color: secondaryColor,
                          fontWeight: 600,
                          fontSize: "16px",
                          letterSpacing: "0.2px",
                        }}
                      >
                        {user.name}
                      </Typography>
                      <Box sx={attendanceColumnStyles}>
                        {user.attendance?.toLowerCase() === "present" ? (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 12px",
                              borderRadius: "20px",
                              backgroundColor: "rgba(76, 175, 80, 0.1)",
                            }}
                          >
                            <CheckCircleIcon
                              sx={{
                                color: theme.palette.success.main,
                                fontSize: "26px",
                              }}
                            />
                            <Typography
                              sx={{
                                color: theme.palette.success.main,
                                fontSize: "13px",
                                fontWeight: 600,
                              }}
                            >
                              Present
                            </Typography>
                          </Box>
                        ) : user.attendance?.toLowerCase() === "absent" ? (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 12px",
                              borderRadius: "20px",
                              backgroundColor: "rgba(244, 67, 54, 0.1)",
                            }}
                          >
                            <CancelIcon
                              sx={{
                                color: theme.palette.error.main,
                                fontSize: "26px",
                              }}
                            />
                            <Typography
                              sx={{
                                color: theme.palette.error.main,
                                fontSize: "13px",
                                fontWeight: 600,
                              }}
                            >
                              Absent
                            </Typography>
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 12px",
                              borderRadius: "20px",
                              backgroundColor: "rgba(158, 158, 158, 0.1)",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#9e9e9e",
                                fontSize: "13px",
                                fontWeight: 500,
                                fontStyle: "italic",
                              }}
                            >
                              Not Marked
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ width: "40px" }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box
                  sx={{
                    textAlign: "center",
                    padding: "80px 40px",
                    backgroundColor: "white",
                    borderRadius: "0 0 12px 12px",
                  }}
                >
                  <Typography
                    color="textSecondary"
                    sx={{ fontSize: "18px", fontWeight: 500, color: alpha(secondaryColor, 0.6) }}
                  >
                    Attendance not marked for this date
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Box>
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

      <style jsx global>{`
        .high-attendance {
          background: rgba(76, 175, 80, 0.08) !important;
        }
        .medium-attendance {
          background: rgba(255, 152, 0, 0.08) !important;
        }
        .low-attendance {
          background: rgba(244, 67, 54, 0.08) !important;
        }
      `}</style>

      {/* Mark Attendance Modal */}
      {openMarkAttendance && (
        <MarkBulkAttendance
          open={openMarkAttendance}
          onClose={handleClose}
          classId={classId}
          selectedDate={selectedDate}
          onSaveSuccess={() => {
            fetchAttendanceForDate();
            fetchAttendanceStats();
          }}
          memberList={attendanceData.cohortMemberList}
          presentCount={attendanceData.presentCount}
          absentCount={attendanceData.absentCount}
          numberOfCohortMembers={attendanceData.numberOfCohortMembers}
          dropoutMemberList={attendanceData.dropoutMemberList}
          dropoutCount={attendanceData.dropoutCount}
          bulkStatus={attendanceData.bulkAttendanceStatus}
        />
      )}
    </Layout>
  );
};

const AttendanceHistoryPage = () => {
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
          Loading attendance history...
        </Box>
      }
    >
      <AttendanceHistoryPageContent />
    </Suspense>
  );
};

export default AttendanceHistoryPage;
