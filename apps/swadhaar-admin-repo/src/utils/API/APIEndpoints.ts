const baseurl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'https://interface.tekdinext.com/interface/v1';
const lmsBase = process.env.NEXT_PUBLIC_LMS_SERVICE_URL || 'https://middleware-qa.aspireleaders.org/lms-service/v1';

const toQueryString = (queryString = ''): string => {
  if (!queryString) return '';
  return queryString.startsWith('?') ? queryString : `?${queryString}`;
};

export const API_ENDPOINTS = {
  contentRead: (doId: string, fields?: string) => {
    const fieldsQuery = fields ? `?fields=${fields}` : '';
    return `${baseurl}/api/content/v1/read/${doId}${fieldsQuery}`;
  },
  academicYearsList: `${baseurl}/academicyears/list`,
  formRead: `${baseurl}/form/read`,
  accountCreate: `${baseurl}/account/create`,
  userUpdate: (userId: string) => `${baseurl}/user/update/${userId}`,
  myCohorts: (userId: string | string[]) => `${baseurl}/cohort/mycohorts/${userId}`,
  accountLogin: `${baseurl}/account/login`,
  authRefresh: `${baseurl}/account/auth/refresh`,
  authLogout: `${baseurl}/account/auth/logout`,
  userAuth: `${baseurl}/user/auth`,
  sendOTP: `${baseurl}/user/send-otp`,
  verifyOTP: `${baseurl}/user/verify-otp`,
  resetPassword: `${baseurl}/user/reset-password`,
  fieldOptionsRead: `${baseurl}/fields/options/read`,
  cohortSearch: process.env.NEXT_PUBLIC_COHORT_SEARCH_URL || 'https://middleware-qa.aspireleaders.org/user/v1/cohort/search',
  cohortMemberListApplication: process.env.NEXT_PUBLIC_COHORT_MEMBER_APPLICATION_URL || 'https://middleware-qa.aspireleaders.org/user/v1/cohortmember/list-application',
  cohortContentSearch: `${baseurl}/user/cohortcontent/search`,
  fieldOptionDelete: (type: string, option: string) => `${baseurl}/fields/options/delete/${type}?option=${option}`,
  fieldUpdate: (fieldId: string) => `${baseurl}/fields/update/${fieldId}`,
  cohortUpdate: (cohortId: string) => `${baseurl}/cohort/update/${cohortId}`,
  notificationSend: `${baseurl}/notification/send`,
  tenantRead: `${baseurl}/tenant/read`,
  tenantCreate: `${baseurl}/tenant/create`,
  tenantUpdate: (tenantId: string) => `${baseurl}/tenant/update/${tenantId}`,
  tenantDelete: (tenantId: string) => `${baseurl}/tenant/delete/${tenantId}`,
  tenantSearch: `${baseurl}/tenant/search`,
  adminUserList: `${baseurl}/user/list`,
  userList: process.env.NEXT_PUBLIC_USER_LIST_URL || 'https://middleware-qa.aspireleaders.org/user/v1/list',
  cohortMemberList: `${baseurl}/cohortmember/list`,
  userRead: (userId: string | string[], fieldValue: boolean = true) =>
    `${process.env.NEXT_PUBLIC_USER_READ_URL || 'https://middleware-qa.aspireleaders.org/user/v1/read'}/${userId}?fieldvalue=${fieldValue}`,
  suggestUsername: `${baseurl}/user/suggestUsername`,
  cohortUpdateUser: (userId?: string) => `${baseurl}/cohort/update/${userId}`,
  formReadWithContext: (context: string, contextType: string) => `${baseurl}/form/read?context=${context}&contextType=${contextType}`,
  cohortCreate: `${baseurl}/cohort/create`,
  cohortMemberBulkCreate: `${baseurl}/cohortmember/bulkCreate`,
  cohortMemberUpdate: (membershipId: string | number) => `${baseurl}/cohortmember/update/${membershipId}`,
  notificationTemplate: `${baseurl}/notification-templates`,
  courseStatus: `${baseurl}/tracking/user_certificate/user_course_status`,
  courseWiseLernerList: `${baseurl}/tracking/user_certificate/status/search`,
  getCourseName: `${baseurl}/action/composite/v3/search`,
  issueCertificate: `${baseurl}/tracking/certificate/issue`,
  renderCertificate: `${baseurl}/tracking/certificate/render`,
  downloadCertificate: `${baseurl}/tracking/certificate/render`,
  framework: (frameworkId: string) => `${baseurl}/framework/v1/read/${frameworkId}`,
  actionObject: `${baseurl}/action/object/category/definition/v1/read?fields=objectMetadata,forms,name,label`,
  compositeSearch: `${baseurl}/action/composite/v3/search`,
  contentHierarchy: (doId: string) => `${baseurl}/action/content/v3/hierarchy/${doId}`,
  lmsCoursesSearch: (queryString = '') => `${lmsBase}/courses/search${toQueryString(queryString)}`,
  lmsModulesSearch: (queryString = '') => `${lmsBase}/modules/search${toQueryString(queryString)}`,
  lmsCourseHierarchy: (courseId: string) => `${lmsBase}/courses/${courseId}/hierarchy`,
  contentCreate: `${baseurl}/action/content/v3/create`,
  contentUpdate: (doId: string) => `${baseurl}/action/content/v3/update/${doId}`,
  contentRetire: (doId: string) => `${baseurl}/action/content/v3/retire/${doId}`,
};
