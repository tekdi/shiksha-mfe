/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-empty-interface */
"use client";

import {
  classesMissedAttendancePercentList,
  getAllCenterAttendance,
  getCohortAttendance,
} from "../services/AttendanceService";
import {
  debounce,
  filterAttendancePercentage,
  formatSelectedDate,
  getTodayDate,
  handleKeyDown,
  sortAttendanceNumber,
  toPascalCase,
} from "../utils/Helper";
import {
  CohortAttendancePercentParam,
  ICohort,
  AcademicYear,
} from "../utils/interfaces";
import {
  Box,
  Button,
  Grid,
  IconButton,
  InputBase,
  Paper,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  accessControl,
  AttendanceAPILimit,
  lowLearnerAttendanceLimit,
} from "../../app.config";

import CohortAttendanceListView from "../components/CohortAttendanceListView";
import CohortSelectionSection from "../components/CohortSelectionSection";
import NoDataFound from "../components/common/NoDataFound";
import DateRangePopup from "../components/DateRangePopup";
import Header from "../components/Header";
import StudentsStatsList from "../components/LearnerAttendanceStatsListView";
import LearnerListHeader from "../components/LearnerListHeader";
import Loader from "../components/Loader";
import OverviewCard from "../components/OverviewCard";
import SortingModal from "../components/SortingModal";
import { showToastMessage } from "../components/Toastify";
import UpDownButton from "../components/UpDownButton";
import { getMyCohortMemberList } from "../services/MyClassDetailsService";
import { getCohortList } from "../services/CohortServices";
import { getUserDetails } from "../services/ProfileService";
import useStore from "../store/store";
import { getMenuItems, Telemetry } from "../utils/app.constant";
import { logEvent } from "../utils/googleAnalytics";
import withAccessControl from "../utils/hoc/withAccessControl";
import { telemetryFactory } from "../utils/telemetry";
import ArrowDropDownSharpIcon from "@mui/icons-material/ArrowDropDownSharp";
import ClearIcon from "@mui/icons-material/Clear";
import KeyboardBackspaceOutlinedIcon from "@mui/icons-material/KeyboardBackspaceOutlined";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import SchoolIcon from "@mui/icons-material/School";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { useRouter } from "next/router";
import ReactGA from "react-ga4";
import { useDirection } from "../hooks/useDirection";
import { useQueryClient } from "@tanstack/react-query";

interface AttendanceOverviewProps {
  //   buttonText: string;
}

const AttendanceOverview: React.FC<AttendanceOverviewProps> = () => {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  const router = useRouter();
  const today = new Date();
  const [classId, setClassId] = React.useState("");
  const [cohortsData, setCohortsData] = React.useState<Array<ICohort>>([]);
  const [manipulatedCohortData, setManipulatedCohortData] =
    React.useState<Array<ICohort>>(cohortsData);
  const [allCenterAttendanceData, setAllCenterAttendanceData] =
    React.useState<any>(cohortsData);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [inLineLoading, setInLineLoading] = React.useState(false);
  const [searchWord, setSearchWord] = React.useState("");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [learnerData, setLearnerData] = React.useState<Array<any>>([]);
  const [isFromDate, setIsFromDate] = useState("");
  const [isToDate, setIsToDate] = useState("");
  const [displayStudentList, setDisplayStudentList] = React.useState<
    Array<any>
  >([]);
  const [currentDayMonth, setCurrentDayMonth] = React.useState<string>("");
  const [userId, setUserId] = React.useState<string | null>(null);
  const [selectedValue, setSelectedValue] = React.useState<any>("");
  const [presentPercentage, setPresentPercentage] = React.useState<
    string | number
  >("");
  const [lowAttendanceLearnerList, setLowAttendanceLearnerList] =
    React.useState<any>([]);
  const [numberOfDaysAttendanceMarked, setNumberOfDaysAttendanceMarked] =
    useState(0);
  const [dateRange, setDateRange] = React.useState<Date | string>("");
  const [blockName, setBlockName] = React.useState<string>("");
  const [yearSelect, setYearSelect] = React.useState("");
  const [academicYearId, setAcademicYearId] = React.useState<string | null>(
    null
  );
  const [academicYearList, setAcademicYearList] = React.useState<
    AcademicYear[]
  >([]);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [selectedLanguage, setSelectedLanguage] = React.useState("en");
  const [centersData, setCentersData] = React.useState<Array<any>>([]);
  const [batchesData, setBatchesData] = React.useState<Array<any>>([]);
  const [selectedCenterId, setSelectedCenterId] = React.useState<string>("");
  const [languageChanging, setLanguageChanging] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  const theme = useTheme<any>();
  const pathname = router.pathname;
  const store = useStore();
  const queryClient = useQueryClient();

  // Set mounted flag after component mounts (client-side only)
  useEffect(() => {
    setIsMounted(true);
    // Initialize dates only on client side
    setIsFromDate(
      formatSelectedDate(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000))
    );
    setIsToDate(getTodayDate());
  }, []);

  const menuItems = getMenuItems(t, dateRange, currentDayMonth);
  // Language change handler
  const handleLanguageChange = async (event: any) => {
    const newLang = event.target.value;
    setLanguageChanging(true);
    setSelectedLanguage(newLang);
    localStorage.setItem("preferredLanguage", newLang);

    // Use router.replace to properly reload with new locale
    router
      .replace(router.pathname, router.asPath, { locale: newLang })
      .then(() => {
        // Force a page reload to ensure all translations are updated
        window.location.reload();
      })
      .catch(() => {
        // Fallback: reload page directly
        window.location.reload();
      });
  };
  useEffect(() => {
    setSelectedValue(currentDayMonth);
  }, []);

  // Initialize academic year list (client-side only)
  useEffect(() => {
    if (!isMounted) return;
    if (typeof window !== "undefined" && window.localStorage) {
      const storedList = localStorage.getItem("academicYearList");
      try {
        const parsedList = storedList ? JSON.parse(storedList) : [];
        setAcademicYearList(parsedList);

        const selectedAcademicYearId = localStorage.getItem("academicYearId");
        if (selectedAcademicYearId && parsedList.length > 0) {
          const selectedYear = parsedList.find(
            (year: AcademicYear) => year.id === selectedAcademicYearId
          );
          if (selectedYear) {
            const yearLabel = selectedYear.isActive
              ? `${selectedYear.session} (Active)`
              : selectedYear.session;
            setYearSelect(yearLabel);
            setAcademicYearId(selectedAcademicYearId);
          } else if (parsedList.length > 0) {
            // Default to first year if no selection
            const firstYear = parsedList[0];
            const yearLabel = firstYear.isActive
              ? `${firstYear.session} (Active)`
              : firstYear.session;
            setYearSelect(yearLabel);
          }
        } else if (parsedList.length > 0) {
          // Default to first year if no selection
          const firstYear = parsedList[0];
          const yearLabel = firstYear.isActive
            ? `${firstYear.session} (Active)`
            : firstYear.session;
          setYearSelect(yearLabel);
        }
      } catch (error) {
        console.error("Error parsing academic year list:", error);
      }
    }
  }, [isMounted]);

  // Initialize user and fetch cohorts (client-side only)
  useEffect(() => {
    if (!isMounted) return;
    const initializePage = async () => {
      if (typeof window !== "undefined" && window.localStorage) {
        const token = localStorage.getItem("token");
        const storedUserId = localStorage.getItem("userId");
        const storedAcademicYearId = localStorage.getItem("academicYearId");
        const storedLanguage =
          localStorage.getItem("preferredLanguage") || router.locale || "en";
        const storedClassId = localStorage.getItem("classId");

        // Sync language with router locale
        const currentLocale = router.locale || storedLanguage || "en";
        setSelectedLanguage(currentLocale);
        if (currentLocale !== storedLanguage) {
          localStorage.setItem("preferredLanguage", currentLocale);
        }

        setAcademicYearId(storedAcademicYearId);

        if (!token) {
          router.push("/login");
          return;
        }

        if (storedUserId) {
          setUserId(storedUserId);
          setIsAuthenticated(true);
          await fetchUserCohorts(storedUserId);
          if (storedClassId) {
            setClassId(storedClassId);
          }
        }
      }
    };

    initializePage();
  }, [router.locale, isMounted]);

  // Store all batches data for filtering
  const [allBatchesData, setAllBatchesData] = React.useState<Array<any>>([]);

  // Fetch user cohorts with API integration
  // Fetch user cohorts with API integration
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

      console.log("getCohortList response:", response);

      if (response && response.length > 0) {
        // Extract centers (parent cohorts with cohortName)
        const centers = response
          .filter((center: any) => center.cohortName && center.childData) // Only centers with cohortName and childData
          .map((center: any) => ({
            centerId: center.cohortId,
            centerName: center.cohortName,
            childData: center.childData || [],
          }));

        console.log("Extracted centers:", centers);
        setCentersData(centers);

        // Extract all batches from all centers
        const allBatches = response
          .flatMap((center: any) => center.childData || [])
          .filter((batch: any) => batch?.status !== "archived")
          .map((batch: any) => ({
            batchId: batch.cohortId,
            batchName: batch.name,
            parentId: batch.parentId,
            status: batch.status,
          }));

        console.log("Extracted all batches:", allBatches);

        // Set default center and batch if available
        if (centers.length > 0) {
          const defaultCenter = centers[0];
          setSelectedCenterId(defaultCenter.centerId);

          // Filter batches for the default center
          const defaultBatches = allBatches.filter(
            (batch: any) => batch.parentId === defaultCenter.centerId
          );
          setBatchesData(defaultBatches);

          // Set default batch if available
          if (defaultBatches.length > 0) {
            const defaultBatchId = defaultBatches[0].batchId;
            setClassId(defaultBatchId);
            localStorage.setItem("classId", defaultBatchId);
            localStorage.setItem("cohortId", defaultBatchId);
          }
        }

        // Also set cohortsData for backward compatibility (all batches)
        const formattedCohorts = allBatches.map((batch: any) => ({
          cohortId: batch.batchId,
          cohortName: batch.batchName,
          name: batch.batchName,
          status: batch.status,
        }));
        setCohortsData(formattedCohorts);
        setManipulatedCohortData([
          ...formattedCohorts,
          { cohortId: "all", cohortName: "All Centers", name: "All Centers" },
        ]);
      } else {
        console.log("No cohort data received");
      }
    } catch (error) {
      console.error("Error fetching cohorts:", error);
      showToastMessage(t("COMMON.SOMETHING_WENT_WRONG"), "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle center selection change
  const handleCenterChange = (event: any) => {
    const centerId = event.target.value;
    setSelectedCenterId(centerId);

    // Filter batches for selected center
    const allBatches = centersData.flatMap((center: any) =>
      center.childData.map((batch: any) => ({
        batchId: batch.cohortId,
        batchName: batch.name,
        parentId: batch.parentId,
      }))
    );

    const filteredBatches = allBatches.filter(
      (batch: any) => batch.parentId === centerId
    );

    setBatchesData(filteredBatches);

    // Reset batch selection when center changes
    if (filteredBatches.length > 0) {
      const defaultBatchId = filteredBatches[0].batchId;
      setClassId(defaultBatchId);
      localStorage.setItem("classId", defaultBatchId);
      localStorage.setItem("cohortId", defaultBatchId);
    } else {
      setClassId("");
    }
  };

  // Handle batch selection change
  const handleBatchChange = (event: any) => {
    const batchId = event.target.value;
    setClassId(batchId);
    localStorage.setItem("classId", batchId);
    localStorage.setItem("cohortId", batchId);
    console.log("Selected batch ID for API:", batchId); // This will be passed to cohortmember/list API
  };

  // Handle year selection change
  const handleChangeYear = (event: any) => {
    const selectedYearValue = event.target.value;
    setYearSelect(selectedYearValue);

    // Get academic year list from localStorage
    const storedList = localStorage.getItem("academicYearList");
    if (storedList) {
      try {
        const parsedList = JSON.parse(storedList);
        // Find the academic year by session name
        const selectedYear = parsedList.find(
          (year: any) =>
            year.session === selectedYearValue ||
            year.session === selectedYearValue.replace(" (Active)", "")
        );

        if (selectedYear && selectedYear.id) {
          const academicYearId = selectedYear.id;
          setAcademicYearId(academicYearId);
          localStorage.setItem("academicYearId", academicYearId);

          // Check if the selected academic year is active
          const isActive = selectedYear.isActive || false;
          store.setIsActiveYearSelected(isActive);

          // Clear query cache
          queryClient.clear();

          // Reload data
          if (userId) {
            fetchUserCohorts(userId);
          }

          // Reload page if year is not active
          if (!isActive) {
            router.push("/centers").then(() => {
              window.location.reload();
            });
          } else {
            window.location.reload();
          }
        }
      } catch (error) {
        console.error("Error parsing academic year list:", error);
      }
    }
  };

  // Handle locale changes - reload translations when language changes
  useEffect(() => {
    // This ensures the page re-renders with new translations when locale changes
    // The router.replace in MenuDrawer will trigger a re-render with new locale
  }, [router.locale]);

  useEffect(() => {
    const getAttendanceMarkedDays = async () => {
      const todayFormattedDate = formatSelectedDate(new Date());
      const lastSeventhDayDate = new Date(
        today.getTime() - 6 * 24 * 60 * 60 * 1000
      );
      const lastSeventhDayFormattedDate = formatSelectedDate(
        new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
      );

      const endDay = today.getDate();
      const endDayMonth = today.toLocaleString("default", { month: "long" });
      setCurrentDayMonth(`(${endDay} ${endDayMonth})`);
      const startDay = lastSeventhDayDate.getDate();
      const startDayMonth = lastSeventhDayDate.toLocaleString("default", {
        month: "long",
      });
      if (startDayMonth === endDayMonth) {
        setDateRange(`(${startDay}-${endDay} ${endDayMonth})`);
      } else {
        setDateRange(`(${startDay} ${startDayMonth}-${endDay} ${endDayMonth})`);
      }
      const cohortAttendanceData: CohortAttendancePercentParam = {
        limit: AttendanceAPILimit,
        page: 0,
        filters: {
          scope: "student",
          fromDate: lastSeventhDayFormattedDate,
          toDate: todayFormattedDate,
          contextId: classId,
        },
        facets: ["attendanceDate"],
        sort: ["present_percentage", "asc"],
      };
      try {
        const res = await getCohortAttendance(cohortAttendanceData);
        const response = res?.data?.result?.attendanceDate;
        if (response) {
          setNumberOfDaysAttendanceMarked(Object.keys(response)?.length);
        } else {
          setNumberOfDaysAttendanceMarked(0);
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      }
    };
    if (classId) {
      getAttendanceMarkedDays();
    }
  }, [
    classId,
    selectedValue ===
      t("DASHBOARD.LAST_SEVEN_DAYS_RANGE", {
        date_range: dateRange,
      }),
  ]);

  const handleDateRangeSelected = ({ fromDate, toDate }: any) => {
    setIsFromDate(fromDate);
    setIsToDate(toDate);
    // Handle the date range values as needed
  };
  //API for getting student list
  const getCohortMemberList = async () => {
    // setLoading(true);
    setDisplayStudentList([]);
    try {
      if (classId && classId != "all") {
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
        if (resp) {
          const nameUserIdArray = resp?.map((entry: any) => ({
            userId: entry.userId,
            name:
              toPascalCase(entry?.firstName || "") +
              " " +
              (entry?.lastName ? toPascalCase(entry.lastName) : ""),

            memberStatus: entry.status,
          }));
          if (nameUserIdArray) {
            //Write logic to call class missed api
            const filters: any = {
              scope: "student",
              contextId: classId,
            };
            // Conditionally add fromDate and toDate to filters if selectedValue doesn't match the specific condition
            if (
              selectedValue !==
              t("DASHBOARD.AS_OF_TODAY_DATE", { day_date: currentDayMonth })
            ) {
              filters.fromDate = isFromDate;
              filters.toDate = isToDate;
            }
            const response = await classesMissedAttendancePercentList({
              filters,
              facets: ["userId"],
              sort: ["present_percentage", "asc"],
            });
            const resp = response?.data?.result?.userId;
            if (resp) {
              const filteredData = Object.keys(resp).map((userId) => ({
                userId,
                absent: resp[userId]?.absent || "0",
                present: resp[userId]?.present || "0",
                present_percent: resp[userId]?.present_percentage || "0",
                absent_percent: resp[userId]?.absent_percentage || "0",
              }));
              if (filteredData) {
                let mergedArray = filteredData.map((attendance) => {
                  const user = nameUserIdArray.find(
                    (user: { userId: string }) =>
                      user.userId === attendance.userId
                  );
                  return Object.assign({}, attendance, {
                    name: user ? user.name : "Unknown",
                    memberStatus: user ? user.memberStatus : "Unknown",
                  });
                });
                mergedArray = mergedArray.filter(
                  (item) => item.name !== "Unknown"
                );
                setLearnerData(mergedArray);
                setDisplayStudentList(mergedArray);

                const studentsWithLowestAttendance = mergedArray.filter(
                  (user) =>
                    user.absent &&
                    (user.present_percent < lowLearnerAttendanceLimit ||
                      user.present_percent === undefined) //TODO: Modify here condition to show low attendance learners
                );

                // Extract names of these students
                if (studentsWithLowestAttendance.length) {
                  const namesOfLowestAttendance: any[] =
                    studentsWithLowestAttendance.map((student) => student.name);
                  setLowAttendanceLearnerList(namesOfLowestAttendance);
                } else {
                  setLowAttendanceLearnerList([]);
                }

                // setLoading(false);
                setInLineLoading(false);
              }
            }
          }
        } else {
          setLearnerData([]);
          setDisplayStudentList([]);
          // setLoading(false);
          setInLineLoading(false);
        }
        if (classId) {
          const cohortAttendancePercent = async () => {
            const filters: any = {
              scope: "student",
              contextId: classId,
            };

            // Conditionally add fromDate and toDate to filters if selectedValue doesn't match the specific condition
            if (
              selectedValue !==
              t("DASHBOARD.AS_OF_TODAY_DATE", { day_date: currentDayMonth })
            ) {
              filters.fromDate = isFromDate;
              filters.toDate = isToDate;
            }
            const cohortAttendanceData: CohortAttendancePercentParam = {
              limit: AttendanceAPILimit,
              page: 0,
              filters,
              facets: ["contextId"],
              sort: ["present_percentage", "asc"],
            };
            const res = await getCohortAttendance(cohortAttendanceData);
            const response = res?.data?.result;
            const contextData = response?.contextId?.[classId];
            if (contextData?.present_percentage) {
              const presentPercentage = contextData?.present_percentage;
              setPresentPercentage(presentPercentage);
            } else if (contextData?.absent_percentage) {
              setPresentPercentage(0);
            } else {
              setPresentPercentage(t("ATTENDANCE.NO_ATTENDANCE"));
            }
          };
          cohortAttendancePercent();
        }
      } else if (classId && classId === "all" && cohortsData) {
        const cohortIds = cohortsData.map((cohort) => cohort.cohortId);
        const limit = 300;
        const page = 0;
        const facets = ["contextId"];

        const fetchAttendanceData = async (cohortIds: any[]) => {
          const fetchPromises = cohortIds.map(async (cohortId) => {
            const filters = {
              fromDate: isFromDate,
              toDate: isToDate,
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
              console.error(
                `Error fetching data for cohortId ${cohortId}:`,
                error
              );
              return { cohortId, error };
            }
          });

          try {
            const results = await Promise.all(fetchPromises);
            const nameIDAttendanceArray = results
              .filter((result) => !result.error && result?.data?.contextId)
              .map((result) => {
                const cohortId = result.cohortId;
                const contextData = result.data.contextId[cohortId] || {};
                const presentPercentage =
                  contextData.present_percentage || null;
                const absentPercentage = contextData.absent_percentage
                  ? 100 - contextData.absent_percentage
                  : null;
                const percentage = presentPercentage || absentPercentage;

                const cohortItem = cohortsData.find(
                  (cohort) => cohort.cohortId === cohortId
                );

                return {
                  userId: cohortId,
                  name: cohortItem ? cohortItem.name : null,
                  presentPercentage: percentage,
                };
              })
              .filter((item) => item.presentPercentage !== null); // Filter out items with no valid percentage

            setAllCenterAttendanceData(nameIDAttendanceArray);
          } catch (error) {
            console.error("Error fetching attendance data:", error);
          }
        };

        fetchAttendanceData(cohortIds);
      }
    } catch (error) {
      console.error("Error fetching cohort list:", error);
      showToastMessage(t("COMMON.SOMETHING_WENT_WRONG"), "error");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setInLineLoading(true);
    getCohortMemberList();
  }, [classId, isToDate, isFromDate]);

  // debounce use for searching time period is 2 sec
  const debouncedSearch = debounce((value: string) => {
    const filteredList = learnerData?.filter((user: any) =>
      user.name.toLowerCase().includes(value.toLowerCase())
    );
    setDisplayStudentList(filteredList || []);
  }, 200);

  const handleSearchClear = () => {
    setSearchWord("");
    setDisplayStudentList(learnerData);
  };

  // handle search student data
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const trimmedValue = event.target.value.replace(/\s{2,}/g, " ").trimStart();
    setSearchWord(trimmedValue);
    if (trimmedValue.length >= 1) {
      debouncedSearch(trimmedValue);
      ReactGA.event("search-by-keyword-attendance-overview-page", {
        keyword: trimmedValue,
      });

      const telemetryInteract = {
        context: {
          env: "dashboard",
          cdata: [],
        },
        edata: {
          id: "search-by-keyword-attendance-overview-page",
          type: Telemetry.SEARCH,
          subtype: "",
          pageid: "attendance-overview",
        },
      };
      telemetryFactory.interact(telemetryInteract);
    } else if (trimmedValue === "") {
      setDisplayStudentList(learnerData);
    } else {
      setDisplayStudentList(learnerData);
    }
  };

  const handleSearchSubmit = () => {
    const filteredList = learnerData?.filter((user: any) =>
      user.name.toLowerCase().includes(searchWord.toLowerCase())
    );
    setDisplayStudentList(filteredList);
  };

  // open modal of sort
  const handleOpenModal = () => {
    setModalOpen(true);
  };

  // close modal of sort
  const handleCloseModal = () => {
    setModalOpen(false);
  };

  //handel sorting
  const handleSorting = (
    sortByName: string,
    sortByAttendance: string,
    // sortByClassesMissed: string,
    sortByAttendancePercentage: string,
    sortByAttendanceNumber: string
  ) => {
    handleCloseModal();
    let sortedData = [...learnerData];

    // Sorting by name
    switch (sortByName) {
      case "asc":
        sortedData.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "desc":
        sortedData.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    // Sorting by attendance
    switch (sortByAttendanceNumber) {
      case "high":
        sortedData = sortAttendanceNumber(sortedData, "high");
        break;
      case "low":
        sortedData = sortAttendanceNumber(sortedData, "low");
        break;
    }

    // // Sorting by classesMissed
    // switch (sortByClassesMissed) {
    //   case 'more':
    //     sortedData = sortClassesMissed(sortedData, 'more');
    //     break;
    //   case 'less':
    //     sortedData = sortClassesMissed(sortedData, 'less');
    //     break;
    // }

    // Sorting by AttendancePercentage
    switch (sortByAttendancePercentage) {
      case "more":
        sortedData = filterAttendancePercentage(sortedData, "more");
        break;
      case "between":
        sortedData = filterAttendancePercentage(sortedData, "between");
        break;
      case "less":
        sortedData = filterAttendancePercentage(sortedData, "less");
        break;
      default:
        // Handle default case if needed
        break;
    }

    setDisplayStudentList(sortedData);
  };
  const handleBackEvent = () => {
    window.history.back();
    logEvent({
      action: "back-button-clicked-attendance-overview",
      category: "Attendance Overview Page",
      label: "Back Button Clicked",
    });
  };

  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleScrollDown = () => {
    if (inputRef.current) {
      const inputRect = inputRef.current.getBoundingClientRect();
      const scrollMargin = 20;
      const scrollY = window.scrollY;
      const targetY = inputRect.top + scrollY - scrollMargin;
      window.scrollTo({ top: targetY - 70, behavior: "smooth" });
    }
  };
  const darkMode =
    isMounted && typeof window !== "undefined" && window.localStorage
      ? localStorage.getItem("mui-mode")
      : null;

  const sidebarWidth = 240;
  // Update the language change handler

  return (
    <Box
      sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#f5f5f5" }}
    >
      {/* Language Changing Loader */}
      {/* {languageChanging && (
        <Loader
          showBackdrop={true}
          loadingText={t("COMMON.CHANGING_LANGUAGE")}
        />
      )} */}
      {/* Sidebar */}

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          // marginLeft: sidebarOpen ? "135px" : 0,
          transition: "margin-left 0.3s",
          width: sidebarOpen ? `calc(100% - ${sidebarWidth}px)` : "100%",
          backgroundColor: "#f5f5f5",
        }}
      >
        {displayStudentList.length ? (
          <Box
            sx={{
              position: "fixed",
              bottom: "20px",
              right: "20px",
              zIndex: 1000,
            }}
          >
            <UpDownButton />
          </Box>
        ) : null}
        {/* <Header /> */}
        {loading && (
          <Loader showBackdrop={true} loadingText={t("COMMON.LOADING")} />
        )}
        <Box>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "15px 20px",
              backgroundColor: theme.palette.warning["A400"],
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <KeyboardBackspaceOutlinedIcon
                onClick={handleBackEvent}
                cursor={"pointer"}
                sx={{
                  color: theme.palette.warning["300"],
                  transform: isRTL ? " rotate(180deg)" : "unset",
                }}
              />
              <Typography
                textAlign={"left"}
                fontSize={"22px"}
                color={theme.palette.warning["300"]}
                fontWeight={500}
              >
                {t("ATTENDANCE.ATTENDANCE_OVERVIEW")}
              </Typography>
            </Box>
          </Box>

          <Box
            className="br-md-8"
            sx={{
              padding: "20px 20px",
              background:
                darkMode === "dark"
                  ? "linear-gradient(180deg, #2e2e2e 0%, #1b1b1b 100%)"
                  : "linear-gradient(180deg, #fffdf7 0%, #f8efda 100%)",
            }}
          >
            <Box className="d-md-flex space-md-between gap-md-10 w-100">
              <Box
                className="flex-basis-md-50"
                sx={{ display: "flex", gap: "10px" }}
              >
                {/* Center Selection - Only show if centers data exists */}
                {centersData.length > 0 ? (
                  <FormControl
                    fullWidth
                    size="small"
                    sx={{ marginBottom: "10px", flex: 1 }}
                  >
                    <InputLabel>Center</InputLabel>
                    <Select
                      value={selectedCenterId}
                      label="Center"
                      onChange={handleCenterChange}
                      disabled={loading}
                    >
                      {centersData.map((center) => (
                        <MenuItem key={center.centerId} value={center.centerId}>
                          {center.centerName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : null}

                {/* Batch Selection - Only show if centers exist */}
                {centersData.length > 0 ? (
                  <FormControl
                    fullWidth
                    size="small"
                    sx={{ marginBottom: "10px", flex: 1 }}
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
                ) : (
                  // Fallback: show combined center/batch selection when no hierarchy
                  <FormControl
                    fullWidth
                    size="small"
                    sx={{ marginBottom: "10px" }}
                  >
                    <InputLabel>Center/Batch</InputLabel>
                    <Select
                      value={classId}
                      label="Center/Batch"
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setClassId(selectedId);
                        localStorage.setItem("classId", selectedId);
                        localStorage.setItem("cohortId", selectedId);
                      }}
                      disabled={loading}
                    >
                      <MenuItem value="all">All Centers</MenuItem>
                      {cohortsData.map((center) => (
                        <MenuItem key={center.cohortId} value={center.cohortId}>
                          {center.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
              <Box
                sx={{ marginTop: blockName ? "25px" : "0px" }}
                className="flex-basis-md-50"
              >
                <DateRangePopup
                  menuItems={menuItems}
                  selectedValue={selectedValue}
                  setSelectedValue={setSelectedValue}
                  onDateRangeSelected={handleDateRangeSelected}
                  dateRange={dateRange}
                />
              </Box>
            </Box>

            {selectedValue ===
              t("DASHBOARD.LAST_SEVEN_DAYS_RANGE", {
                date_range: dateRange,
              }) || selectedValue === "" ? (
              <Typography
                color={theme.palette.warning["400"]}
                fontSize={"0.75rem"}
                fontWeight={"500"}
                pt={"1rem"}
              >
                {t("ATTENDANCE.ATTENDANCE_MARKED_OUT_OF_DAYS", {
                  count: numberOfDaysAttendanceMarked,
                })}
              </Typography>
            ) : null}
            {classId !== "all" ? (
              <Box display={"flex"} className="card_overview" p={"1rem 0"}>
                <Grid container spacing={2}>
                  <Grid item xs={5}>
                    <OverviewCard
                      label={t("ATTENDANCE.CENTER_ATTENDANCE")}
                      value={
                        learnerData.length
                          ? presentPercentage + " %"
                          : t("ATTENDANCE.NO_ATTENDANCE")
                      }
                    />
                  </Grid>
                  <Grid item xs={7}>
                    <OverviewCard
                      label={t("ATTENDANCE.LOW_ATTENDANCE_STUDENTS")}
                      {...(loading && (
                        <Loader
                          loadingText={t("COMMON.LOADING")}
                          showBackdrop={false}
                        />
                      ))}
                      valuePartOne={
                        lowAttendanceLearnerList.length > 0
                          ? lowAttendanceLearnerList.slice(0, 2).join(", ")
                          : t("ATTENDANCE.NO_LEARNER_WITH_LOW_ATTENDANCE")
                      }
                      valuePartTwo={
                        Array.isArray(lowAttendanceLearnerList) &&
                        lowAttendanceLearnerList.length > 2
                          ? `${t("COMMON.AND")} ${
                              lowAttendanceLearnerList.length - 2
                            } ${t("COMMON.MORE")}`
                          : null
                      }
                    />
                  </Grid>
                </Grid>
              </Box>
            ) : null}
          </Box>
        </Box>

        {learnerData?.length > 0 ? (
          <Box bgcolor={theme.palette.warning["A400"]}>
            {classId !== "all" ? (
              <Stack mr={1} ml={1}>
                <Box mt={3} mb={3} boxShadow={"none"}>
                  <Grid
                    container
                    alignItems="center"
                    display={"flex"}
                    justifyContent="space-between"
                  >
                    <Grid item xs={8}>
                      <Paper
                        component="form"
                        onSubmit={(event) => {
                          event.preventDefault();
                          handleSearchSubmit();
                        }}
                        className="w-md-60"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          borderRadius: "100px",
                          background: theme.palette.warning.A700,
                          boxShadow: "none",
                        }}
                      >
                        <InputBase
                          ref={inputRef}
                          value={searchWord}
                          sx={{
                            ml: isRTL ? 0 : 3,
                            mr: isRTL ? 3 : 0,
                            flex: 1,
                            mb: "0",
                            px: "10px",
                            fontSize: "14px",
                            color: theme.palette.warning["A200"],
                          }}
                          placeholder={t("COMMON.SEARCH_STUDENT") + ".."}
                          inputProps={{ "aria-label": "search student" }}
                          onChange={handleSearch}
                          onClick={handleScrollDown}
                          onKeyDown={handleKeyDown}
                        />
                        <IconButton
                          type="button"
                          sx={{
                            p: "10px",
                            color: theme.palette.warning["A200"],
                          }}
                          aria-label="search"
                          onClick={handleSearchSubmit}
                        >
                          <SearchIcon
                            sx={{ color: theme.palette.warning["A200"] }}
                          />
                        </IconButton>

                        {searchWord?.length > 0 && (
                          <IconButton
                            type="button"
                            aria-label="Clear"
                            onClick={handleSearchClear}
                          >
                            <ClearIcon
                              sx={{ color: theme.palette.warning["A200"] }}
                            />
                          </IconButton>
                        )}
                      </Paper>
                    </Grid>
                    <Grid
                      item
                      xs={4}
                      display={"flex"}
                      justifyContent={"flex-end"}
                    >
                      <Button
                        onClick={handleOpenModal}
                        sx={{
                          color: theme.palette.warning.A200,
                          borderRadius: "10px",
                          fontSize: "14px",
                        }}
                        endIcon={<ArrowDropDownSharpIcon />}
                        size="small"
                        variant="outlined"
                      >
                        {t("COMMON.SORT_BY").length > 7
                          ? `${t("COMMON.SORT_BY").substring(0, 6)}...`
                          : t("COMMON.SORT_BY")}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
                {modalOpen && (
                  <SortingModal
                    isModalOpen={modalOpen}
                    handleCloseModal={handleCloseModal}
                    handleSorting={handleSorting}
                    routeName={pathname}
                  />
                )}
              </Stack>
            ) : null}
            {classId !== "all" ? (
              <Box>
                <LearnerListHeader
                  numberOfColumns={3}
                  firstColumnName={t("COMMON.ATTENDANCE")}
                  secondColumnName={t("COMMON.CLASS_MISSED")}
                />
                <Box>
                  {inLineLoading ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        marginTop: "20px",
                      }}
                    >
                      <Loader
                        showBackdrop={false}
                        loadingText={t("COMMON.LOADING")}
                      />
                    </Box>
                  ) : displayStudentList?.length > 0 ? (
                    displayStudentList.map((user: any) => (
                      <StudentsStatsList
                        key={user.userId}
                        name={user.name}
                        presentPercent={
                          Math.floor(parseFloat(user.present_percent)) || 0
                        }
                        classesMissed={user.absent || 0}
                        userId={user.userId}
                        cohortId={classId}
                        memberStatus={user.memberStatus}
                      />
                    ))
                  ) : (
                    <>'No data'</>
                  )}
                </Box>
              </Box>
            ) : (
              <Box>
                <LearnerListHeader
                  numberOfColumns={2}
                  firstColumnName={t("COMMON.ATTENDANCE")}
                />
                {allCenterAttendanceData.map(
                  (item: {
                    cohortId: React.Key | null | undefined;
                    name: string;
                    presentPercentage: number;
                  }) => (
                    <CohortAttendanceListView
                      key={item.cohortId}
                      cohortName={item.name}
                      attendancePercent={item.presentPercentage}
                    />
                  )
                )}
              </Box>
            )}
          </Box>
        ) : (
          "No data"
        )}
      </Box>
    </Box>
  );
};

export async function getServerSideProps(context: {
  locale?: string;
  defaultLocale?: string;
}) {
  const locale = context.locale || context.defaultLocale || "en";

  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export default withAccessControl(
  "accessAttendanceOverview",
  accessControl
)(AttendanceOverview);
