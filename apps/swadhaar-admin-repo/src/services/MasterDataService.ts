import { API_ENDPOINTS } from '@/utils/API/APIEndpoints';
import { post } from './RestClient';

export interface LocationOption {
  value: string;
  label: string;
}

const FIELD_OPTIONS_LIMIT = 500;

/**
 * Options of a tenant field (POST /user/v1/fields/options/read). Dependent fields (district under a state,
 * block under a district) pass the parent option's value as `controllingfieldfk`.
 */
const fetchFieldOptions = async (fieldName: string, controllingValue?: string): Promise<LocationOption[]> => {
  try {
    const response = await post(API_ENDPOINTS.fieldOptionsRead, {
      fieldName,
      ...(controllingValue ? { controllingfieldfk: String(controllingValue) } : {}),
      limit: FIELD_OPTIONS_LIMIT,
      offset: 0,
      sort: ['name', 'asc'],
    });
    const values: any[] = response?.data?.result?.values || [];
    return values.map((v) => ({
      value: String(v.value ?? v.id ?? v.name),
      label: v.label || v.name || String(v.value),
    }));
  } catch (e) {
    console.warn(`Failed to fetch ${fieldName} options`, e);
    return [];
  }
};

const hasParent = (value?: string): value is string => Boolean(value) && value !== 'all';

export const MasterDataService = {
  getStates: (): Promise<LocationOption[]> => fetchFieldOptions('states'),

  // Districts are the `city` field, controlled by the state
  getDistricts: async (stateValue?: string): Promise<LocationOption[]> =>
    hasParent(stateValue) ? fetchFieldOptions('city', stateValue) : [],

  getBlocks: async (districtValue?: string): Promise<LocationOption[]> =>
    hasParent(districtValue) ? fetchFieldOptions('block', districtValue) : [],

  getVillages: async (blockValue?: string): Promise<LocationOption[]> =>
    hasParent(blockValue) ? fetchFieldOptions('village', blockValue) : [],

  getPrograms: (): LocationOption[] => {
    return [
      { value: 'financial_inclusion', label: 'Financial Inclusion (CFL)' },
      { value: 'micro_enterprise', label: 'Micro-Enterprise Skillset' },
      { value: 'digital_saksharta', label: 'Digital Saksharta' },
    ];
  },

  getRoles: (): LocationOption[] => {
    return [
      { value: 'ARM', label: 'Area Relationship Manager (ARM)' },
      { value: 'DI', label: 'Development Inspector (DI)' },
      { value: 'Trainer', label: 'Field Trainer' },
      { value: 'State_Lead', label: 'State Operations Lead' },
    ];
  },
};

export default MasterDataService;
