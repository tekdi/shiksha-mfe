import { SWADHAAR_TENANT_ID } from './app.constant';
import { getSessionTenantId } from '@/utils/API/serviceHeaders';
import type { CreateUserPayload, UpdateUserPayload } from '@/services/UserService';

export const SWADHAAR_FIELD_IDS = {
  STATE: '800265b1-9058-482a-94f4-726197e1dfe4',
  DISTRICT: '56ce5f2b-1d81-4d60-9eba-798f764008d3',
  BRANCH: '2b5da81a-b803-4550-9af3-f4c61e8f8ca1',
  PROGRAM: '1b92932d-648b-4b26-9f12-f43cec5416ef',
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
    [SWADHAAR_FIELD_IDS.PROGRAM, input.program],
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
  const password = providedPassword || (input.password || '').trim() || generateSecureTemporaryPassword();
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
    type: /admin/i.test(input.roleName || input.role || '') || input.role === DEFAULT_ROLE_ID_MAP.admin ? 'Admin' : 'Student',
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
