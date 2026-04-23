const baseurl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL;

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
  downloadCertificate: `${baseurl}/tracking/certificate/render`,
  userCheck: `${baseurl}/user/check`,
  sendOTP: `${baseurl}/user/send-otp`,
  verifyOTP: `${baseurl}/user/verify-otp`,
  courseWiseLernerList: `${baseurl}/tracking/user_certificate/status/search`,
  getCourseName: `${baseurl}/action/composite/v3/search`,
};

export const COURSE_PLANNER_UPLOAD_ENDPOINTS = `${process.env.NEXT_PUBLIC_BASE_URL}/prathamservice/v1/course-planner/upload`;

export const TARGET_SOLUTION_ENDPOINTS = `${process.env.NEXT_PUBLIC_COURSE_PLANNER_API_URL}/solutions/targetedSolutions?type=improvementProject&currentScopeOnly=true`;
