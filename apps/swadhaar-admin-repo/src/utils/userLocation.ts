import { SWADHAAR_FIELD_IDS } from './userPayloadBuilder';
import MasterDataService, { LocationOption } from '@/services/MasterDataService';

export interface UserLocation {
  state: string;
  district: string;
  block: string;
}

const lower = (v: unknown): string => (typeof v === 'string' || typeof v === 'number' ? String(v) : '').trim().toLowerCase();

/** First value of a custom field: `value` may be an array or a string, `selectedValues` carries {id, value} */
const firstFieldValue = (cf: any): string => {
  const raw = Array.isArray(cf?.value) ? cf.value[0] : cf?.value;
  if (raw !== undefined && raw !== null && String(raw).trim()) return String(raw).trim();
  const selected = cf?.selectedValues?.[0];
  const fromSelected = selected?.id ?? selected?.value;
  return fromSelected !== undefined && fromSelected !== null ? String(fromSelected).trim() : '';
};

const isField = (cf: any, fieldId: string, names: string[]): boolean =>
  cf?.fieldId === fieldId || names.includes(lower(cf?.label)) || names.includes(lower(cf?.name));

/**
 * State, district and block of a user as stored: the option values (ids such as "4") saved in the
 * state (`states`), `city` and `block` custom fields of the user record.
 */
export const readUserLocation = (userData: any): UserLocation => {
  const fields: any[] = userData?.customFields || userData?.customField || [];
  const pick = (fieldId: string, names: string[]) => {
    const found = fields.find((cf) => isField(cf, fieldId, names) && firstFieldValue(cf));
    return found ? firstFieldValue(found) : '';
  };
  return {
    state: pick(SWADHAAR_FIELD_IDS.STATE, ['state', 'states']) || String(userData?.state ?? ''),
    district: pick(SWADHAAR_FIELD_IDS.DISTRICT, ['city', 'district']) || String(userData?.district ?? userData?.city ?? ''),
    block: pick(SWADHAAR_FIELD_IDS.BRANCH, ['block', 'branch']) || String(userData?.block ?? userData?.branch ?? ''),
  };
};

const labelFor = (options: LocationOption[], value: string): string =>
  options.find((o) => o.value === value || lower(o.label) === lower(value))?.label || value;

/** Names of the stored state, district and block, looked up level by level in the field options */
export const resolveLocationLabels = async (location: UserLocation): Promise<UserLocation> => {
  const result = { ...location };
  if (!location.state) return result;
  const states = await MasterDataService.getStates();
  const state = states.find((o) => o.value === location.state || lower(o.label) === lower(location.state));
  result.state = state?.label || location.state;
  if (!location.district) return result;
  const districts = await MasterDataService.getDistricts(state?.value || location.state);
  const district = districts.find((o) => o.value === location.district || lower(o.label) === lower(location.district));
  result.district = district?.label || labelFor(districts, location.district);
  if (!location.block) return result;
  const blocks = await MasterDataService.getBlocks(district?.value || location.district);
  result.block = labelFor(blocks, location.block);
  return result;
};
