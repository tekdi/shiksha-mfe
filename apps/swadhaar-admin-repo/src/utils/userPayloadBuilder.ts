import { SWADHAAR_TENANT_ID } from './app.constant';
import { getSessionTenantId } from '@/utils/API/serviceHeaders';
import type { CreateUserPayload, UpdateUserPayload } from '@/services/UserService';

export const SWADHAAR_FIELD_IDS = {
  // The field ids returned by POST /user/v1/fields/options/read for `states`, `city` and `block`
  STATE: 'b61edfc6-3787-4079-86d3-37262bf23a9e',
  DISTRICT: '4aab68ae-8382-43aa-a45a-e9b239319857',
  BRANCH: '87d95cea-942b-4f8a-87d1-ee346b06b53c',
  // Free-text "Other" branch (sql/021_branch_other_field.up.sql in the user service); used instead of BRANCH
  BRANCH_OTHER: '7ff04020-7805-4be0-b49f-f88281a92448',
} as const;

// Fallback only: the create dialog and bulk upload send the roleId picked from POST /user/v1/rbac/roles/list/roles.
// Used when no roleId is given (default = Trainer) or a value names a Swadhaar role by code or title.
// Keys are role codes and titles in lower case. Learner / Reviewer are group roles (Task 8a), never a user's own role.
const TRAINER_ROLE_ID = '8225a8de-c3c2-45d6-afca-fdf73c07afdd';
const DISTRICT_INCHARGE_ROLE_ID = '724d6e43-b13d-4a0f-bb88-c175b2f89f9e';
export const DEFAULT_ROLE_ID_MAP: Record<string, string> = {
  admin: 'a0262d32-6200-4ba1-adbb-bb2883ba27a2',
  trainer: TRAINER_ROLE_ID,
  'trainer/cfl incharge': TRAINER_ROLE_ID,
  cfl: DISTRICT_INCHARGE_ROLE_ID,
  di: DISTRICT_INCHARGE_ROLE_ID,
  'district incharge': DISTRICT_INCHARGE_ROLE_ID,
  arm: 'caae81d6-5c3c-44ac-9953-ac3770d704aa',
};
/** Own role given when none is chosen */
export const DEFAULT_USER_ROLE_ID = TRAINER_ROLE_ID;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const resolveRoleId = (roleNameOrId?: string): string => {
  if (!roleNameOrId) {
    return DEFAULT_USER_ROLE_ID;
  }
  const trimmed = roleNameOrId.trim();
  if (UUID_REGEX.test(trimmed)) {
    return trimmed;
  }
  const key = trimmed.toLowerCase();
  return DEFAULT_ROLE_ID_MAP[key] || DEFAULT_USER_ROLE_ID;
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
  /**
   * Employee ID, Organization Code and Organization Name (Task 27). On update, leave a field
   * undefined to keep the stored value; an empty string clears it.
   */
  employeeId?: string;
  organisationCode?: string;
  organisationName?: string;
  username?: string;
  password?: string;
  gender?: string;
  role?: string;
  /** Display name of `role` when `role` is a role id */
  roleName?: string;
  state?: string;
  district?: string;
  branch?: string;
  /**
   * Branch typed in when "Other" is picked (Task 28/29). Sent instead of `branch`. On update, leave it
   * undefined to keep the stored value; an empty string clears it.
   */
  branchOther?: string;
  program?: string;
}

// A drop_down field takes an array of option values; a text field (branch_other) takes a string
type CustomFieldValue = { fieldId: string; value: string[] | string };

type OrganisationFields = Pick<UserInputFields, 'employeeId' | 'organisationCode' | 'organisationName'>;
const ORGANISATION_KEYS = ['employeeId', 'organisationCode', 'organisationName'] as const;

/**
 * The organisation fields to send. Create sends only filled values. Update also sends a cleared
 * value as null so the server removes it, and skips undefined so the stored value stays.
 */
const buildOrganisationFields = (input: UserInputFields, sendCleared: boolean): Record<string, string | null> => {
  const out: Record<string, string | null> = {};
  ORGANISATION_KEYS.forEach((key) => {
    const raw = (input as OrganisationFields)[key];
    if (raw === undefined) return;
    const trimmed = String(raw).trim();
    const value = key === 'organisationCode' ? trimmed.toUpperCase() : trimmed;
    if (value) out[key] = value;
    else if (sendCleared) out[key] = null;
  });
  return out;
};

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

/**
 * State, district and branch custom fields. An "Other" branch goes in the text field branch_other
 * instead of the branch dropdown. Update also sends a cleared "Other" branch ('') so the stored one is removed.
 */
const buildLocationCustomFields = (input: UserInputFields, sendCleared = false): CustomFieldValue[] => {
  const branchOther = input.branchOther?.trim() || '';
  const locationFields: Array<[string, string | undefined]> = [
    [SWADHAAR_FIELD_IDS.STATE, input.state],
    [SWADHAAR_FIELD_IDS.DISTRICT, input.district],
    [SWADHAAR_FIELD_IDS.BRANCH, branchOther ? undefined : input.branch],
  ];
  const fields: CustomFieldValue[] = locationFields
    .filter(([, value]) => value && value !== 'all')
    .map(([fieldId, value]) => ({ fieldId, value: [String(value)] }));
  if (branchOther || (sendCleared && input.branchOther !== undefined)) {
    fields.push({ fieldId: SWADHAAR_FIELD_IDS.BRANCH_OTHER, value: branchOther });
  }
  return fields;
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
  // The create dialog passes the chosen roleId; bulk upload may name a role per row; otherwise the default role applies.
  const roleId = input.role ? resolveRoleId(input.role) : DEFAULT_USER_ROLE_ID;
  const gender = sanitizeGender(input.gender);
  const isAdmin = /admin/i.test(input.roleName || input.role || '') || input.role === DEFAULT_ROLE_ID_MAP.admin;
  // Learners sign in to the learner app with mobile OTP, which then logs in with the shared learner password
  // (NEXT_PUBLIC_SWADHAAR_LEARNER_PASSWORD, same value as the learner app). So a learner created without a typed
  // password gets that one; a random password would make OTP sign-in fail. Admins keep a random temporary password.
  const learnerPassword = isAdmin ? '' : process.env.NEXT_PUBLIC_SWADHAAR_LEARNER_PASSWORD || '';
 if (!isAdmin && !learnerPassword) {
    // Fail loudly instead of silently creating a learner who can never sign in
    throw new Error('NEXT_PUBLIC_SWADHAAR_LEARNER_PASSWORD is not set in the admin build; learners cannot be created.');
  }
  const password = isAdmin
    ? providedPassword || (input.password || '').trim() || generateSecureTemporaryPassword()
    : learnerPassword;
  // Employee ID is its own field now (unique per Organization Code), never the login username
  const username = isAdmin
    ? (input.username || '').trim() || mobile || email
    : mobile || (input.username || '').trim() || email;
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

  Object.assign(payload, buildOrganisationFields(input, false));

  if (customFields.length > 0) {
    payload.customFields = customFields;
  }

  return payload;
};

export const buildUpdateUserPayload = (input: UserInputFields): UpdateUserPayload => {
  const { firstName, middleName, lastName } = splitFullName(input.fullName);
  const mobile = (input.phone || '').trim();
  const email = (input.email || '').trim();
  const gender = sanitizeGender(input.gender);

  const userData: Record<string, any> = {
    firstName,
    lastName,
    middleName,
    mobile,
    ...buildOrganisationFields(input, true),
  };

  if (email && email !== '-') {
    userData.email = email;
  }

  if (gender) {
    userData.gender = gender;
  }

  const customFields = buildLocationCustomFields(input, true);

  const updatePayload: UpdateUserPayload = {
    userData,
  };

  if (customFields.length > 0) {
    updatePayload.customFields = customFields;
  }

  return updatePayload;
};
