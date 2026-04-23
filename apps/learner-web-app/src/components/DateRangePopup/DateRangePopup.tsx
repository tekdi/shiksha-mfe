"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Divider,
  FormControl,
  MenuItem,
  MenuList,
  Modal,
  Select,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { alpha } from "@mui/material/styles";
import { getTodayDate, shortDateFormat } from "@learner/utils/attendance/helper";
import { format } from "date-fns";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useTranslation } from "@shared-lib";
import { getContrastTextColor } from "@learner/utils/colorUtils";

interface DateRangePopupProps {
  selectedValue: string;
  setSelectedValue: (value: string) => void;
  onDateRangeSelected: (dates: { fromDate: string; toDate: string }) => void;
  dateRange?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

const DateRangePopup: React.FC<DateRangePopupProps> = ({
  selectedValue,
  setSelectedValue,
  onDateRangeSelected,
  dateRange,
  primaryColor = "#E6873C",
  secondaryColor = "#1A1A1A",
}) => {
  const { t, language } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [calendarDate, setCalendarDate] = useState<Date | [Date, Date] | null>(null);

  const today = new Date();
  const last7Days = new Date(today);
  last7Days.setDate(today.getDate() - 6);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const menuItems = useMemo(() => {
    const dateRangeStr = dateRange || formatDate(last7Days) + " to " + formatDate(today);
    const lastSevenDaysLabel = `${t("LEARNER_APP.ATTENDANCE.LAST_7_DAYS") || "Last 7 Days"} (${dateRangeStr})`;
    const asOfTodayLabel = `${t("COMMON.AS_OF_TODAY") || "As of today"} (${formatDate(today)})`;
    return [
      lastSevenDaysLabel,
      asOfTodayLabel,
      t("COMMON.LAST_MONTH") || "Last Month",
      t("COMMON.LAST_6_MONTHS") || "Last 6 Months",
      t("COMMON.CUSTOM_RANGE") || "Custom Range",
    ];
  }, [t, language, dateRange]);

  const getDateRange = (index: number | null) => {
    let fromDate: Date;
    let toDate = today;

    switch (index) {
      case 0: // Last 7 Days
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 6);
        break;
      case 1: // Today
        fromDate = new Date(today);
        toDate = new Date(today);
        break;
      case 2: // Last Month
        fromDate = new Date(today);
        fromDate.setMonth(today.getMonth() - 1);
        fromDate.setDate(1);
        toDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 3: // Last 6 Months
        fromDate = new Date(today);
        fromDate.setMonth(today.getMonth() - 6);
        fromDate.setDate(1);
        toDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 4: // Custom Range
        if (Array.isArray(calendarDate) && calendarDate.length === 2) {
          fromDate = calendarDate[0];
          toDate = calendarDate[1];
        } else {
          fromDate = last7Days;
        }
        break;
      default:
        fromDate = last7Days;
    }

    return {
      fromDate: formatDate(fromDate),
      toDate: formatDate(toDate),
    };
  };

  const toggleModal = () => setIsModalOpen(!isModalOpen);
  const toggleCalendarModal = () => setIsCalendarModalOpen(!isCalendarModalOpen);

  const handleMenuItemClick = (index: number, item: string) => {
    setSelectedIndex(index);
    setSelectedValue(item);
    if (index === 4) {
      toggleCalendarModal();
    }
  };

  const handleApply = () => {
    if (selectedIndex !== null) {
      const dates = getDateRange(selectedIndex);
      onDateRangeSelected(dates);
      setIsModalOpen(false);
    }
  };

  const handleCalendarChange = (value: Date | [Date, Date] | null) => {
    setCalendarDate(value);
  };

  const handleCalendarApply = () => {
    if (Array.isArray(calendarDate) && calendarDate.length === 2) {
      setSelectedIndex(4);
      const dates = getDateRange(4);
      onDateRangeSelected(dates);
      setIsCalendarModalOpen(false);
      setIsModalOpen(false);
    }
  };

  const handleCalendarCancel = () => {
    setIsCalendarModalOpen(false);
    setCalendarDate(null);
  };

  const handleCalendarClear = () => {
    setCalendarDate(null);
  };

  const modalStyle = {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "85%",
    bgcolor: "background.paper",
    boxShadow: 24,
    borderRadius: "16px",
    "@media (min-width: 600px)": {
      width: "450px",
    },
  };

  return (
    <Box sx={{ px: "2px" }}>
      <FormControl sx={{ width: "100%" }}>
        <Select
          sx={{
            height: "40px",
            width: "100%",
            borderRadius: "8px",
            fontSize: "14px",
            backgroundColor: "#FFFFFF",
            color: secondaryColor,
            "& .MuiSelect-select": {
              color: secondaryColor,
            },
            "& .MuiSvgIcon-root": {
              color: secondaryColor,
            },
          }}
          value={selectedValue || menuItems[0]}
          displayEmpty
          onClick={toggleModal}
          inputProps={{ readOnly: true }}
        >
          <MenuItem value={selectedValue || menuItems[0]} disabled>
            {selectedValue || menuItems[0]}
          </MenuItem>
        </Select>
      </FormControl>

      {/* Date Range Options Modal */}
      <Modal
        open={isModalOpen}
        onClose={(event, reason) => {
          if (reason !== "backdropClick") {
            setIsModalOpen(false);
          }
        }}
        aria-labelledby="date-range-modal"
      >
        <Box sx={modalStyle}>
          <Box
            sx={{
              padding: "20px 20px 5px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography sx={{ color: secondaryColor, fontWeight: 600 }}>
              {t("COMMON.DATE_RANGE") || "Date Range"}
            </Typography>
            <CloseIcon
              onClick={() => setIsModalOpen(false)}
              sx={{ cursor: "pointer", color: secondaryColor }}
            />
          </Box>
          <Divider />
          <MenuList sx={{ margin: "0 9px", py: 1 }} dense>
            {menuItems.map((item, index) => (
              <MenuItem
                key={index}
                selected={selectedIndex === index}
                onClick={() => handleMenuItemClick(index, item)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: selectedIndex === index ? "32px" : "16px",
                  backgroundColor: "transparent",
                  color: secondaryColor,
                  "&:hover": {
                    backgroundColor: alpha(primaryColor, 0.08),
                    color: primaryColor,
                  },
                  "&.Mui-selected": {
                    backgroundColor: alpha(primaryColor, 0.12),
                    color: primaryColor,
                    "&:hover": {
                      backgroundColor: alpha(primaryColor, 0.16),
                    },
                  },
                }}
              >
                {item}
              </MenuItem>
            ))}
          </MenuList>
          <Divider />
          <Box sx={{ padding: "20px" }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleApply}
              sx={{
                backgroundColor: primaryColor,
                color: getContrastTextColor(primaryColor),
                "&:hover": {
                  backgroundColor: primaryColor,
                  opacity: 0.9,
                },
              }}
            >
              {t("COMMON.APPLY") || "Apply"}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Custom Calendar Modal */}
      <Modal
        open={isCalendarModalOpen}
        onClose={handleCalendarCancel}
        aria-labelledby="calendar-modal"
      >
        <Box sx={modalStyle} padding={"12px 0 12px 0"}>
          <Box sx={{ padding: "0 15px 15px" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "5px",
                alignItems: "center",
              }}
            >
              <Typography sx={{ color: secondaryColor, fontWeight: 600 }}>
                {t("COMMON.CUSTOM_RANGE") || "Custom Range"}
              </Typography>
              <CloseIcon
                onClick={handleCalendarCancel}
                sx={{ cursor: "pointer", color: secondaryColor }}
              />
            </Box>
            <Box sx={{ paddingTop: "10px" }}>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: alpha(secondaryColor, 0.6),
                  mb: 1,
                }}
              >
                {t("COMMON.SELECT_DATE_RANGE") || "Select Date Range"}
              </Typography>
              {Array.isArray(calendarDate) && calendarDate.length === 2 && (
                <Typography
                  sx={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: secondaryColor,
                  }}
                >
                  {format(calendarDate[0], "MMM dd, yyyy")} –{" "}
                  {format(calendarDate[1], "MMM dd, yyyy")}
                </Typography>
              )}
            </Box>
          </Box>
          <Divider />
          <Box sx={{ padding: "20px", display: "flex", justifyContent: "center" }}>
            <Calendar
              onChange={handleCalendarChange}
              selectRange
              value={calendarDate}
              maxDate={today}
            />
          </Box>
          <Divider />
          <Box
            sx={{
              padding: "20px 18px 10px",
              display: "flex",
              gap: "15px",
              justifyContent: "flex-end",
            }}
          >
            <Button
              onClick={handleCalendarClear}
              disabled={!calendarDate}
              sx={{
                color: secondaryColor,
                fontSize: "14px",
                fontWeight: 500,
                "&:hover": {
                  backgroundColor: alpha(secondaryColor, 0.08),
                },
                "&:disabled": {
                  color: alpha(secondaryColor, 0.4),
                },
              }}
            >
              {t("COMMON.CLEAR") || "Clear"}
            </Button>
            <Button
              onClick={handleCalendarCancel}
              sx={{
                color: secondaryColor,
                fontSize: "14px",
                fontWeight: 500,
                "&:hover": {
                  backgroundColor: alpha(secondaryColor, 0.08),
                },
              }}
            >
              {t("COMMON.CANCEL") || "Cancel"}
            </Button>
            <Button
              onClick={handleCalendarApply}
              disabled={!Array.isArray(calendarDate) || calendarDate.length !== 2}
              sx={{
                color: primaryColor,
                fontSize: "14px",
                fontWeight: 500,
                "&:hover": {
                  backgroundColor: alpha(primaryColor, 0.08),
                },
                "&:disabled": {
                  color: alpha(secondaryColor, 0.4),
                },
              }}
            >
              {t("COMMON.OK") || "OK"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default DateRangePopup;

