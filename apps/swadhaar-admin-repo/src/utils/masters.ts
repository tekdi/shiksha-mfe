/**
 * Org Management and Branch Management: field rules and list filters.
 * The rules mirror the user service (src/masters/dto/masters.dto.ts), so most mistakes are
 * caught before a request is sent. The server still checks everything.
 */

export type StatusFilter = 'all' | 'active' | 'inactive';

export const ORG_CODE_PATTERN = /^[A-Za-z0-9]{1,10}$/;
export const ORG_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 &.,'()-]*$/;
export const ORG_NAME_MAX = 150;
export const BRANCH_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{0,19}$/;
export const BRANCH_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 .'()-]*$/;
export const BRANCH_NAME_MAX = 100;

export interface OrganisationForm {
  code: string;
  name: string;
}

export interface BranchForm {
  stateValue: string;
  districtValue: string;
  code: string;
  name: string;
}

/** Field name to an i18n key for its error. */
export type FormErrors<T> = Partial<Record<keyof T, string>>;

const ERR = 'ADMINISTRATION.ERRORS';

/** Same clean-up the server applies: trim, and collapse runs of spaces. */
export const cleanText = (value: string): string => (value ?? '').trim().replace(/\s{2,}/g, ' ');

export const hasErrors = (errors: Record<string, string | undefined>): boolean =>
  Object.values(errors).some(Boolean);

const checkCode = (code: string, pattern: RegExp, invalidKey: string): string | undefined => {
  const value = cleanText(code);
  if (!value) return `${ERR}.CODE_REQUIRED`;
  return pattern.test(value) ? undefined : `${ERR}.${invalidKey}`;
};

const checkName = (name: string, pattern: RegExp, max: number, invalidKey: string): string | undefined => {
  const value = cleanText(name);
  if (!value) return `${ERR}.NAME_REQUIRED`;
  if (value.length > max) return `${ERR}.NAME_TOO_LONG`;
  return pattern.test(value) ? undefined : `${ERR}.${invalidKey}`;
};

/** Drops fields without an error, so a valid form gives {}. */
const compact = <T>(errors: FormErrors<T>): FormErrors<T> =>
  Object.fromEntries(Object.entries(errors).filter(([, v]) => Boolean(v))) as FormErrors<T>;

export const validateOrganisationForm = (
  form: OrganisationForm,
  { isEdit = false }: { isEdit?: boolean } = {}
): FormErrors<OrganisationForm> =>
  compact({
    code: isEdit ? undefined : checkCode(form.code, ORG_CODE_PATTERN, 'ORG_CODE_INVALID'),
    name: checkName(form.name, ORG_NAME_PATTERN, ORG_NAME_MAX, 'ORG_NAME_INVALID'),
  });

export const validateBranchForm = (
  form: BranchForm,
  { isEdit = false }: { isEdit?: boolean } = {}
): FormErrors<BranchForm> =>
  compact({
    stateValue: isEdit || form.stateValue ? undefined : `${ERR}.STATE_REQUIRED`,
    districtValue: isEdit || form.districtValue ? undefined : `${ERR}.DISTRICT_REQUIRED`,
    code: isEdit ? undefined : checkCode(form.code, BRANCH_CODE_PATTERN, 'BRANCH_CODE_INVALID'),
    name: checkName(form.name, BRANCH_NAME_PATTERN, BRANCH_NAME_MAX, 'BRANCH_NAME_INVALID'),
  });

export interface ListQuery {
  page: number;
  rowsPerPage: number;
  search?: string;
  status?: StatusFilter;
  stateValue?: string;
  districtValue?: string;
}

export interface ListBody {
  limit: number;
  offset: number;
  search?: string;
  isActive?: boolean;
  stateValue?: string;
  districtValue?: string;
}

const isSet = (value?: string): value is string => Boolean(value) && value !== 'all';

/** Page state to the list API's body. Empty filters are left out. */
export const toListBody = (query: ListQuery): ListBody => {
  const body: ListBody = { limit: query.rowsPerPage, offset: query.page * query.rowsPerPage };
  const search = cleanText(query.search ?? '');
  if (search) body.search = search;
  if (query.status === 'active') body.isActive = true;
  if (query.status === 'inactive') body.isActive = false;
  if (isSet(query.stateValue)) body.stateValue = query.stateValue;
  if (isSet(query.districtValue)) body.districtValue = query.districtValue;
  return body;
};
