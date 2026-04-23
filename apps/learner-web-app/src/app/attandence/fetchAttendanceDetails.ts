/* eslint-disable @typescript-eslint/no-empty-object-type */
import { attendanceStatusList } from "@learner/utils/API/services/AttendanceService";
import {
  AttendanceStatusListProps,
  DropoutMember,
} from "@learner/utils/attendance/interfaces";
import { shortDateFormat } from "@learner/utils/attendance/helper";
import {
  CohortPrivileges,
  Status,
} from "@learner/utils/attendance/constants";
import { AttendanceAPILimit } from "../../../app.config";

type AttendanceData = {
  cohortMemberList: any[];
  presentCount: number;
  absentCount: number;
  numberOfCohortMembers: number;
  dropoutMemberList: any[];
  dropoutCount: number;
  bulkStatus: string;
};

export const fetchAttendanceDetails = async (
  nameUserIdArray: any[],
  selectedDate: string,
  classId: string,
  onAttendanceDataUpdate: (data: AttendanceData) => void
) => {
  let cohortMemberList: Array<{}> = [];
  let presentCount = 0;
  let absentCount = 0;
  let numberOfCohortMembers = 0;
  let dropoutMemberList: Array<DropoutMember> = [];
  let dropoutCount = 0;
  let bulkAttendanceStatus = "";

  const updateBulkAttendanceStatus = (arr: any[]) => {
    const isAllPresent = arr.every(
      (user: any) => user.attendance === "present"
    );
    const isAllAbsent = arr.every((user: any) => user.attendance === "absent");
    bulkAttendanceStatus = isAllPresent
      ? "present"
      : isAllAbsent
      ? "absent"
      : "";
  };

  const getPresentCount = (newArray: { attendance: string }[]) =>
    newArray.filter((user) => user.attendance === "present").length;

  const getAbsentCount = (newArray: { attendance: string }[]) =>
    newArray.filter((user) => user.attendance === "absent").length;

  if (nameUserIdArray && selectedDate) {
    const formatSelectedDate = shortDateFormat(new Date(selectedDate));

    const attendanceStatusData: AttendanceStatusListProps = {
      limit: AttendanceAPILimit,
      page: 0,
      filters: {
        fromDate: formatSelectedDate,
        toDate: formatSelectedDate,
        contextId: classId,
        scope: CohortPrivileges.STUDENT,
      },
    };

    const res = await attendanceStatusList(attendanceStatusData);
    const response = res?.data?.attendanceList || [];

    if (nameUserIdArray && nameUserIdArray.length > 0) {
      const getUserAttendanceStatus = (
        users: any[],
        attendanceList: any[]
      ) => {
        const userAttendanceArray: { userId: any; attendance: any }[] = [];

        users.forEach((user) => {
          const userId = user.userId;
          const attendance = attendanceList.find(
            (status) => status.userId === userId
          );
          userAttendanceArray.push({
            userId,
            attendance: attendance?.attendance || "",
          });
        });
        return userAttendanceArray;
      };

      const userAttendanceArray = getUserAttendanceStatus(
        nameUserIdArray,
        response
      );

      const mergeArrays = (
        users: {
          userName: any;
          userId: string;
          name: string;
          memberStatus: string;
          updatedAt: string | number | Date;
        }[],
        attendance: { userId: string; attendance: string }[]
      ) => {
        const newArray = users.map((user) => {
          const attendanceEntry = attendance.find(
            (entry) => entry.userId === user.userId
          );
          return {
            userId: user.userId,
            name: user.name,
            memberStatus: user.memberStatus,
            attendance: attendanceEntry?.attendance || "",
            updatedAt: user.updatedAt,
            userName: user.userName,
          };
        });

        if (newArray.length !== 0) {
          numberOfCohortMembers = newArray.filter(
            (member) =>
              member.memberStatus === Status.ACTIVE ||
              member.attendance !== "" ||
              (member.memberStatus === Status.DROPOUT &&
                shortDateFormat(new Date(member.updatedAt)) >
                  shortDateFormat(new Date(selectedDate))) ||
              (member.memberStatus === Status.ARCHIVED &&
                shortDateFormat(new Date(member.updatedAt)) >
                  shortDateFormat(new Date(selectedDate)))
          ).length;
          cohortMemberList = newArray;
          presentCount = getPresentCount(newArray);
          absentCount = getAbsentCount(newArray);

          const hasDropout = newArray.some(
            (user) => user.memberStatus === Status.DROPOUT
          );
          if (hasDropout) {
            cohortMemberList = newArray.filter(
              (user) =>
                user.memberStatus === Status.ACTIVE ||
                (user.memberStatus === Status.DROPOUT &&
                  shortDateFormat(new Date(user.updatedAt)) >
                    shortDateFormat(new Date(selectedDate))) ||
                (user.memberStatus === Status.ARCHIVED &&
                  shortDateFormat(new Date(user.updatedAt)) >
                    shortDateFormat(new Date(selectedDate)))
            );
            dropoutMemberList = newArray.filter(
              (user) =>
                user.memberStatus === Status.DROPOUT &&
                shortDateFormat(new Date(user.updatedAt)) <=
                  shortDateFormat(new Date(selectedDate))
            );
            dropoutCount = dropoutMemberList.length;
          }
        } else {
          cohortMemberList = nameUserIdArray.filter(
            (user) =>
              user.memberStatus === Status.ACTIVE ||
              (user.memberStatus === Status.DROPOUT &&
                shortDateFormat(new Date(user.updatedAt)) >
                  shortDateFormat(new Date(selectedDate))) ||
              (user.memberStatus === Status.ARCHIVED &&
                shortDateFormat(new Date(user.updatedAt)) >
                  shortDateFormat(new Date(selectedDate)))
          );
          dropoutMemberList = nameUserIdArray.filter(
            (user) =>
              user.memberStatus === Status.DROPOUT &&
              shortDateFormat(new Date(user.updatedAt)) <=
                shortDateFormat(new Date(selectedDate))
          );
          numberOfCohortMembers = nameUserIdArray.filter(
            (member) =>
              member.memberStatus === Status.ACTIVE ||
              (member.memberStatus === Status.DROPOUT &&
                shortDateFormat(new Date(member.updatedAt)) >
                  shortDateFormat(new Date(selectedDate))) ||
              (member.memberStatus === Status.ARCHIVED &&
                shortDateFormat(new Date(member.updatedAt)) >
                  shortDateFormat(new Date(selectedDate)))
          ).length;
        }

        updateBulkAttendanceStatus(newArray);
        return newArray;
      };

      mergeArrays(nameUserIdArray, userAttendanceArray);
    } else {
      // If no members, still create empty member list structure
      console.log("[fetchAttendanceDetails] No members in nameUserIdArray, creating empty structure");
      cohortMemberList = [];
      numberOfCohortMembers = 0;
      presentCount = 0;
      absentCount = 0;
      dropoutMemberList = [];
      dropoutCount = 0;
      bulkAttendanceStatus = "";
    }
  } else {
    // If nameUserIdArray is not provided, ensure we still update with empty data
    console.log("[fetchAttendanceDetails] nameUserIdArray not provided, creating empty structure");
    cohortMemberList = [];
    numberOfCohortMembers = 0;
    presentCount = 0;
    absentCount = 0;
    dropoutMemberList = [];
    dropoutCount = 0;
    bulkAttendanceStatus = "";
  }

  const attendanceDataToUpdate = {
    cohortMemberList,
    presentCount,
    absentCount,
    numberOfCohortMembers,
    dropoutMemberList,
    dropoutCount,
    bulkAttendanceStatus: bulkAttendanceStatus,
  };
  
  console.log("[fetchAttendanceDetails] Calling onAttendanceDataUpdate with:", {
    cohortMemberListLength: cohortMemberList.length,
    presentCount,
    absentCount,
    numberOfCohortMembers,
    dropoutCount,
    bulkAttendanceStatus,
    sampleMembers: cohortMemberList.slice(0, 3).map(m => ({
      userId: (m as any).userId,
      name: (m as any).name,
      attendance: (m as any).attendance,
    })),
  });
  
  onAttendanceDataUpdate(attendanceDataToUpdate);
};

