import { API_ENDPOINTS } from '@/utils/API/APIEndpoints';
import { deleteApi, post, put } from './RestClient';
import { getServiceHeaders, getSessionTenantId } from '@/utils/API/serviceHeaders';

export interface CohortCustomField {
  fieldId: string;
  label: string;
  type?: string;
  selectedValues?: Array<{
    id?: number | string;
    value: string;
  }>;
}

export interface CohortItemApi {
  cohortId: string;
  parentId?: string | null;
  name: string;
  type: string;
  status: string;
  image?: string | null;
  referenceId?: string | null;
  metadata?: any;
  tenantId: string;
  programId?: string | null;
  attendanceCaptureImage?: boolean;
  params?: {
    groupOwnerId?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  customFields?: CohortCustomField[];
  [key: string]: any;
}

export interface CohortSearchParams {
  limit?: number;
  offset?: number;
  sort?: string[];
  filters?: {
    type?: string;
    tenantId?: string;
    status?: string | string[];
    name?: string;
    start_year?: string;
    cohortId?: string;
    [key: string]: any;
  };
}

export interface CohortSearchResponse {
  responseCode: string | number;
  params?: any;
  result?: {
    count?: number;
    results?: {
      cohortDetails?: CohortItemApi[];
    };
  };
}
export const getCohortSearch = async (
  payload: CohortSearchParams,
  customHeaders: Record<string, string> = {}
): Promise<CohortSearchResponse> => {
  try {
    const apiUrl = API_ENDPOINTS.cohortSearch;
    const headers = getServiceHeaders(customHeaders);
    // The search API scopes results by the tenant given in the filters
    const body: CohortSearchParams = {
      ...payload,
      filters: { tenantId: getSessionTenantId(), ...payload.filters },
    };
    const response = await post(apiUrl, body, headers);
    return response?.data;
  } catch (error) {
    console.error('Error in getCohortSearch:', error);
    throw error;
  }
};

export const getCohortById = async (cohortId: string): Promise<any> => {
  try {
    const res = await getCohortSearch({
      limit: 1,
      offset: 0,
      filters: { cohortId },
    });
    const details = res?.result?.results?.cohortDetails;
    if (Array.isArray(details) && details.length > 0) {
      return details[0];
    }
    return null;
  } catch (error) {
    console.error('Error in getCohortById:', error);
    return null;
  }
};

export const getCohortMemberListApplication = async (
  payload: any,
  customHeaders: Record<string, string> = {}
): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.cohortMemberListApplication;
    const headers = getServiceHeaders(customHeaders);
    const response = await post(apiUrl, payload, headers);
    return response?.data;
  } catch (error) {
    console.error('Error in getCohortMemberListApplication:', error);
    throw error;
  }
};

export interface CohortMemberListParams {
  limit?: number;
  offset?: number;
  filters: {
    cohortId: string;
    role?: string;
    status?: string;
    [key: string]: any;
  };
  sort?: string[];
}

export const getCohortMemberList = async (
  payload: CohortMemberListParams,
  customHeaders: Record<string, string> = {}
): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.cohortMemberList;
    const headers = getServiceHeaders(customHeaders);
    const response = await post(apiUrl, payload, headers);
    return response?.data;
  } catch (error) {
    console.error('Error in getCohortMemberList:', error);
    throw error;
  }
};

export interface CohortContentSearchParams {
  filter: {
    cohortId: string;
    [key: string]: any;
  };
}

export const getCohortContentSearch = async (
  payload: CohortContentSearchParams,
  customHeaders: Record<string, string> = {}
): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.cohortContentSearch;
    const headers = getServiceHeaders(customHeaders);
    const response = await post(apiUrl, payload, headers);
    return response?.data;
  } catch (error) {
    console.error('Error in getCohortContentSearch:', error);
    throw error;
  }
};

export const createCohort = async (
  payload: any,
  customHeaders: Record<string, string> = {}
): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.cohortCreate;
    const headers = getServiceHeaders(customHeaders);
    const response = await post(apiUrl, payload, headers);
    return response?.data;
  } catch (error) {
    console.error('Error in createCohort:', error);
    throw error;
  }
};

export const updateCohort = async (
  cohortId: string,
  payload: any,
  customHeaders: Record<string, string> = {}
): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.cohortUpdate(cohortId);
    const headers = getServiceHeaders(customHeaders);
    const response = await put(apiUrl, payload, headers);
    return response?.data;
  } catch (error) {
    console.error('Error in updateCohort:', error);
    throw error;
  }
};

/** DELETE /user/v1/cohort/delete/:cohortId */
export const deleteCohort = async (
  cohortId: string,
  customHeaders: Record<string, string> = {}
): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.cohortDelete(cohortId);
    const response = await deleteApi(apiUrl, undefined, getServiceHeaders(customHeaders));
    return response?.data;
  } catch (error) {
    console.error('Error in deleteCohort:', error);
    throw error;
  }
};

/** Task 16a: a member's role inside one group. Their own role (Admin, Trainer, ...) is never changed by it. */
export type CohortRoleCode = 'learner' | 'reviewer';

export const COHORT_ROLE_LABELS: Record<CohortRoleCode, string> = {
  learner: 'Learner',
  reviewer: 'Reviewer',
};

/** Largest `members` list POST cohortmember/bulkCreate accepts in one call */
const BULK_MEMBERS_MAX = 100;

export interface BulkMembersResult {
  /** Members the server saved */
  saved: number;
  /** Messages for members the server could not save */
  errors: string[];
}

/**
 * Task 33: enrols users into a group, each with their group role (POST cohortmember/bulkCreate
 * with `members`), in calls of at most 100 members. Members already in the group get the role sent.
 */
export const enrolCohortMembers = async (
  cohortId: string,
  members: Array<{ userId: string; cohortRoleCode: CohortRoleCode }>
): Promise<BulkMembersResult> => {
  const result: BulkMembersResult = { saved: 0, errors: [] };
  for (let i = 0; i < members.length; i += BULK_MEMBERS_MAX) {
    const chunk = members.slice(i, i + BULK_MEMBERS_MAX);
    const response = await bulkCreateCohortMembers({ cohortId: [cohortId], members: chunk, status: 'active' });
    // Partial success comes back as { results, errors }; full success as the saved rows
    const body = response?.result;
    const saved = Array.isArray(body) ? body : body?.results;
    result.saved += Array.isArray(saved) ? saved.length : 0;
    if (Array.isArray(body?.errors)) result.errors.push(...body.errors.map(String));
  }
  return result;
};

export const bulkCreateCohortMembers = async (
  payload: {
    userId?: string[];
    cohortId: string[];
    /** Task 16a: members with their group role; used instead of `userId` */
    members?: Array<{ userId: string; cohortRoleCode?: CohortRoleCode }>;
    /** Task 16a: group role for every id in `userId` */
    cohortRoleCode?: CohortRoleCode;
    role?: string;
    status?: string;
    [key: string]: any;
  },
  customHeaders: Record<string, string> = {}
): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.cohortMemberBulkCreate;
    const headers = getServiceHeaders(customHeaders);
    const response = await post(apiUrl, payload, headers);
    return response?.data;
  } catch (error) {
    console.error('Error in bulkCreateCohortMembers:', error);
    throw error;
  }
};

/**
 * Task 18: changes a member's role in one group (PUT cohortmember/update/:membershipId with cohortRoleCode).
 * The user's own role (Admin, Trainer, DI, ARM) is not touched.
 */
export const setCohortMemberRole = async (membershipId: string, cohortRoleCode: CohortRoleCode): Promise<void> => {
  const response = await updateCohortMember(membershipId, { cohortRoleCode });
  if (response?.params?.status && response.params.status !== 'successful') {
    throw new Error(response?.params?.errmsg || 'The group role could not be changed.');
  }
};

/** The group role code of a member row from the member lists; old rows without one are learners */
export const toCohortRoleCode = (value: unknown): CohortRoleCode =>
  String(value || '').trim().toLowerCase() === 'reviewer' ? 'reviewer' : 'learner';

export const updateCohortMember = async (
  membershipId: string | number,
  payload: any,
  customHeaders: Record<string, string> = {}
): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.cohortMemberUpdate(membershipId);
    const headers = getServiceHeaders(customHeaders);
    const response = await put(apiUrl, payload, headers);
    return response?.data;
  } catch (error) {
    console.error('Error in updateCohortMember:', error);
    throw error;
  }
};

/** Id of a member row's membership in the cohort (the key differs between list responses) */
export const getMembershipId = (row: any): string =>
  String(row?.cohortMembershipId || row?.membershipId || row?.cohortMemberId || '');

/**
 * Takes users out of groups (removes their membership in each group).
 * POST /user/v1/cohortmember/bulkCreate?userId=<admin> { userId: [...], removeCohortId: [...] }
 */
export const removeUsersFromCohorts = async (userIds: string[], cohortIds: string[]): Promise<any> => {
  if (userIds.length === 0 || cohortIds.length === 0) return;
  try {
    const adminId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
    const url = `${API_ENDPOINTS.cohortMemberBulkCreate}${adminId ? `?userId=${encodeURIComponent(adminId)}` : ''}`;
    const response = await post(url, { userId: userIds, removeCohortId: cohortIds }, getServiceHeaders());
    return response?.data;
  } catch (error) {
    console.error('Error in removeUsersFromCohorts:', error);
    throw error;
  }
};

const COHORT_MEMBER_PAGE_SIZE = 100;

/** User ids of every learner in a group (reviewers are left out), across all member pages */
/** Member rows of a cohort member list response, which comes as `result.userDetails` or a bare `result` array. */
export const getMemberRows = (res: any): any[] => {
  if (Array.isArray(res?.result?.userDetails)) return res.result.userDetails;
  return Array.isArray(res?.result) ? res.result : [];
};

/** Statuses of a membership that has been ended: the member list still returns these rows after a removal. */
const ENDED_MEMBER_STATUSES = ['archived', 'inactive', 'removed', 'dropout', 'rejected'];

/** False for a membership that was removed from the group (its row stays in the member list with an ended status). */
export const isCurrentMember = (row: any): boolean => {
  const status = String(row?.memberStatus || row?.membershipStatus || row?.status || '').toLowerCase();
  return !ENDED_MEMBER_STATUSES.includes(status);
};

/** Total member count of a cohort member list response. */
export const getMemberTotal = (res: any, rows: any[]): number => {
  if (typeof res?.result?.totalCount === 'number') return res.result.totalCount;
  const rowTotal = rows[0]?.total_count;
  return rowTotal ? Number(rowTotal) : rows.length;
};

/**
 * Current member count of a group. The group's own `youthCount` still includes members that were removed,
 * so count the member rows that are not ended; falls back to null if the member list cannot be read.
 */
export const getCurrentMemberCount = async (cohortId: string): Promise<number | null> => {
  try {
    let count = 0;
    for (let offset = 0; ; offset += COHORT_MEMBER_PAGE_SIZE) {
      const res = await getCohortMemberListApplication({
        limit: COHORT_MEMBER_PAGE_SIZE,
        offset,
        filters: { cohortId: [cohortId] },
      });
      const rows = getMemberRows(res);
      count += rows.filter(isCurrentMember).length;
      if (rows.length < COHORT_MEMBER_PAGE_SIZE) return count;
    }
  } catch (error) {
    console.error('Error in getCurrentMemberCount:', error);
    return null;
  }
};

export const getCohortLearnerIds = async (cohortId: string): Promise<string[]> => {
  const ids: string[] = [];
  for (let offset = 0; ; offset += COHORT_MEMBER_PAGE_SIZE) {
    const res = await getCohortMemberListApplication({
      limit: COHORT_MEMBER_PAGE_SIZE,
      offset,
      filters: { cohortId: [cohortId] },
    });
    const rows = getMemberRows(res);
    rows.forEach((row) => {
      const role = String(row.role || row.membershipRole || 'Student').toLowerCase();
      const userId = row.userId || row.id;
      if (userId && role !== 'reviewer' && isCurrentMember(row)) ids.push(userId);
    });
    if (rows.length < COHORT_MEMBER_PAGE_SIZE) break;
  }
  return Array.from(new Set(ids));
};
