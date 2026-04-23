/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Stack,
  Divider,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Radio,
  // Link,
  styled,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";
import { format, isAfter, isValid, parse, startOfDay } from "date-fns";
import { useTheme } from "@mui/material/styles";
import ArrowForwardSharpIcon from "@mui/icons-material/ArrowForwardSharp";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PeopleIcon from "@mui/icons-material/People";
import {
  classesMissedAttendancePercentList,
  getAllCenterAttendance,
  getCohortAttendance,
  markAttendance,
  getLearnerAttendanceStatus,
} from "../services/AttendanceService";
import { ShowSelfAttendance } from "../../app.config";
import { getCohortList } from "../services/CohortServices";
import { getMyCohortMemberList } from "../services/MyClassDetailsService";
import { getUserDetails } from "../services/ProfileService";
import {
  AttendancePercentageProps,
  CohortAttendancePercentParam,
  CohortMemberList,
  CustomField,
  ICohort,
} from "../utils/interfaces";
import {
  getTodayDate,
  shortDateFormat,
  ATTENDANCE_ENUM,
} from "../utils/Helper";
import ModalComponent from "../components/Modal";
import MarkBulkAttendance from "../components/MarkBulkAttendance"; // ADD THIS IMPORT
import { showToastMessage } from "../components/Toastify"; // ADD THIS IMPORT
import { fetchAttendanceDetails } from "../components/AttendanceDetails";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import LocationModal from "./LocationModal";
import useGeolocation from "./useGeoLocation";
// Styled components
const DashboardContainer = styled(Box)({
  minHeight: "100vh",
  backgroundColor: "#f5f5f5",
  marginRight: "20px",
});

const HeaderBox = styled(Box)({
  display: "flex",
  justifyContent: "center",
});

const HeaderContent = styled(Box)(({ theme }) => ({
  display: "flex",
  width: "100%",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: (theme.palette.warning as any).A400,
  padding: "1rem 1.5rem",
}));

const MainContent = styled(Box)({
  display: "flex",
  justifyContent: "center",
});

const ContentWrapper = styled(Box)({
  paddingBottom: "25px",
  width: "100%",
  background: "linear-gradient(180deg, #fffdf7 0%, #f8efda 100%)",
  borderRadius: "8px",
});

const StatusCard = styled(Card)(({ theme }) => ({
  height: "100%",
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  border: "1px solid #e0e0e0",
  "& .MuiCardContent-root": {
    padding: "16px",
  },
}));

const CardHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  marginBottom: "16px",
});

const CardIcon = styled(Box)({
  fontSize: "18px",
  marginRight: "8px",
  padding: "6px",
  borderRadius: "4px",
});

const CalendarContainer = styled(Box)({
  marginTop: "16px",
});

const HorizontalCalendarScroll = styled(Box)({
  display: "flex",
  overflowX: "auto",
  gap: "8px",
  padding: "8px 0",
  "&::-webkit-scrollbar": {
    height: "4px",
  },
  "&::-webkit-scrollbar-track": {
    background: "#f1f1f1",
    borderRadius: "2px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "#c1c1c1",
    borderRadius: "2px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: "#a8a8a8",
  },
});

const CalendarCell = styled(Box)(({ theme }) => ({
  position: "relative",
  height: "3.5rem",
  width: "3rem",
  minWidth: "3rem",
  padding: "4px",
  overflow: "hidden",
  fontSize: "0.875em",
  border: `1px solid ${(theme.palette.warning as any).A100}`,
  borderRadius: "4px",
  cursor: "pointer",
  transition: "0.25s ease-out",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "center",
  backgroundColor: "#fff",
  "&:hover": {
    backgroundColor: "#f5f5f5",
  },
}));

const DayHeader = styled(Typography)({
  fontSize: "0.7em",
  fontWeight: "600",
  color: "#666",
  lineHeight: 1,
  marginBottom: "2px",
});

const DateNumber = styled(Typography)({
  fontSize: "0.875em",
  fontWeight: "500",
  lineHeight: 1,
  marginTop: "2px",
});

const LearnerTag = styled(Box)({
  display: "inline-block",
  backgroundColor: "#fffbe6",
  border: "1px solid #ffe58f",
  color: "#faad14",
  borderRadius: "4px",
  padding: "4px 8px",
  fontSize: "12px",
  margin: "2px",
});

const SimpleTeacherDashboard = () => {
  const theme = useTheme();
  const [classId, setClassId] = useState("1");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [yearSelect, setYearSelect] = useState("2024-2025 (Active)");
  const [cohortsData, setCohortsData] = useState<Array<ICohort>>([]);
  const [centersData, setCentersData] = useState<Array<any>>([]);
  const [batchesData, setBatchesData] = useState<Array<any>>([]);
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [open, setOpen] = useState(false);
  const [isRemoteCohort, setIsRemoteCohort] = useState(false);
  const [cohortPresentPercentage, setCohortPresentPercentage] =
    useState("No Attendance");
  const [lowAttendanceLearnerList, setLowAttendanceLearnerList] = useState<any>(
    "No Learners with Low Attendance"
  );
  const [allCenterAttendanceData, setAllCenterAttendanceData] = useState<any>(
    []
  );
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [startDateRange, setStartDateRange] = useState("");
  const [endDateRange, setEndDateRange] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [selectedDate, setSelectedDate] = React.useState<string>(
    getTodayDate()
  );
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
  const [attendanceLocation, setAttendanceLocation] =
    useState<GeolocationPosition | null>(null);
  const [handleSaveHasRun, setHandleSaveHasRun] = useState(false);
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [dayWiseAttendanceData, setDayWiseAttendanceData] = useState<{
    [date: string]: {
      presentCount: number;
      absentCount: number;
      totalCount: number;
      percentage: number;
    };
  }>({});
  const router = useRouter();
  const { getLocation } = useGeolocation();
  // Get current month and year for display (showing last 30 days)
  const today = new Date();
  const currentMonth = today.toLocaleString("default", {
    month: "long",
  });
  const currentYear = today.getFullYear();
  const handleModalToggle = () => {
    setOpen(!open);
    // Add telemetry if needed
    // telemetryFactory.interact(telemetryInteract);
  };

  const handleClose = () => {
    setOpen(false);
    setIsRemoteCohort(false);
  };
  // ADD THIS FUNCTION TO HANDLE ATTENDANCE DATA UPDATE
  const handleAttendanceDataUpdate = (data: any) => {
    console.log("Updating attendance data:", data);
    setAttendanceData(data);
  };
  const handleRemoteSession = () => {
    try {
      // Check if it's a remote cohort (you might need to adjust this logic based on your data)
      const teacherApp = JSON.parse(
        localStorage.getItem("teacherApp") ?? "null"
      );
      const cohort = teacherApp?.state?.cohorts?.find?.(
        (c: any) => c.cohortId === classId
      );
      const REMOTE_COHORT_TYPE = "REMOTE" as const;

      if (cohort?.cohortType === REMOTE_COHORT_TYPE) {
        // if (true) {
        setIsRemoteCohort(true);
        // ReactGA.event('mark/modify-attendance-button-clicked-dashboard', {
        //   teacherId: userId,
        // });
      } else {
        handleModalToggle();
      }
    } catch (error) {
      console.error("Error parsing teacher app data:", error);
      handleModalToggle();
    }
  };
  // Initialize user and data
  useEffect(() => {
    const initializeDashboard = async () => {
      if (typeof window !== "undefined" && window.localStorage) {
        const token = localStorage.getItem("token");
        const storedUserId = localStorage.getItem("userId");
        const storedAcademicYearId = localStorage.getItem("academicYearId");
        if (token) {
          setIsAuthenticated(true);
          setUserId(storedUserId);
          setAcademicYearId(storedAcademicYearId);
          await fetchUserCohorts(storedUserId);
        } else {
          router.push("/login");
        }
      }
    };

    initializeDashboard();
  }, []);

  // Fetch user cohorts
  const fetchUserCohorts = async (userId: string | null) => {
    if (!userId) return;

    try {
      setLoading(true);
      const headers: { [key: string]: string } = {};
      if (academicYearId) {
        headers["academicYearId"] = academicYearId;
      }
      const response = await getCohortList(userId, {
        customField: "true",
        children: "true",
      });
      const userDetails = await getUserDetails(userId, true);
      console.log("getCohortList==", response);
      if (response && response.length > 0) {
        setCohortsData(response);
        setClassId(response[0]?.cohortId || "");
        // Extract centers (parent cohorts)
        const centers = response.map((center: any) => ({
          centerId: center.cohortId,
          centerName: center.cohortName,
          childData: center.childData || [],
        }));
        setCentersData(centers);
        if (centers.length > 0) {
          const defaultCenter = centers[0];
          setSelectedCenterId(defaultCenter.centerId);

          // Extract batches for the default center
          const batches = defaultCenter.childData.map((batch: any) => ({
            batchId: batch.cohortId,
            batchName: batch.name,
            parentId: batch.parentId,
          }));
          setBatchesData(batches);

          // Set default batch if available
          if (batches.length > 0) {
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
  // Handle center selection change
  const handleCenterChange = (event: any) => {
    const centerId = event.target.value;
    setSelectedCenterId(centerId);

    // Find the selected center and get its batches
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

      // Reset batch selection
      if (batches.length > 0) {
        setClassId(batches[0].batchId);
      } else {
        setClassId("");
      }
    }
  };

  // Handle batch selection change
  const handleBatchChange = (event: any) => {
    const batchId = event.target.value;
    setClassId(batchId);
    console.log("Selected batch ID:", batchId); // This will be passed to cohortmember/list API
  };
  // Calculate date range for last 7 days
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
      console.log("Setting date range:", {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        startRangeDate,
        endRangeDate,
      });
      setStartDateRange(formattedStartDate);
      setEndDateRange(formattedEndDate);
    };

    calculateDateRange();
  }, []);
  const todayDate = getTodayDate();

  // Get current attendance status based on attendanceData
  const getCurrentAttendanceStatusValue = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    // Check if selected date is in the future
    if (selected > today) {
      return "futureDate";
    }

    // Check if attendance is marked for the selected date
    const isAttendanceMarked =
      attendanceData.presentCount > 0 || attendanceData.absentCount > 0;

    console.log("Attendance Check:", {
      selectedDate,
      presentCount: attendanceData.presentCount,
      absentCount: attendanceData.absentCount,
      isAttendanceMarked,
    });

    return isAttendanceMarked ? "marked" : "notMarked";
  };

  const currentAttendance = getCurrentAttendanceStatusValue();
  // const pathColor = determinePathColor(presentPercentage);

  // Fetch self attendance data
  const fetchSelfAttendance = async () => {
    if (!classId || classId === "all") return;

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const limit = 300;
      const page = 0;
      const filters = {
        contextId: classId,
        userId: userId,
        scope: "self",
        toDate: selectedDate,
        fromDate: selectedDate,
      };

      const response = await getLearnerAttendanceStatus({
        limit,
        page,
        filters,
      });
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

  // Request location permission
  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      showToastMessage("Geolocation is not supported by your browser", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAttendanceLocation(position);
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

  // Handle marking self attendance
  const handleMarkSelfAttendance = async () => {
    if (!selectedSelfAttendance) return;

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        showToastMessage("User ID not found", "error");
        return;
      }

      // Get location using useGeolocation hook
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

      // Add location data if available from useGeolocation hook
      if (locationData) {
        data.latitude = locationData.latitude;
        data.longitude = locationData.longitude;
      }
      console.log("locationdata==", data);
      const response = await markAttendance(data);
      if (response?.responseCode === 200 || response?.responseCode === 201) {
        const successMessage =
          response?.params?.successmessage || "Attendance marked successfully";
        showToastMessage(successMessage, "success");
        setIsSelfAttendanceModalOpen(false);
        setSelectedSelfAttendance(null);
        // Refresh attendance data to show updated status
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

  // Fetch attendance data when classId changes
  useEffect(() => {
    console.log("useEffect triggered - fetching attendance data", {
      classId,
      selectedDate,
      handleSaveHasRun,
    });
    if (classId && classId !== "all") {
      fetchAttendanceData();
      fetchDayWiseAttendanceData();
      if (ShowSelfAttendance) {
        fetchSelfAttendance();
      }
    }
  }, [classId, selectedDate, startDateRange, endDateRange, handleSaveHasRun]);

  // Fetch attendance data for all 30 days
  const fetchDayWiseAttendanceData = async () => {
    if (!classId || classId === "all") return;

    // Validate UUID format
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

      const firstDate = calendarDays[0].dateString;
      const lastDate = calendarDays[calendarDays.length - 1].dateString;

      const cohortAttendanceData: CohortAttendancePercentParam = {
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

      // Process the data
      const processedData: {
        [date: string]: {
          presentCount: number;
          absentCount: number;
          totalCount: number;
          percentage: number;
        };
      } = {};

      // Get total members count
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
      const totalMembers = members.length;

      // Process each date
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

  // Main function to fetch attendance data
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

  // Fetch attendance for single center
  const fetchSingleCenterAttendance = async () => {
    console.log("Class id---", classId);
    try {
      // Fetch cohort member list
      // Validate UUID format before making API call
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

      const resp = response?.result?.userDetails;
      console.log("Cohort member response:", resp);
      if (resp) {
        const nameUserIdArray = resp
          ?.map((entry: any) => ({
            userId: entry.userId,
            name: entry.firstName,
            memberStatus: entry.status,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
            userName: entry.username,
          }))
          .filter((member: any) => {
            const createdAt = new Date(member.createdAt);
            createdAt.setHours(0, 0, 0, 0);
            const updatedAt = new Date(member.updatedAt);
            updatedAt.setHours(0, 0, 0, 0);
            const currentDate = new Date(selectedDate);
            currentDate.setHours(0, 0, 0, 0);

            if (
              member.memberStatus === "ARCHIVED" &&
              updatedAt <= currentDate
            ) {
              return false;
            }
            return createdAt <= new Date(selectedDate);
          });
        console.log("Filtered members:", nameUserIdArray);
        // Fetch actual attendance details
        if (nameUserIdArray && selectedDate && classId) {
          await fetchAttendanceDetails(
            nameUserIdArray,
            selectedDate,
            classId,
            handleAttendanceDataUpdate
          );
        }
        // Get low attendance learners
        const fromDate = startDateRange;
        const toDate = endDateRange;
        console.log("Fetching low attendance learners with date range:", {
          fromDate,
          toDate,
          startDateRange,
          endDateRange,
        });
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

        console.log("Low Attendance API Response:", attendanceResponse);
        console.log("Low Attendance Structure Check:", {
          hasData: !!attendanceResponse?.data,
          hasResult: !!attendanceResponse?.data?.result,
          hasUserId: !!attendanceResponse?.data?.result?.userId,
          userIdKeys: attendanceResponse?.data?.result?.userId
            ? Object.keys(attendanceResponse.data.result.userId).length
            : 0,
        });
        const attendanceData = attendanceResponse?.data?.result?.userId;
        if (attendanceData) {
          console.log("Processing low attendance data:", attendanceData);
          console.log(
            "Number of students in attendance data:",
            Object.keys(attendanceData).length
          );
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
          console.log(
            "Merged attendance data for threshold check:",
            mergedArray
          );

          // Consider students with less than 75% attendance as "low attendance"
          const LOW_ATTENDANCE_THRESHOLD = 75;
          const studentsWithLowestAttendance = mergedArray.filter((user) => {
            const hasAbsence = user.absent && user.absent > 0;
            const percentNum = parseFloat(user.present_percent || "0");
            const isLowAttendance = percentNum < LOW_ATTENDANCE_THRESHOLD;
            console.log(
              `${user.name}: ${user.present_percent}% (${
                isLowAttendance ? "LOW" : "OK"
              })`
            );
            return (
              hasAbsence &&
              (isLowAttendance || user.present_percent === undefined)
            );
          });

          console.log(
            "Students with low attendance:",
            studentsWithLowestAttendance
          );
          if (studentsWithLowestAttendance.length) {
            const namesOfLowestAttendance = studentsWithLowestAttendance.map(
              (student) => student.name
            );
            console.log(
              "Setting low attendance learners:",
              namesOfLowestAttendance
            );
            setLowAttendanceLearnerList(namesOfLowestAttendance);
          } else {
            console.log("No students with low attendance");
            setLowAttendanceLearnerList([]);
          }
        } else {
          console.log("No attendance data received from API");
        }

        // Get cohort attendance percentage
        const cohortAttendanceData: CohortAttendancePercentParam = {
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

        console.log(
          "Fetching cohort attendance with params:",
          cohortAttendanceData
        );
        const cohortRes = await getCohortAttendance(cohortAttendanceData);
        console.log("Cohort Attendance API Response:", cohortRes);
        const cohortResponse = cohortRes?.data?.result;
        console.log("Cohort response:", cohortResponse);
        const contextData = cohortResponse?.contextId?.[classId];

        console.log("Context data for classId:", classId, contextData);

        if (contextData?.present_percentage) {
          // present_percentage comes as a string from API, so parse it first
          const presentPercent = parseFloat(contextData.present_percentage);
          const percentageString = presentPercent.toFixed(1);
          console.log(
            "Setting cohort present percentage:",
            percentageString,
            "from",
            contextData.present_percentage
          );
          setCohortPresentPercentage(percentageString);
        } else if (contextData?.absent_percentage) {
          console.log("Only absent percentage available, setting to 0");
          setCohortPresentPercentage("0");
        } else {
          console.log("No attendance data, setting to 'No Attendance'");
          setCohortPresentPercentage("No Attendance");
        }
      }
    } catch (error) {
      console.error("Error fetching single center attendance:", error);
    }
  };

  // Fetch attendance for all centers
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
  // Generate calendar data for last 30 days till today
  const generateCalendarData = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const days = [];

    // Generate last 30 days from today backwards
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      // Only include dates that are not in the future
      if (date <= today) {
        const dayName = ["S", "M", "T", "W", "T", "F", "S"][date.getDay()];
        const dateStr = shortDateFormat(date);
        days.push({
          date: date.getDate(),
          day: dayName,
          fullDate: date,
          dateString: dateStr,
        });
      }
    }

    return days;
  };

  const calendarDays = generateCalendarData();
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  // Handle date click
  const handleDateClick = (dateString: string) => {
    setSelectedDate(dateString);
  };

  // Handle calendar icon/month click to navigate to attendance-history
  const handleCalendarClick = () => {
    if (classId && classId !== "all") {
      router.push(`/attendance-history?classId=${classId}`);
    } else {
      router.push("/attendance-history");
    }
  };

  const handlePreviousMonth = () => {
    // Navigate to attendance-history instead
    handleCalendarClick();
  };

  const handleNextMonth = () => {
    // Navigate to attendance-history instead
    handleCalendarClick();
  };
  const handleChangeYear = (event: any) => {
    setYearSelect(event.target.value);
  };
  // Handle class selection change
  const handleClassChange = (event: any) => {
    const selectedClassId = event.target.value;
    setClassId(selectedClassId);
    console.log("Selected class:", selectedClassId); // Debug log
  };
  // ADD THIS FUNCTION TO HANDLE SAVE SUCCESS
  const handleSaveSuccess = (isModified?: boolean) => {
    console.log("handleSaveSuccess called, isModified:", isModified);
    if (isModified) {
      showToastMessage("Attendance modified successfully", "success");
    } else {
      showToastMessage("Attendance marked successfully", "success");
    }
    console.log(
      "Toggling handleSaveHasRun from",
      handleSaveHasRun,
      "to",
      !handleSaveHasRun
    );
    setHandleSaveHasRun(!handleSaveHasRun);
    handleClose();
  };
  // Get current attendance status

  // const currentAttendance = getCurrentAttendanceStatus();
  // Translation function placeholder (replace with your actual t function)
  const t = (key: string) => {
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
    return translations[key] || key;
  };
  const clickAttendanceOverview = () => {
    if (classId && classId !== "all") {
      router.push(`/attendance-overview?classId=${classId}`);
    } else {
      router.push("/attendance-overview");
    }
  };
  return (
    <DashboardContainer>
      {/* Header Section */}
      <HeaderBox>
        <HeaderContent>
          <Typography
            textAlign={"left"}
            fontSize={"22px"}
            m={"1.5rem 1.2rem 0.8rem"}
            color={(theme?.palette?.warning as any)?.["300"]}
          >
            Dashboard
          </Typography>
          <Select
            value={yearSelect}
            onChange={handleChangeYear}
            size="small"
            sx={{
              backgroundColor: "white",
              borderRadius: "8px",
              fontWeight: 500,
              "& .MuiSelect-select": {
                display: "flex",
                alignItems: "center",
                gap: "4px",
              },
            }}
          >
            <MenuItem value="2023-2024">2023-2024</MenuItem>
            <MenuItem value="2024-2025 (Active)">
              2024-2025{" "}
              <span style={{ color: "green", marginLeft: "6px" }}>
                (Active)
              </span>
            </MenuItem>
            <MenuItem value="2024-2025 Demo">2024-2025 Demo</MenuItem>
          </Select>
        </HeaderContent>
      </HeaderBox>

      {/* Main Content */}
      <MainContent>
        <ContentWrapper>
          {/* Day-wise Attendance Section */}
          <Box>
            <Box
              display={"flex"}
              flexDirection={"column"}
              padding={"1.5rem 2.2rem 1rem 1.2rem"}
            >
              <Box
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
                marginBottom={"16px"}
                marginRight={"25px"}
              >
                <Typography
                  variant="h2"
                  sx={{ fontSize: "14px" }}
                  color={(theme.palette.warning as any)["300"]}
                  fontWeight={"500"}
                >
                  Day-Wise Attendance
                </Typography>
                {/* Center Selection */}
                {centersData.length > 0 && (
                  <Box sx={{ padding: "0 1.2rem 1rem" }}>
                    <FormControl
                      fullWidth
                      size="small"
                      sx={{ maxWidth: "200px" }}
                    >
                      <InputLabel>Center</InputLabel>
                      <Select
                        value={selectedCenterId}
                        label="Center"
                        onChange={handleCenterChange}
                        disabled={loading}
                      >
                        {centersData.map((center) => (
                          <MenuItem
                            key={center.centerId}
                            value={center.centerId}
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
                  <Box sx={{ padding: "0 1.2rem 1rem" }}>
                    <FormControl
                      fullWidth
                      size="small"
                      sx={{ maxWidth: "200px" }}
                    >
                      <InputLabel>Batch</InputLabel>
                      <Select
                        value={classId}
                        label="Batch"
                        onChange={handleBatchChange}
                        disabled={loading || !selectedCenterId}
                      >
                        {batchesData.map((batch) => (
                          <MenuItem key={batch.batchId} value={batch.batchId}>
                            {batch.batchName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}

                {/* Month Navigation */}
                <Box
                  display={"flex"}
                  sx={{
                    cursor: "pointer",
                    color: theme.palette.secondary.main,
                    gap: "4px",
                    alignItems: "center",
                  }}
                  onClick={handleCalendarClick}
                >
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviousMonth();
                    }}
                    sx={{ minWidth: "auto", padding: "4px" }}
                  >
                    ‹
                  </Button>
                  <Typography
                    style={{
                      fontWeight: "500",
                      minWidth: "100px",
                      textAlign: "center",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCalendarClick();
                    }}
                  >
                    {currentMonth} {currentYear}
                  </Typography>
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextMonth();
                    }}
                    sx={{ minWidth: "auto", padding: "4px" }}
                  >
                    ›
                  </Button>
                  <CalendarMonthIcon
                    sx={{ fontSize: "12px", ml: 0.5, cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCalendarClick();
                    }}
                  />
                </Box>
              </Box>

              {/* Horizontal Calendar Section */}
              <CalendarContainer>
                {/* Horizontal Scroll Calendar */}
                <HorizontalCalendarScroll>
                  {calendarDays.map((dayData, index) => {
                    const dateAttendance =
                      dayWiseAttendanceData[dayData.dateString] || null;
                    const isSelected = dayData.dateString === selectedDate;
                    const isMarked =
                      dateAttendance && dateAttendance.totalCount > 0;
                    const attendancePercentage =
                      dateAttendance?.percentage || 0;

                    // Check if this date is today
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dayDate = new Date(dayData.fullDate);
                    dayDate.setHours(0, 0, 0, 0);
                    const isToday = dayDate.getTime() === today.getTime();

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
                        {/* Day character or "Today" text above box */}
                        <Typography
                          sx={{
                            fontSize: "0.7em",
                            fontWeight: "600",
                            color: "#666",

                            // color: isToday ? "#ff9800" : "#666",
                            lineHeight: 1,
                            marginBottom: "2px",
                          }}
                        >
                          {isToday ? "Today" : dayData.day}
                        </Typography>
                        {/* Calendar Cell with date and circular progress inside */}
                        <CalendarCell
                          onClick={() => handleDateClick(dayData.dateString)}
                          sx={{
                            backgroundColor: isSelected
                              ? theme.palette.primary.light
                              : "#fff",
                          }}
                        >
                          {/* Date number at top */}
                          <DateNumber variant="body2">
                            {dayData.date}
                          </DateNumber>
                          {/* Circular Progress inside box below date when marked, or "Not marked" for selected date when not marked */}
                          {isMarked ? (
                            <Box
                              sx={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "20px",
                                height: "20px",
                                marginTop: "2px",
                              }}
                            >
                              <CircularProgress
                                variant="determinate"
                                value={attendancePercentage}
                                size={20}
                                thickness={10}
                                sx={{
                                  color: "#4caf50",
                                  position: "absolute",
                                  "& .MuiCircularProgress-circle": {
                                    strokeLinecap: "round",
                                  },
                                }}
                              />
                            </Box>
                          ) : null}
                          {/* // ) : isSelected ? (
                          //   // Show "Not marked" text only for selected date when not marked
                          //   <Typography
                          //     sx={{
                          //       fontSize: "0.55em",
                          //       fontWeight: "400",
                          //       color: "#999",
                          //       marginTop: "2px",
                          //       textAlign: "center",
                          //       minHeight: "20px",
                          //       display: "flex",
                          //       alignItems: "center",
                          //       justifyContent: "center",
                          //     }}
                          //   >
                          //     Not marked
                          //   </Typography>
                          // ) : null} */}
                        </CalendarCell>
                      </Box>
                    );
                  })}
                </HorizontalCalendarScroll>
              </CalendarContainer>
            </Box>

            <Box sx={{ padding: "0 20px" }}>
              <Divider sx={{ borderBottomWidth: "0.1rem" }} />
            </Box>
          </Box>
          <Box
            height={"auto"}
            width={"auto"}
            padding={"1rem"}
            borderRadius={"1rem"}
            bgcolor={"#4A4640"}
            textAlign={"left"}
            margin={"15px 35px 15px 25px"}
            sx={{ opacity: classId === "all" ? 0.5 : 1 }}
            justifyContent={"space-between"}
            display={"flex"}
            alignItems={"center"}
          >
            <Box display="flex" alignItems="center" gap="12px">
              {currentAttendance !== "notMarked" &&
                currentAttendance !== "futureDate" && (
                  <>
                    {/* CircularProgressbar */}
                    <Box sx={{ width: "30px", height: "30px" }}>
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
                          pathColor: "#4caf50",
                          trailColor: "#E6E6E6",
                          strokeLinecap: "round",
                          backgroundColor: "#fff",
                        })}
                        strokeWidth={20}
                        background
                        backgroundPadding={6}
                      />
                    </Box>
                    {/* Attendance Text */}
                    <Box>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#F4F4F4",
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
                        % Attendance
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#F4F4F4",
                        }}
                        variant="h6"
                      >
                        ({attendanceData.presentCount}/
                        {attendanceData.numberOfCohortMembers} present)
                      </Typography>
                    </Box>
                  </>
                )}
              {currentAttendance === "notMarked" && (
                <Typography
                  sx={{
                    color: (theme.palette.warning as any).A400,
                  }}
                  fontSize={"0.8rem"}
                >
                  Not started
                </Typography>
              )}
              {currentAttendance === "futureDate" && (
                <Typography
                  sx={{
                    color: (theme.palette.warning as any)["300"],
                  }}
                  fontSize={"0.8rem"}
                  fontStyle={"italic"}
                  fontWeight={"500"}
                >
                  Future date - can't mark
                </Typography>
              )}
            </Box>
            <Button
              className="btn-mark-width"
              variant="contained"
              color="primary"
              sx={{
                minWidth: "84px",
                height: "2.5rem",
                padding: theme.spacing(1),
                fontWeight: "500",
              }}
              disabled={classId === "all"}
              onClick={handleRemoteSession}
            >
              {currentAttendance === "notMarked" ? "Mark" : "Modify"}
            </Button>
          </Box>
          {/* Self Attendance Card */}
          {ShowSelfAttendance && (
            <Box
              height={"auto"}
              width={"auto"}
              padding={"1rem"}
              borderRadius={"1rem"}
              bgcolor={"#4A4640"}
              textAlign={"left"}
              margin={"15px 35px 15px 25px"}
              sx={{ opacity: classId === "all" ? 0.5 : 1 }}
              justifyContent={"space-between"}
              display={"flex"}
              alignItems={"center"}
            >
              <Box display="flex" alignItems="center" gap="12px">
                {selfAttendanceData?.length > 0 ? (
                  <Box display={"flex"} alignItems={"center"}>
                    <Typography
                      sx={{
                        color: (theme.palette.warning as any).A400,
                      }}
                      fontSize={"0.9rem"}
                    >
                      {selfAttendanceData[0]?.attendance?.toLowerCase() ===
                      ATTENDANCE_ENUM.PRESENT
                        ? "Present"
                        : selfAttendanceData[0]?.attendance?.toLowerCase() ===
                          ATTENDANCE_ENUM.ABSENT
                        ? "Absent"
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
                      color: (theme.palette.warning as any).A400,
                    }}
                    fontSize={"0.8rem"}
                  >
                    Not Marked For Self
                  </Typography>
                )}
              </Box>
              <Button
                className="btn-mark-width"
                variant="contained"
                color="primary"
                sx={{
                  minWidth: "84px",
                  height: "2.5rem",
                  padding: theme.spacing(1),
                  fontWeight: "500",
                }}
                disabled={classId === "all"}
                onClick={() => {
                  setIsLocationModalOpen(true);
                }}
              >
                {selfAttendanceData?.length > 0 &&
                (selfAttendanceData[0]?.attendance?.toLowerCase() ===
                  ATTENDANCE_ENUM.PRESENT ||
                  selfAttendanceData[0]?.attendance?.toLowerCase() ===
                    ATTENDANCE_ENUM.ABSENT)
                  ? "Modify For Self"
                  : "Mark For Self"}
              </Button>
            </Box>
          )}
          {/* Status Cards Section */}
          <Box
            sx={{
              padding: "1rem 1.2rem",
            }}
          >
            <Box
              mb={2}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              {/* Left Section (Overview + Last 7 Days) */}
              <Box>
                <Typography variant="body2" fontWeight="600" color="#333">
                  Overview
                </Typography>
                <Typography variant="caption" color="#666">
                  Last 7 Days {dateRange}
                </Typography>
              </Box>

              {/* Right Section (More Details link) */}
              <Link href="/attendance-overview" legacyBehavior>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    clickAttendanceOverview();
                  }}
                  style={{
                    color: "#1890ff",
                    textDecoration: "none",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  More Details →
                </a>
              </Link>
            </Box>
            {loading ? (
              <Typography>Loading...</Typography>
            ) : (
              <Grid container spacing={2}>
                {classId && classId !== "all" ? (
                  <>
                    {/* Single Center View */}
                    <Grid item xs={12} md={4}>
                      <StatusCard>
                        <CardContent sx={{ pt: 0 }}>
                          <Box textAlign="center" mb={2} p={2}>
                            <Typography
                              fontSize={"11px"}
                              color="rgb(124, 118, 111)"
                            >
                              Center Attendance
                            </Typography>
                            <Typography
                              fontWeight="700"
                              color="#000000"
                              sx={{ fontSize: "16px", lineHeight: 1 }}
                            >
                              {cohortPresentPercentage === "No Attendance"
                                ? cohortPresentPercentage
                                : `${cohortPresentPercentage}%`}
                            </Typography>
                          </Box>
                        </CardContent>
                      </StatusCard>
                    </Grid>

                    <Grid item xs={12} md={8}>
                      <StatusCard>
                        <CardContent sx={{ pt: 0 }}>
                          <Box textAlign="center" mb={2} p={2}>
                            <Typography
                              fontSize={"11px"}
                              color="rgb(124, 118, 111)"
                            >
                              Low Attendance Learners
                            </Typography>
                            <Typography
                              fontWeight="700"
                              color="#000000"
                              sx={{ fontSize: "16px", lineHeight: 1 }}
                            >
                              {Array.isArray(lowAttendanceLearnerList) &&
                              lowAttendanceLearnerList.length > 0
                                ? lowAttendanceLearnerList
                                    .slice(0, 2)
                                    .join(", ") +
                                  (lowAttendanceLearnerList.length > 2
                                    ? ` and ${
                                        lowAttendanceLearnerList.length - 2
                                      } more`
                                    : "")
                                : "No Learners with Low Attendance"}
                            </Typography>
                          </Box>
                        </CardContent>
                      </StatusCard>
                    </Grid>
                  </>
                ) : (
                  /* All Centers View */
                  allCenterAttendanceData.map((item: any) => (
                    <Grid item xs={12} md={6} key={item.userId}>
                      <StatusCard>
                        <CardContent sx={{ pt: 0 }}>
                          <Box textAlign="center" mb={2} p={2}>
                            <Typography
                              fontSize={"11px"}
                              color="rgb(124, 118, 111)"
                            >
                              {item.name}
                            </Typography>
                            <Typography
                              fontWeight="700"
                              color="#000000"
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
      {open && (
        <MarkBulkAttendance
          open={open}
          onClose={handleClose}
          classId={classId}
          selectedDate={new Date(selectedDate)}
          onSaveSuccess={handleSaveSuccess}
          memberList={attendanceData?.cohortMemberList}
          presentCount={attendanceData?.presentCount}
          absentCount={attendanceData?.absentCount}
          numberOfCohortMembers={attendanceData?.numberOfCohortMembers}
          dropoutMemberList={attendanceData?.dropoutMemberList}
          dropoutCount={attendanceData?.dropoutCount}
          bulkStatus={attendanceData?.bulkAttendanceStatus}
        />
      )}
      {/* Modal Components */}
      {isRemoteCohort && (
        <ModalComponent
          open={isRemoteCohort}
          heading={t("COMMON.MARK_CENTER_ATTENDANCE")}
          secondaryBtnText={t("COMMON.CANCEL")}
          btnText={t("COMMON.YES_MANUALLY")}
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
              {t("COMMON.ARE_YOU_SURE_MANUALLY")}
            </Box>
            <Box
              sx={{
                color: (theme?.palette?.warning as any)?.["300"],
                fontSize: "14px",
                fontWeight: "400",
                mt: "10px",
              }}
            >
              {t("COMMON.ATTENDANCE_IS_USUALLY")}
            </Box>
            <Box
              sx={{
                color: (theme?.palette?.warning as any)?.["300"],
                fontSize: "14px",
                fontWeight: "400",
                mt: "10px",
              }}
            >
              {t("COMMON.USE_MANUAL")}
            </Box>
            <Box
              sx={{
                color: (theme?.palette?.warning as any)?.["300"],
                fontSize: "14px",
                fontWeight: "500",
                mt: "10px",
              }}
            >
              {t("COMMON.NOTE_MANUALLY")}
            </Box>
          </Box>
        </ModalComponent>
      )}
      {/* Location Permission Modal */}
      {isLocationModalOpen && (
        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          onConfirm={requestLocationPermission}
        />
        // <ModalComponent
        //   open={isLocationModalOpen}
        //   heading="Device location is needed to mark your attendance"
        //   secondaryBtnText="No, go back"
        //   btnText="Turn On"
        //   onClose={() => {
        //     setIsLocationModalOpen(false);
        //   }}
        //   handlePrimaryAction={requestLocationPermission}
        //   handleSecondaryAction={() => {
        //     setIsLocationModalOpen(false);
        //   }}
        // >
        //   <Box sx={{ padding: "0 16px" }}>
        //     <Typography
        //       sx={{
        //         color: (theme?.palette?.warning as any)?.["300"],
        //         fontSize: "14px",
        //         fontWeight: "400",
        //       }}
        //     >
        //       We need your device location to verify your attendance. Please
        //       allow location access when prompted.
        //     </Typography>
        //   </Box>
        // </ModalComponent>
      )}
      {/* Self Attendance Modal */}
      {isSelfAttendanceModalOpen && (
        <ModalComponent
          open={isSelfAttendanceModalOpen}
          heading="Attendance"
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
          <Box sx={{ padding: "0 16px" }}>
            <Box
              display={"flex"}
              justifyContent={"space-between"}
              alignItems={"center"}
              mb={2}
            >
              <Typography
                variant="h2"
                sx={{
                  color: (theme.palette.warning as any).A200,
                  fontSize: "14px",
                }}
                component="h2"
              >
                Present
              </Typography>
              <Radio
                onChange={() =>
                  setSelectedSelfAttendance(ATTENDANCE_ENUM.PRESENT)
                }
                value={ATTENDANCE_ENUM.PRESENT}
                checked={selectedSelfAttendance === ATTENDANCE_ENUM.PRESENT}
              />
            </Box>
            <Divider />
            <Box
              display={"flex"}
              justifyContent={"space-between"}
              alignItems={"center"}
              mb={2}
              mt={2}
            >
              <Typography
                variant="h2"
                sx={{
                  color: (theme.palette.warning as any).A200,
                  fontSize: "14px",
                }}
                component="h2"
              >
                Absent
              </Typography>
              <Radio
                onChange={() =>
                  setSelectedSelfAttendance(ATTENDANCE_ENUM.ABSENT)
                }
                value={ATTENDANCE_ENUM.ABSENT}
                checked={selectedSelfAttendance === ATTENDANCE_ENUM.ABSENT}
              />
            </Box>
          </Box>
        </ModalComponent>
      )}
    </DashboardContainer>
  );
};

export default SimpleTeacherDashboard;
