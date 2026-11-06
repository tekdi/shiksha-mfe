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

export const bulkCreateCohortMembers = async (
  payload: {
    userId: string[];
    cohortId: string[];
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
