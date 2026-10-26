import { SWADHAAR_TENANT_ID } from './app.constant';
import { CreateUserPayload, UpdateUserPayload } from '@/services/UserService';

export const SWADHAAR_FIELD_IDS = {
  STATE: '800265b1-9058-482a-94f4-726197e1dfe4',
  DISTRICT: '56ce5f2b-1d81-4d60-9eba-798f764008d3',
  BRANCH: '2b5da81a-b803-4550-9af3-f4c61e8f8ca1',
  PROGRAM: '1b92932d-648b-4b26-9f12-f43cec5416ef',
} as const;

export const DEFAULT_ROLE_ID_MAP: Record<string, string> = {
  // Swadhaar / Aspire Company & System Roles
  student: '57bc16f8-f446-4e5d-b595-c908a229e776',
  learner: '57bc16f8-f446-4e5d-b595-c908a229e776',
  trainer: 'a5f1dbc9-2ad4-442c-b762-0e3fc1f6c6da',
  'field trainer': 'a5f1dbc9-2ad4-442c-b762-0e3fc1f6c6da',
  arm: 'c4454929-954e-4c51-bb7d-cca834ab9375',
  di: 'b82e16d4-399a-4c28-91ec-29bfe4436511',
  admin: '4a3493aa-a4f7-4e2b-b141-f213084b5599',
  'super admin': '4a3493aa-a4f7-4e2b-b141-f213084b5599',
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
  gender?: string;
  role?: string;
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
  const targetTenantId = tenantId || SWADHAAR_TENANT_ID;
  const { nameTrimmed, firstName, lastName } = splitFullName(input.fullName);
  const mobile = (input.phone || '').trim();
  const email = (input.email || '').trim();
  const employeeId = (input.employeeId || '').trim();
  const roleId = resolveRoleId(input.role);
  const gender = sanitizeGender(input.gender);
  const password = providedPassword || generateSecureTemporaryPassword();
  const customFields = buildLocationCustomFields(input);

  const payload: CreateUserPayload = {
    name: nameTrimmed,
    username: employeeId || mobile || email,
    password,
    firstName,
    lastName,
    email,
    mobile,
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
