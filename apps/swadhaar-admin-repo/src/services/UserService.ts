import { API_ENDPOINTS } from '@/utils/API/APIEndpoints';
import { get, post, patch } from './RestClient';
import { getAspireHeaders } from '@/utils/API/aspireHeaders';

export const getUserDetailsInfo = async (
  userId: string,
  customHeaders: Record<string, string> = {}
): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.userRead(userId, true);
    const headers = getAspireHeaders(customHeaders);
    const response = await get(apiUrl, headers);
    return response?.data;
  } catch (error) {
    console.error('Error in getUserDetailsInfo:', error);
    throw error;
  }
};

export const getUserList = async (
  payload: any,
  customHeaders: Record<string, string> = {}
): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.userList;
    const headers = getAspireHeaders(customHeaders);
    const response = await post(apiUrl, payload, headers);
    return response?.data;
  } catch (error) {
    console.error('Error in getUserList:', error);
    throw error;
  }
};

export const getCohortMemberList = async (payload: any): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.cohortMemberList;
    const response = await post(apiUrl, payload);
    return response?.data;
  } catch (error) {
    console.error('Error in getCohortMemberList:', error);
    throw error;
  }
};

export interface CreateUserPayload {
  name: string;
  username: string;
  password?: string;
  firstName: string;
  lastName: string;
  gender?: string;
  email: string;
  mobile: string;
  tenantCohortRoleMapping: Array<{
    tenantId: string;
    roleId: string;
  }>;
  customFields?: Array<{
    fieldId: string;
    value: string[];
  }>;
}

export const createUserAccount = async (payload: CreateUserPayload): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.accountCreate;
    const response = await post(apiUrl, payload);
    return response?.data;
  } catch (error) {
    console.error('Error in createUserAccount:', error);
    throw error;
  }
};

export interface UpdateUserPayload {
  userData: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    gender?: string;
    mobile?: string;
    email?: string;
    employeeId?: string;
    username?: string;
    status?: string;
    [key: string]: any;
  };
  customFields?: Array<{
    fieldId: string;
    value: string[];
  }>;
}

export const updateUserAccount = async (
  userId: string,
  payload: UpdateUserPayload
): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.userUpdate(userId);
    const response = await patch(apiUrl, payload);
    return response?.data;
  } catch (error) {
    console.error('Error in updateUserAccount:', error);
    throw error;
  }
};

export const updateUserStatus = async (
  userId: string,
  status: string // 'active' | 'blocked' | 'archived' | 'deleted'
): Promise<any> => {
  return updateUserAccount(userId, {
    userData: {
      status,
    },
  });
};

export const deleteUserAccount = async (userId: string): Promise<any> => {
  return updateUserStatus(userId, 'deleted');
};
