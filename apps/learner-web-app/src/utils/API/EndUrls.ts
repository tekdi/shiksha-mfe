export const baseurl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL;
export const telemetryUrl = process.env.NEXT_PUBLIC_TELEMETRY_URL;
export const notificationUrl = process.env.NEXT_PUBLIC_NOTIFICATION_URL;
export const API_ENDPOINTS = {
  accountCreate: `${baseurl}/account/create`,
  accountLogin: `${baseurl}/account/login`,
  authRefresh: `${baseurl}/account/auth/refresh`,
  authLogout: `${baseurl}/account/auth/logout`,
  userAuth: `${baseurl}/user/auth`,
  resetPassword: `${baseurl}/user/reset-password`,
  userList: `${baseurl}/user/list`,
  userRead: (userId: string | string[], fieldValue: boolean) =>
    `${baseurl}/user/read/${userId}?fieldvalue=${fieldValue}`,
  suggestUsername: `${baseurl}/user/suggestUsername`,
  formReadWithContext: (context: string, contextType: string) =>
    `${baseurl}/form/read?context=${context}&contextType=${contextType}`,
  issueCertificate: `${baseurl}/tracking/certificate/issue`,
  renderCertificate: `${baseurl}/tracking/certificate/render`,
  downloadCertificate: `${baseurl}/tracking/certificate/render-PDF`,
  userCheck: `${baseurl}/user/check`,
  sendOTP: `${baseurl}/user/send-otp`,
  verifyOTP: `${baseurl}/user/verify-otp`,
  verifyMagicLink: `https://acinaceous-derek-nondiplomatically.ngrok-free.dev/user/v1/auth/validate-magic-link`,
  program: `${baseurl}/tenant/read`,
  fetchCourseId: `${baseurl}/tracking/content/course/inprogress`,
  userUpdate: (userId: string) => `${baseurl}/user/update/${userId}`,
  courseWiseLernerList: `${baseurl}/tracking/user_certificate/status/search`,
  academicYearsList: `${baseurl}/academicyears/list`,
  cohortSearch: `${baseurl}/cohort/search`,
  contentCreate: `${baseurl}/tracking/content/create`,
  myCohortsRead: (userId: string) => `${baseurl}/user/read/${userId}`,
  attendanceList: `${baseurl}/account/attendance/list`,
  attendanceCreate: `${baseurl}/attendance/create`,
  bulkAttendance: `${baseurl}/account/attendance/bulkAttendance`,
  cohortMemberList: `${baseurl}/cohortmember/list`,
  cohortMemberUpdate: (membershipId: string | number) =>
    `${baseurl}/cohortmember/update/${membershipId}`,
  cohortMemberBulkCreate: `${baseurl}/cohortmember/bulkCreate`,
  cohortHierarchy: (cohortId: string) =>
    `${baseurl}/cohort/cohortHierarchy/${cohortId}`,
  myCohorts: (userId: string) => `${baseurl}/cohort/mycohorts/${userId}`,
  telemetry: `${telemetryUrl}/telemetry`,
  compositeSearch: `${baseurl}/action/composite/v3/search`,
  courseHierarchy: (courseId: string) =>
    `${baseurl}/api/course/v1/hierarchy/${courseId}`,
  questionList: `${baseurl}/api/question/v2/list`,
  userCertStatusGet: `${baseurl}/tracking/user_certificate/status/get`,
  userCertStatusCreate: `${baseurl}/tracking/user_certificate/status/create`,
  contentCourseStatus: `${baseurl}/tracking/content/course/status`,
  contentCourseStatusUpdate: `${baseurl}/tracking/user_certificate/status/update`,
  userUpdatePatch: `${baseurl}/user/update`,
  inAppNotifications: `${notificationUrl}/notification/inApp`,
  inAppMarkRead: `${notificationUrl}/notification/inApp/mark-read`,
  presignedUrl: `${baseurl}/user/presigned-url`,
  contentCreateSunbird: `${baseurl}/action/content/v3/create`,
  contentUploadUrlSunbird: (identifier: string) => `${baseurl}/action/content/v3/upload/url/${identifier}`,
};

// Interface API endpoints
export const INTERFACE_API_ENDPOINTS = {
  sendOtp: `${baseurl}/user/send-otp`,
};

export const COURSE_L2_ENDPOINTS = `${process.env.NEXT_PUBLIC_BASE_URL}/prathamservice/v1/save-user-salesforce`;
export const COURSE_PLANNER_UPLOAD_ENDPOINTS = `${process.env.NEXT_PUBLIC_BASE_URL}/prathamservice/v1/course-planner/upload`;

export const TARGET_SOLUTION_ENDPOINTS = `${process.env.NEXT_PUBLIC_COURSE_PLANNER_API_URL}/solutions/targetedSolutions?type=improvementProject&currentScopeOnly=true`;