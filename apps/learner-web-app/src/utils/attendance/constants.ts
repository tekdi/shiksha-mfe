export enum Status {
  DROPOUT = "dropout",
  ACTIVE = "active",
  ARCHIVED = "archived",
}

export enum CohortPrivileges {
  STUDENT = "student",
}

export const ATTENDANCE_ENUM = {
  PRESENT: "present",
  ABSENT: "absent",
  HALF_DAY: "half-day",
  NOT_MARKED: "notmarked",
  ON_LEAVE: "on-leave",
} as const;

export type AttendanceValue =
  (typeof ATTENDANCE_ENUM)[keyof typeof ATTENDANCE_ENUM] | "";

