import { API_ENDPOINTS } from '@/utils/API/APIEndpoints';
import { post, put } from './RestClient';

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
  filters: {
    type?: string;
    tenantId?: string;
    status?: string | string[];
    name?: string;
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
import { getAspireHeaders } from '@/utils/API/aspireHeaders';



export const getCohortSearch = async (
  payload: CohortSearchParams,
  customHeaders: Record<string, string> = {}
): Promise<CohortSearchResponse> => {
  try {
    const apiUrl = API_ENDPOINTS.cohortSearch;
    const headers = getAspireHeaders(customHeaders);
    const response = await post(apiUrl, payload, headers);
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
    const headers = getAspireHeaders(customHeaders);
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
  payload: CohortMemberListParams
): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.cohortMemberList;
    const response = await post(apiUrl, payload);
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
  payload: CohortContentSearchParams
): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.cohortContentSearch;
    const response = await post(apiUrl, payload);
    return response?.data;
  } catch (error) {
    console.error('Error in getCohortContentSearch:', error);
    throw error;
  }
};

export const createCohort = async (payload: any): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.cohortCreate;
    const response = await post(apiUrl, payload);
    return response?.data;
  } catch (error) {
    console.error('Error in createCohort:', error);
    throw error;
  }
};

export const updateCohort = async (cohortId: string, payload: any): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.cohortUpdate(cohortId);
    const response = await put(apiUrl, payload);
    return response?.data;
  } catch (error) {
    console.error('Error in updateCohort:', error);
    throw error;
  }
};

export const deleteCohort = async (cohortId: string): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.cohortUpdate(cohortId);
    const response = await put(apiUrl, { status: 'archived' });
    return response?.data;
  } catch (error) {
    console.error('Error in deleteCohort:', error);
    throw error;
  }
};

export const bulkCreateCohortMembers = async (payload: {
  userId: string[];
  cohortId: string[];
  role?: string;
  status?: string;
  [key: string]: any;
}): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.cohortMemberBulkCreate;
    const response = await post(apiUrl, payload);
    return response?.data;
  } catch (error) {
    console.error('Error in bulkCreateCohortMembers:', error);
    throw error;
  }
};

export const updateCohortMember = async (
  membershipId: string | number,
  payload: any
): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.cohortMemberUpdate(membershipId);
    const response = await put(apiUrl, payload);
    return response?.data;
  } catch (error) {
    console.error('Error in updateCohortMember:', error);
    throw error;
  }
};

