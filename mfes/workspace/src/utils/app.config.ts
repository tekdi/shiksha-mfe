/* eslint-disable @typescript-eslint/no-inferrable-types */
export const MIME_TYPE = {
  COLLECTION_MIME_TYPE: "application/vnd.ekstep.content-collection",
  ECML_MIME_TYPE: "application/vnd.ekstep.ecml-archive",
  GENERIC_MIME_TYPE: [
    "application/pdf",
    "video/mp4",
    "application/vnd.ekstep.html-archive",
    "application/epub",
    "application/vnd.ekstep.h5p-archive",
    "video/webm",
    "text/x-url",
    "video/x-youtube",
    "video/youtube",
  ],
  QUESTIONSET_MIME_TYPE: "application/vnd.sunbird.questionset",
  COURSE_MIME_TYPE: "application/vnd.ekstep.content-collection",
  INTERACTIVE_MIME_TYPE: [
    "application/vnd.ekstep.h5p-archive",
    "application/vnd.ekstep.html-archive",
    "video/x-youtube",
    "video/youtube",
  ],
};

export const CLOUD_STORAGE_URL =
  process.env.NEXT_PUBLIC_CLOUD_STORAGE_URL || "";
if (!CLOUD_STORAGE_URL) {
  console.warn(
    "NEXT_PUBLIC_CLOUD_STORAGE_URL is not set in the environment variables."
  );
}
export const lowLearnerAttendanceLimit: number = 32;
export const avgLearnerAttendanceLimit: number = 66;
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
  DRAFT = "Draft",
  LIVE = "Live",
  SUBMITTED_FOR_REVIEW = "Review",
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