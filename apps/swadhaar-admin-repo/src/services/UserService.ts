import { API_ENDPOINTS } from '@/utils/API/APIEndpoints';
import { get, post, patch, deleteApi } from './RestClient';
import { getServiceHeaders, getSessionTenantId } from '@/utils/API/serviceHeaders';
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

/**
 * Returns the stored Organization Name for a code, or '' when no user in the tenant has that code yet.
 * The user service has no organisation lookup API, so this reads one user with the code from
 * /user/v1/list (filter organisationCode). Every user with a code stores that code's name, so the first one is enough.
 */
export const findOrganisationName = async (organisationCode: string): Promise<string> => {
  const code = organisationCode.trim().toUpperCase();
  if (!code) return '';
  try {
    const response = await getUserList({
      limit: 1,
      offset: 0,
      filters: { organisationCode: code, role: 'all', status: ['active', 'inactive'] },
    });
    const user = response?.result?.getUserDetails?.[0];
    return typeof user?.organisationName === 'string' ? user.organisationName : '';
  } catch (error: any) {
    if (error?.response?.status === 404) return ''; // no user has this code yet
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
  name?: string;
  username: string;
  password?: string;
  firstName: string;
  lastName: string;
  gender?: string;
  email: string;
  mobile: string;
  /** User type the user service lists the account under, e.g. 'Student' or 'Admin' */
  type?: string;
  /** Unique per Organization Code within the tenant (409 EMPLOYEE_ID_EXISTS otherwise) */
  employeeId?: string;
  organisationCode?: string;
  /** Needed only when organisationCode is new; an existing code keeps its stored name */
  organisationName?: string;
  tenantCohortRoleMapping: Array<{
    tenantId: string;
    roleId: string;
  }>;
  /** A drop_down field takes option values (string[]); a text field such as branch_other takes a string */
  customFields?: Array<{
    fieldId: string;
    value: string[] | string;
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

export interface BulkImportFailure {
  [key: string]: any;
}

export interface BulkImportResult {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  failures: BulkImportFailure[];
  batchId?: string;
}

/**
 * Creates the users of a CSV/Excel file in one request and adds them to a group with a role
 * POST /user/v1/bulk-import/users (multipart: file, optional cohortId, optional roleId)
 */
export const bulkImportUsers = async (file: File, cohortId?: string, roleId?: string): Promise<BulkImportResult> => {
  const form = new FormData();
  form.append('file', file);
  // Group and role are optional: without a cohortId the users join no group
  if (cohortId) form.append('cohortId', cohortId);
  if (roleId) form.append('roleId', roleId);
  // multipart/form-data lets the browser add the boundary
  const response = await post(API_ENDPOINTS.userBulkImport, form, getServiceHeaders({ 'content-type': 'multipart/form-data' }));
  return response?.data?.result;
};

export interface UpdateUserPayload {
  userData: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    gender?: string;
    mobile?: string;
    email?: string;
    /** null clears the stored value */
    employeeId?: string | null;
    organisationCode?: string | null;
    organisationName?: string | null;
    username?: string;
    status?: string;
    [key: string]: any;
  };
  /** A drop_down field takes option values (string[]); a text field such as branch_other takes a string */
  customFields?: Array<{
    fieldId: string;
    value: string[] | string;
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

/**
 * Changes a user's role in two steps, because assigning a role adds a row instead of replacing the old one:
 * 1. DELETE /user/v1/rbac/usersRoles/:userId { userId, roleId: [oldRoleId] } removes the old role.
 * 2. POST /user/v1/rbac/usersRoles { tenantId, userId, roleId: [newRoleId] } assigns the new one.
 */
export const changeUserRole = async (userId: string, oldRoleId: string, newRoleId: string): Promise<void> => {
  const headers = getServiceHeaders();
  const tenantId = getSessionTenantId() || SWADHAAR_TENANT_ID;
  await deleteApi(API_ENDPOINTS.userRolesOfUser(userId), { userId, roleId: [oldRoleId] }, headers);
  await post(API_ENDPOINTS.userRolesAssign, { tenantId, userId, roleId: [newRoleId] }, headers);
};

/** Blocking sets the user inactive with a reason (PATCH /user/v1/update/:userId) */
export const blockUser = async (userId: string): Promise<any> =>
  updateUserAccount(userId, { userData: { status: 'inactive', reason: 'Blocked by admin' } });

export const unblockUser = async (userId: string): Promise<any> =>
  updateUserAccount(userId, { userData: { status: 'active' } });

/**
 * Deleting anonymizes the account (POST /user/v1/anonymize). The call succeeds even when a user could not
 * be processed, so a FAILED result of the given email is thrown as an error.
 */
export const deleteUser = async (email: string, reason = 'GDPR erasure request'): Promise<any> => {
  try {
    const response = await post(API_ENDPOINTS.userAnonymize, { emails: [email], reason }, getServiceHeaders());
    const outcome = (response?.data?.result?.results || []).find((r: any) => r?.email === email);
    if (outcome?.status === 'FAILED') {
      throw new Error(outcome.message || 'The user could not be deleted.');
    }
    return response?.data;
  } catch (error) {
    console.error('Error in deleteUser:', error);
    throw error;
  }
};

/**
 * Task 8: what a role is for (Roles.roleType in the user service).
 * admin = platform admin, organisation = a user's own job role (Trainer, District Incharge, ARM),
 * cohort = a role inside one group (Learner, Reviewer).
 */
export type RoleType = 'admin' | 'organisation' | 'cohort';

export interface TenantRole {
  id: string;
  /** Role title as stored; the user list filters (`filters.role`) and listUsersByRoles match on it */
  name: string;
  /** Fixed key (admin, trainer, cfl, arm, learner, reviewer) */
  code: string;
  /** What the admin sees: displayName from the API, the title when it has none */
  label: string;
  roleType: RoleType;
}

/** Option shape of the filter components: value = role title (what the list APIs filter on), label = display name */
export interface RoleOption {
  value: string;
  label: string;
}

/**
 * Task 8b: roles of the Swadhaar tenant from POST /user/v1/rbac/roles/list/roles.
 * Without `roleTypes` the API returns every type except cohort, i.e. the roles a user can hold
 * (Admin + organisation roles). Pass ['organisation'] for learners only, ['cohort'] for group roles.
 * `roleId` is sent in tenantCohortRoleMapping when a user is created.
 */
export const getTenantRoles = async (roleTypes?: RoleType[]): Promise<TenantRole[]> => {
  try {
    const filters: Record<string, unknown> = { tenantId: SWADHAAR_TENANT_ID };
    if (roleTypes?.length) filters.roleType = roleTypes;
    const response = await post(
      API_ENDPOINTS.userRolesList,
      { limit: '100', page: 1, filters },
      getServiceHeaders()
    );
    const roles: any[] = response?.data?.result || [];
    return roles
      .filter((role) => role?.roleId && role?.title)
      .map((role) => ({
        id: role.roleId,
        name: role.title,
        code: role.code || '',
        label: role.displayName || role.title,
        roleType: (role.roleType || 'organisation') as RoleType,
      }));
  } catch (error) {
    console.error('Error in getTenantRoles:', error);
    return [];
  }
};

/** Filter options: value = role title (what `filters.role` matches), label = display name */
export const toRoleOptions = (roles: TenantRole[]): RoleOption[] =>
  roles.map((r) => ({ value: r.name, label: r.label }));

/**
 * Display name for a role as a user record or member row carries it (title, code or id).
 * Falls back to the given text, so an unknown role still shows something.
 */
export const roleLabelFor = (roles: TenantRole[], role?: string | null): string => {
  const key = (role || '').trim();
  if (!key) return '';
  const lower = key.toLowerCase();
  const match = roles.find(
    (r) => r.id === key || r.name.toLowerCase() === lower || r.code.toLowerCase() === lower
  );
  return match?.label || key;
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
