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
  TextField,
  Autocomplete,
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
import {
  getCohortList,
  getCohortDetails,
  cohortList,
} from "../../utils/API/services/CohortServices";
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
import { ATTENDANCE_ENUM, Status } from "@learner/utils/attendance/constants";
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
import {telemetryFactory} from "../../utils/telemtery";
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
  background:
    "linear-gradient(180deg, var(--background-color, #F5F5F5) 0%, rgba(255,255,255,0.9) 100%)",
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
  border: `2px solid var(--primary-color, ${
    (theme.palette.warning as any).A100 || "#FDBE16"
  })`,
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
    borderColor: `var(--primary-color, ${
      (theme.palette.warning as any).A200 || "#FDBE16"
    })`,
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

// Work location options for Staff role
const workLocationOptions = [
  { label: "WORK FROM HOME", value: "work_from_home" },
  { label: "WORK FROM FIELD", value: "work_from_field" },
  { label: "WORK FROM OFFICE", value: "work_from_office" },
  { label: "OTHER", value: "other" },
];

// Mapping from work location value to API label
const workLocationLabelMap: Record<string, string> = {
  work_from_home: "Work From Home",
  work_from_field: "Work From Field",
  work_from_office: "Work From Office",
  other: "Other",
};

// Absent reason options for Staff and Supervisor
const absentReasonOptions = [
  { label: "PAID_LEAVE_HALF_DAY", value: "Paid leave - Half day" },
  { label: "PAID_LEAVE_FULL_DAY", value: "Paid leave - Full day" },
  { label: "UNPAID_LEAVE_HALF_DAY", value: "Unpaid leave - Half day" },
  { label: "UNPAID_LEAVE_FULL_DAY", value: "Unpaid leave - Full day" },
  { label: "MENSTRUAL_LEAVE_HALF_DAY", value: "Menstrual leave - Half day" },
  { label: "MENSTRUAL_LEAVE_FULL_DAY", value: "Menstrual leave - Full day" },
  { label: "STUDY_LEAVE_HALF_DAY", value: "Study Leave - Half day" },
  { label: "STUDY_LEAVE_FULL_DAY", value: "Study Leave - Full day" },
  { label: "OTHER", value: "Other" },
];

// Additional absent reason options for Teacher role only
const teacherOnlyAbsentReasonOptions = [
  { label: "UNINFORMED_FULL_DAY_ABSENT", value: "Uninformed Full Day Absent" },
  {
    label: "UNINFORMED_HALF_DAY_PRESENT",
    value: "Uninformed Half Day Present",
  },
  { label: "MEDICAL_LEAVE", value: "Medical Leave" },
];

// Attendance comment options for Teacher role only (when Present is selected)
const attendanceCommentOptions = ["STAT", "TAB"];

// Haversine distance (meters) to validate geo-fence for self attendance
const getDistanceInMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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
  const [cohortPresentPercentage, setCohortPresentPercentage] = useState("");
  const [lowAttendanceLearnerList, setLowAttendanceLearnerList] =
    useState<any>("");
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
  // Store self-attendance by date for Staff role (for calendar display)
  const [staffSelfAttendanceByDate, setStaffSelfAttendanceByDate] = useState<{
    [date: string]: "present" | "absent" | null;
  }>({});
  const router = useRouter();
  const pathname = usePathname();
  const { getLocation } = useGeolocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [oblfOfficeCoords, setOblfOfficeCoords] = useState<{
    latitude: number;
    longitude: number;
    centerName: string;
  } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [absentReason, setAbsentReason] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [comment, setComment] = useState("");
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [capturedLocation, setCapturedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

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
    showToastMessage(
      "Self attendance can only be marked for today's date.",
      "warning"
    );
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

  const handleAttendanceDataUpdate = (data: any, onComplete?: () => void) => {
    console.log("[handleAttendanceDataUpdate] Updating attendance data:", {
      cohortMemberListLength: data?.cohortMemberList?.length || 0,
      presentCount: data?.presentCount || 0,
      absentCount: data?.absentCount || 0,
      numberOfCohortMembers: data?.numberOfCohortMembers || 0,
      dataKeys: Object.keys(data || {}),
      sampleData: data?.cohortMemberList?.slice(0, 2) || [],
      fullMemberList: data?.cohortMemberList || [],
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
        memberListSample: newData.cohortMemberList.slice(0, 3).map((m: any) => ({
          userId: m?.userId,
          name: m?.name,
          attendance: m?.attendance,
        })),
      });

      // Call onComplete callback after state is set, with a small delay to ensure React has processed it
      if (onComplete) {
        setTimeout(() => {
          onComplete();
        }, 100);
      }

      return newData;
    });
    console.log("[handleAttendanceDataUpdate] State update queued");
  };

  const getSelectedCenterCoordinates = () => {
    const center = centersData.find((c) => c.centerId === selectedCenterId);
    const customFields: any[] =
      center?.hierarchyData?.customField || center?.customField || [];
    const latitudeField = customFields.find(
      (field) =>
        field?.label?.toLowerCase() === "latitude" &&
        Array.isArray(field?.selectedValues) &&
        field.selectedValues.length > 0
    );
    const longitudeField = customFields.find(
      (field) =>
        field?.label?.toLowerCase() === "longitude" &&
        Array.isArray(field?.selectedValues) &&
        field.selectedValues.length > 0
    );

    const lat = parseFloat(latitudeField?.selectedValues?.[0]);
    const lon = parseFloat(longitudeField?.selectedValues?.[0]);

    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return { latitude: lat, longitude: lon };
    }
    return null;
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

            console.log(
              "[handleRemoteSession] Fetching cohort member list for:",
              {
                classId,
                selectedDate,
              }
            );

            const limit = 300;
            const page = 0;
            const filters = { cohortId: classId, status: [Status.ACTIVE] };
            const response = await getMyCohortMemberList({
              limit,
              page,
              filters,
              includeArchived: false,
            });

            console.log(
              "[handleRemoteSession] Cohort member list API response:",
              {
                hasResponse: !!response,
                hasResult: !!response?.result,
                userDetailsCount: response?.result?.userDetails?.length || 0,
                responseStructure: Object.keys(response || {}),
              }
            );

            const resp =
              response?.result?.userDetails ||
              response?.data?.result?.userDetails ||
              [];
            console.log("[handleRemoteSession] Raw API response members:", {
              totalMembers: resp.length,
              members: resp.map((m) => ({
                userId: m?.userId,
                name: `${m?.firstName || ""} ${m?.lastName || ""}`.trim(),
                role: m?.role,
                username: m?.username,
              })),
            });

            const filteredResp = filterMembersExcludingCurrentUser(resp);
            console.log("[handleRemoteSession] After filtering current user:", {
              originalCount: resp.length,
              filteredCount: filteredResp.length,
              filteredMembers: filteredResp.map((m) => ({
                userId: m?.userId,
                name: `${m?.firstName || ""} ${m?.lastName || ""}`.trim(),
                role: m?.role,
              })),
            });

            if (filteredResp && filteredResp.length > 0) {
              console.log(
                "[handleRemoteSession] Processing members:",
                filteredResp.length
              );

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
                    if (
                      member.memberStatus === "ARCHIVED" ||
                      member.memberStatus === "DROPOUT"
                    ) {
                      if (!member.updatedAt) {
                        // If no updatedAt, include to be safe
                        console.warn(
                          "[handleRemoteSession] Member has no updatedAt:",
                          member
                        );
                        return true;
                      }

                      const updatedAt = new Date(member.updatedAt);
                      const currentDate = new Date(selectedDate);

                      if (
                        isNaN(updatedAt.getTime()) ||
                        isNaN(currentDate.getTime())
                      ) {
                        console.warn(
                          "[handleRemoteSession] Invalid date for member:",
                          {
                            userId: member.userId,
                            name: member.name,
                            updatedAt: member.updatedAt,
                            selectedDate,
                          }
                        );
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
                    console.error(
                      "[handleRemoteSession] Error filtering member:",
                      error,
                      member
                    );
                    // On error, include the member to be safe
                    return true;
                  }
                });

              console.log("[handleRemoteSession] Filtered members for date:", {
                selectedDate,
                totalMembers: resp.length,
                filteredMembers: nameUserIdArray.length,
                sampleMembers: nameUserIdArray.slice(0, 3).map((m) => ({
                  name: m.name,
                  status: m.memberStatus,
                  createdAt: m.createdAt,
                })),
              });

              if (
                nameUserIdArray &&
                nameUserIdArray.length > 0 &&
                selectedDate &&
                classId
              ) {
                console.log(
                  "[handleRemoteSession] Calling fetchAttendanceDetails"
                );
                // Convert Date to string format for fetchAttendanceDetails
                const selectedDateStr =
                  typeof selectedDate === "string"
                    ? selectedDate
                    : shortDateFormat(selectedDate);

                // Fetch attendance details - this will call handleAttendanceDataUpdate when done
                // The callback is called synchronously at the end of fetchAttendanceDetails
                await new Promise<void>((resolve) => {
                  const updateCallback = (data: any) => {
                    console.log(
                      "[handleRemoteSession] Callback received data:",
                      {
                        memberCount: data?.cohortMemberList?.length || 0,
                      }
                    );
                    handleAttendanceDataUpdate(data, () => {
                      console.log(
                        "[handleRemoteSession] State update completed, opening modal"
                      );
                      setOpen(true);
                      resolve();
                    });
                  };

                  fetchAttendanceDetails(
                    nameUserIdArray,
                    selectedDateStr,
                    classId,
                    updateCallback
                  ).catch((error) => {
                    console.error(
                      "[handleRemoteSession] Error in fetchAttendanceDetails:",
                      error
                    );
                    // Still open modal even on error
                    setOpen(true);
                    resolve();
                  });
                });
              } else {
                console.warn(
                  "[handleRemoteSession] No members to fetch attendance for:",
                  {
                    nameUserIdArrayLength: nameUserIdArray?.length || 0,
                    selectedDate,
                    classId,
                  }
                );
                // Still open modal even if no members (to show empty state)
                setOpen(true);
              }
            } else {
              console.warn(
                "[handleRemoteSession] No members found in response:",
                {
                  responseKeys: Object.keys(response || {}),
                  hasResult: !!response?.result,
                  hasData: !!response?.data,
                }
              );
              // Open modal even if no members found
              setOpen(true);
            }
          } catch (error) {
            console.error(
              "[handleRemoteSession] Error fetching cohort member list:",
              error
            );
            // Open modal even on error
            setOpen(true);
          }
        } else {
          // If no classId or selectedDate, still open modal
          setOpen(true);
        }
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
    // Load user role for Staff-specific behaviour
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole");
      setUserRole(role);
    }
  }, []);

  // Fetch OBLF Office coordinates when work_from_office is selected
  useEffect(() => {
    if (
      userRole === "Staff" &&
      workLocation === "work_from_office" &&
      !oblfOfficeCoords
    ) {
      console.log(
        "[Work From Office] Work location changed to work_from_office, fetching OBLF Office coordinates..."
      );
      fetchOBLFOfficeCoordinates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workLocation, userRole, oblfOfficeCoords]);

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
      // Read userRole directly from localStorage to avoid race condition with state
      const currentUserRole =
        typeof window !== "undefined"
          ? localStorage.getItem("userRole")
          : userRole;
      console.log(
        "[fetchUserCohorts] Fetching cohorts for userId:",
        userId,
        "userRole from localStorage:",
        currentUserRole,
        "userRole from state:",
        userRole
      );

      // For Supervisor and Staff, we need all data including inactive cohorts to build centers
      const response = await getCohortList(
        userId,
        {
          customField: "true",
          children: "true",
        },
        true // isCustomFields: true to get all data without filtering
      );
      console.log("[fetchUserCohorts] API response:", response);
      await getUserDetails(userId, true);
      if (response && response.length > 0) {
        console.log(
          "[fetchUserCohorts] Response has data, processing...",
          response.length,
          "items"
        );
        setCohortsData(response);

        // For Supervisor: Show SCHOOL items directly in center dropdown
        // For Teacher: Fetch hierarchy to get centers
        if (currentUserRole === "Supervisor") {
          console.log("[fetchUserCohorts] Processing for Supervisor role");
          console.log("[fetchUserCohorts] Full response:", response);

          // Extract SCHOOL items directly - these are the schools assigned to Supervisor
          // Filter for type === "SCHOOL" exactly (case-sensitive)
          const schoolItems = response.filter((item: any) => {
            const isSchool = item.type === "SCHOOL";
            console.log(
              `[fetchUserCohorts] Item: ${item.cohortName}, type: ${item.type}, isSchool: ${isSchool}`
            );
            return isSchool;
          });

          console.log(
            "[fetchUserCohorts] Supervisor - SCHOOL items found:",
            schoolItems.length,
            schoolItems
          );

          // Map SCHOOL items directly to centers - NO hierarchy API call
          const supervisorCenters = schoolItems.map((school: any) => {
            console.log(
              `[fetchUserCohorts] Mapping school: ${school.cohortName} (${school.cohortId})`
            );
            return {
              centerId: school.cohortId, // Use school ID as center ID
              centerName: school.cohortName, // Use school name as center name
              childData: school.childData || [], // Classes/batches are in childData
              hierarchyData: school, // Store the full school object
              parentId: school.parentId, // Keep parentId for reference
            };
          });

          console.log(
            "[fetchUserCohorts] Supervisor centers (schools) - FINAL:",
            supervisorCenters
          );
          setCentersData(supervisorCenters);

          if (supervisorCenters.length > 0) {
            const defaultCenter = supervisorCenters[0];
            setSelectedCenterId(defaultCenter.centerId);
            // Don't set batches for Supervisor (batch dropdown is hidden)
            setBatchesData([]);
            setClassId("");
            console.log(
              "[fetchUserCohorts] Default center set for Supervisor:",
              defaultCenter.centerName
            );
          } else {
            console.warn(
              "[fetchUserCohorts] No SCHOOL items found for Supervisor!"
            );
          }
        } else {
          // For Teacher and other roles: Fetch hierarchy to get centers
          // Extract unique parent IDs from the cohorts
          const uniqueParentIds = [
            ...new Set(
              response
                .filter((item: any) => item.parentId && item.type === "COHORT")
                .map((item: any) => item.parentId)
            ),
          ];

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
                const centerData = Array.isArray(hierarchyData)
                  ? hierarchyData[0]
                  : hierarchyData;

                return {
                  centerId: centerData?.cohortId || parentId,
                  centerName:
                    centerData?.cohortName ||
                    centerData?.name ||
                    "Unknown Center",
                  childData: centerData?.childData || [],
                  hierarchyData: centerData,
                };
              } catch (error) {
                console.error(
                  `Error fetching hierarchy for ${parentId}:`,
                  error
                );
                return null;
              }
            })
          );

          // Filter out null values (failed requests)
          const validCenters = centersWithHierarchy.filter(
            (center) => center !== null
          );

          console.log(
            "[fetchUserCohorts] Valid centers found:",
            validCenters.length,
            validCenters
          );
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
              .map((item: any) => {
                // Extract slot value from cohortMemberCustomField
                const slotField = item.cohortMemberCustomField?.find(
                  (field: any) => field?.label?.toUpperCase() === "SLOTS"
                );
                const slotValue = slotField?.selectedValues?.[0] || "";

                return {
                  batchId: item.cohortId,
                  batchName: item.cohortName,
                  parentId: item.parentId,
                  slot: slotValue,
                };
              });

            console.log(
              "Batches for default center (from myCohorts):",
              batches
            );
            setBatchesData(batches);

            // Set default batch if available
            if (batches.length > 0) {
              setClassId(batches[0].batchId);
            } else {
              setClassId("");
            }
          } else {
            console.log(
              "[fetchUserCohorts] No valid centers from hierarchy, trying fallback with direct cohorts"
            );
            // If no hierarchy data, use direct cohorts/schools from response
            // For Supervisor: items have type "SCHOOL", for Teacher: items have type "COHORT"
            const directCohorts = response.filter(
              (item: any) => item.type === "COHORT" || item.type === "SCHOOL"
            );
            console.log(
              "[fetchUserCohorts] Direct cohorts/schools found:",
              directCohorts.length
            );
            if (directCohorts.length > 0) {
              // Group cohorts/schools by parentId
              const cohortsByParent: any = {};
              directCohorts.forEach((cohort: any) => {
                if (!cohortsByParent[cohort.parentId]) {
                  cohortsByParent[cohort.parentId] = [];
                }
                cohortsByParent[cohort.parentId].push(cohort);
              });

              // Create centers from parent IDs
              // Try to get center name from first cohort's parentId by fetching hierarchy, or use a generic name
              const fallbackCenters = await Promise.all(
                Object.keys(cohortsByParent).map(async (parentId) => {
                  try {
                    const hierarchyData = await getCohortDetails(parentId, {
                      children: "true",
                      customField: "true",
                    });
                    const centerData = Array.isArray(hierarchyData)
                      ? hierarchyData[0]
                      : hierarchyData;
                    return {
                      centerId: centerData?.cohortId || parentId,
                      centerName:
                        centerData?.cohortName ||
                        centerData?.name ||
                        `Center ${parentId.substring(0, 8)}`,
                      childData: cohortsByParent[parentId],
                      hierarchyData: centerData,
                    };
                  } catch (error) {
                    console.error(
                      `Error fetching hierarchy for fallback center ${parentId}:`,
                      error
                    );
                    return {
                      centerId: parentId,
                      centerName: `Center ${parentId.substring(0, 8)}`,
                      childData: cohortsByParent[parentId],
                      hierarchyData: null,
                    };
                  }
                })
              );

              console.log(
                "[fetchUserCohorts] Fallback centers created:",
                fallbackCenters.length,
                fallbackCenters
              );
              setCentersData(fallbackCenters);

              if (fallbackCenters.length > 0) {
                const defaultCenter = fallbackCenters[0];
                setSelectedCenterId(defaultCenter.centerId);

                const batches = defaultCenter.childData.map((batch: any) => {
                  // Extract slot value from cohortMemberCustomField
                  const slotField = batch.cohortMemberCustomField?.find(
                    (field: any) => field?.label?.toUpperCase() === "SLOTS"
                  );
                  const slotValue = slotField?.selectedValues?.[0] || "";

                  return {
                    batchId: batch.cohortId,
                    batchName: batch.cohortName,
                    parentId: batch.parentId,
                    slot: slotValue,
                  };
                });
                setBatchesData(batches);

                if (batches.length > 0) {
                  setClassId(batches[0].batchId);
                }
              }
            }
          } // End of Teacher else block
        } // End of outer if (response && response.length > 0)
      } else {
        console.warn(
          "[fetchUserCohorts] No response or empty response from API"
        );
        setCentersData([]);
      }
    } catch (error) {
      console.error("[fetchUserCohorts] Error fetching cohorts:", error);
      setCentersData([]);
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
      .map((item: any) => {
        // Extract slot value from cohortMemberCustomField
        const slotField = item.cohortMemberCustomField?.find(
          (field: any) => field?.label?.toUpperCase() === "SLOTS"
        );
        const slotValue = slotField?.selectedValues?.[0] || "";

        return {
          batchId: item.cohortId,
          batchName: item.cohortName,
          parentId: item.parentId,
          slot: slotValue,
        };
      });

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
    // For Supervisor: use selectedCenterId, for other roles: use classId
    const effectiveContextId =
      userRole === "Supervisor" ? selectedCenterId : classId;

    if (!effectiveContextId || effectiveContextId === "all") return;

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const limit = 300;
      const page = 0;

      let filters = {
        contextId: effectiveContextId,
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

  // Generate calendar data function (moved before use)
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

  // Fetch self-attendance for all calendar dates (for Staff/Supervisor role calendar display)
  const fetchStaffSelfAttendanceForCalendar = async () => {
    // For Supervisor: use selectedCenterId, for Staff: use classId
    const effectiveContextId =
      userRole === "Supervisor" ? selectedCenterId : classId;

    if (
      !effectiveContextId ||
      effectiveContextId === "all" ||
      (userRole !== "Staff" && userRole !== "Supervisor")
    )
      return;

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const calendarDays = generateCalendarData();
      if (calendarDays.length === 0) return;

      const firstDate = calendarDays[calendarDays.length - 1].dateString;
      const lastDate = calendarDays[0].dateString;

      const limit = 300;
      const page = 0;

      let filters = {
        contextId: effectiveContextId,
        userId: userId,
        scope: "self",
        toDate: lastDate,
        fromDate: firstDate,
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
        // Create a map of date -> attendance status
        const attendanceMap: { [date: string]: "present" | "absent" | null } =
          {};

        response.data.attendanceList.forEach((item: any) => {
          if (item.attendanceDate) {
            const dateKey = shortDateFormat(new Date(item.attendanceDate));
            attendanceMap[dateKey] =
              item.attendance?.toLowerCase() === "present"
                ? "present"
                : item.attendance?.toLowerCase() === "absent"
                ? "absent"
                : null;
          }
        });

        setStaffSelfAttendanceByDate(attendanceMap);
      } else {
        setStaffSelfAttendanceByDate({});
      }
    } catch (error) {
      console.error(
        "Error fetching staff self-attendance for calendar:",
        error
      );
      setStaffSelfAttendanceByDate({});
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

    // Close location modal and open attendance modal immediately for better UX
    setIsLocationModalOpen(false);
    const currentAttendance = selfAttendanceData?.[0]?.attendance;
    setSelectedSelfAttendance(
      currentAttendance ? currentAttendance.toLowerCase() : null
    );
    setIsSelfAttendanceModalOpen(true);

    // Get location in the background (non-blocking)
    // This is a pre-fetch to speed up the actual attendance marking
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Store the captured location for use when marking attendance
        setCapturedLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        console.log("[Location] Location captured successfully", {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error getting location (background fetch):", error);
        // Don't show error to user immediately - this is just a background pre-fetch
        // Location will be attempted again when marking attendance with retry logic
        // Only log for debugging
        if (error.code === 1) {
          console.log("[Location] Permission denied");
        } else if (error.code === 2) {
          console.log("[Location] Position unavailable");
        } else if (error.code === 3) {
          console.log(
            "[Location] Timeout - will retry when marking attendance"
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000, // Increased timeout to 20 seconds
        maximumAge: 30000, // Allow cached location up to 30 seconds old
      }
    );
  };

  const handleSelfAttendanceButtonClick = () => {
    if (!isSelectedDateTodayValue) {
      showSelfAttendanceRestrictionMessage();
      return;
    }

    // For Teacher: enforce slot timing but keep button enabled.
    // Do NOT allow marking before 5 minutes of slot start.
    if (userRole === "Teacher") {
      const timing = getSelectedBatchSlotTiming();
      if (timing) {
        const now = new Date();
        if (now < timing.enableTime) {
          showToastMessage(
            "You can mark self attendance only within 5 minutes before the slot start time.",
            "warning"
          );
          return;
        }
      }
    }

    // For Staff: allow marking attendance anytime, but late flag will be true after 9:35 AM

    setIsLocationModalOpen(true);
  };

  // Fetch OBLF Office coordinates from API
  const fetchOBLFOfficeCoordinates = async () => {
    if (oblfOfficeCoords) {
      // Return cached coordinates
      return oblfOfficeCoords;
    }

    try {
      console.log("[Work From Office] Fetching OBLF Office from API...");
      const filters = { type: "SCHOOL", status: ["active"] };
      const response = await cohortList({ limit: 0, offset: 0, filters });

      const cohorts =
        response?.cohortDetails || response?.results?.cohortDetails || [];
      console.log(
        "[Work From Office] API Response - Total cohorts:",
        cohorts.length
      );

      // Find OBLF Office
      const oblfEntity = cohorts.find(
        (c: any) =>
          c.name?.toLowerCase().includes("oblf office") ||
          c.cohortName?.toLowerCase().includes("oblf office")
      );

      if (oblfEntity) {
        console.log("[Work From Office] Found OBLF Office:", {
          cohortId: oblfEntity.cohortId,
          name: oblfEntity.name || oblfEntity.cohortName,
          customFields: oblfEntity.customFields || oblfEntity.customField,
        });

        const customFields =
          oblfEntity.customFields || oblfEntity.customField || [];
        const latField = customFields.find(
          (f: any) => f.label?.toLowerCase() === "latitude"
        );
        const lonField = customFields.find(
          (f: any) => f.label?.toLowerCase() === "longitude"
        );

        if (latField && lonField) {
          const lat = parseFloat(latField.selectedValues?.[0]);
          const lon = parseFloat(lonField.selectedValues?.[0]);

          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            const coords = {
              latitude: lat,
              longitude: lon,
              centerName:
                oblfEntity.name || oblfEntity.cohortName || "OBLF Office",
            };
            console.log(
              "[Work From Office] OBLF Office coordinates found:",
              coords
            );
            setOblfOfficeCoords(coords);
            return coords;
          } else {
            console.error("[Work From Office] Invalid lat/lon values:", {
              lat,
              lon,
            });
          }
        } else {
          console.error(
            "[Work From Office] Latitude or Longitude field not found in customFields"
          );
        }
      } else {
        console.error("[Work From Office] OBLF Office not found in cohorts");
      }
    } catch (error) {
      console.error(
        "[Work From Office] Error fetching OBLF Office coordinates:",
        error
      );
    }

    return null;
  };

  // Get OBLF office coordinates (for Staff work_from_office validation)
  const getOBLFOfficeCoordinates = () => {
    // Return cached coordinates if available
    if (oblfOfficeCoords) {
      console.log(
        "[Work From Office] Using cached OBLF Office coordinates:",
        oblfOfficeCoords
      );
      return {
        latitude: oblfOfficeCoords.latitude,
        longitude: oblfOfficeCoords.longitude,
      };
    }

    // If not cached, return null (will trigger fetch when needed)
    console.warn(
      "[Work From Office] OBLF Office coordinates not cached yet. Call fetchOBLFOfficeCoordinates first."
    );
    return null;
  };

  const isLocationValid = (
    locationData: { latitude: number; longitude: number } | null,
    useOfficeCoords = false
  ): { valid: boolean; distance?: number } => {
    // For Staff with work_from_office, use office coordinates
    // For Teacher/Supervisor, use center coordinates
    const referenceCoords = useOfficeCoords
      ? getOBLFOfficeCoordinates()
      : getSelectedCenterCoordinates();

    if (!referenceCoords || !locationData) {
      console.log("[SelfAttendance] Missing coords", {
        referenceCoords,
        locationData,
        useOfficeCoords,
      });
      return { valid: false };
    }

    // Ensure coordinates are numbers (not strings)
    const refLat =
      typeof referenceCoords.latitude === "string"
        ? parseFloat(referenceCoords.latitude)
        : referenceCoords.latitude;
    const refLon =
      typeof referenceCoords.longitude === "string"
        ? parseFloat(referenceCoords.longitude)
        : referenceCoords.longitude;
    const userLat =
      typeof locationData.latitude === "string"
        ? parseFloat(locationData.latitude)
        : locationData.latitude;
    const userLon =
      typeof locationData.longitude === "string"
        ? parseFloat(locationData.longitude)
        : locationData.longitude;

    // Validate coordinates are valid numbers
    if (
      !Number.isFinite(refLat) ||
      !Number.isFinite(refLon) ||
      !Number.isFinite(userLat) ||
      !Number.isFinite(userLon)
    ) {
      console.error("[Location Validation] Invalid coordinate values:", {
        refLat,
        refLon,
        userLat,
        userLon,
        refLatType: typeof referenceCoords.latitude,
        refLonType: typeof referenceCoords.longitude,
        userLatType: typeof locationData.latitude,
        userLonType: typeof locationData.longitude,
      });
      return { valid: false };
    }

    // DEBUG: Log exact coordinates being compared
    console.log("[Location Validation DEBUG] Coordinates being compared:", {
      referencePoint: {
        latitude: refLat,
        longitude: refLon,
        type: useOfficeCoords ? "OBLF Office" : "Center/School",
      },
      userLocation: {
        latitude: userLat,
        longitude: userLon,
      },
      functionCall: `getDistanceInMeters(${refLat}, ${refLon}, ${userLat}, ${userLon})`,
    });

    const distance = getDistanceInMeters(refLat, refLon, userLat, userLon);

    const allowedRadiusMeters = 100; // within 50m
    const isValid = distance <= allowedRadiusMeters;

    // DEBUG: Log calculation result
    console.log("[Location Validation DEBUG] Distance calculation result:", {
      calculatedDistance_meters: distance,
      calculatedDistance_rounded: distance.toFixed(4),
      allowedRadius_meters: allowedRadiusMeters,
      comparison: `${distance} <= ${allowedRadiusMeters}`,
      isValid: isValid,
      whyFailed: !isValid
        ? `Distance ${distance.toFixed(
            4
          )}m exceeds ${allowedRadiusMeters}m by ${(
            distance - allowedRadiusMeters
          ).toFixed(4)}m`
        : "PASSED",
    });

    return { valid: isValid, distance };
  };

  const handleMarkSelfAttendance = async () => {
    if (!selectedSelfAttendance) return;
    if (!isTodayDate(selectedDate)) {
      showSelfAttendanceRestrictionMessage();
      return;
    }

    // Validation: Staff must select work location when Present (Supervisor doesn't need it)
    if (
      userRole === "Staff" &&
      selectedSelfAttendance === ATTENDANCE_ENUM.PRESENT &&
      !workLocation
    ) {
      showToastMessage("Please select a work location", "warning");
      return;
    }

    setIsMarkingAttendance(true);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        showToastMessage("User ID not found", "error");
        setIsMarkingAttendance(false);
        return;
      }

      // Always get real-time device location for all roles
      // This ensures we have the most current location, not stale data
      let locationData = null;

      console.log(
        "[SelfAttendance] ===== GETTING USER LOCATION FROM GPS ====="
      );
      console.log("[SelfAttendance] Getting real-time device location...");

      // Try to get location with retry logic (built into getLocation)
      // Increased retries to 3 to give GPS more time to get a fix
      locationData = await getLocation(true, 3); // 3 retries with fallback to low accuracy

      if (
        locationData &&
        locationData.latitude !== 0 &&
        locationData.longitude !== 0
      ) {
        console.log("[SelfAttendance] Real-time GPS location obtained:", {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          coordinates: `${locationData.latitude}, ${locationData.longitude}`,
        });
        // Update captured location for future reference
        setCapturedLocation({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        });
        console.log("[SelfAttendance] ===== END USER LOCATION =====");
      } else {
        // If getLocation failed after retries, try using capturedLocation as fallback
        if (
          capturedLocation &&
          capturedLocation.latitude !== 0 &&
          capturedLocation.longitude !== 0
        ) {
          console.log(
            "[SelfAttendance] Using captured location as fallback after retry failure:",
            {
              latitude: capturedLocation.latitude,
              longitude: capturedLocation.longitude,
              coordinates: `${capturedLocation.latitude}, ${capturedLocation.longitude}`,
            }
          );
          locationData = {
            latitude: capturedLocation.latitude,
            longitude: capturedLocation.longitude,
            accuracy: 0,
          };
          console.log(
            "[SelfAttendance] ===== END USER LOCATION (FALLBACK) ====="
          );
        } else {
          console.error(
            "[SelfAttendance] Failed to get location after retries - no valid location data available"
          );
          showToastMessage(
            "Unable to get your GPS location. Please check: 1) Location/GPS is enabled in device settings, 2) Browser has location permission, 3) You are in an area with GPS signal (try moving to an open area), then try again.",
            "error"
          );
          setIsMarkingAttendance(false);
          return;
        }
      }

      // Scope for API: always "self" for both Teacher, Staff & Supervisor
      const scope = "self";

      // Get work location label for API from value (title case)
      // Only include workLocation if Staff (not Supervisor) and Present is selected
      let workLocationLabel = "";
      if (
        userRole === "Staff" &&
        selectedSelfAttendance === ATTENDANCE_ENUM.PRESENT
      ) {
        if (workLocation) {
          workLocationLabel = workLocationLabelMap[workLocation] || "";
          // If mapping fails, try to format the value directly
          if (!workLocationLabel && workLocation) {
            // Convert "work_from_home" to "Work From Home"
            workLocationLabel = workLocation
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
          }
        }
      }

      // Determine lateMark and reason based on timing for Teacher and Staff roles
      let isLate = false;
      const effectiveAbsentReason = absentReason || "";

      if (userRole === "Teacher" && selectedSelfAttendance) {
        const timing = getSelectedBatchSlotTiming();
        if (timing) {
          const now = new Date();
          // Window where lateMark is FALSE: from 5 min before start until 5 min after start
          // Outside this window, lateMark is TRUE
          if (now < timing.enableTime) {
            isLate = true;
          } else if (now <= timing.lateThreshold) {
            isLate = false;
          } else {
            isLate = true;
          }
        }
      } else if (userRole === "Staff" && selectedSelfAttendance) {
        // Staff can mark attendance anytime, but late is TRUE only after 9:35 AM
        const timing = getStaffFixedTiming();
        const now = new Date();
        if (timing && now > timing.lateThreshold) {
          isLate = true;
        } else {
          isLate = false;
        }
      }

      // Debug logging for Staff/Teacher role - check state values
      console.log("[Self Attendance] State values before payload:", {
        userRole,
        selectedSelfAttendance,
        workLocation,
        workLocationLabel,
        comment,
        absentReason: effectiveAbsentReason,
        workLocationLabelMapKeys: Object.keys(workLocationLabelMap),
        workLocationInMap: workLocation
          ? workLocationLabelMap[workLocation]
          : "N/A",
      });

      // Determine absentReason and reason based on attendance type and late status
      // absentReason: only for absent attendance (not for present)
      // reason: only "Late" if late, otherwise empty
      const isPresent = selectedSelfAttendance?.toLowerCase() === "present";
      const finalAbsentReason = isPresent ? "" : effectiveAbsentReason;
      const finalReason = isLate ? "Late" : "";

      // For Supervisor: use selectedCenterId as contextId (since classId is empty)
      // For other roles: use classId
      const effectiveContextId =
        userRole === "Supervisor"
          ? selectedCenterId || "5767a18a-323a-4eac-b115-22dabcd9b8ae"
          : classId || "5767a18a-323a-4eac-b115-22dabcd9b8ae";

      const data: any = {
        userId: userId,
        attendance: selectedSelfAttendance?.toLowerCase(),
        attendanceDate: selectedDate,
        contextId: effectiveContextId,
        scope: scope,
        context: "cohort",
        absentReason: finalAbsentReason,
        reason: finalReason,
        remark: comment || "",
        validLocation: false,
      };

      if (userRole === "Supervisor") {
        data.lateMark = null;
      } else if (userRole === "Staff") {
        data.lateMark = isLate; // Use calculated isLate for Staff
        data.metaData = {
          workLocation: workLocationLabel || "",
        };
      } else {
        data.lateMark = isLate;
      }

      // Ensure latitude and longitude are always set (should not be 0)
      // Always require valid real-time device location for all roles
      if (
        !locationData ||
        locationData.latitude === 0 ||
        locationData.longitude === 0
      ) {
        console.error(
          "[SelfAttendance] Invalid location data - cannot proceed",
          locationData
        );
        showToastMessage(
          "GPS location not available. Please ensure: 1) Location/GPS is enabled, 2) Browser has location permission, 3) You have GPS signal, then try again.",
          "error"
        );
        setIsMarkingAttendance(false);
        return;
      }

      // Always set latitude and longitude for all roles (real-time device location)
      data.latitude = locationData.latitude;
      data.longitude = locationData.longitude;

      // No 50m validation when marking absent - validation only applies to "present" attendance
      const isAbsent =
        selectedSelfAttendance?.toLowerCase() === ATTENDANCE_ENUM.ABSENT;

      if (isAbsent) {
        // For absent attendance, no location validation needed
        data.validLocation = false;
      } else {
        // For present attendance, apply validation based on role
        // For Teachers and Supervisor, enforce 50m validation against center
        // For Staff with work_from_office, enforce 50m validation against office
        // For Staff with other work locations, no validation
        if (userRole === "Teacher" || userRole === "Supervisor") {
          let shouldValidate = true;

          // For Supervisor: check if selected center has coordinates
          // If not, skip validation
          if (userRole === "Supervisor") {
            const centerCoords = getSelectedCenterCoordinates();
            if (!centerCoords) {
              shouldValidate = false;
              console.log(
                "[SelfAttendance] Supervisor selected center has no coordinates. Skipping validation."
              );
            }
          }

          if (shouldValidate) {
            const validationResult = isLocationValid(locationData, false);
            data.validLocation = validationResult.valid;

            if (!validationResult.valid) {
              const distanceMsg =
                validationResult.distance !== undefined
                  ? `Distance from center: ${validationResult.distance.toFixed(
                      2
                    )}m`
                  : "Distance could not be computed.";
              showToastMessage(
                `${distanceMsg} You must be within 100 meters of the center to mark self attendance.`,
                "warning"
              );
              setIsSelfAttendanceModalOpen(false);
              setIsMarkingAttendance(false);
              return;
            }
          } else {
            data.validLocation = false;
          }
        } else if (
          userRole === "Staff" &&
          workLocation === "work_from_office"
        ) {
          // Staff with work_from_office: 50m validation commented out for now
          // No location validation - allow marking attendance regardless of distance
          data.validLocation = false;

          // COMMENTED OUT: 50m validation for work_from_office
          // // Staff with work_from_office: validate against office location
          console.log(
            "[Work From Office] Validating location for work_from_office",
            {
              workLocation: workLocation,
              userLocation: {
                latitude: locationData?.latitude,
                longitude: locationData?.longitude,
              },
              oblfCoordsCached: !!oblfOfficeCoords,
            }
          );

          // Fetch OBLF coordinates if not cached
          let oblfCoords = getOBLFOfficeCoordinates();
          if (!oblfCoords) {
            console.log(
              "[Work From Office] OBLF coordinates not cached, fetching now..."
            );
            const fetchedCoords = await fetchOBLFOfficeCoordinates();
            if (fetchedCoords) {
              oblfCoords = {
                latitude: fetchedCoords.latitude,
                longitude: fetchedCoords.longitude,
              };
            }
          }

          if (!oblfCoords) {
            console.error(
              "[Work From Office] OBLF Office coordinates not available. Cannot validate location."
            );
            showToastMessage(
              "OBLF Office location not found. Please try again or contact support.",
              "error"
            );
            setIsSelfAttendanceModalOpen(false);
            return;
          }

          const validationResult = isLocationValid(locationData, true);
          data.validLocation = validationResult.valid;

          console.log("[Work From Office] Validation result:", {
            valid: validationResult.valid,
            distance: validationResult.distance,
            oblfOffice: oblfOfficeCoords?.centerName || "OBLF Office",
            oblfCoords: {
              latitude: oblfCoords.latitude,
              longitude: oblfCoords.longitude,
            },
            userLocation: {
              latitude: locationData?.latitude,
              longitude: locationData?.longitude,
            },
          });

          if (!validationResult.valid) {
            const distanceMsg =
              validationResult.distance !== undefined
                ? `Distance from office: ${validationResult.distance.toFixed(
                    2
                  )}m`
                : "Distance could not be computed.";
            showToastMessage(
              `${distanceMsg} You must be within 100 meters of the office to mark attendance when working from office.`,
              "warning"
            );
            setIsSelfAttendanceModalOpen(false);
            return;
          }
        } else {
          // For Staff with other work locations (work_from_home, work_from_field, other), no validation
          data.validLocation = false;
        }
      }

      // Debug logging for Staff/Teacher role - final payload
      console.log(
        "[Self Attendance] Final payload being sent:",
        JSON.stringify(data, null, 2)
      );
      console.log("[Self Attendance] Payload fields check:", {
        hasRemark: !!data.remark,
        hasMetaData: !!data.metaData,
        remarkValue: data.remark,
        metaDataValue: data.metaData,
        workLocationInMetaData: data.metaData?.workLocation,
      });

      const response = await markAttendance(data);

      if (
        (response?.responseCode === 200 || response?.responseCode === 201) &&
        response?.params?.status === "successful"
      ) {
        const successMessage =
          response?.params?.successmessage || "Attendance marked successfully";
        showToastMessage(successMessage, "success");

        // Show late message if attendance was marked as late (for Teacher or Staff)
        if ((userRole === "Teacher" || userRole === "Staff") && isLate) {
          showToastMessage(
            "Your attendance has been marked as Late. Please ensure you arrive on time in the future.",
            "warning"
          );
        }

        setIsSelfAttendanceModalOpen(false);
        setSelectedSelfAttendance(null);
        setAbsentReason("");
        setWorkLocation("");
        setComment("");
        setCapturedLocation(null); // Clear captured location after successful submission

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
        // Refresh staff self-attendance for calendar if Staff/Supervisor
        if (userRole === "Staff" || userRole === "Supervisor") {
          fetchStaffSelfAttendanceForCalendar();
        }
        setIsMarkingAttendance(false);
      } else if (response?.responseCode === 400 || response?.params?.err) {
        const errorMessage =
          response?.params?.errmsg ||
          response?.params?.err ||
          "Something went wrong";
        showToastMessage(errorMessage, "error");
        setIsMarkingAttendance(false);
      } else {
        showToastMessage("Something went wrong", "error");
        setIsMarkingAttendance(false);
      }
    } catch (error) {
      console.error("Error marking self attendance:", error);
      showToastMessage("Something went wrong", "error");
      setIsMarkingAttendance(false);
    }
  };

  useEffect(() => {
    // For Supervisor: check selectedCenterId, for other roles: check classId
    const effectiveContextId =
      userRole === "Supervisor" ? selectedCenterId : classId;

    if (effectiveContextId && effectiveContextId !== "all") {
      fetchAttendanceData();
      fetchDayWiseAttendanceData();
      if (ShowSelfAttendance) {
        fetchSelfAttendance();
      }
      // Fetch self-attendance for all calendar dates if Staff/Supervisor
      if (userRole === "Staff" || userRole === "Supervisor") {
        fetchStaffSelfAttendanceForCalendar();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    classId,
    selectedCenterId,
    selectedDate,
    startDateRange,
    endDateRange,
    handleSaveHasRun,
    userRole,
  ]);

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
      const filters = { cohortId: classId, status: [Status.ACTIVE] };
      const memberResponse = await getMyCohortMemberList({
        limit,
        page,
        filters,
        includeArchived: false,
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

            if (member.memberStatus === "ARCHIVED") {
              return updatedAt > currentDate;
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

  // Helper: get selected batch slot timings for Teacher's self-attendance
  const getSelectedBatchSlotTiming = () => {
    if (!classId || !selectedDate) return null;

    // Always derive slot from cohortsData so it works for all centers/batches
    const selectedCohort: any = (cohortsData as any[]).find(
      (cohort: any) => cohort.cohortId === classId
    );

    let slot: string | undefined;

    if (selectedCohort) {
      const slotField =
        selectedCohort.cohortMemberCustomField?.find(
          (field: any) => field?.label?.toUpperCase() === "SLOTS"
        ) ||
        selectedCohort.customField?.find(
          (field: any) => field?.label?.toUpperCase() === "SLOTS"
        );

      slot = slotField?.selectedValues?.[0];
    }

    // Fallback to batchesData.slot if for some reason cohortsData doesn't carry slots
    if (!slot) {
      const selectedBatch = batchesData.find(
        (batch: any) => batch.batchId === classId
      );
      slot = selectedBatch?.slot;
    }

    if (!slot) return null;

    // Expecting format like "02:15 PM - 03:15 PM"
    const [startPart] = slot.split("-").map((s: string) => s.trim());
    if (!startPart) return null;

    const [time, meridian] = startPart.split(" ");
    if (!time || !meridian) return null;

    const [hourStr, minuteStr] = time.split(":");
    let hour = parseInt(hourStr || "0", 10);
    const minute = parseInt(minuteStr || "0", 10);

    if (meridian.toUpperCase() === "PM" && hour < 12) {
      hour += 12;
    } else if (meridian.toUpperCase() === "AM" && hour === 12) {
      hour = 0;
    }

    const slotStart = new Date(selectedDate);
    if (Number.isNaN(slotStart.getTime())) return null;

    slotStart.setHours(hour, minute, 0, 0);

    const enableTime = new Date(slotStart.getTime() - 5 * 60 * 1000); // 5 min before start
    const lateThreshold = new Date(slotStart.getTime() + 5 * 60 * 1000); // 5 min after start

    return { slotStart, enableTime, lateThreshold };
  };

  // Helper: get late threshold (9:35 AM) for Staff's self-attendance
  // No fixed time - staff can mark attendance anytime, but late is true after 9:35 AM
  // Helper: get late threshold (9:35 AM) for Staff's self-attendance
  // No fixed time - staff can mark attendance anytime, but late is true after 9:35 AM
  const getStaffFixedTiming = () => {
    if (!selectedDate) return null;

    const dateForThreshold = new Date(selectedDate);
    if (Number.isNaN(dateForThreshold.getTime())) return null;

    // Late threshold is 9:35 AM - staff can mark anytime, but after this time late flag is true
    dateForThreshold.setHours(9, 35, 0, 0);

    return { lateThreshold: dateForThreshold };
  };

  const calendarDays = generateCalendarData();

  const handleDateClick = (dateString: string) => {
    setSelectedDate(dateString);
  };

  const handleCalendarClick = () => {
    if (isCalendarLoading) return;
    setIsCalendarLoading(true);
    const targetUrl =
      classId && classId !== "all"
        ? `/attendance-history?classId=${classId}`
        : "/attendance-history";
    router.push(targetUrl);
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
    
     const telemetryInteract = {
            context: { env: "prod", cdata: [] },
            edata: {
              id: "profile-click",
              type: "CLICK",
              pageid: `Profile menu`,
              uid: localStorage.getItem("userId") || "Anonymous",
            },
          };
          telemetryFactory.interact(telemetryInteract);
      
    router.push("/profile");
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    const telemetryInteract = {
            context: { env: "prod", cdata: [] },
            edata: {
              id: "logout-click",
              type: "CLICK",
              pageid: `logout`,
              uid: localStorage.getItem("userId") || "Anonymous",
            },
          };
          telemetryFactory.interact(telemetryInteract);
    setLogoutModalOpen(true);
    setAnchorEl(null);
  };

  const performLogout = () => {
    router.push("/logout");
  };

  const handleTopTabChange = (_: React.SyntheticEvent, value: string) => {
    switch (value) {
      case "content":
        router.push("/dashboard?tab=1");
        break;
      case "Course":
        router.push("/dashboard?tab=2");
        break;
      case "groups":
        router.push("/dashboard?tab=3");
        break;
      case "myClasses":
        router.push("/my-classes");
        break;
      default:
        break;
    }
  };

  console.log("centersData", centersData);
  console.log(
    "userRole for center dropdown:",
    userRole,
    "Should show:",
    userRole !== "Staff"
  );
  console.log(
    "centersData types:",
    centersData.map((c: any) => ({
      name: c.centerName,
      type: c.hierarchyData?.type || "unknown",
    }))
  );

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
                  display: { xs: "none", sm: "block" },
                  flexShrink: 0,
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
        <Box
          sx={{
            px: { xs: 2, md: 4 },
            pb: { xs: 4, md: 6 },
            width: "100%",
            maxWidth: "100%",
            overflowX: "hidden",
            boxSizing: "border-box",
          }}
        >
          <Tabs
            value="attendance"
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
                display: { xs: "flex", md: "none" },
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
            <Tab
              label={t("LEARNER_APP.COMMON.CONTENT")}
              value="content"
              sx={{
                display:
                  userRole === "Staff" || userRole === "Supervisor"
                    ? "none"
                    : "inline-flex",
              }}
            />
            <Tab
              label={t("LEARNER_APP.COMMON.COURSES")}
              value="Course"
              sx={{
                display:
                  userRole === "Staff" || userRole === "Supervisor"
                    ? "none"
                    : "inline-flex",
              }}
            />
            <Tab
              label={t("LEARNER_APP.COMMON.GROUPS")}
              value="groups"
              sx={{
                display:
                  userRole === "Staff" || userRole === "Supervisor"
                    ? "none"
                    : "inline-flex",
              }}
            />
            <Tab
              label={t("LEARNER_APP.COMMON.ATTENDANCE")}
              value="attendance"
            />
            <Tab
              label={t("LEARNER_APP.COMMON.MY_CLASSES") || "My Classes"}
              value="myClasses"
              sx={{
                display:
                  userRole === "Staff" || userRole === "Supervisor"
                    ? "none"
                    : "inline-flex",
              }}
            />
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
                        padding={{
                          xs: "1rem 1rem 1rem 1rem",
                          md: "2rem 2.5rem 1.5rem 1.5rem",
                        }}
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
                          {/* Center and Batch Selection - Hidden for Staff, Center only for Supervisor */}
                          {userRole !== "Staff" && (
                            <Box
                              sx={{
                                display: "flex",
                                gap: { xs: "0.5rem", md: "1rem" },
                                alignItems: "center",
                                flexDirection: { xs: "column", sm: "row" },
                                width: { xs: "100%", md: "auto" },
                              }}
                            >
                              {/* Center Selection - Visible for Supervisor and non-Staff roles */}
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
                                  <InputLabel sx={{ color: secondaryColor }}>
                                    {t("LEARNER_APP.COMMON.CENTER")}
                                  </InputLabel>
                                  <Select
                                    value={selectedCenterId || ""}
                                    label={t("LEARNER_APP.COMMON.CENTER")}
                                    onChange={handleCenterChange}
                                    disabled={
                                      loading || centersData.length === 0
                                    }
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
                                    {centersData.length > 0 ? (
                                      centersData.map((center) => (
                                        <MenuItem
                                          key={center.centerId}
                                          value={center.centerId}
                                          sx={{ color: secondaryColor }}
                                        >
                                          {center.centerName}
                                        </MenuItem>
                                      ))
                                    ) : (
                                      <MenuItem disabled value="">
                                        {loading
                                          ? "Loading centers..."
                                          : "No centers available"}
                                      </MenuItem>
                                    )}
                                  </Select>
                                </FormControl>
                              </Box>

                              {/* Batch Selection - Hidden for Supervisor, visible for non-Staff/Supervisor roles */}
                              {userRole !== "Supervisor" &&
                                batchesData.length > 0 && (
                                  <Box
                                    sx={{ width: { xs: "100%", sm: "auto" } }}
                                  >
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
                                      <InputLabel
                                        sx={{ color: secondaryColor }}
                                      >
                                        {t("LEARNER_APP.COMMON.BATCH")}
                                      </InputLabel>
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
                                          <MenuItem
                                            key={batch.batchId}
                                            value={batch.batchId}
                                            sx={{ color: secondaryColor }}
                                          >
                                            {batch.batchName}
                                            {batch.slot
                                              ? ` (${batch.slot})`
                                              : ""}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </Box>
                                )}
                            </Box>
                          )}

                          <Box
                            display={"flex"}
                            sx={{
                              color: theme.palette.secondary.main,
                              gap: { xs: "4px", sm: "6px", md: "8px" },
                              alignItems: "center",
                              backgroundColor: "white",
                              padding: {
                                xs: "6px 12px",
                                sm: "7px 14px",
                                md: "8px 16px",
                              },
                              borderRadius: { xs: "6px", md: "8px" },
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                              border: "1px solid rgba(0,0,0,0.05)",
                              transition: "all 0.2s",
                              width: { xs: "100%", sm: "auto" },
                              justifyContent: {
                                xs: "space-between",
                                sm: "flex-start",
                              },
                              cursor: "pointer",
                              "&:hover": {
                                boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                                transform: {
                                  xs: "none",
                                  md: "translateY(-1px)",
                                },
                              },
                              opacity: isCalendarLoading ? 0.7 : 1,
                            }}
                            onClick={handleCalendarClick}
                          >
                            <Typography
                              sx={{
                                fontWeight: "600",
                                minWidth: {
                                  xs: "auto",
                                  sm: "120px",
                                  md: "140px",
                                },
                                textAlign: "center",
                                fontSize: {
                                  xs: "13px",
                                  sm: "14px",
                                  md: "15px",
                                },
                                color: secondaryColor,
                                flex: { xs: 1, sm: "none" },
                                cursor: "pointer",
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
                                fontSize: {
                                  xs: "14px",
                                  sm: "15px",
                                  md: "16px",
                                },
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
                            {isCalendarLoading && (
                              <CircularProgress
                                size={18}
                                sx={{ ml: 1, color: secondaryColor }}
                              />
                            )}
                          </Box>
                        </Box>

                        <CalendarContainer>
                          <HorizontalCalendarScroll>
                            {calendarDays.map((dayData, index) => {
                              const dateAttendance =
                                dayWiseAttendanceData[dayData.dateString] ||
                                null;
                              const isSelected =
                                dayData.dateString === selectedDate;
                              const isMarked =
                                dateAttendance && dateAttendance.totalCount > 0;
                              const attendancePercentage =
                                dateAttendance?.percentage || 0;

                              // For Staff/Supervisor: check self-attendance status for this date
                              const staffSelfAttendance =
                                userRole === "Staff" ||
                                userRole === "Supervisor"
                                  ? staffSelfAttendanceByDate[
                                      dayData.dateString
                                    ]
                                  : null;
                              const isStaffPresent =
                                staffSelfAttendance === "present";
                              const isStaffAbsent =
                                staffSelfAttendance === "absent";

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
                                      fontSize: {
                                        xs: "0.65em",
                                        sm: "0.7em",
                                        md: "0.75em",
                                      },
                                      fontWeight: "700",
                                      color: isToday
                                        ? primaryColor
                                        : secondaryColor,
                                      lineHeight: 1,
                                      marginBottom: { xs: "2px", md: "4px" },
                                      textTransform: "uppercase",
                                      letterSpacing: {
                                        xs: "0.3px",
                                        md: "0.5px",
                                      },
                                    }}
                                  >
                                    {isToday
                                      ? t("LEARNER_APP.ATTENDANCE.TODAY")
                                      : dayData.day}
                                  </Typography>
                                  <CalendarCell
                                    onClick={() =>
                                      handleDateClick(dayData.dateString)
                                    }
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
                                      borderWidth:
                                        isSelected || isToday ? "2px" : "1px",
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
                                    {/* For Staff/Supervisor: Show green/red circular progress ring based on self-attendance */}
                                    {(userRole === "Staff" ||
                                      userRole === "Supervisor") &&
                                    (isStaffPresent || isStaffAbsent) ? (
                                      <Box
                                        sx={{
                                          position: "relative",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          width: {
                                            xs: "16px",
                                            sm: "18px",
                                            md: "20px",
                                          },
                                          height: {
                                            xs: "16px",
                                            sm: "18px",
                                            md: "20px",
                                          },
                                          marginTop: { xs: "1px", md: "2px" },
                                        }}
                                      >
                                        <CircularProgress
                                          variant="determinate"
                                          value={100}
                                          size={20}
                                          thickness={10}
                                          sx={{
                                            color: isStaffPresent
                                              ? theme.palette.success.main
                                              : theme.palette.error.main,
                                            position: "absolute",
                                            width: {
                                              xs: "16px",
                                              sm: "18px",
                                              md: "20px",
                                            },
                                            height: {
                                              xs: "16px",
                                              sm: "18px",
                                              md: "20px",
                                            },
                                            "& .MuiCircularProgress-circle": {
                                              strokeLinecap: "round",
                                              stroke: isStaffPresent
                                                ? theme.palette.success.main
                                                : theme.palette.error.main,
                                            },
                                          }}
                                        />
                                      </Box>
                                    ) : isMarked ? (
                                      /* For Teacher: Show circular progress as before */
                                      <Box
                                        sx={{
                                          position: "relative",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          width: {
                                            xs: "16px",
                                            sm: "18px",
                                            md: "20px",
                                          },
                                          height: {
                                            xs: "16px",
                                            sm: "18px",
                                            md: "20px",
                                          },
                                          marginTop: { xs: "1px", md: "2px" },
                                        }}
                                      >
                                        <CircularProgress
                                          variant="determinate"
                                          value={attendancePercentage}
                                          size={20}
                                          thickness={10}
                                          sx={{
                                            color:
                                              attendancePercentage >= 75
                                                ? theme.palette.success.main
                                                : theme.palette.error.main,
                                            position: "absolute",
                                            width: {
                                              xs: "16px",
                                              sm: "18px",
                                              md: "20px",
                                            },
                                            height: {
                                              xs: "16px",
                                              sm: "18px",
                                              md: "20px",
                                            },
                                            "& .MuiCircularProgress-circle": {
                                              strokeLinecap: "round",
                                              stroke:
                                                attendancePercentage >= 75
                                                  ? theme.palette.success.main
                                                  : theme.palette.error.main,
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

                      <Box
                        sx={{
                          padding: { xs: "0 10px", sm: "0 15px", md: "0 20px" },
                        }}
                      >
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
                      {userRole !== "Staff" && userRole !== "Supervisor" && (
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
                            background: `linear-gradient(135deg, ${alpha(
                              backgroundColor,
                              0.8
                            )} 0%, ${backgroundColor} 100%)`,
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
                                  <Box
                                    sx={{
                                      width: {
                                        xs: "24px",
                                        sm: "28px",
                                        md: "30px",
                                      },
                                      height: {
                                        xs: "24px",
                                        sm: "28px",
                                        md: "30px",
                                      },
                                    }}
                                  >
                                    <CircularProgressbar
                                      value={
                                        attendanceData?.numberOfCohortMembers &&
                                        attendanceData.numberOfCohortMembers !==
                                          0
                                          ? (attendanceData.presentCount /
                                              attendanceData.numberOfCohortMembers) *
                                            100
                                          : 0
                                      }
                                      styles={buildStyles({
                                        pathColor: primaryColor,
                                        trailColor: alpha(secondaryColor, 0.15),
                                        strokeLinecap: "round",
                                        backgroundColor: alpha(
                                          backgroundColor,
                                          0.5
                                        ),
                                      })}
                                      strokeWidth={20}
                                      background
                                      backgroundPadding={6}
                                    />
                                  </Box>
                                  <Box>
                                    <Typography
                                      sx={{
                                        fontSize: {
                                          xs: "12px",
                                          sm: "13px",
                                          md: "14px",
                                        },
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
                                      {t(
                                        "LEARNER_APP.ATTENDANCE.ATTENDANCE_PERCENTAGE"
                                      )}
                                    </Typography>
                                    <Typography
                                      sx={{
                                        fontSize: {
                                          xs: "11px",
                                          sm: "12px",
                                          md: "13px",
                                        },
                                        fontWeight: "500",
                                        color: alpha(secondaryColor, 0.6),
                                        marginTop: "2px",
                                      }}
                                      variant="body2"
                                    >
                                      ({attendanceData.presentCount}/
                                      {attendanceData.numberOfCohortMembers}{" "}
                                      {t(
                                        "LEARNER_APP.ATTENDANCE.PRESENT_LABEL"
                                      )}
                                      )
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
                                {t(
                                  "LEARNER_APP.ATTENDANCE.FUTURE_DATE_CANT_MARK"
                                )}
                              </Typography>
                            )}
                          </Box>
                          <Button
                            className="btn-mark-width"
                            variant="contained"
                            sx={{
                              minWidth: {
                                xs: "100%",
                                sm: "100px",
                                md: "120px",
                              },
                              height: {
                                xs: "2.25rem",
                                sm: "2.5rem",
                                md: "2.75rem",
                              },
                              padding: {
                                xs: theme.spacing(1),
                                sm: theme.spacing(1.25),
                                md: theme.spacing(1.5),
                              },
                              fontWeight: "600",
                              fontSize: { xs: "12px", sm: "13px", md: "14px" },
                              borderRadius: { xs: "6px", md: "8px" },
                              backgroundColor: primaryColor,
                              color: getContrastTextColor(primaryColor),
                              boxShadow: `0 4px 12px ${alpha(
                                primaryColor,
                                0.4
                              )}`,
                              "&:hover": {
                                backgroundColor: primaryColor,
                                boxShadow: `0 6px 16px ${alpha(
                                  primaryColor,
                                  0.5
                                )}`,
                                transform: {
                                  xs: "none",
                                  md: "translateY(-1px)",
                                },
                              },
                              transition: "all 0.2s",
                            }}
                            disabled={classId === "all"}
                            onClick={handleMarkAttendanceClick}
                          >
                            {currentAttendance === "notMarked"
                              ? t("LEARNER_APP.ATTENDANCE.MARK")
                              : t("LEARNER_APP.ATTENDANCE.MODIFY")}
                          </Button>
                        </Box>
                      )}

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
                            background: `linear-gradient(135deg, ${alpha(
                              backgroundColor,
                              0.8
                            )} 0%, ${backgroundColor} 100%)`,
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
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              px: 1.5,
                              py: 0.75,
                              borderRadius: "999px",
                              backgroundColor:
                                selfAttendanceData[0]?.attendance?.toLowerCase() ===
                                ATTENDANCE_ENUM.PRESENT
                                  ? alpha(theme.palette.success.main, 0.12)
                                  : selfAttendanceData[0]?.attendance?.toLowerCase() ===
                                    ATTENDANCE_ENUM.ABSENT
                                  ? alpha(theme.palette.error.main, 0.12)
                                  : alpha(secondaryColor, 0.08),
                            }}
                          >
                            {selfAttendanceData?.length > 0 ? (
                              <Box display={"flex"} alignItems={"center"}>
                                <Typography
                                  sx={{
                                    color: secondaryColor,
                                    fontWeight: "600",
                                    fontSize: {
                                      xs: "0.85rem",
                                      sm: "0.9rem",
                                      md: "0.95rem",
                                    },
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
                                {t(
                                  "LEARNER_APP.ATTENDANCE.NOT_MARKED_FOR_SELF"
                                )}
                              </Typography>
                            )}
                          </Box>
                          <Button
                            className="btn-mark-width"
                            variant="contained"
                            sx={{
                              minWidth: {
                                xs: "100%",
                                sm: "100px",
                                md: "120px",
                              },
                              height: {
                                xs: "2.25rem",
                                sm: "2.5rem",
                                md: "2.75rem",
                              },
                              padding: {
                                xs: theme.spacing(1),
                                sm: theme.spacing(1.25),
                                md: theme.spacing(1.5),
                              },
                              fontWeight: "600",
                              fontSize: { xs: "12px", sm: "12px", md: "13px" },
                              borderRadius: { xs: "6px", md: "8px" },
                              backgroundColor:
                                selfAttendanceData?.[0]?.attendance?.toLowerCase() ===
                                ATTENDANCE_ENUM.PRESENT
                                  ? theme.palette.success.main
                                  : selfAttendanceData?.[0]?.attendance?.toLowerCase() ===
                                    ATTENDANCE_ENUM.ABSENT
                                  ? theme.palette.error.main
                                  : primaryColor,
                              color: getContrastTextColor(
                                selfAttendanceData?.[0]?.attendance?.toLowerCase() ===
                                  ATTENDANCE_ENUM.PRESENT
                                  ? theme.palette.success.main
                                  : selfAttendanceData?.[0]?.attendance?.toLowerCase() ===
                                    ATTENDANCE_ENUM.ABSENT
                                  ? theme.palette.error.main
                                  : primaryColor
                              ),
                              boxShadow: `0 4px 12px ${alpha(
                                primaryColor,
                                0.4
                              )}`,
                              "&:hover": {
                                backgroundColor:
                                  selfAttendanceData?.[0]?.attendance?.toLowerCase() ===
                                  ATTENDANCE_ENUM.PRESENT
                                    ? alpha(theme.palette.success.main, 0.85)
                                    : selfAttendanceData?.[0]?.attendance?.toLowerCase() ===
                                      ATTENDANCE_ENUM.ABSENT
                                    ? alpha(theme.palette.error.main, 0.85)
                                    : primaryColor,
                                boxShadow: `0 6px 16px ${alpha(
                                  primaryColor,
                                  0.5
                                )}`,
                                transform: "translateY(-1px)",
                              },
                              transition: "all 0.2s",
                            }}
                            disabled={
                              userRole === "Supervisor"
                                ? !selectedCenterId ||
                                  selectedCenterId === "all"
                                : !classId || classId === "all"
                            }
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
                    {userRole !== "Staff" && userRole !== "Supervisor" && (
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
                            borderBottom: `2px solid ${alpha(
                              primaryColor,
                              0.2
                            )}`,
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
                            <Typography
                              variant="body2"
                              color={alpha(secondaryColor, 0.6)}
                              sx={{ fontSize: "13px" }}
                            >
                              {t("LEARNER_APP.ATTENDANCE.LAST_7_DAYS")}{" "}
                              {dateRange}
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
                                e.currentTarget.style.color = alpha(
                                  primaryColor,
                                  0.8
                                );
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
                          <Typography color={secondaryColor}>
                            Loading...
                          </Typography>
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
                                          sx={{
                                            mb: 1.5,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                          }}
                                        >
                                          {t(
                                            "LEARNER_APP.ATTENDANCE.CENTER_ATTENDANCE"
                                          )}
                                        </Typography>
                                        {allCenterAttendanceData.length > 0 ? (
                                          allCenterAttendanceData.map(
                                            (item: any, index: number) => (
                                              <Box
                                                key={item.userId || index}
                                                mb={
                                                  index <
                                                  allCenterAttendanceData.length -
                                                    1
                                                    ? 2
                                                    : 0
                                                }
                                              >
                                                <Typography
                                                  fontSize={"11px"}
                                                  color={alpha(
                                                    secondaryColor,
                                                    0.6
                                                  )}
                                                  sx={{ mb: 0.5 }}
                                                >
                                                  {item.name}
                                                </Typography>
                                                <Typography
                                                  fontWeight="700"
                                                  color={primaryColor}
                                                  sx={{
                                                    fontSize: "24px",
                                                    lineHeight: 1.2,
                                                  }}
                                                >
                                                  {item.presentPercentage}%
                                                </Typography>
                                              </Box>
                                            )
                                          )
                                        ) : (
                                          <Typography
                                            fontWeight="700"
                                            color={primaryColor}
                                            sx={{
                                              fontSize: "28px",
                                              lineHeight: 1.2,
                                              mb: 0.5,
                                            }}
                                          >
                                            {cohortPresentPercentage ===
                                            t(
                                              "LEARNER_APP.ATTENDANCE.NO_ATTENDANCE"
                                            )
                                              ? cohortPresentPercentage
                                              : `${cohortPresentPercentage}%`}
                                          </Typography>
                                        )}
                                        {allCenterAttendanceData.length === 0 &&
                                          cohortPresentPercentage !==
                                            t(
                                              "LEARNER_APP.ATTENDANCE.NO_ATTENDANCE"
                                            ) && (
                                            <Typography
                                              variant="caption"
                                              color={alpha(secondaryColor, 0.6)}
                                              sx={{ fontSize: "11px" }}
                                            >
                                              {t(
                                                "LEARNER_APP.ATTENDANCE.OVERALL_ATTENDANCE"
                                              )}
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
                                          sx={{
                                            mb: 1.5,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                          }}
                                        >
                                          {t(
                                            "LEARNER_APP.ATTENDANCE.LOW_ATTENDANCE_LEARNERS"
                                          )}
                                        </Typography>
                                        <Typography
                                          fontWeight="500"
                                          color={alpha(secondaryColor, 0.6)}
                                          sx={{
                                            fontSize: "15px",
                                            lineHeight: 1.6,
                                          }}
                                        >
                                          {Array.isArray(
                                            lowAttendanceLearnerList
                                          ) &&
                                          lowAttendanceLearnerList.length >
                                            0 ? (
                                            <>
                                              {lowAttendanceLearnerList
                                                .slice(0, 2)
                                                .join(", ")}
                                              {lowAttendanceLearnerList.length >
                                                2 && (
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
                                              {t(
                                                "LEARNER_APP.ATTENDANCE.NO_LEARNERS_LOW_ATTENDANCE"
                                              )}
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
                                          sx={{
                                            fontSize: "16px",
                                            lineHeight: 1,
                                          }}
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
                    )}
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
          isLoading={isMarkingAttendance}
          onClose={() => {
            if (!isMarkingAttendance) {
              setIsSelfAttendanceModalOpen(false);
              const currentAttendance = selfAttendanceData?.[0]?.attendance;
              setSelectedSelfAttendance(
                currentAttendance ? currentAttendance.toLowerCase() : null
              );
              setAbsentReason("");
              setWorkLocation("");
              setComment("");
              // Don't clear capturedLocation here - keep it for retry
            }
          }}
          handlePrimaryAction={() => {
            if (selectedSelfAttendance && !isMarkingAttendance) {
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
                boxShadow:
                  selectedSelfAttendance === ATTENDANCE_ENUM.PRESENT
                    ? `0 0 0 2px ${alpha(theme.palette.success.main, 0.4)}`
                    : "none",
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
                boxShadow:
                  selectedSelfAttendance === ATTENDANCE_ENUM.ABSENT
                    ? `0 0 0 2px ${alpha(theme.palette.error.main, 0.4)}`
                    : "none",
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

            {/* Conditional Fields based on Role and Attendance Selection */}

            {/* For Staff: Work Location dropdown when Present is selected (Supervisor doesn't need it) */}
            {userRole === "Staff" &&
              selectedSelfAttendance === ATTENDANCE_ENUM.PRESENT && (
                <Box sx={{ mt: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel id="work-location-label">
                      Work Location
                    </InputLabel>
                    <Select
                      labelId="work-location-label"
                      value={workLocation}
                      onChange={(e) => setWorkLocation(e.target.value)}
                      label="Work Location"
                      sx={{
                        mt: 1,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: alpha(secondaryColor, 0.3),
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: primaryColor,
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: primaryColor,
                        },
                      }}
                    >
                      {workLocationOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

            {/* For Teacher: Comment Autocomplete when Present is selected */}
            {userRole === "Teacher" &&
              selectedSelfAttendance === ATTENDANCE_ENUM.PRESENT && (
                <Box sx={{ p: 0.5, pt: 2.5, borderRadius: "12px" }}>
                  <Autocomplete
                    freeSolo
                    fullWidth
                    options={attendanceCommentOptions}
                    value={comment}
                    onChange={(event, newValue) => {
                      setComment(newValue || "");
                    }}
                    onInputChange={(event, newInputValue) => {
                      setComment(newInputValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        label="Comment"
                        multiline
                        rows={3}
                        placeholder="Type to search or add custom comment..."
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: alpha(secondaryColor, 0.3),
                            },
                            "&:hover fieldset": {
                              borderColor: primaryColor,
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: primaryColor,
                            },
                          },
                        }}
                      />
                    )}
                  />
                </Box>
              )}

            {/* For Staff/Supervisor: Comment text box when Present is selected */}
            {(userRole === "Staff" || userRole === "Supervisor") &&
              selectedSelfAttendance === ATTENDANCE_ENUM.PRESENT && (
                <Box sx={{ mt: 3 }}>
                  <TextField
                    fullWidth
                    label="Comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Enter comment"
                    sx={{
                      mt: 1,
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: alpha(secondaryColor, 0.3),
                        },
                        "&:hover fieldset": {
                          borderColor: primaryColor,
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: primaryColor,
                        },
                      },
                    }}
                  />
                </Box>
              )}

            {/* For Teacher & Staff: Absent Reason dropdown when Absent is selected */}
            {selectedSelfAttendance === ATTENDANCE_ENUM.ABSENT && (
              <Box sx={{ mt: 3 }}>
                <FormControl fullWidth>
                  <InputLabel id="absent-reason-label">
                    Reason for Absence
                  </InputLabel>
                  <Select
                    labelId="absent-reason-label"
                    value={absentReason}
                    onChange={(e) => setAbsentReason(e.target.value)}
                    label="Reason for Absence"
                    sx={{
                      mt: 1,
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: alpha(secondaryColor, 0.3),
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: primaryColor,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: primaryColor,
                      },
                    }}
                  >
                    {(() => {
                      // For Teacher: combine common options + teacher-only options
                      // For Staff/Supervisor: only common options
                      const optionsToShow =
                        userRole === "Teacher"
                          ? [
                              ...absentReasonOptions,
                              ...teacherOnlyAbsentReasonOptions,
                            ]
                          : absentReasonOptions;

                      return optionsToShow.map((option) => (
                        <MenuItem key={option.label} value={option.value}>
                          {option.value}
                        </MenuItem>
                      ));
                    })()}
                  </Select>
                </FormControl>
              </Box>
            )}
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
        buttonNames={{
          primary: t("COMMON.LOGOUT"),
          secondary: t("COMMON.CANCEL"),
        }}
      />
    </Layout>
  );
};

export default SimpleTeacherDashboard;
