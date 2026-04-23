/* eslint-disable @typescript-eslint/no-inferrable-types */
import { TFunction } from "i18next";
export enum Status {
  DRAFT = "Draft",
  LIVE = "Live",
  SUBMITTED_FOR_REVIEW = "Review",
}
export enum ContentType {
  QUESTION_SET = "QuestionSet",
}
export enum Editor {
  CONTENT = "content",
  QUESTION_SET = "questionset",
  COLLECTION = "collection",
}
export enum Publish {
  PUBLISH = "publish",
  REJECT = "reject",
}
export enum Role {
  SCTA = "Content creator",
  CCTA = "Content reviewer",
}
export enum ContentStatus {
  PUBLISHED = "Published",
  REJECTED = "Rejected",
}
export const SortOptions = ["Modified On", "Created On"];
export const StatusOptions = ["Live", "Review", "Draft", "All"];
export const LIMIT = 100;
export const PrimaryCategoryValue = [
  "Course",
  "eTextbook",
  "Explanation Content",
  "Learning Resource",
  "Practice Question Set",
  "Teacher Resource",
];
export const TENANT_DATA = {
  SECOND_CHANCE_PROGRAM: "Second Chance Program",
};
export const limit: number = 200;
export const refetchInterval: number = 5 * 60 * 1000; // 5 min
export const gcTime: number = 10 * 60 * 1000; // 10 Min
export const pagesLimit: number = 10;
export const labelsToExtractForMiniProfile = [
  "AGE",
  "GENDER",
  "LEARNERS_PRIMARY_WORK",
  "TYPE_OF_LEARNER",
];
export const getMenuItems = (
  t: TFunction,
  dateRange: string | Date,
  currentDayMonth: string | Date
) => {
  return [
    t("DASHBOARD.LAST_SEVEN_DAYS_RANGE", {
      date_range: dateRange,
    }),
    t("DASHBOARD.AS_OF_TODAY_DATE", {
      day_date: currentDayMonth,
    }),
    t("COMMON.LAST_MONTH"),
    t("COMMON.LAST_SIX_MONTHS"),
    t("COMMON.CUSTOM_RANGE"),
  ];
};
export const names = [
  "name",
  "age",
  "gender",
  "student_type",
  "enrollment_number",
  "primary_work",
];
export enum Role {
  STUDENT = "Student",
  TEACHER = "Teacher",
  TEAM_LEADER = "Lead",
  ADMIN = "Admin",
}
export enum Status {
  DROPOUT = "dropout",
  ACTIVE = "active",
  ARCHIVED = "archived",
}
export enum cohortHierarchy {
  BLOCK = "BLOCK",
  COHORT = "COHORT",
}
export enum sessionMode {
  ONLINE = "online",
  OFFLINE = "offline",
}
export enum cohortPrivileges {
  STUDENT = "student",
}
export enum FormContext {
  USERS = "USERS",
  COHORTS = "COHORTS",
  COHORT_MEMBER = "COHORTMEMBER",
}
export enum FormContextType {
  STUDENT = "STUDENT",
  TEACHER = "TEACHER",
  TEAM_LEADER = "TEAM LEADER",
  COHORT = "COHORT",
  COHORT_MEMBER = "COHORTMEMBER",
}
export enum ObservationEntityType {
  LEARNER = "learner",
  FACILITATOR = "facilitator",
  CENTER = "center",
}
export enum ObservationStatus {
  DRAFT = "draft",
  COMPLETED = "completed",
  NOT_STARTED = "notstarted",
  STARTED = "started",
  ALL = "All",
}
export enum CenterType {
  REGULAR = "REGULAR",
  REMOTE = "REMOTE",
  UNKNOWN = "UNKNOWN",
}
export enum RoleId {
  STUDENT = "493c04e2-a9db-47f2-b304-503da358d5f4",
  TEACHER = "3bde0028-6900-4900-9d05-eeb608843718",
  TEAM_LEADER = "9dd9328f-1bc7-444f-96e3-c5e1daa3514a",
  ADMIN = "ee482faf-8a41-45fe-9656-5533dd6a787c",
}
export enum Pagination {
  ITEMS_PER_PAGE = 10,
  MAX_ITEMS = 50,
}
export enum LeftDays {
  ONE_DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24,
}
export enum Telemetry {
  CLICK = "CLICK",
  SEARCH = "SEARCH",
  VIEW = "VIEW",
}
export enum TelemetryEventType {
  CLICK = "CLICK",
  SEARCH = "SEARCH",
  VIEW = "VIEW",
  RADIO = "RADIO",
}
export enum AssessmentStatus {
  NOT_STARTED = "Not_Started",
  IN_PROGRESS = "In_Progress",
  COMPLETED = "Completed",
  COMPLETED_SMALL = "completed",
}
export enum QueryKeys {
  GET_ACTIVE_FACILITATOR = "getActiveFacilitatorList",
  MY_COHORTS = "myCohorts",
}
export enum CoursePlannerConstants {
  SUBJECT = "SUBJECT",
  STATES = "STATES",
  BOARD = "BOARD",
  MEDIUM = "MEDIUM",
  GRADE = "GRADE",
  SUBJECT_SMALL = "Subject",
  STATES_SMALL = "State",
  BOARD_SMALL = "Board",
  MEDIUM_SMALL = "Medium",
  GRADE_SMALL = "Grade",
}
export enum EventStatus {
  UPCOMING = "UPCOMING",
  LIVE = "LIVE",
  PASSED = "PASSED",
}
export const metaTags = {
  title: "Pratham Learning Management Portal",
  description:
    "Pratham's Second Chance program focuses on providing school dropouts, especially young girls and women, another chance at education. Second Chance aims to support those who could not complete their secondary education. The program focuses on completion of Grade 10. The academic certificate that they receive opens the door for further opportunities for lifelong learning and growth. The Second Chance program uses innovative teaching methods, to provide accessible learning opportunities very close to where the students live.",
  keywords: "Second Chance Program",
};
export enum ResourcesType {
  PREREQUSITE = "prerequisite",
  POSTREQUSITE = "postrequisite",
  OTHER = "other",
  NONE = "none",
}
export const FeesStepBoards = ["NIOS"];
import { StaticImageData } from "next/image"; // Import StaticImageData for type safety with images
// Define the enum for content types
// Define the type for the content type mapping
export type FileType = {
  [key in ContentType]: {
    name: string;
    imgPath: StaticImageData;
    BgImgPath?: StaticImageData;
  };
};
// Create the mapping object with enum keys
export enum contentStatus {
  COMPLETED = "Completed",
  IN_PROGRESS = "In_Progress",
  NOT_STARTED = "Not_Started",
}
export enum sessionType {
  PLANNED = "planned",
  EXTRA = "extra",
}
export enum fieldKeys {
  GENDER = "gender",
}