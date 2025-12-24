export interface UserAttendanceObj {
  userId: string;
  attendance: string;
  name?: string;
  memberStatus?: string;
  updatedAt?: string | number | Date;
  userName?: string;
  scope?: string;
}

export interface BulkAttendanceParams {
  attendanceDate: string;
  contextId: string;
  userAttendance: UserAttendanceObj[];
  scope?: string;
}

export interface MarkAttendanceParams {
  userId: string;
  attendanceDate: string;
  contextId: string;
  attendance: string;
}

export interface AttendanceStatusListProps {
  limit: number;
  page: number;
  filters: {
    fromDate: string | Date;
    toDate: string | Date;
    contextId: string;
    scope: string;
  };
}

export interface AttendancePercentageProps {
  limit: number;
  page: number;
  filters: {
    contextId: string;
    scope: string;
    toDate: string | Date;
    fromDate: string | Date;
  };
  facets?: Array<string>;
}

export interface OverallAttendancePercentageProps {
  limit: number;
  page: number;
  filters: {
    contextId: string;
    scope: string;
  };
  facets?: Array<string>;
}

export interface LearnerAttendanceProps {
  limit?: number;
  page?: number;
  filters: {
    contextId?: string;
    scope: string;
    toDate: string | Date;
    fromDate: string | Date;
    userId: string;
  };
}

export interface CohortAttendancePercentParam {
  limit: number;
  page: number;
  filters: {
    scope: string;
    fromDate: Date | string;
    toDate: Date | string;
    contextId: string;
  };
  facets?: Array<string>;
  sort?: Array<string>;
}

export interface AllCenterAttendancePercentParam {
  limit: number;
  page: number;
  filters: {
    scope: string;
    fromDate: Date | string;
    toDate: Date | string;
    contextId: string;
  };
  facets?: Array<string>;
}

export interface DropoutMember {
  userId: string | number;
  name: string;
  memberStatus: string;
}

export interface CohortMemberList {
  limit?: number;
  page?: number;
  filters: {
    cohortId: string;
    role?: string;
    status?: string[];
    name?: string;
    firstName?: string;
  };
}

export interface UpdateCohortMemberStatusParams {
  memberStatus?: string;
  statusReason?: string;
  membershipId: string | number;
  dynamicBody?: Record<string, any>;
}

export interface UserList {
  limit: number;
  page: number;
  filters: Record<string, any>;
  fields: string[];
}

export interface CohortListParam {
  limit: number;
  offset: number;
  filters: Record<string, any>;
}

export interface GetCohortSearchParams {
  cohortId: string;
  limit?: number;
  offset?: number;
}

export interface ICohort {
  typeOfCohort?: string;
  presentPercentage?: number;
  cohortId: string;
  cohortName?: string;
  name?: string;
  value?: string;
  state?: string;
  customField?: any[];
  childData?: any[];
}

