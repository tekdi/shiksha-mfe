"use client";

import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Stack,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import {
  bulkAttendance,
} from "@learner/utils/API/services/AttendanceService";
import { shortDateFormat } from "@learner/utils/attendance/helper";
import { showToastMessage } from "../toast";
import { useTranslation } from "@shared-lib";
import { useTenant } from "@learner/context/TenantContext";
import { getContrastTextColor } from "@learner/utils/colorUtils";

interface MarkBulkAttendanceProps {
  open: boolean;
  onClose: () => void;
  classId: string;
  selectedDate: Date;
  onSaveSuccess?: (isModified?: boolean) => void;
  memberList: Array<any>;
  presentCount: number;
  absentCount: number;
  numberOfCohortMembers: number;
  dropoutMemberList: Array<any>;
  dropoutCount: number;
  bulkStatus: string;
}

type AttendanceStatus = "present" | "absent" | "";

const MarkBulkAttendance: React.FC<MarkBulkAttendanceProps> = ({
  open,
  onClose,
  classId,
  selectedDate,
  onSaveSuccess,
  memberList,
  presentCount,
  absentCount,
  numberOfCohortMembers,
  dropoutMemberList,
  dropoutCount,
}) => {
  const { t } = useTranslation();
  const { contentFilter } = useTenant();
  const primaryColor = contentFilter?.theme?.primaryColor || "#E6873C";
  const [rows, setRows] = React.useState<Array<any>>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    console.log("[MarkBulkAttendance] Modal opened/updated:", {
      open,
      memberListLength: memberList?.length || 0,
      memberList: memberList,
      presentCount,
      absentCount,
      numberOfCohortMembers,
      memberListIsArray: Array.isArray(memberList),
      firstMember: memberList?.[0],
    });
    
    if (open && memberList && memberList.length > 0) {
      const initialRows = (memberList || []).map((member: any) => ({
        ...member,
        attendance: member.attendance ?? "",
      }));
      console.log("[MarkBulkAttendance] Setting rows:", {
        rowsCount: initialRows.length,
        sampleRows: initialRows.slice(0, 3),
        allRows: initialRows,
      });
      setRows(initialRows);
    } else if (open && (!memberList || memberList.length === 0)) {
      console.warn("[MarkBulkAttendance] Modal is open but memberList is empty:", {
        open,
        memberListLength: memberList?.length || 0,
        memberList,
      });
      // Still set empty rows to avoid undefined errors
      setRows([]);
    }
  }, [open, memberList, presentCount, absentCount, numberOfCohortMembers]);

  const totalPresent = React.useMemo(
    () =>
      rows.filter((row) => row.attendance === "present").length,
    [rows]
  );
  const totalAbsent = React.useMemo(
    () =>
      rows.filter((row) => row.attendance === "absent").length,
    [rows]
  );

  const allMarked = React.useMemo(
    () => rows.length > 0 && rows.every((row) => row.attendance),
    [rows]
  );

  const handleAttendanceChange = (userId: string, value: AttendanceStatus) => {
    setRows((prev) =>
      prev.map((row) =>
        row.userId === userId ? { ...row, attendance: value } : row
      )
    );
  };

  const handleBulkAction = (value: AttendanceStatus) => {
    setRows((prev) => prev.map((row) => ({ ...row, attendance: value })));
  };

  const handleSave = async () => {
    const userAttendance = rows.map((row) => ({
      userId: row.userId,
      attendance: row.attendance,
      scope: "student", // Add scope to each user attendance item
    }));

    if (!allMarked) {
      showToastMessage("Please mark attendance for all learners", "warning");
      return;
    }

    const payload = {
      attendanceDate: shortDateFormat(selectedDate),
      contextId: classId,
      userAttendance,
    };

    try {
      setLoading(true);
      const response = await bulkAttendance(payload);
      if (response?.responses || response) {
        showToastMessage("Attendance updated successfully", "success");
        const originalMarked =
          presentCount + absentCount === numberOfCohortMembers;
        const newMarked = totalPresent + totalAbsent === rows.length;
        if (onSaveSuccess) {
          onSaveSuccess(originalMarked ? true : newMarked);
        }
        onClose();
      } else {
        showToastMessage("Something went wrong", "error");
      }
    } catch (error) {
      console.error("Failed to mark attendance", error);
      showToastMessage("Failed to mark attendance", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px",
          borderBottom: "2px solid rgba(0,0,0,0.08)",
          backgroundColor: "#fffdf7",
        }}
      >
        <Typography
          variant="h6"
          component="span"
          sx={{ fontWeight: 700, fontSize: "20px", color: "#1F1B13" }}
        >
          {t("LEARNER_APP.ATTENDANCE.MARK_ATTENDANCE")}
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: "#666",
            "&:hover": {
              backgroundColor: "rgba(0,0,0,0.05)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ padding: "24px", backgroundColor: "#fff" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={2}
          mb={3}
        >
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Chip
              label={`${t("LEARNER_APP.ATTENDANCE.TOTAL_LABEL")} ${rows.length}`}
              sx={{
                backgroundColor: "#f5f5f5",
                fontWeight: 600,
                fontSize: "13px",
              }}
            />
            <Chip
              label={`${t("LEARNER_APP.ATTENDANCE.PRESENT_LABEL_WITH_COLON")} ${totalPresent}`}
              sx={{
                backgroundColor: "rgba(76, 175, 80, 0.1)",
                color: "#4caf50",
                fontWeight: 600,
                fontSize: "13px",
              }}
            />
            <Chip
              label={`${t("LEARNER_APP.ATTENDANCE.ABSENT_LABEL_WITH_COLON")} ${totalAbsent}`}
              sx={{
                backgroundColor: "rgba(244, 67, 54, 0.1)",
                color: "#f44336",
                fontWeight: 600,
                fontSize: "13px",
              }}
            />
            {dropoutCount > 0 && (
              <Chip
                label={`${t("LEARNER_APP.ATTENDANCE.DROPOUTS")} ${dropoutCount}`}
                sx={{
                  backgroundColor: "rgba(158, 158, 158, 0.1)",
                  color: "#9e9e9e",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              />
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleBulkAction("")}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 500,
              }}
            >
              {t("LEARNER_APP.ATTENDANCE.CLEAR_ALL")}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleBulkAction("present")}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 500,
                borderColor: "#4caf50",
                color: "#4caf50",
                "&:hover": {
                  borderColor: "#4caf50",
                  backgroundColor: "rgba(76, 175, 80, 0.1)",
                },
              }}
            >
              {t("LEARNER_APP.ATTENDANCE.MARK_ALL_PRESENT")}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleBulkAction("absent")}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 500,
                borderColor: "#f44336",
                color: "#f44336",
                "&:hover": {
                  borderColor: "#f44336",
                  backgroundColor: "rgba(244, 67, 54, 0.1)",
                },
              }}
            >
              {t("LEARNER_APP.ATTENDANCE.MARK_ALL_ABSENT")}
            </Button>
          </Stack>
        </Stack>
        <Box
          sx={{
            border: "1px solid rgba(0,0,0,0.1)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: "#fffdf7",
                  "& .MuiTableCell-head": {
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "#1F1B13",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    borderBottom: "2px solid rgba(253, 190, 22, 0.3)",
                  },
                }}
              >
                <TableCell>{t("LEARNER_APP.ATTENDANCE.NAME")}</TableCell>
                <TableCell align="center">{t("LEARNER_APP.ATTENDANCE.ATTENDANCE_LABEL")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow
                  key={row.userId}
                  sx={{
                    "&:hover": {
                      backgroundColor: "rgba(253, 190, 22, 0.05)",
                    },
                    "&:last-child td": {
                      borderBottom: "none",
                    },
                    borderBottom:
                      index < rows.length - 1
                        ? "1px solid rgba(0,0,0,0.08)"
                        : "none",
                  }}
                >
                  <TableCell sx={{ padding: "16px 20px" }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, fontSize: "15px", color: "#1F1B13" }}
                    >
                      {row.name}
                    </Typography>
                    {row.memberStatus === "dropout" && (
                      <Chip
                        label="Dropout"
                        size="small"
                        sx={{
                          marginTop: "4px",
                          backgroundColor: "rgba(244, 67, 54, 0.1)",
                          color: "#f44336",
                          fontSize: "11px",
                          height: "20px",
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="center" sx={{ padding: "16px 20px" }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 2,
                        alignItems: "center",
                      }}
                    >
                      <IconButton
                        onClick={() => handleAttendanceChange(row.userId, "present")}
                        sx={{
                          color:
                            row.attendance === "present"
                              ? "#4caf50"
                              : "rgba(0,0,0,0.3)",
                          backgroundColor:
                            row.attendance === "present"
                              ? "rgba(76, 175, 80, 0.1)"
                              : "transparent",
                          border:
                            row.attendance === "present"
                              ? "2px solid #4caf50"
                              : "2px solid rgba(0,0,0,0.2)",
                          borderRadius: "50%",
                          width: "44px",
                          height: "44px",
                          transition: "all 0.2s",
                          "&:hover": {
                            backgroundColor:
                              row.attendance === "present"
                                ? "rgba(76, 175, 80, 0.2)"
                                : "rgba(76, 175, 80, 0.1)",
                            borderColor: "#4caf50",
                            transform: "scale(1.1)",
                          },
                        }}
                      >
                        <CheckCircleIcon
                          sx={{
                            fontSize: "28px",
                          }}
                        />
                      </IconButton>
                      <IconButton
                        onClick={() => handleAttendanceChange(row.userId, "absent")}
                        sx={{
                          color:
                            row.attendance === "absent"
                              ? "#f44336"
                              : "rgba(0,0,0,0.3)",
                          backgroundColor:
                            row.attendance === "absent"
                              ? "rgba(244, 67, 54, 0.1)"
                              : "transparent",
                          border:
                            row.attendance === "absent"
                              ? "2px solid #f44336"
                              : "2px solid rgba(0,0,0,0.2)",
                          borderRadius: "50%",
                          width: "44px",
                          height: "44px",
                          transition: "all 0.2s",
                          "&:hover": {
                            backgroundColor:
                              row.attendance === "absent"
                                ? "rgba(244, 67, 54, 0.2)"
                                : "rgba(244, 67, 54, 0.1)",
                            borderColor: "#f44336",
                            transform: "scale(1.1)",
                          },
                        }}
                      >
                        <CancelIcon
                          sx={{
                            fontSize: "28px",
                          }}
                        />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        {dropoutMemberList?.length ? (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Learners marked as dropout earlier
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {dropoutMemberList.map((item: any) => item.name).join(", ")}
            </Typography>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 2,
          borderTop: "2px solid rgba(0,0,0,0.08)",
          backgroundColor: "#fffdf7",
        }}
      >
        <Button
          color="inherit"
          onClick={onClose}
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 600,
            padding: "10px 24px",
            "&:hover": {
              backgroundColor: "rgba(0,0,0,0.05)",
            },
          }}
        >
          {t("LEARNER_APP.COMMON.CANCEL")}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!rows.length || loading}
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 600,
            padding: "10px 32px",
            backgroundColor: primaryColor,
            color: getContrastTextColor(primaryColor),
            boxShadow: `0 4px 12px ${primaryColor}40`,
            "&:hover": {
              backgroundColor: primaryColor,
              opacity: 0.9,
              boxShadow: `0 6px 16px ${primaryColor}50`,
              transform: "translateY(-1px)",
            },
            "&:disabled": {
              backgroundColor: primaryColor,
              opacity: 0.6,
              color: getContrastTextColor(primaryColor),
            },
            transition: "all 0.2s",
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: getContrastTextColor(primaryColor) }} /> : t("LEARNER_APP.COMMON.SAVE")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MarkBulkAttendance;

