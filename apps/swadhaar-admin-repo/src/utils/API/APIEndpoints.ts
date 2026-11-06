import { trimTrailingSlashes } from '@/utils/url';
// Swadhaar-specific middleware: the single base URL for every API
export const swadhaarMiddlewareUrl = trimTrailingSlashes(
  process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'https://swadhaar-middleware-qa.tekdinext.com'
);
const baseurl = swadhaarMiddlewareUrl;
const cohortBaseUrl = baseurl;
const lmsBase = `${baseurl}/lms-service/v1`;
const assessmentBase = trimTrailingSlashes(process.env.NEXT_PUBLIC_ASSESSMENT_SERVICE_URL || `${baseurl}/assessment/v1`);
const certificateBase = trimTrailingSlashes(
  process.env.NEXT_PUBLIC_CERTIFICATE_SERVICE_URL || `${baseurl}/aspirespecific/certificate`
);

/**
 * Lesson media paths for locally stored files are relative (e.g. /uploads/lessons/media/x.pdf), so a
 * browser would resolve them against this app. Files are served by the LMS service behind the middleware;
 * NEXT_PUBLIC_MEDIA_BASE_URL overrides that location.
 */
const mediaBase = trimTrailingSlashes(process.env.NEXT_PUBLIC_MEDIA_BASE_URL || `${baseurl}/lms-service`);
export const resolveMediaUrl = (path?: string | null): string => {
  if (!path) return '';
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path;
  return `${mediaBase}/${path.replace(/^\/+/, '')}`;
};

const toQueryString = (queryString = ''): string => {
  if (!queryString) return '';
  return queryString.startsWith('?') ? queryString : `?${queryString}`;
};

export const API_ENDPOINTS = {
  // Base URLs
  baseurl,
  cohortBaseUrl,
  lmsBase,
  assessmentBase,
  certificateBase,

  // Content & Framework
  contentRead: (doId: string, fields?: string) => {
    const fieldsQuery = fields ? `?fields=${fields}` : '';
    return `${baseurl}/api/content/v1/read/${doId}${fieldsQuery}`;
  },
  contentCreate: `${baseurl}/action/content/v3/create`,
  contentUpdate: (doId: string) => `${baseurl}/action/content/v3/update/${doId}`,
  contentRetire: (doId: string) => `${baseurl}/action/content/v3/retire/${doId}`,
  contentHierarchy: (doId: string) => `${baseurl}/action/content/v3/hierarchy/${doId}`,
  compositeSearch: `${baseurl}/action/composite/v3/search`,
  framework: (frameworkId: string) => `${baseurl}/framework/v1/read/${frameworkId}`,
  actionObject: `${baseurl}/action/object/category/definition/v1/read?fields=objectMetadata,forms,name,label`,

  // Academic Years & Forms
  academicYearsList: `${baseurl}/user/v1/academicyears/list`,
  formRead: `${baseurl}/form/read`,
  formReadWithContext: (context: string, contextType: string) => `${baseurl}/form/read?context=${context}&contextType=${contextType}`,

  // Auth & Account
  accountCreate: `${baseurl}/account/create`,
  accountLogin: `${baseurl}/account/login`,
  authRefresh: `${baseurl}/account/auth/refresh`,
  authLogout: `${baseurl}/account/auth/logout`,
  userAuth: `${swadhaarMiddlewareUrl}/user/v1/auth`,
  sendOTP: `${swadhaarMiddlewareUrl}/user/v1/send-otp`,
  verifyOTP: `${swadhaarMiddlewareUrl}/user/v1/verify-otp`,
  resetPassword: `${baseurl}/v1/user/reset-password`,
  suggestUsername: `${baseurl}/v1/user/suggestUsername`,

  // User Management
  adminUserList: `${swadhaarMiddlewareUrl}/user/v1/list`,
  userList: `${baseurl}/user/v1/list`,
  userRolesList: `${baseurl}/user/v1/rbac/roles/list/roles`,
  userCreate: `${baseurl}/user/v1/create`,
  userBulkImport: `${baseurl}/user/v1/bulk-import/users`,
  userRead: (userId: string | string[], fieldValue: boolean = true) =>
    `${swadhaarMiddlewareUrl}/user/v1/read/${userId}?fieldvalue=${fieldValue}`,
  userAnonymize: `${baseurl}/user/v1/anonymize`,
  userUpdate: (userId: string) => `${baseurl}/user/v1/update/${userId}`,

  // Fields / Master Data
  fieldOptionsRead: `${baseurl}/user/v1/fields/options/read`,
  fieldOptionDelete: (type: string, option: string) => `${baseurl}/fields/options/delete/${type}?option=${option}`,
  fieldUpdate: (fieldId: string) => `${baseurl}/fields/update/${fieldId}`,

  // Cohorts
  myCohorts: (userId: string | string[]) => `${cohortBaseUrl}/cohort/mycohorts/${userId}`,
  cohortSearch: `${cohortBaseUrl}/user/v1/cohort/search`,
  cohortMemberListApplication: `${cohortBaseUrl}/user/v1/cohortmember/list-application`,
  cohortContentSearch: `${cohortBaseUrl}/user/cohortcontent/search`,
  cohortMemberList: `${cohortBaseUrl}/user/v1/cohortmember/list`,
  cohortCreate: `${cohortBaseUrl}/user/v1/cohort/create`,
  cohortUpdate: (cohortId: string) => `${cohortBaseUrl}/user/v1/cohort/update/${cohortId}`,
  cohortDelete: (cohortId: string) => `${cohortBaseUrl}/user/v1/cohort/delete/${cohortId}`,
  cohortUpdateUser: (userId?: string) => `${cohortBaseUrl}/user/v1/cohort/update/${userId}`,
  cohortMemberBulkCreate: `${cohortBaseUrl}/user/v1/cohortmember/bulkCreate`,
  cohortMemberUpdate: (membershipId: string | number) => `${cohortBaseUrl}/user/v1/cohortmember/update/${membershipId}`,

  // Tenants
  tenantRead: `${baseurl}/tenant/read`,
  tenantCreate: `${baseurl}/tenant/create`,
  tenantUpdate: (tenantId: string) => `${baseurl}/tenant/update/${tenantId}`,
  tenantDelete: (tenantId: string) => `${baseurl}/tenant/delete/${tenantId}`,
  tenantSearch: `${baseurl}/tenant/search`,

  // Notifications
  notificationSend: `${baseurl}/notification/send`,
  notificationTemplate: `${baseurl}/notification-templates`,

  // Certificates & DID
  issueCertificate: `${certificateBase}/issue`,
  generateDid: `${certificateBase}/generateDid`,
  credentialSchema: `${baseurl}/credential-schema`,
  didGenerate: `${baseurl}/did/generate`,
  courseStatus: `${baseurl}/tracking/user_certificate/user_course_status`,
  courseWiseLernerList: `${baseurl}/tracking/user_certificate/status/search`,
  getCourseName: `${baseurl}/action/composite/v3/search`,
  trackingIssueCertificate: `${certificateBase}/issue`,
  renderCertificate: `${certificateBase}/render`,
  downloadCertificate: `${certificateBase}/render`,

  // LMS Service
  lmsCourses: `${lmsBase}/courses`,
  lmsCoursesSearch: (queryString = '') => `${lmsBase}/courses/search${toQueryString(queryString)}`,
  lmsModules: `${lmsBase}/modules`,
  lmsModulesSearch: (queryString = '') => `${lmsBase}/modules/search${toQueryString(queryString)}`,
  lmsMediaUpload: `${lmsBase}/media/upload`,
  lmsMediaUploadVideo: `${lmsBase}/media/upload-video`,
  lmsLessons: (queryString = '') => `${lmsBase}/lessons${toQueryString(queryString)}`,
  lmsLessonById: (lessonId: string) => `${lmsBase}/lessons/${lessonId}`,
  lmsLessonsByModule: (moduleId: string) => `${lmsBase}/lessons/module/${moduleId}`,
  lmsMediaAssociate: (mediaId: string, lessonId: string, userId?: string) => {
    const query = userId ? `?userId=${userId}` : '';
    return `${lmsBase}/media/${mediaId}/associate/${lessonId}${query}`;
  },
  lmsCourseHierarchy: (courseId: string) =>
    `${lmsBase}/courses/${courseId}/hierarchy?includeModules=true&includeLessons=true`,
  // Learning paths (pathways)
  pathwayList: `${baseurl}/user/v1/pathway/list`,
  pathwayCreate: `${baseurl}/user/v1/pathway/create`,
  pathwayById: (id: string) => `${baseurl}/user/v1/pathway/${id}`,
  pathwayUpdate: (id: string) => `${baseurl}/user/v1/pathway/update/${id}`,
  pathwayOrderStructure: `${baseurl}/user/v1/pathway/order/structure`,
  pathwayAssign: `${baseurl}/user/v1/pathway/assign`,
  certificateCourseTemplate: `${baseurl}/lms-service/v1/certificate/course-template`,
  certificateTemplatesList: `${baseurl}/lms-service/v1/certificate/templates-list`,
  lmsUserCourses: (userId: string, limit: number, offset: number) =>
    `${baseurl}/lms-service/v1/enrollments/users-courses?userId=${userId}&limit=${limit}&offset=${offset}`,
  lmsCourseTracking: (courseId: string, userId: string) =>
    `${baseurl}/lms-service/v1/courses/${courseId}/hierarchy/tracking/${userId}?includeModules=true`,
  lmsEnrollCohort: (adminId: string) =>
    `${baseurl}/lms-service/v1/enrollments/cohort${adminId ? `?userId=${encodeURIComponent(adminId)}` : ''}`,
  lmsEnrollmentCreate: `${baseurl}/lms-service/v1/enrollments`,
  lmsEnrollments: (userId: string) => `${baseurl}/lms-service/v1/enrollments?userId=${userId}`,
  lmsLessonAttempt: (lessonId: string, userId: string) => `${baseurl}/tracking/lesson/attempt/${lessonId}?userId=${userId}`,
  lmsConfig: `${baseurl}/config`,

  // Assessment Service
  assessmentHealth: `${assessmentBase}/health`,
  // Tests
  assessmentTests: `${assessmentBase}/tests`,
  assessmentTestById: (id: string) => `${assessmentBase}/tests/${id}`,
  assessmentTestQuestions: (id: string) => `${assessmentBase}/tests/${id}/questions`,
  assessmentTestQuestionsBulk: (id: string) => `${assessmentBase}/tests/${id}/questions/bulk`,
  assessmentTestHierarchy: (id: string) => `${assessmentBase}/tests/${id}/test-hierarchy`,
  assessmentTestHierarchySimple: (id: string) => `${assessmentBase}/tests/${id}/hierarchy`,
  assessmentTestStructure: (testId: string) => `${assessmentBase}/tests/${testId}/structure`,
  assessmentTestClone: (id: string) => `${assessmentBase}/tests/${id}/clone`,
  assessmentTestUserStatus: (testId: string, userId: string) => `${assessmentBase}/tests/${testId}/users/${userId}/status`,
  assessmentTestUserResult: (testId: string, userId: string) => `${assessmentBase}/tests/${testId}/users/${userId}/result`,

  // Sections
  assessmentSections: `${assessmentBase}/sections`,
  assessmentSectionById: (id: string) => `${assessmentBase}/sections/${id}`,
  assessmentSectionsByTestId: (testId: string) => `${assessmentBase}/sections/test/${testId}`,

  // Questions
  assessmentQuestions: `${assessmentBase}/questions`,
  assessmentQuestionById: (id: string) => `${assessmentBase}/questions/${id}`,
  assessmentQuestionAssociateOption: `${assessmentBase}/questions/associate-option`,
  assessmentQuestionChildQuestions: (id: string) => `${assessmentBase}/questions/${id}/child-questions`,

  // Attempts
  assessmentAttemptStart: (testId: string, userId: string) => `${assessmentBase}/attempts/start/${testId}?userId=${userId}`,
  assessmentAttemptResume: (attemptId: string) => `${assessmentBase}/attempts/${attemptId}/resume`,
  assessmentAttemptAnswers: (attemptId: string) => `${assessmentBase}/attempts/${attemptId}/answers`,
  assessmentAttemptSubmit: (attemptId: string) => `${assessmentBase}/attempts/${attemptId}/submit`,
  assessmentAttemptAnswersheet: (attemptId: string) => `${assessmentBase}/attempts/${attemptId}/answersheet`,
  assessmentAttemptReview: (attemptId: string) => `${assessmentBase}/attempts/review/${attemptId}`,
  assessmentAttemptCheckResultImported: `${assessmentBase}/attempts/check-result-imported`,

  // Rules
  assessmentRules: `${assessmentBase}/rules`,
  assessmentRuleById: (id: string) => `${assessmentBase}/rules/${id}`,
};
