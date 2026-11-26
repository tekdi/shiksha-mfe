import { patch, post } from './RestClient';
import { API_ENDPOINTS } from '@/utils/API/APIEndpoints';
import { BranchForm, cleanText, ListQuery, OrganisationForm, toListBody } from '@/utils/masters';

/**
 * Org Management and Branch Management (user service /user/v1/masters, Admin role only).
 * Nothing is deleted: orgs and branches are deactivated with isActive=false.
 */

export interface MasterPage<T> {
  totalCount: number;
  items: T[];
}

export interface Organisation {
  organisationId: string;
  code: string;
  name: string;
  isActive: boolean;
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationOption {
  value: string;
  name: string;
}

export interface District extends LocationOption {
  stateValue: string;
}

export interface Branch {
  /** The branch's id (users store this value) */
  value: string;
  /** Null for branches added before Branch Management */
  code: string | null;
  name: string;
  isActive: boolean;
  districtValue: string;
  districtName?: string | null;
  stateValue?: string | null;
  stateName?: string | null;
  userCount?: number;
}

export interface MasterChanges {
  name?: string;
  isActive?: boolean;
}

const result = <T>(response: { data: { result: T } }): T => response.data.result;

/** Cleans the name the way the server will, so the value saved is the value sent. */
const cleanChanges = (changes: MasterChanges): MasterChanges =>
  changes.name === undefined ? changes : { ...changes, name: cleanText(changes.name) };

export const listOrganisations = async (query: ListQuery): Promise<MasterPage<Organisation>> =>
  result(await post(API_ENDPOINTS.organisationList, toListBody(query)));

export const createOrganisation = async (form: OrganisationForm): Promise<Organisation> =>
  result(
    await post(API_ENDPOINTS.organisationCreate, {
      code: cleanText(form.code).toUpperCase(),
      name: cleanText(form.name),
    })
  );

export const updateOrganisation = async (
  organisationId: string,
  changes: MasterChanges
): Promise<{ organisation: Organisation; usersUpdated: number }> =>
  result(await patch(API_ENDPOINTS.organisationUpdate(organisationId), cleanChanges(changes)));

export const listStates = async (): Promise<LocationOption[]> =>
  result(await post(API_ENDPOINTS.stateList, {}));

export const listDistricts = async (stateValue: string): Promise<District[]> =>
  result(await post(API_ENDPOINTS.districtList, { stateValue }));

export const listBranches = async (query: ListQuery): Promise<MasterPage<Branch>> =>
  result(await post(API_ENDPOINTS.branchList, toListBody(query)));

/** The state only narrows the district list in the form; the server needs the district. */
export const createBranch = async (form: BranchForm): Promise<Branch> =>
  result(
    await post(API_ENDPOINTS.branchCreate, {
      districtValue: form.districtValue,
      code: cleanText(form.code).toUpperCase(),
      name: cleanText(form.name),
    })
  );

export const updateBranch = async (value: string, changes: MasterChanges): Promise<Branch> =>
  result(await patch(API_ENDPOINTS.branchUpdate(value), cleanChanges(changes)));
