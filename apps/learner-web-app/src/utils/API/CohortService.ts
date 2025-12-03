/* eslint-disable @typescript-eslint/no-inferrable-types */
import { post, get } from '@shared-lib';
import { API_ENDPOINTS } from './EndUrls';

export interface CustomFieldValue {
  id: string | number;
  value: string;
  label?: string;
  order?: string;
}

export interface CustomField {
  fieldId: string;
  label: string;
  type: string;
  selectedValues: CustomFieldValue[];
}

export interface CohortDetails {
  cohortId: string;
  parentId: string | null;
  name: string;
  type: string;
  status: string;
  image: string[];
  referenceId: string | null;
  metadata: any;
  tenantId: string;
  programId: string | null;
  attendanceCaptureImage: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  customFields: CustomField[];
}

export interface CohortSearchResponse {
  id: string;
  ver: string;
  ts: string;
  params: {
    resmsgid: string;
    status: string;
    err: any;
    errmsg: any;
    successmessage: string;
  };
  responseCode: number;
  result: {
    count: number;
    results: {
      cohortDetails: CohortDetails[];
    };
  };
}

export interface CohortSearchParams {
  limit?: number;
  offset?: number;
  filters: {
    state?: number;
    district?: number;
    block?: number;
    village?: number;
  };
}
interface CohortDetailsParams {
  userId: string;
  fieldvalue?: boolean;
}

export const searchCohort = async ({
  limit = 10,
  offset = 0,
  filters,
}: CohortSearchParams): Promise<CohortSearchResponse> => {
  const apiUrl: string = API_ENDPOINTS.cohortSearch;
  
  try {
    const response = await post(apiUrl, {
      limit,
      offset,
      filters,
    });
    return response?.data;
  } catch (error) {
    console.error('Error in cohort search:', error);
    throw error;
  }
}; 




export const getUserCohortsRead = async ({
  userId,
  fieldvalue=true
}: CohortDetailsParams): Promise<any> => {
  const apiUrl: string = `${API_ENDPOINTS.myCohortsRead(userId)}?fieldvalue=${fieldvalue}`;
  
  try {
    const response = await get(apiUrl);
    return response?.data;
  } catch (error) {
    console.error('Error getting cohort details:', error);
    throw error;
  }
}; 