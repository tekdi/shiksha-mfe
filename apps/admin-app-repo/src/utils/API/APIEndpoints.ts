const baseurl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL;

export const API_ENDPOINTS = {
  contentRead: (doId: string) => `${baseurl}/api/content/v1/read/${doId}?fields=artifactUrl`,
  academicYearsList: `${baseurl}/academicyears/list`,
  formRead: `${baseurl}/form/read`,
  accountCreate: `${baseurl}/account/create`, 
  userUpdate: (userId: string) => `${baseurl}/user/update/${userId}`,
  myCohorts: (userId: string | string[]) => `${baseurl}/cohort/mycohorts/${userId}`,
  accountLogin: `${baseurl}/account/login`,
  authRefresh: `${baseurl}/account/auth/refresh`,
  authLogout: `${baseurl}/account/auth/logout`,
  userAuth: `${baseurl}/user/auth`,
  resetPassword: `${baseurl}/user/reset-password`,
  fieldOptionsRead: `${baseurl}/fields/options/read`,
  cohortSearch: `${baseurl}/cohort/search`,
  fieldOptionDelete: (type: string, option: string) => `${baseurl}/fields/options/delete/${type}?option=${option}`,
  fieldUpdate: (fieldId: string) => `${baseurl}/fields/update/${fieldId}`,
  cohortUpdate: (cohortId: string) => `${baseurl}/cohort/update/${cohortId}`,
  notificationSend: `${baseurl}/notification/send`,
  tenantRead: `${baseurl}/tenant/read`,
  tenantCreate: `${baseurl}/tenant/create`,
  tenantUpdate: (tenantId: string) => `${baseurl}/tenant/update/${tenantId}`,
  tenantDelete: (tenantId: string) => `${baseurl}/tenant/delete/${tenantId}`,
  tenantSearch: `${baseurl}/tenant/search`,
  userList: `${baseurl}/user/list`,
  cohortMemberList: `${baseurl}/cohortmember/list`,
  userRead: (userId: string | string[], fieldValue: boolean) => `${baseurl}/user/read/${userId}?fieldvalue=${fieldValue}`,
  suggestUsername: `${baseurl}/user/suggestUsername`,
  cohortUpdateUser: (userId?: string) => `${baseurl}/cohort/update/${userId}`,
  formReadWithContext: (context: string, contextType: string) => `${baseurl}/form/read?context=${context}&contextType=${contextType}`,
  cohortCreate: `${baseurl}/cohort/create`,
  cohortMemberBulkCreate: `${baseurl}/cohortmember/bulkCreate`,
  cohortMemberUpdate: (membershipId: string | number) => `${baseurl}/cohortmember/update/${membershipId}`,
  notificationTemplate: `${baseurl}/notification-templates`,
  courseStatus:`${baseurl}/tracking/user_certificate/user_course_status`,
  courseWiseLernerList: `${baseurl}/tracking/user_certificate/status/search`,
  getCourseName: `${baseurl}/action/composite/v3/search`,
  issueCertificate: `${baseurl}/tracking/certificate/issue`,
  renderCertificate: `${baseurl}/tracking/certificate/render`,
  downloadCertificate: `${baseurl}/tracking/certificate/render`,
  framework : (frameworkId: string) => `${baseurl}/framework/v1/read/${frameworkId}`,
  actionObject : `${baseurl}/action/object/category/definition/v1/read?fields=objectMetadata,forms,name,label`,

};

export const COURSE_PLANNER_UPLOAD_ENDPOINTS = `${process.env.NEXT_PUBLIC_BASE_URL}/prathamservice/v1/course-planner/upload`;

export const TARGET_SOLUTION_ENDPOINTS = `${process.env.NEXT_PUBLIC_COURSE_PLANNER_API_URL}/solutions/targetedSolutions?type=improvementProject&currentScopeOnly=true`;
export const COURSE_PLANNER_DELETE = `${process.env.NEXT_PUBLIC_COURSE_PLANNER_API_URL}/project/templateTasks/delete/`;
export const COURSE_PLANNER_TOPIC_CREATE = `${process.env.NEXT_PUBLIC_COURSE_PLANNER_API_URL}/project/templateTasks/bulkCreateJson/`;
export const COURSE_PLANNER_DELETE_CONTENT = `${process.env.NEXT_PUBLIC_COURSE_PLANNER_API_URL}/project/templateTasks/deleteTask/`;
export const COURSE_PLANNER_UPDATE_CONTENT = `${process.env.NEXT_PUBLIC_COURSE_PLANNER_API_URL}/project/templateTasks/updateTask/`;
