import { SWADHAAR_TENANT_ID } from './app.constant';
import { getSessionTenantId } from '@/utils/API/serviceHeaders';
import type { CreateUserPayload, UpdateUserPayload } from '@/services/UserService';

export const SWADHAAR_FIELD_IDS = {
  // The field ids returned by POST /user/v1/fields/options/read for `states`, `city` and `block`
  STATE: 'b61edfc6-3787-4079-86d3-37262bf23a9e',
  DISTRICT: '4aab68ae-8382-43aa-a45a-e9b239319857',
  BRANCH: '87d95cea-942b-4f8a-87d1-ee346b06b53c',
} as const;

// Swadhaar tenant roles (POST /user/v1/rbac/roles/list/roles returns Admin, Trainer and ARM). Used for bulk upload
// rows that name a role and as the default; the create dialog sends the roleId picked from that API instead.
export const DEFAULT_ROLE_ID_MAP: Record<string, string> = {
  admin: 'a0262d32-6200-4ba1-adbb-bb2883ba27a2',
  'super admin': 'a0262d32-6200-4ba1-adbb-bb2883ba27a2',
  trainer: '8225a8de-c3c2-45d6-afca-fdf73c07afdd',
  'field trainer': '8225a8de-c3c2-45d6-afca-fdf73c07afdd',
  // The server titles 8225a8de… "Trainer"; it stays the default role for learners and "student" rows
  student: '8225a8de-c3c2-45d6-afca-fdf73c07afdd',
  learner: '8225a8de-c3c2-45d6-afca-fdf73c07afdd',
  arm: 'caae81d6-5c3c-44ac-9953-ac3770d704aa',
  di: '8225a8de-c3c2-45d6-afca-fdf73c07afdd',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const resolveRoleId = (roleNameOrId?: string): string => {
  if (!roleNameOrId) {
    return DEFAULT_ROLE_ID_MAP.student;
  }
  const trimmed = roleNameOrId.trim();
  if (UUID_REGEX.test(trimmed)) {
    return trimmed;
  }
  const key = trimmed.toLowerCase();
  return DEFAULT_ROLE_ID_MAP[key] || DEFAULT_ROLE_ID_MAP.student;
};

export const sanitizeGender = (gender?: string): string | undefined => {
  if (!gender) return undefined;
  const g = gender.trim().toLowerCase();
  if (g === 'male' || g === 'female' || g === 'other') {
    return g;
  }
  return undefined;
};

export const generateSecureTemporaryPassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const randomValues = new Uint32Array(9);
  globalThis.crypto.getRandomValues(randomValues);
  return `Sw@${Array.from(randomValues, (value) => chars.charAt(value % chars.length)).join('')}`;
};

export interface UserInputFields {
  fullName: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  username?: string;
  password?: string;
  gender?: string;
  role?: string;
  /** Display name of `role` when `role` is a role id */
  roleName?: string;
  state?: string;
  district?: string;
  branch?: string;
  program?: string;
}

type CustomFieldValue = { fieldId: string; value: string[] };

const splitFullName = (fullName: string) => {
  const nameTrimmed = (fullName || '').trim();
  const nameParts = nameTrimmed.split(/\s+/);
  const firstName = nameParts[0] || '';
  if (nameParts.length === 2) {
    return { nameTrimmed, firstName, middleName: '', lastName: nameParts[1] };
  }
  if (nameParts.length > 2) {
    return {
      nameTrimmed,
      firstName,
      middleName: nameParts.slice(1, -1).join(' '),
      lastName: nameParts.at(-1) ?? '',
    };
  }
  return { nameTrimmed, firstName, middleName: '', lastName: firstName };
};

const buildLocationCustomFields = (input: UserInputFields): CustomFieldValue[] => {
  const locationFields: Array<[string, string | undefined]> = [
    [SWADHAAR_FIELD_IDS.STATE, input.state],
    [SWADHAAR_FIELD_IDS.DISTRICT, input.district],
    [SWADHAAR_FIELD_IDS.BRANCH, input.branch],
  ];
  return locationFields
    .filter(([, value]) => value && value !== 'all')
    .map(([fieldId, value]) => ({ fieldId, value: [String(value)] }));
};

export const buildCreateUserPayload = (
  input: UserInputFields,
  tenantId?: string,
  providedPassword?: string
): CreateUserPayload => {
  const targetTenantId = tenantId || getSessionTenantId() || SWADHAAR_TENANT_ID;
  const { nameTrimmed, firstName, lastName } = splitFullName(input.fullName);
  const mobile = (input.phone || '').trim();
  const email = (input.email || '').trim();
  const employeeId = (input.employeeId || '').trim();
  // The create dialog passes the chosen roleId; bulk upload may name a role per row; otherwise the default role applies.
  const roleId = input.role ? resolveRoleId(input.role) : DEFAULT_ROLE_ID_MAP.student;
  const gender = sanitizeGender(input.gender);
  const isAdmin = /admin/i.test(input.roleName || input.role || '') || input.role === DEFAULT_ROLE_ID_MAP.admin;
  // Learners sign in to the learner app with mobile OTP, which then logs in with the shared learner password
  // (NEXT_PUBLIC_SWADHAAR_LEARNER_PASSWORD, same value as the learner app). So a learner created without a typed
  // password gets that one; a random password would make OTP sign-in fail. Admins keep a random temporary password.
  const learnerPassword = isAdmin ? '' : process.env.NEXT_PUBLIC_SWADHAAR_LEARNER_PASSWORD || '';
  const password =
    providedPassword || (input.password || '').trim() || learnerPassword || generateSecureTemporaryPassword();
  const username = (input.username || '').trim() || employeeId || mobile || email;
  const customFields = buildLocationCustomFields(input);

  const payload: CreateUserPayload = {
    name: nameTrimmed,
    username,
    password,
    firstName,
    lastName,
    email,
    mobile,
    type: isAdmin ? 'Admin' : 'Student',
    tenantCohortRoleMapping: [
      {
        tenantId: targetTenantId,
        roleId,
      },
    ],
  };

  if (gender) {
    payload.gender = gender;
  }

  if (customFields.length > 0) {
    payload.customFields = customFields;
  }

  return payload;
};

export const buildUpdateUserPayload = (input: UserInputFields): UpdateUserPayload => {
  const { firstName, middleName, lastName } = splitFullName(input.fullName);
  const mobile = (input.phone || '').trim();
  const email = (input.email || '').trim();
  const employeeId = (input.employeeId || '').trim();
  const gender = sanitizeGender(input.gender);

  const userData: Record<string, any> = {
    firstName,
    lastName,
    middleName,
    mobile,
  };

  if (email && email !== '-') {
    userData.email = email;
  }

  if (employeeId) {
    userData.employeeId = employeeId;
  }

  if (gender) {
    userData.gender = gender;
  }

  const customFields = buildLocationCustomFields(input);

  const updatePayload: UpdateUserPayload = {
    userData,
  };

  if (customFields.length > 0) {
    updatePayload.customFields = customFields;
  }

  return updatePayload;
};
