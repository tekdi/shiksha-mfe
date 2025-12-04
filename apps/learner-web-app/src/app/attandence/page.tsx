/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Divider,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Radio,
  styled,
  Tabs,
  Tab,
  IconButton,
} from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { alpha, useTheme } from "@mui/material/styles";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import {
  classesMissedAttendancePercentList,
  getAllCenterAttendance,
  getCohortAttendance,
  markAttendance,
  getLearnerAttendanceStatus,
} from "../../utils/API/services/AttendanceService";
import { ShowSelfAttendance } from "../../../app.config";
import { getCohortList, getCohortDetails } from "../../utils/API/services/CohortServices";
import { getMyCohortMemberList } from "../../utils/API/services/MyClassDetailsService";
import { getUserDetails } from "../../utils/API/services/ProfileService";
import { ICohort } from "@learner/utils/attendance/interfaces";
import {
  getTodayDate,
  shortDateFormat,
  filterMembersExcludingCurrentUser,
  isDateWithinPastDays,
  isTodayDate,
  getDayDifferenceFromToday,
} from "@learner/utils/attendance/helper";
import { ATTENDANCE_ENUM } from "@learner/utils/attendance/constants";
import { getContrastTextColor } from "@learner/utils/colorUtils";
import ModalComponent from "./components/ModalComponent";
import MarkBulkAttendance from "./components/MarkBulkAttendance";
import { showToastMessage } from "./toast";
import { fetchAttendanceDetails } from "./fetchAttendanceDetails";
import LocationModal from "./LocationModal";
import useGeolocation from "./useGeoLocation";
import { ensureAcademicYearForTenant } from "../../utils/API/ProgramService";
import Layout from "@learner/components/Layout";
import { AccountCircleOutlined } from "@mui/icons-material";
import ProfileMenu from "../../components/ProfileMenu/ProfileMenu";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import { usePathname } from "next/navigation";
import { gredientStyle } from "@learner/utils/style";
import { useTenant } from "@learner/context/TenantContext";
import { useTranslation } from "@shared-lib";
import LanguageDropdown from "@learner/components/LanguageDropdown/LanguageDropdown";

const DashboardContainer = styled(Box)<{ backgroundColor?: string }>(({ theme, backgroundColor }) => ({
  minHeight: "100vh",
  backgroundColor: backgroundColor || "var(--background-color, #f5f5f5)",
  marginRight: "20px",
  [theme.breakpoints.down("sm")]: {
    marginRight: "0",
  },
  [theme.breakpoints.between("sm", "md")]: {
    marginRight: "10px",
  },
}));

const MainContent = styled(Box)({
  display: "flex",
  justifyContent: "center",
});

const ContentWrapper = styled(Box)({
  paddingBottom: "25px",
  width: "100%",
  background: "linear-gradient(180deg, var(--background-color, #F5F5F5) 0%, rgba(255,255,255,0.9) 100%)",
  borderRadius: "8px",
});

const StatusCard = styled(Card)(({ theme }) => ({
  height: "100%",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  border: "1px solid rgba(0,0,0,0.08)",
  backgroundColor: "var(--surface-color, #FFFFFF)",
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
  },
  "& .MuiCardContent-root": {
    padding: "20px",
  },
}));

const CalendarContainer = styled(Box)(({ theme }) => ({
  marginTop: "20px",
  padding: "16px 20px",
  backgroundColor: "var(--surface-color, #FFFFFF)",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  [theme.breakpoints.down("md")]: {
    marginTop: "12px",
    padding: "12px 8px",
    borderRadius: "8px",
  },
  [theme.breakpoints.between("sm", "md")]: {
    padding: "14px 16px",
  },
}));

const HorizontalCalendarScroll = styled(Box)(({ theme }) => ({
  display: "flex",
  overflowX: "auto",
  gap: "8px",
  padding: "8px 0",
  [theme.breakpoints.down("sm")]: {
    gap: "6px",
    padding: "6px 0",
  },
  [theme.breakpoints.between("sm", "md")]: {
    gap: "7px",
  },
  "&::-webkit-scrollbar": {
    height: "4px",
  },
  "&::-webkit-scrollbar-track": {
    background: "var(--background-color, #F5F5F5)",
    borderRadius: "2px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "rgba(0,0,0,0.2)",
    borderRadius: "2px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: "rgba(0,0,0,0.3)",
  },
}));

const CalendarCell = styled(Box)(({ theme }) => ({
  position: "relative",
  height: "4rem",
  width: "3.5rem",
  minWidth: "3.5rem",
  padding: "6px",
  overflow: "hidden",
  fontSize: "0.875em",
  border: `2px solid var(--primary-color, ${(theme.palette.warning as any).A100 || "#FDBE16"})`,
  borderRadius: "8px",
  cursor: "pointer",
  backgroundColor: "var(--surface-color, #FFFFFF)",
  boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
  transition: "all 0.2s ease-out",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "center",
  [theme.breakpoints.down("sm")]: {
    height: "3rem",
    width: "2.5rem",
    minWidth: "2.5rem",
    padding: "4px",
    fontSize: "0.75em",
    borderRadius: "6px",
  },
  [theme.breakpoints.between("sm", "md")]: {
    height: "3.5rem",
    width: "3rem",
    minWidth: "3rem",
    padding: "5px",
    fontSize: "0.8em",
  },
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
    borderColor: `var(--primary-color, ${(theme.palette.warning as any).A200 || "#FDBE16"})`,
    backgroundColor: "var(--background-color, #F5F5F5)",
    [theme.breakpoints.down("md")]: {
      transform: "none",
    },
  },
}));

const DateNumber = styled(Typography)(({ theme }) => ({
  fontSize: "1em",
  fontWeight: "600",
  lineHeight: 1,
  marginTop: "2px",
  color: "var(--secondary-color, #1F1B13)",
  [theme.breakpoints.down("sm")]: {
    fontSize: "0.85em",
    marginTop: "1px",
  },
  [theme.breakpoints.between("sm", "md")]: {
    fontSize: "0.9em",
  },
}));

const MAX_BACKDATED_MARK_DAYS = 7;

const SimpleTeacherDashboard = () => {
  const theme = useTheme();
  const { tenant, contentFilter } = useTenant();
  const { t, language, setLanguage } = useTranslation();
  
  // Get tenant colors
  const primaryColor = contentFilter?.theme?.primaryColor || "#E6873C";
  const secondaryColor = contentFilter?.theme?.secondaryColor || "#1A1A1A";
  const backgroundColor = contentFilter?.theme?.backgroundColor || "#F5F5F5";
  const tenantIcon = contentFilter?.icon || "/logo.png";
  const tenantName = contentFilter?.title || tenant?.name || "Tenant";
  const tenantAlt = `${tenantName} logo`;
  
  const [classId, setClassId] = useState("");
  const [yearSelect, setYearSelect] = useState("");
  const [academicYearList, setAcademicYearList] = useState<Array<any>>([]);
  const [cohortsData, setCohortsData] = useState<Array<ICohort>>([]);
  const [centersData, setCentersData] = useState<Array<any>>([]);
  const [batchesData, setBatchesData] = useState<Array<any>>([]);
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isRemoteCohort, setIsRemoteCohort] = useState(false);
  const [cohortPresentPercentage, setCohortPresentPercentage] =
    useState("");
  const [lowAttendanceLearnerList, setLowAttendanceLearnerList] = useState<any>(
    ""
  );
  const [allCenterAttendanceData, setAllCenterAttendanceData] = useState<any>(
    []
  );
  const [startDateRange, setStartDateRange] = useState("");
  const [endDateRange, setEndDateRange] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [attendanceData, setAttendanceData] = useState({
    cohortMemberList: [],
    presentCount: 0,
    absentCount: 0,
    numberOfCohortMembers: 0,
    dropoutMemberList: [],
    dropoutCount: 0,
    bulkAttendanceStatus: "",
  });
  const [selfAttendanceData, setSelfAttendanceData] = useState<any[]>([]);
  const [selectedSelfAttendance, setSelectedSelfAttendance] = useState<
    string | null
  >(null);
  const [isSelfAttendanceModalOpen, setIsSelfAttendanceModalOpen] =
    useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [handleSaveHasRun, setHandleSaveHasRun] = useState(false);
  const [dayWiseAttendanceData, setDayWiseAttendanceData] = useState<{
    [date: string]: {
      presentCount: number;
      absentCount: number;
      totalCount: number;
      percentage: number;
    };
  }>({});
  const router = useRouter();
  const pathname = usePathname();
  const { getLocation } = useGeolocation();
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
  const isSelectedDateTodayValue = useMemo(
    () => isTodayDate(selectedDate),
    [selectedDate]
  );

  const showBackDateRestrictionMessage = () => {
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

  const showSelfAttendanceRestrictionMessage = () => {
    showToastMessage("Self attendance can only be marked for today's date.", "warning");
  };

  const today = new Date();
  const currentMonth = today.toLocaleString("default", {
    month: "long",
  });
  const currentYear = today.getFullYear();

  const handleModalToggle = () => {
    setOpen(!open);
  };

  const handleClose = () => {
    setOpen(false);
    setIsRemoteCohort(false);
  };

  const handleAttendanceDataUpdate = (data: any) => {
    console.log("[handleAttendanceDataUpdate] Updating attendance data:", {
      cohortMemberListLength: data?.cohortMemberList?.length || 0,
      presentCount: data?.presentCount || 0,
      absentCount: data?.absentCount || 0,
      numberOfCohortMembers: data?.numberOfCohortMembers || 0,
      dataKeys: Object.keys(data || {}),
      sampleData: data?.cohortMemberList?.slice(0, 2) || [],
    });
    // Use functional update to ensure we're setting the complete data object
    setAttendanceData((prevData) => {
      const newData = {
        cohortMemberList: data?.cohortMemberList || [],
        presentCount: data?.presentCount || 0,
        absentCount: data?.absentCount || 0,
        numberOfCohortMembers: data?.numberOfCohortMembers || 0,
        dropoutMemberList: data?.dropoutMemberList || [],
        dropoutCount: data?.dropoutCount || 0,
        bulkAttendanceStatus: data?.bulkAttendanceStatus || "",
      };
      console.log("[handleAttendanceDataUpdate] Setting new state:", {
        cohortMemberListLength: newData.cohortMemberList.length,
        presentCount: newData.presentCount,
        absentCount: newData.absentCount,
      });
      return newData;
    });
    console.log("[handleAttendanceDataUpdate] State update queued");
  };

  const handleRemoteSession = async () => {
    if (!isSelectedDateWithinAllowedWindow) {
      showBackDateRestrictionMessage();
      return;
    }
    try {
      const teacherApp = JSON.parse(
        localStorage.getItem("teacherApp") ?? "null"
      );
      const cohort = teacherApp?.state?.cohorts?.find?.(
        (c: any) => c.cohortId === classId
      );
      const REMOTE_COHORT_TYPE = "REMOTE" as const;

      if (cohort?.cohortType === REMOTE_COHORT_TYPE) {
        setIsRemoteCohort(true);
      } else {
        // Fetch cohort member list for the selected date before opening modal
        if (classId && selectedDate && classId !== "all") {
          try {
            // Reset attendance data before fetching new data
            setAttendanceData({
              cohortMemberList: [],
              presentCount: 0,
              absentCount: 0,
              numberOfCohortMembers: 0,
              dropoutMemberList: [],
              dropoutCount: 0,
              bulkAttendanceStatus: "",
            });
            
            console.log("[handleRemoteSession] Fetching cohort member list for:", {
              classId,
              selectedDate,
            });

            const limit = 300;
            const page = 0;
            const filters = { cohortId: classId };
            const response = await getMyCohortMemberList({
              limit,
              page,
              filters,
              includeArchived: true,
            });

            console.log("[handleRemoteSession] Cohort member list API response:", {
              hasResponse: !!response,
              hasResult: !!response?.result,
              userDetailsCount: response?.result?.userDetails?.length || 0,
              responseStructure: Object.keys(response || {}),
            });

            const resp = response?.result?.userDetails || response?.data?.result?.userDetails || [];
            const filteredResp = filterMembersExcludingCurrentUser(resp);
            
            if (filteredResp && filteredResp.length > 0) {
              console.log("[handleRemoteSession] Processing members:", filteredResp.length);
              
              const nameUserIdArray = filteredResp
                ?.map((entry: any) => ({
                  userId: entry.userId,
                  name:
                    `${entry.firstName || ""} ${entry.lastName || ""}`.trim() ||
                    entry.firstName ||
                    entry.lastName ||
                    "",
                  memberStatus: entry.status,
                  createdAt: entry.createdAt,
                  updatedAt: entry.updatedAt,
                  userName: entry.username,
                }))
                .filter((member: any) => {
                  try {
                    // For older dates, show members based on their status:
                    // - ACTIVE members: always show (they exist now, so they existed on older dates too)
                    // - ARCHIVED/DROPOUT: only show if they were archived/dropped out AFTER the selected date
                    
                    if (member.memberStatus === "ACTIVE") {
                      // Active members should always be shown
                      return true;
                    }
                    
                    // For ARCHIVED or DROPOUT members, check if they were archived/dropped out after the selected date
                    if (member.memberStatus === "ARCHIVED" || member.memberStatus === "DROPOUT") {
                      if (!member.updatedAt) {
                        // If no updatedAt, include to be safe
                        console.warn("[handleRemoteSession] Member has no updatedAt:", member);
                        return true;
                      }
                      
                      const updatedAt = new Date(member.updatedAt);
                      const currentDate = new Date(selectedDate);
                      
                      if (isNaN(updatedAt.getTime()) || isNaN(currentDate.getTime())) {
                        console.warn("[handleRemoteSession] Invalid date for member:", {
                          userId: member.userId,
                          name: member.name,
                          updatedAt: member.updatedAt,
                          selectedDate,
                        });
                        return true; // Include on error
                      }
                      
                      updatedAt.setHours(0, 0, 0, 0);
                      currentDate.setHours(0, 0, 0, 0);
                      
                      // Include if archived/dropped out AFTER the selected date (they were active on that date)
                      const wasArchivedAfterDate = updatedAt > currentDate;
                      return wasArchivedAfterDate;
                    }
                    
                    // For any other status, include by default
                    return true;
                  } catch (error) {
                    console.error("[handleRemoteSession] Error filtering member:", error, member);
                    // On error, include the member to be safe
                    return true;
                  }
                });

              console.log("[handleRemoteSession] Filtered members for date:", {
                selectedDate,
                totalMembers: resp.length,
                filteredMembers: nameUserIdArray.length,
                sampleMembers: nameUserIdArray.slice(0, 3).map(m => ({
                  name: m.name,
                  status: m.memberStatus,
                  createdAt: m.createdAt,
                })),
              });

              if (nameUserIdArray && nameUserIdArray.length > 0 && selectedDate && classId) {
                console.log("[handleRemoteSession] Calling fetchAttendanceDetails");
                // Convert Date to string format for fetchAttendanceDetails
                const selectedDateStr =
                  typeof selectedDate === "string"
                    ? selectedDate
                    : shortDateFormat(selectedDate);
                await fetchAttendanceDetails(
                  nameUserIdArray,
                  selectedDateStr,
                  classId,
                  handleAttendanceDataUpdate
                );
                console.log("[handleRemoteSession] Attendance details fetched successfully");
                // Wait a bit to ensure state update is applied
                await new Promise(resolve => setTimeout(resolve, 200));
                console.log("[handleRemoteSession] Opening modal with updated data");
              } else {
                console.warn("[handleRemoteSession] No members to fetch attendance for:", {
                  nameUserIdArrayLength: nameUserIdArray?.length || 0,
                  selectedDate,
                  classId,
                });
              }
            } else {
              console.warn("[handleRemoteSession] No members found in response:", {
                responseKeys: Object.keys(response || {}),
                hasResult: !!response?.result,
                hasData: !!response?.data,
              });
            }
          } catch (error) {
            console.error("[handleRemoteSession] Error fetching cohort member list:", error);
          }
        }
        // Open modal after data is fetched and state is updated
        handleModalToggle();
      }
    } catch (error) {
      console.error("Error parsing teacher app data:", error);
      handleModalToggle();
    }
  };

  const handleMarkAttendanceClick = () => {
    if (!isSelectedDateWithinAllowedWindow) {
      showBackDateRestrictionMessage();
      return;
    }
    handleRemoteSession();
  };


  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTenantId = localStorage.getItem("tenantId");
      // Check if academicYearList already exists in localStorage
      const existingAcademicYearList = JSON.parse(
        localStorage.getItem("academicYearList") || "[]"
      );
      if (existingAcademicYearList.length > 0) {
        setAcademicYearList(existingAcademicYearList);
        const activeYear = existingAcademicYearList.find(
          (year: any) => year.isActive
        );
        if (activeYear) {
          setYearSelect(activeYear.name);
        }
      } else if (storedTenantId) {
        ensureAcademicYearForTenant(storedTenantId).then(() => {
          const academicYearListData = JSON.parse(
            localStorage.getItem("academicYearList") || "[]"
          );
          setAcademicYearList(academicYearListData);
          const activeYear = academicYearListData.find(
            (year: any) => year.isActive
          );
          if (activeYear) {
            setYearSelect(activeYear.name);
          }
        });
      }
      setFirstName(localStorage.getItem("firstName") || "");
    }
    const initializeDashboard = async () => {
      if (typeof window !== "undefined" && window.localStorage) {
        const token = localStorage.getItem("token");
        const storedUserId = localStorage.getItem("userId");
        if (token) {
          await fetchUserCohorts(storedUserId);
        } else {
          router.push("/login");
        }
      }
    };

    initializeDashboard();
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
        
        console.log("Unique parent IDs:", uniqueParentIds);
        
        // Fetch hierarchy data for each unique parent ID
        const centersWithHierarchy = await Promise.all(
          uniqueParentIds.map(async (parentId: any) => {
            try {
              // Call cohortHierarchy API with the parent ID
              const hierarchyData = await getCohortDetails(parentId, {
                children: "true",
                customField: "true",
              });
              
              console.log(`Hierarchy data for ${parentId}:`, hierarchyData);
              
              // The API returns an array, get the first item
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
        
        // Filter out null values (failed requests)
        const validCenters = centersWithHierarchy.filter((center) => center !== null);
        
        setCentersData(validCenters);
        
        if (validCenters.length > 0) {
          const defaultCenter = validCenters[0];
          setSelectedCenterId(defaultCenter.centerId);

          // Batches/classes should come ONLY from myCohorts response
          const batches = response
            .filter(
              (item: any) =>
                item.type === "COHORT" &&
                item.parentId === defaultCenter.centerId &&
                item.cohortStatus === "active"
            )
            .map((item: any) => ({
              batchId: item.cohortId,
              batchName: item.cohortName,
              parentId: item.parentId,
            }));

          console.log("Batches for default center (from myCohorts):", batches);
          setBatchesData(batches);

          // Set default batch if available
          if (batches.length > 0) {
            setClassId(batches[0].batchId);
          } else {
            setClassId("");
          }
        } else {
          // If no hierarchy data, use direct cohorts from response
          const directCohorts = response.filter(
            (item: any) => item.type === "COHORT"
          );
          if (directCohorts.length > 0) {
            // Group cohorts by parentId
            const cohortsByParent: any = {};
            directCohorts.forEach((cohort: any) => {
              if (!cohortsByParent[cohort.parentId]) {
                cohortsByParent[cohort.parentId] = [];
              }
              cohortsByParent[cohort.parentId].push(cohort);
            });
            
            // Create centers from parent IDs
            const fallbackCenters = Object.keys(cohortsByParent).map((parentId) => ({
              centerId: parentId,
              centerName: `Center ${parentId.substring(0, 8)}`,
              childData: cohortsByParent[parentId],
              hierarchyData: null,
            }));
            
            setCentersData(fallbackCenters);
            
            if (fallbackCenters.length > 0) {
              const defaultCenter = fallbackCenters[0];
              setSelectedCenterId(defaultCenter.centerId);
              
              const batches = defaultCenter.childData.map((batch: any) => ({
                batchId: batch.cohortId,
                batchName: batch.cohortName,
                parentId: batch.parentId,
              }));
              setBatchesData(batches);
              
              if (batches.length > 0) {
                setClassId(batches[0].batchId);
              }
            }
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

    // Batches/classes should come ONLY from myCohorts response
    const batches = cohortsData
      .filter(
        (item: any) =>
          item.type === "COHORT" &&
          item.parentId === centerId &&
          item.cohortStatus === "active"
      )
      .map((item: any) => ({
        batchId: item.cohortId,
        batchName: item.cohortName,
        parentId: item.parentId,
      }));

    console.log("Batches for selected center (from myCohorts):", batches);

    setBatchesData(batches);

    if (batches.length > 0) {
      setClassId(batches[0].batchId);
    } else {
      setClassId("");
    }
  };

  const handleBatchChange = (event: any) => {
    const batchId = event.target.value;
    setClassId(batchId);
  };

  useEffect(() => {
    const calculateDateRange = () => {
      const endRangeDate = new Date();
      endRangeDate.setHours(23, 59, 59, 999);
      const startRangeDate = new Date(endRangeDate);
      startRangeDate.setDate(startRangeDate.getDate() - 6);
      startRangeDate.setHours(0, 0, 0, 0);

      const startDay = startRangeDate.getDate();
      const startDayMonth = startRangeDate.toLocaleString("default", {
        month: "long",
      });
      const endDay = endRangeDate.getDate();
      const endDayMonth = endRangeDate.toLocaleString("default", {
        month: "long",
      });

      if (startDayMonth === endDayMonth) {
        setDateRange(`(${startDay}-${endDay} ${endDayMonth})`);
      } else {
        setDateRange(`(${startDay} ${startDayMonth}-${endDay} ${endDayMonth})`);
      }

      const formattedStartDate = shortDateFormat(startRangeDate);
      const formattedEndDate = shortDateFormat(endRangeDate);
      setStartDateRange(formattedStartDate);
      setEndDateRange(formattedEndDate);
    };

    calculateDateRange();
  }, []);

  const getCurrentAttendanceStatusValue = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    if (selected > today) {
      return "futureDate";
    }

    const isAttendanceMarked =
      attendanceData.presentCount > 0 || attendanceData.absentCount > 0;

    return isAttendanceMarked ? "marked" : "notMarked";
  };

  const currentAttendance = getCurrentAttendanceStatusValue();

  const fetchSelfAttendance = async () => {
    if (!classId || classId === "all") return;

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const limit = 300;
      const page = 0;

      let filters = {
        contextId: classId,
        userId: userId,
        scope: "self",
        toDate: selectedDate,
        fromDate: selectedDate,
      };

      let response = await getLearnerAttendanceStatus({
        limit,
        page,
        filters,
      });

      if (
        !response?.data?.attendanceList ||
        response.data.attendanceList.length === 0
      ) {
        filters = {
          ...filters,
          scope: "student",
        };
        response = await getLearnerAttendanceStatus({
          limit,
          page,
          filters,
        });
      }

      if (response?.data?.attendanceList) {
        if (response.data.attendanceList.length > 0) {
          setSelfAttendanceData(response.data.attendanceList);
          const attendanceValue = response.data.attendanceList[0]?.attendance;
          setSelectedSelfAttendance(
            attendanceValue ? attendanceValue.toLowerCase() : null
          );
        } else {
          setSelfAttendanceData([]);
          setSelectedSelfAttendance(null);
        }
      }
    } catch (error) {
      console.error("Error fetching self attendance:", error);
      setSelfAttendanceData([]);
      setSelectedSelfAttendance(null);
    }
  };

  const requestLocationPermission = () => {
    if (!isSelectedDateTodayValue) {
      showSelfAttendanceRestrictionMessage();
      return;
    }
    if (!navigator.geolocation) {
      showToastMessage("Geolocation is not supported by your browser", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocationModalOpen(false);
        const currentAttendance = selfAttendanceData?.[0]?.attendance;
        setSelectedSelfAttendance(
          currentAttendance ? currentAttendance.toLowerCase() : null
        );
        setIsSelfAttendanceModalOpen(true);
      },
      (error) => {
        console.error("Error getting location:", error);
        showToastMessage(
          "Failed to get location. Please enable location services.",
          "error"
        );
        setIsLocationModalOpen(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSelfAttendanceButtonClick = () => {
    if (!isSelectedDateTodayValue) {
      showSelfAttendanceRestrictionMessage();
      return;
    }
    setIsLocationModalOpen(true);
  };

  const handleMarkSelfAttendance = async () => {
    if (!selectedSelfAttendance) return;
    if (!isTodayDate(selectedDate)) {
      showSelfAttendanceRestrictionMessage();
      return;
    }

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        showToastMessage("User ID not found", "error");
        return;
      }

      const locationData = await getLocation(true);

      const data: any = {
        userId: userId,
        attendance: selectedSelfAttendance?.toLowerCase(),
        attendanceDate: selectedDate,
        contextId: classId,
        scope: "self",
        context: "cohort",
        absentReason: "",
        lateMark: true,
        validLocation: false,
      };

      if (locationData) {
        data.latitude = locationData.latitude;
        data.longitude = locationData.longitude;
      }
      const response = await markAttendance(data);

      if (
        (response?.responseCode === 200 || response?.responseCode === 201) &&
        response?.params?.status === "successful"
      ) {
        const successMessage =
          response?.params?.successmessage || "Attendance marked successfully";
        showToastMessage(successMessage, "success");
        setIsSelfAttendanceModalOpen(false);
        setSelectedSelfAttendance(null);

        if (response?.data?.attendance) {
          const attendanceValue = response.data.attendance.toLowerCase();
          setSelectedSelfAttendance(attendanceValue);

          const updatedSelfAttendance = [
            {
              attendance: response.data.attendance,
              attendanceDate: response.data.attendanceDate,
              ...response.data,
            },
          ];
          setSelfAttendanceData(updatedSelfAttendance);
        }

        await fetchSelfAttendance();
        fetchAttendanceData();
      } else if (response?.responseCode === 400 || response?.params?.err) {
        const errorMessage =
          response?.params?.errmsg ||
          response?.params?.err ||
          "Something went wrong";
        showToastMessage(errorMessage, "error");
      } else {
        showToastMessage("Something went wrong", "error");
      }
    } catch (error) {
      console.error("Error marking self attendance:", error);
      showToastMessage("Something went wrong", "error");
    }
  };

  useEffect(() => {
    if (classId && classId !== "all") {
      fetchAttendanceData();
      fetchDayWiseAttendanceData();
      if (ShowSelfAttendance) {
        fetchSelfAttendance();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, selectedDate, startDateRange, endDateRange, handleSaveHasRun]);

  const fetchDayWiseAttendanceData = async () => {
    if (!classId || classId === "all") return;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(classId)) {
      console.warn(
        "fetchDayWiseAttendanceData: Invalid UUID format for classId:",
        classId
      );
      return;
    }

    try {
      const calendarDays = generateCalendarData();
      if (calendarDays.length === 0) return;

      const firstDate = calendarDays[calendarDays.length - 1].dateString;
      const lastDate = calendarDays[0].dateString;

      const cohortAttendanceData: any = {
        limit: 1000,
        page: 0,
        filters: {
          scope: "student",
          fromDate: firstDate,
          toDate: lastDate,
          contextId: classId,
        },
        facets: ["attendanceDate"],
        sort: ["present_percentage", "asc"],
      };

      const response = await getCohortAttendance(cohortAttendanceData);
      const attendanceDateData = response?.data?.result?.attendanceDate || {};

      const processedData: {
        [date: string]: {
          presentCount: number;
          absentCount: number;
          totalCount: number;
          percentage: number;
        };
      } = {};

      const limit = 300;
      const page = 0;
      const filters = { cohortId: classId };
      const memberResponse = await getMyCohortMemberList({
        limit,
        page,
        filters,
        includeArchived: true,
      });
      const members = memberResponse?.result?.userDetails || [];
      const filteredMembers = filterMembersExcludingCurrentUser(members);
      const totalMembers = filteredMembers.length;

      Object.keys(attendanceDateData).forEach((dateStr) => {
        const dateData = attendanceDateData[dateStr];
        const present = dateData.present || 0;
        const absent = dateData.absent || 0;
        const total = present + absent;
        const percentage =
          totalMembers > 0 ? (present / totalMembers) * 100 : 0;

        processedData[dateStr] = {
          presentCount: present,
          absentCount: absent,
          totalCount: total,
          percentage: Math.round(percentage),
        };
      });

      setDayWiseAttendanceData(processedData);
    } catch (error) {
      console.error("Error fetching day-wise attendance data:", error);
    }
  };

  const fetchAttendanceData = async () => {
    if (!classId) return;

    setLoading(true);
    try {
      if (classId !== "all") {
        await fetchSingleCenterAttendance();
      } else {
        await fetchAllCentersAttendance();
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleCenterAttendance = async () => {
    try {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(classId)) {
        console.warn(
          "fetchAttendanceData: Invalid UUID format for classId:",
          classId
        );
        return;
      }

      const limit = 300;
      const page = 0;
      const filters = { cohortId: classId };
      const response = await getMyCohortMemberList({
        limit,
        page,
        filters,
        includeArchived: true,
      });

      const resp = response?.result?.userDetails || [];
      const filteredResp = filterMembersExcludingCurrentUser(resp);
      if (filteredResp.length > 0) {
        const nameUserIdArray = filteredResp
          ?.map((entry: any) => ({
            userId: entry.userId,
            name:
              `${entry.firstName || ""} ${entry.lastName || ""}`.trim() ||
              entry.firstName ||
              entry.lastName ||
              "",
            memberStatus: entry.status,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
            userName: entry.username,
          }))
          .filter((member: any) => {
            const updatedAt = new Date(member.updatedAt);
            updatedAt.setHours(0, 0, 0, 0);
            const currentDate = new Date(selectedDate);
            currentDate.setHours(0, 0, 0, 0);

            if (
              member.memberStatus === "ARCHIVED" 
            ) {
             return updatedAt > currentDate
            }
            return true;
          });

        if (nameUserIdArray && selectedDate && classId) {
          await fetchAttendanceDetails(
            nameUserIdArray,
            selectedDate,
            classId,
            handleAttendanceDataUpdate
          );
        }

        const fromDate = startDateRange;
        const toDate = endDateRange;
        const attendanceFilters = {
          contextId: classId,
          fromDate,
          toDate,
          scope: "student",
        };

        const attendanceResponse = await classesMissedAttendancePercentList({
          filters: attendanceFilters,
          facets: ["userId"],
          sort: ["absent_percentage", "asc"],
        });
        const attendanceData = attendanceResponse?.data?.result?.userId;
        if (attendanceData) {
          const filteredData = Object.keys(attendanceData).map((userId) => ({
            userId,
            absent: attendanceData[userId].absent,
            present_percent: attendanceData[userId].present_percentage,
          }));

          let mergedArray = filteredData.map((attendance) => {
            const user = nameUserIdArray.find(
              (user: { userId: string }) => user.userId === attendance.userId
            );
            return Object.assign({}, attendance, {
              name: user ? user.name : "Unknown",
            });
          });

          mergedArray = mergedArray.filter((item) => item.name !== "Unknown");

          const LOW_ATTENDANCE_THRESHOLD = 75;
          const studentsWithLowestAttendance = mergedArray.filter((user) => {
            const hasAbsence = user.absent && user.absent > 0;
            const percentNum = parseFloat(user.present_percent || "0");
            const isLowAttendance = percentNum < LOW_ATTENDANCE_THRESHOLD;
            return (
              hasAbsence &&
              (isLowAttendance || user.present_percent === undefined)
            );
          });

          if (studentsWithLowestAttendance.length) {
            const namesOfLowestAttendance = studentsWithLowestAttendance.map(
              (student) => student.name
            );
            setLowAttendanceLearnerList(namesOfLowestAttendance);
          } else {
            setLowAttendanceLearnerList([]);
          }
        }

        const cohortAttendanceData: any = {
          limit: 1000,
          page: 0,
          filters: {
            scope: "student",
            fromDate: startDateRange,
            toDate: endDateRange,
            contextId: classId,
          },
          facets: ["contextId"],
          sort: ["present_percentage", "asc"],
        };

        const cohortRes = await getCohortAttendance(cohortAttendanceData);
        const cohortResponse = cohortRes?.data?.result;
        const contextData = cohortResponse?.contextId?.[classId];

        if (contextData?.present_percentage) {
          const presentPercent = parseFloat(contextData.present_percentage);
          const percentageString = presentPercent.toFixed(1);
          setCohortPresentPercentage(percentageString);
        } else if (contextData?.absent_percentage) {
          setCohortPresentPercentage("0");
        } else {
          setCohortPresentPercentage(t("LEARNER_APP.ATTENDANCE.NO_ATTENDANCE"));
        }
      }
    } catch (error) {
      console.error("Error fetching single center attendance:", error);
    }
  };

  const fetchAllCentersAttendance = async () => {
    try {
      const cohortIds = cohortsData.map((cohort) => cohort.cohortId);
      const limit = 300;
      const page = 0;
      const facets = ["contextId"];

      const fetchPromises = cohortIds.map(async (cohortId) => {
        const filters = {
          fromDate: startDateRange,
          toDate: endDateRange,
          scope: "student",
          contextId: cohortId,
        };

        try {
          const response = await getAllCenterAttendance({
            limit,
            page,
            filters,
            facets,
          });
          return { cohortId, data: response?.data?.result };
        } catch (error) {
          console.error(`Error fetching data for cohortId ${cohortId}:`, error);
          return { cohortId, error };
        }
      });

      const results = await Promise.all(fetchPromises);
      const nameIDAttendanceArray = results
        .filter((result) => !result?.error && result?.data?.contextId)
        .map((result) => {
          const cohortId = result?.cohortId;
          const contextData = result?.data?.contextId[cohortId] || {};
          const presentPercentage = contextData.present_percentage || null;
          const absentPercentage = contextData?.absent_percentage
            ? 100 - contextData?.absent_percentage
            : null;
          const percentage = presentPercentage || absentPercentage;

          const cohortItem = cohortsData.find(
            (cohort) => cohort?.cohortId === cohortId
          );

          return {
            userId: cohortId,
            name: cohortItem ? cohortItem.name : null,
            presentPercentage: percentage ? percentage.toFixed(1) : null,
          };
        })
        .filter((item) => item.presentPercentage !== null);

      setAllCenterAttendanceData(nameIDAttendanceArray);
    } catch (error) {
      console.error("Error fetching all centers attendance:", error);
    }
  };

  const generateCalendarData = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const days = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      if (date <= today) {
        const dayName = ["S", "M", "T", "W", "T", "F", "S"][date.getDay()];
        const dateStr = shortDateFormat(date);
        days.push({
          date: date.getDate(),
          day: dayName,
          fullDate: date,
          dateString: dateStr,
          isToday: i === 0,
        });
      }
    }

    return days;
  };

  const calendarDays = generateCalendarData();

  const handleDateClick = (dateString: string) => {
    setSelectedDate(dateString);
  };

  const handleCalendarClick = () => {
    if (classId && classId !== "all") {
      router.push(`/attendance-history?classId=${classId}`);
    } else {
      router.push("/attendance-history");
    }
  };

  const handlePreviousMonth = () => {
    handleCalendarClick();
  };

  const handleNextMonth = () => {
    handleCalendarClick();
  };

  const handleChangeYear = (event: any) => {
    setYearSelect(event.target.value);
  };

  const handleSaveSuccess = (isModified?: boolean) => {
    if (isModified) {
      showToastMessage("Attendance modified successfully", "success");
    } else {
      showToastMessage("Attendance marked successfully", "success");
    }
    setHandleSaveHasRun(!handleSaveHasRun);
    handleClose();
  };

  const localT = (key: string) => {
    const translations: { [key: string]: string } = {
      "COMMON.MARK_CENTER_ATTENDANCE": "Mark Center Attendance",
      "COMMON.CANCEL": "Cancel",
      "COMMON.YES_MANUALLY": "Yes, Manually",
      "COMMON.ARE_YOU_SURE_MANUALLY":
        "Are you sure you want to manually mark attendance?",
      "COMMON.ATTENDANCE_IS_USUALLY":
        "Attendance is usually marked automatically for remote cohorts.",
      "COMMON.USE_MANUAL":
        "Use manual marking only if automatic attendance failed.",
      "COMMON.NOTE_MANUALLY":
        "Note: Manual attendance will override automatic attendance.",
    };
    // Try to use the translation from useTranslation first, fallback to local translations
    const translated = t(key);
    if (translated !== key) {
      return translated;
    }
    return translations[key] || key;
  };
  const clickAttendanceOverview = () => {
    if (classId && classId !== "all") {
      router.push(`/attendance-overview?classId=${classId}`);
    } else {
      router.push("/attendance-overview");
    }
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
      case "myClasses":
        router.push("/my-classes");
        break;
      default:
        break;
    }
  };

  console.log("centersData",centersData);

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
            {/* <Select
              value={yearSelect || ""}
              onChange={handleChangeYear}
              size="small"
              displayEmpty
              sx={{
                backgroundColor: "#FFFFFF",
                borderRadius: "999px",
                minWidth: 160,
                fontWeight: 500,
                color: secondaryColor,
                border: `1px solid ${alpha(secondaryColor, 0.2)}`,
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  py: 0.75,
                  color: secondaryColor,
                },
                "& .MuiSvgIcon-root": {
                  color: secondaryColor,
                },
              }}
            >
              {academicYearList.length === 0 ? (
                <MenuItem value="" disabled sx={{ color: alpha(secondaryColor, 0.6) }}>
                  {t("COMMON.LOADING") || "Loading..."}
                </MenuItem>
              ) : (
                academicYearList.map((year: any) => (
                  <MenuItem key={year.id} value={year.name} sx={{ color: secondaryColor }}>
                    {year.name}
                    {year.isActive && (
                      <span style={{ color: primaryColor, marginLeft: "6px" }}>
                        ({t("COMMON.ACTIVE") || "Active"})
                      </span>
                    )}
                  </MenuItem>
                ))
              )}
            </Select> */}
          </Box>
        </Box>
        <Box sx={{ px: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}>
          <Tabs
            value="attendance"
            onChange={handleTopTabChange}
            aria-label="Dashboard Tabs"
            sx={{
              "& .MuiTab-root": {
                color: secondaryColor,
                "&.Mui-selected": {
                  color: primaryColor,
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: primaryColor,
              },
            }}
          >
            <Tab label={t("LEARNER_APP.COMMON.COURSES")} value="Course" />
            <Tab label={t("LEARNER_APP.COMMON.CONTENT")} value="content" />
            <Tab label={t("LEARNER_APP.COMMON.GROUPS")} value="groups" />
            <Tab label={t("LEARNER_APP.COMMON.ATTENDANCE")} value="attendance" />
            <Tab label={t("LEARNER_APP.COMMON.MY_CLASSES") || "My Classes"} value="myClasses" />
          </Tabs>
          <Grid container style={gredientStyle}>
          <Grid item xs={12}>
            <DashboardContainer backgroundColor={backgroundColor}>
              <MainContent>
                <ContentWrapper>
          <Box>
            <Box
              display={"flex"}
              flexDirection={"column"}
              padding={{ xs: "1rem 1rem 1rem 1rem", md: "2rem 2.5rem 1.5rem 1.5rem" }}
              sx={{
                backgroundColor: alpha(backgroundColor, 0.95),
                borderRadius: "12px 12px 0 0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <Box
                display={"flex"}
                flexDirection={{ xs: "column", md: "row" }}
                justifyContent={"space-between"}
                alignItems={{ xs: "flex-start", md: "center" }}
                marginBottom={"16px"}
                marginRight={{ xs: 0, md: "25px" }}
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
                </Box>

                <Box
                  display={"flex"}
                  sx={{
                    cursor: "pointer",
                    color: theme.palette.secondary.main,
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
                  onClick={handleCalendarClick}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCalendarClick();
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCalendarClick();
                    }}
                  />
                </Box>
              </Box>

              <CalendarContainer>
                <HorizontalCalendarScroll>
                  {calendarDays.map((dayData, index) => {
                    const dateAttendance =
                      dayWiseAttendanceData[dayData.dateString] || null;
                    const isSelected = dayData.dateString === selectedDate;
                    const isMarked =
                      dateAttendance && dateAttendance.totalCount > 0;
                    const attendancePercentage =
                      dateAttendance?.percentage || 0;

                    const currentDate = new Date();
                    currentDate.setHours(0, 0, 0, 0);
                    const dayDate = new Date(dayData.fullDate);
                    dayDate.setHours(0, 0, 0, 0);
                    const isToday =
                      dayDate.getTime() === currentDate.getTime();

                    return (
                      <Box
                        key={index}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "2px",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: { xs: "0.65em", sm: "0.7em", md: "0.75em" },
                            fontWeight: "700",
                            color: isToday ? primaryColor : secondaryColor,
                            lineHeight: 1,
                            marginBottom: { xs: "2px", md: "4px" },
                            textTransform: "uppercase",
                            letterSpacing: { xs: "0.3px", md: "0.5px" },
                          }}
                        >
                          {isToday ? t("LEARNER_APP.ATTENDANCE.TODAY") : dayData.day}
                        </Typography>
                        <CalendarCell
                          onClick={() => handleDateClick(dayData.dateString)}
                          sx={{
                            backgroundColor: isSelected
                              ? primaryColor
                              : isToday
                              ? alpha(backgroundColor, 0.95)
                              : "#fff",
                            borderColor: isSelected
                              ? primaryColor
                              : isToday
                              ? primaryColor
                              : alpha(primaryColor, 0.3),
                            borderWidth: isSelected || isToday ? "2px" : "1px",
                          }}
                        >
                          <DateNumber
                            variant="body2"
                            sx={{
                              color: isSelected
                                ? getContrastTextColor(primaryColor)
                                : secondaryColor,
                            }}
                          >
                            {dayData.date}
                          </DateNumber>
                          {isMarked ? (
                            <Box
                              sx={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: { xs: "16px", sm: "18px", md: "20px" },
                                height: { xs: "16px", sm: "18px", md: "20px" },
                                marginTop: { xs: "1px", md: "2px" },
                              }}
                            >
                              <CircularProgress
                                variant="determinate"
                                value={attendancePercentage}
                                size={20}
                                thickness={10}
                                sx={{
                                  color: secondaryColor,
                                  position: "absolute",
                                  width: { xs: "16px", sm: "18px", md: "20px" },
                                  height: { xs: "16px", sm: "18px", md: "20px" },
                                  "& .MuiCircularProgress-circle": {
                                    strokeLinecap: "round",
                                    stroke: secondaryColor,
                                  },
                                }}
                              />
                            </Box>
                          ) : null}
                        </CalendarCell>
                      </Box>
                    );
                  })}
                </HorizontalCalendarScroll>
              </CalendarContainer>
            </Box>

            <Box sx={{ padding: { xs: "0 10px", sm: "0 15px", md: "0 20px" } }}>
              <Divider sx={{ borderBottomWidth: "0.1rem" }} />
            </Box>
          </Box>
          {/* Attendance Summary Cards - Two Cards Side by Side */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              margin: { xs: "15px 10px", md: "20px 35px 20px 25px" },
              flexWrap: { xs: "wrap", md: "nowrap" },
            }}
          >
          <Box
            height={"auto"}
            flex={1}
            minWidth={{ xs: "100%", md: 0 }}
            padding={{ xs: "1rem 1.5rem", md: "1.5rem 2rem" }}
            borderRadius={"16px"}
            bgcolor={alpha(backgroundColor, 0.8)}
            textAlign={"left"}
            sx={{
              opacity: classId === "all" ? 0.5 : 1,
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
              transition: "transform 0.2s, box-shadow 0.2s",
              background: `linear-gradient(135deg, ${alpha(backgroundColor, 0.8)} 0%, ${backgroundColor} 100%)`,
              "&:hover": {
                transform: { xs: "none", md: "translateY(-3px)" },
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              },
            }}
            justifyContent={"space-between"}
            display={"flex"}
            flexDirection={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            gap={{ xs: 2, sm: 0 }}
          >
              <Box display="flex" alignItems="center" gap="12px">
                {currentAttendance !== "notMarked" &&
                  currentAttendance !== "futureDate" && (
                    <>
                      <Box sx={{ width: { xs: "24px", sm: "28px", md: "30px" }, height: { xs: "24px", sm: "28px", md: "30px" } }}>
                        <CircularProgressbar
                          value={
                            attendanceData?.numberOfCohortMembers &&
                            attendanceData.numberOfCohortMembers !== 0
                              ? (attendanceData.presentCount /
                                  attendanceData.numberOfCohortMembers) *
                                100
                              : 0
                          }
                          styles={buildStyles({
                            pathColor: primaryColor,
                            trailColor: alpha(secondaryColor, 0.15),
                            strokeLinecap: "round",
                            backgroundColor: alpha(backgroundColor, 0.5),
                          })}
                          strokeWidth={20}
                          background
                          backgroundPadding={6}
                        />
                      </Box>
                      <Box>
                        <Typography
                          sx={{
                            fontSize: { xs: "12px", sm: "13px", md: "14px" },
                            fontWeight: "700",
                            color: secondaryColor,
                            letterSpacing: "0.3px",
                          }}
                          variant="h6"
                        >
                          {attendanceData?.numberOfCohortMembers &&
                          attendanceData.numberOfCohortMembers !== 0
                            ? (
                                (attendanceData.presentCount /
                                  attendanceData.numberOfCohortMembers) *
                                100
                              ).toFixed(2)
                            : "0"}
                          {t("LEARNER_APP.ATTENDANCE.ATTENDANCE_PERCENTAGE")}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: { xs: "11px", sm: "12px", md: "13px" },
                            fontWeight: "500",
                            color: alpha(secondaryColor, 0.6),
                            marginTop: "2px",
                          }}
                          variant="body2"
                        >
                          ({attendanceData.presentCount}/
                          {attendanceData.numberOfCohortMembers} {t("LEARNER_APP.ATTENDANCE.PRESENT_LABEL")})
                        </Typography>
                      </Box>
                    </>
                  )}
                {currentAttendance === "notMarked" && (
                  <Typography
                    sx={{
                      color: alpha(secondaryColor, 0.6),
                      fontWeight: "500",
                    }}
                    fontSize={"0.9rem"}
                  >
                    {t("LEARNER_APP.ATTENDANCE.NOT_STARTED")}
                  </Typography>
                )}
                {currentAttendance === "futureDate" && (
                  <Typography
                    sx={{
                      color: alpha(secondaryColor, 0.6),
                    }}
                    fontSize={"0.9rem"}
                    fontStyle={"italic"}
                    fontWeight={"500"}
                  >
                    {t("LEARNER_APP.ATTENDANCE.FUTURE_DATE_CANT_MARK")}
                  </Typography>
                )}
              </Box>
              <Button
                className="btn-mark-width"
                variant="contained"
                sx={{
                  minWidth: { xs: "100%", sm: "100px", md: "120px" },
                  height: { xs: "2.25rem", sm: "2.5rem", md: "2.75rem" },
                  padding: { xs: theme.spacing(1), sm: theme.spacing(1.25), md: theme.spacing(1.5) },
                  fontWeight: "600",
                  fontSize: { xs: "12px", sm: "13px", md: "14px" },
                  borderRadius: { xs: "6px", md: "8px" },
                  backgroundColor: primaryColor,
                  color: getContrastTextColor(primaryColor),
                  boxShadow: `0 4px 12px ${alpha(primaryColor, 0.4)}`,
                  "&:hover": {
                    backgroundColor: primaryColor,
                    boxShadow: `0 6px 16px ${alpha(primaryColor, 0.5)}`,
                    transform: { xs: "none", md: "translateY(-1px)" },
                  },
                  transition: "all 0.2s",
                }}
                disabled={classId === "all"}
                onClick={handleMarkAttendanceClick}
              >
                {currentAttendance === "notMarked" ? t("LEARNER_APP.ATTENDANCE.MARK") : t("LEARNER_APP.ATTENDANCE.MODIFY")}
              </Button>
            </Box>

          {ShowSelfAttendance && (
            <Box
              height={"auto"}
              flex={1}
              minWidth={{ xs: "100%", md: 0 }}
              padding={{ xs: "1rem 1.5rem", md: "1.5rem 2rem" }}
              borderRadius={"16px"}
              bgcolor={alpha(backgroundColor, 0.8)}
              textAlign={"left"}
              sx={{
                opacity: classId === "all" ? 0.5 : 1,
                boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                transition: "transform 0.2s, box-shadow 0.2s",
                background: `linear-gradient(135deg, ${alpha(backgroundColor, 0.8)} 0%, ${backgroundColor} 100%)`,
                "&:hover": {
                  transform: { xs: "none", md: "translateY(-3px)" },
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                },
              }}
              justifyContent={"space-between"}
              display={"flex"}
              flexDirection={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              gap={{ xs: 2, sm: 0 }}
            >
              <Box display={"flex"} alignItems={"center"} gap={"12px"}>
                {selfAttendanceData?.length > 0 ? (
                  <Box display={"flex"} alignItems={"center"}>
                    <Typography
                      sx={{
                        color: secondaryColor,
                        fontWeight: "600",
                        fontSize: { xs: "0.85rem", sm: "0.9rem", md: "0.95rem" },
                      }}
                    >
                      {selfAttendanceData[0]?.attendance?.toLowerCase() ===
                      ATTENDANCE_ENUM.PRESENT
                        ? t("LEARNER_APP.COMMON.PRESENT")
                        : selfAttendanceData[0]?.attendance?.toLowerCase() ===
                          ATTENDANCE_ENUM.ABSENT
                        ? t("LEARNER_APP.COMMON.ABSENT")
                        : selfAttendanceData[0]?.attendance}
                    </Typography>
                    {selfAttendanceData[0]?.attendance?.toLowerCase() ===
                    ATTENDANCE_ENUM.PRESENT ? (
                      <CheckCircleOutlineIcon
                        fontSize="small"
                        sx={{
                          color: theme.palette.success.main,
                          marginLeft: "4px",
                        }}
                      />
                    ) : selfAttendanceData[0]?.attendance?.toLowerCase() ===
                      ATTENDANCE_ENUM.ABSENT ? (
                      <WarningAmberIcon
                        fontSize="small"
                        sx={{
                          color: theme.palette.error.main,
                          marginLeft: "4px",
                        }}
                      />
                    ) : null}
                  </Box>
                ) : (
                  <Typography
                    sx={{
                      color: alpha(secondaryColor, 0.6),
                      fontWeight: "500",
                    }}
                    fontSize={"0.9rem"}
                  >
                    {t("LEARNER_APP.ATTENDANCE.NOT_MARKED_FOR_SELF")}
                  </Typography>
                )}
              </Box>
              <Button
                className="btn-mark-width"
                variant="contained"
                sx={{
                  minWidth: { xs: "100%", sm: "100px", md: "120px" },
                  height: { xs: "2.25rem", sm: "2.5rem", md: "2.75rem" },
                  padding: { xs: theme.spacing(1), sm: theme.spacing(1.25), md: theme.spacing(1.5) },
                  fontWeight: "600",
                  fontSize: { xs: "12px", sm: "12px", md: "13px" },
                  borderRadius: { xs: "6px", md: "8px" },
                  backgroundColor: primaryColor,
                  color: getContrastTextColor(primaryColor),
                  boxShadow: `0 4px 12px ${alpha(primaryColor, 0.4)}`,
                  "&:hover": {
                    backgroundColor: primaryColor,
                    boxShadow: `0 6px 16px ${alpha(primaryColor, 0.5)}`,
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s",
                }}
                disabled={classId === "all"}
                onClick={handleSelfAttendanceButtonClick}
              >
                {selfAttendanceData?.length > 0 &&
                (selfAttendanceData[0]?.attendance?.toLowerCase() ===
                  ATTENDANCE_ENUM.PRESENT ||
                  selfAttendanceData[0]?.attendance?.toLowerCase() ===
                    ATTENDANCE_ENUM.ABSENT)
                  ? t("LEARNER_APP.ATTENDANCE.MODIFY_FOR_SELF")
                  : t("LEARNER_APP.ATTENDANCE.MARK_FOR_SELF")}
              </Button>
            </Box>
          )}
          </Box>
          <Box
            sx={{
              padding: { xs: "1rem", md: "1.5rem 1.5rem" },
              backgroundColor: alpha(backgroundColor, 0.95),
              borderRadius: "12px",
              margin: { xs: "0 10px 15px", md: "0 20px 20px" },
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <Box
              mb={3}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                paddingBottom: "12px",
                borderBottom: `2px solid ${alpha(primaryColor, 0.2)}`,
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  fontWeight="700"
                  color={secondaryColor}
                  sx={{ fontSize: "18px", mb: 0.5 }}
                >
                  {t("LEARNER_APP.ATTENDANCE.OVERVIEW")}
                </Typography>
                <Typography variant="body2" color={alpha(secondaryColor, 0.6)} sx={{ fontSize: "13px" }}>
                  {t("LEARNER_APP.ATTENDANCE.LAST_7_DAYS")} {dateRange}
                </Typography>
              </Box>

              <Link href="/attendance-overview" legacyBehavior>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    clickAttendanceOverview();
                  }}
                  style={{
                    color: primaryColor,
                    textDecoration: "none",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = alpha(primaryColor, 0.8);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = primaryColor;
                  }}
                >
                  {t("LEARNER_APP.ATTENDANCE.MORE_DETAILS")}
                </a>
              </Link>
            </Box>
            {loading ? (
              <Typography color={secondaryColor}>Loading...</Typography>
            ) : (
              <Grid container spacing={2}>
                {classId && classId !== "all" ? (
                  <>
                    <Grid item xs={12} md={4}>
                      <StatusCard>
                        <CardContent sx={{ pt: 2 }}>
                          <Box textAlign="center" mb={2} p={2}>
                            <Typography
                              fontSize={"14px"}
                              fontWeight="600"
                              color={secondaryColor}
                              sx={{ mb: 1.5, textTransform: "uppercase", letterSpacing: "0.5px" }}
                            >
                              {t("LEARNER_APP.ATTENDANCE.CENTER_ATTENDANCE")}
                            </Typography>
                            {allCenterAttendanceData.length > 0 ? (
                              allCenterAttendanceData.map((item: any, index: number) => (
                                <Box key={item.userId || index} mb={index < allCenterAttendanceData.length - 1 ? 2 : 0}>
                                  <Typography
                                    fontSize={"11px"}
                                    color={alpha(secondaryColor, 0.6)}
                                    sx={{ mb: 0.5 }}
                                  >
                                    {item.name}
                                  </Typography>
                                  <Typography
                                    fontWeight="700"
                                    color={primaryColor}
                                    sx={{ fontSize: "24px", lineHeight: 1.2 }}
                                  >
                                    {item.presentPercentage}%
                                  </Typography>
                                </Box>
                              ))
                            ) : (
                              <Typography
                                fontWeight="700"
                                color={primaryColor}
                                sx={{ fontSize: "28px", lineHeight: 1.2, mb: 0.5 }}
                              >
                                {cohortPresentPercentage === t("LEARNER_APP.ATTENDANCE.NO_ATTENDANCE")
                                  ? cohortPresentPercentage
                                  : `${cohortPresentPercentage}%`}
                              </Typography>
                            )}
                            {allCenterAttendanceData.length === 0 && cohortPresentPercentage !== t("LEARNER_APP.ATTENDANCE.NO_ATTENDANCE") && (
                              <Typography
                                variant="caption"
                                color={alpha(secondaryColor, 0.6)}
                                sx={{ fontSize: "11px" }}
                              >
                                {t("LEARNER_APP.ATTENDANCE.OVERALL_ATTENDANCE")}
                              </Typography>
                            )}
                          </Box>
                        </CardContent>
                      </StatusCard>
                    </Grid>

                    <Grid item xs={12} md={8}>
                      <StatusCard>
                        <CardContent sx={{ pt: 2 }}>
                          <Box textAlign="center" mb={2} p={2}>
                            <Typography
                              fontSize={"14px"}
                              fontWeight="600"
                              color={secondaryColor}
                              sx={{ mb: 1.5, textTransform: "uppercase", letterSpacing: "0.5px" }}
                            >
                              {t("LEARNER_APP.ATTENDANCE.LOW_ATTENDANCE_LEARNERS")}
                            </Typography>
                            <Typography
                              fontWeight="500"
                              color={alpha(secondaryColor, 0.6)}
                              sx={{ fontSize: "15px", lineHeight: 1.6 }}
                            >
                              {Array.isArray(lowAttendanceLearnerList) &&
                              lowAttendanceLearnerList.length > 0 ? (
                                <>
                                  {lowAttendanceLearnerList
                                    .slice(0, 2)
                                    .join(", ")}
                                  {lowAttendanceLearnerList.length > 2 && (
                                    <>
                                      {" "}
                                      and{" "}
                                      <Link
                                        href="/attendance-overview"
                                        legacyBehavior
                                      >
                                        <a
                                          onClick={(e) => {
                                            e.preventDefault();
                                            clickAttendanceOverview();
                                          }}
                                          style={{
                                            color: primaryColor,
                                            textDecoration: "none",
                                            fontWeight: "600",
                                            cursor: "pointer",
                                          }}
                                        >
                                          more
                                        </a>
                                      </Link>
                                    </>
                                  )}
                                </>
                              ) : (
                                <Typography
                                  sx={{
                                    color: primaryColor,
                                    fontWeight: "500",
                                    fontStyle: "italic",
                                  }}
                                >
                                  {t("LEARNER_APP.ATTENDANCE.NO_LEARNERS_LOW_ATTENDANCE")}
                                </Typography>
                              )}
                            </Typography>
                          </Box>
                        </CardContent>
                      </StatusCard>
                    </Grid>
                  </>
                ) : (
                  allCenterAttendanceData.map((item: any) => (
                    <Grid item xs={12} md={6} key={item.userId}>
                      <StatusCard>
                        <CardContent sx={{ pt: 0 }}>
                          <Box textAlign="center" mb={2} p={2}>
                            <Typography
                              fontSize={"11px"}
                              color={alpha(secondaryColor, 0.6)}
                            >
                              {item.name}
                            </Typography>
                            <Typography
                              fontWeight="700"
                              color={secondaryColor}
                              sx={{ fontSize: "16px", lineHeight: 1 }}
                            >
                              {item.presentPercentage}%
                            </Typography>
                          </Box>
                        </CardContent>
                      </StatusCard>
                    </Grid>
                  ))
                )}
              </Grid>
            )}
          </Box>
                </ContentWrapper>
              </MainContent>
            </DashboardContainer>
          </Grid>
        </Grid>
      </Box>
      </Box>
      {open && (
        <MarkBulkAttendance
          open={open}
          onClose={handleClose}
          classId={classId}
          selectedDate={new Date(selectedDate)}
          onSaveSuccess={handleSaveSuccess}
          memberList={attendanceData?.cohortMemberList || []}
          presentCount={attendanceData?.presentCount || 0}
          absentCount={attendanceData?.absentCount || 0}
          numberOfCohortMembers={attendanceData?.numberOfCohortMembers || 0}
          dropoutMemberList={attendanceData?.dropoutMemberList || []}
          dropoutCount={attendanceData?.dropoutCount || 0}
          bulkStatus={attendanceData?.bulkAttendanceStatus || ""}
        />
      )}
      {isRemoteCohort && (
        <ModalComponent
          open={isRemoteCohort}
          heading={localT("COMMON.MARK_CENTER_ATTENDANCE")}
          secondaryBtnText={localT("COMMON.CANCEL")}
          btnText={localT("COMMON.YES_MANUALLY")}
          selectedDate={selectedDate ? new Date(selectedDate) : undefined}
          onClose={handleClose}
          handlePrimaryAction={() => handleModalToggle()}
        >
          <Box sx={{ padding: "0 16px" }}>
            <Box
              sx={{
                color: (theme?.palette?.warning as any)?.["300"],
                fontSize: "16px",
                fontWeight: "500",
              }}
            >
              {localT("COMMON.ARE_YOU_SURE_MANUALLY")}
            </Box>
            <Box
              sx={{
                color: (theme?.palette?.warning as any)?.["300"],
                fontSize: "14px",
                fontWeight: "400",
                mt: "10px",
              }}
            >
              {localT("COMMON.ATTENDANCE_IS_USUALLY")}
            </Box>
            <Box
              sx={{
                color: (theme?.palette?.warning as any)?.["300"],
                fontSize: "14px",
                fontWeight: "400",
                mt: "10px",
              }}
            >
              {localT("COMMON.USE_MANUAL")}
            </Box>
            <Box
              sx={{
                color: (theme?.palette?.warning as any)?.["300"],
                fontSize: "14px",
                fontWeight: "500",
                mt: "10px",
              }}
            >
              {localT("COMMON.NOTE_MANUALLY")}
            </Box>
          </Box>
        </ModalComponent>
      )}
      {isLocationModalOpen && (
        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          onConfirm={requestLocationPermission}
          primaryColor={primaryColor}
        />
      )}
      {isSelfAttendanceModalOpen && (
        <ModalComponent
          open={isSelfAttendanceModalOpen}
          heading="Mark Self Attendance"
          secondaryBtnText="Cancel"
          btnText="Mark"
          selectedDate={selectedDate ? new Date(selectedDate) : undefined}
          onClose={() => {
            setIsSelfAttendanceModalOpen(false);
            const currentAttendance = selfAttendanceData?.[0]?.attendance;
            setSelectedSelfAttendance(
              currentAttendance ? currentAttendance.toLowerCase() : null
            );
          }}
          handlePrimaryAction={() => {
            if (selectedSelfAttendance) {
              handleMarkSelfAttendance();
            }
          }}
        >
          <Box sx={{ py: 2 }}>
            {/* Present Option */}
            <Box
              onClick={() => setSelectedSelfAttendance(ATTENDANCE_ENUM.PRESENT)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2.5,
                mb: 2,
                borderRadius: "12px",
                border: `2px solid ${
                  selectedSelfAttendance === ATTENDANCE_ENUM.PRESENT
                    ? primaryColor
                    : alpha(secondaryColor, 0.2)
                }`,
                backgroundColor:
                  selectedSelfAttendance === ATTENDANCE_ENUM.PRESENT
                    ? alpha(primaryColor, 0.08)
                    : "transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: primaryColor,
                  backgroundColor: alpha(primaryColor, 0.05),
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CheckCircleOutlineIcon
                  sx={{
                    fontSize: 28,
                    color:
                      selectedSelfAttendance === ATTENDANCE_ENUM.PRESENT
                        ? primaryColor
                        : alpha(secondaryColor, 0.5),
                  }}
                />
                <Typography
                  component="div"
                  sx={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color:
                      selectedSelfAttendance === ATTENDANCE_ENUM.PRESENT
                        ? primaryColor
                        : secondaryColor,
                  }}
                >
                  Present
                </Typography>
              </Box>
              <Radio
                onChange={() =>
                  setSelectedSelfAttendance(ATTENDANCE_ENUM.PRESENT)
                }
                value={ATTENDANCE_ENUM.PRESENT}
                checked={selectedSelfAttendance === ATTENDANCE_ENUM.PRESENT}
                sx={{
                  color: primaryColor,
                  "&.Mui-checked": {
                    color: primaryColor,
                  },
                }}
              />
            </Box>

            {/* Absent Option */}
            <Box
              onClick={() => setSelectedSelfAttendance(ATTENDANCE_ENUM.ABSENT)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2.5,
                borderRadius: "12px",
                border: `2px solid ${
                  selectedSelfAttendance === ATTENDANCE_ENUM.ABSENT
                    ? theme.palette.error.main
                    : alpha(secondaryColor, 0.2)
                }`,
                backgroundColor:
                  selectedSelfAttendance === ATTENDANCE_ENUM.ABSENT
                    ? alpha(theme.palette.error.main, 0.08)
                    : "transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: theme.palette.error.main,
                  backgroundColor: alpha(theme.palette.error.main, 0.05),
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <WarningAmberIcon
                  sx={{
                    fontSize: 28,
                    color:
                      selectedSelfAttendance === ATTENDANCE_ENUM.ABSENT
                        ? theme.palette.error.main
                        : alpha(secondaryColor, 0.5),
                  }}
                />
                <Typography
                  component="div"
                  sx={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color:
                      selectedSelfAttendance === ATTENDANCE_ENUM.ABSENT
                        ? theme.palette.error.main
                        : secondaryColor,
                  }}
                >
                  Absent
                </Typography>
              </Box>
              <Radio
                onChange={() =>
                  setSelectedSelfAttendance(ATTENDANCE_ENUM.ABSENT)
                }
                value={ATTENDANCE_ENUM.ABSENT}
                checked={selectedSelfAttendance === ATTENDANCE_ENUM.ABSENT}
                sx={{
                  color: theme.palette.error.main,
                  "&.Mui-checked": {
                    color: theme.palette.error.main,
                  },
                }}
              />
            </Box>
          </Box>
        </ModalComponent>
      )}
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

export default SimpleTeacherDashboard;

