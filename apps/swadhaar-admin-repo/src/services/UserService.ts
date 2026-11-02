import { API_ENDPOINTS } from '@/utils/API/APIEndpoints';
import { get, post, patch } from './RestClient';
import { getServiceHeaders } from '@/utils/API/serviceHeaders';
import { SWADHAAR_TENANT_ID } from '@/utils/app.constant';

export const getUserDetailsInfo = async (
  userId: string,
  customHeaders: Record<string, string> = {}
): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.userRead(userId, true);
    const headers = getServiceHeaders(customHeaders);
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
    const headers = getServiceHeaders(customHeaders);
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
  username: string;
  password?: string;
  firstName: string;
  lastName: string;
  gender?: string;
  email: string;
  mobile: string;
  /** User type the user service lists the account under, e.g. 'Student' or 'Admin' */
  type?: string;
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
    const apiUrl = API_ENDPOINTS.userCreate;
    const response = await post(apiUrl, payload, getServiceHeaders());
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
    const response = await patch(apiUrl, payload, getServiceHeaders());
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

export interface TenantRole {
  id: string;
  name: string;
}

/**
 * Roles for the Swadhaar tenant from POST /user/v1/rbac/roles/list/roles. `title` is shown in the dropdown and
 * `roleId` is sent in tenantCohortRoleMapping when a user is created.
 */
export const getTenantRoles = async (): Promise<TenantRole[]> => {
  try {
    const response = await post(
      API_ENDPOINTS.userRolesList,
      { limit: '100', page: 1, filters: { tenantId: SWADHAAR_TENANT_ID } },
      getServiceHeaders()
    );
    const roles: any[] = response?.data?.result || [];
    return roles
      .filter((role) => role?.roleId && role?.title)
      .map((role) => ({ id: role.roleId, name: role.title }));
  } catch (error) {
    console.error('Error in getTenantRoles:', error);
    return [];
  }
};

/**
 * Lists users by role title. /user/v1/list filters one role at a time (two roles return 404) and returns only
 * Students when no role is sent, so several titles become one call each, merged by createdAt and paged here.
 * `payload` is the usual list body (limit, offset, filters, sort).
 */
export const listUsersByRoles = async (
  payload: any,
  roleTitles: string[]
): Promise<{ users: any[]; total: number }> => {
  const listForRole = async (title: string, body: any) => {
    try {
      const response = await getUserList({ ...body, filters: { ...body.filters, role: [title] } });
      return response?.result || {};
    } catch (error: any) {
      if (error?.response?.status === 404) return {}; // no users with this role
      throw error;
    }
  };

  if (roleTitles.length === 0) {
    const response = await getUserList(payload);
    return {
      users: response?.result?.getUserDetails || [],
      total: Number(response?.result?.totalCount) || 0,
    };
  }
  if (roleTitles.length === 1) {
    const result = await listForRole(roleTitles[0], payload);
    return { users: result.getUserDetails || [], total: Number(result.totalCount) || 0 };
  }

  const results = await Promise.all(
    roleTitles.map((title) => listForRole(title, { ...payload, limit: 200, offset: 0 }))
  );
  const all = results.flatMap((r) => r.getUserDetails || []);
  all.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return { users: all.slice(payload.offset, payload.offset + payload.limit), total: all.length };
};
