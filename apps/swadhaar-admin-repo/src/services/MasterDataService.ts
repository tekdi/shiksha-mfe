import { API_ENDPOINTS } from '@/utils/API/APIEndpoints';
import { post } from './RestClient';

export interface LocationOption {
  value: string;
  label: string;
}

export const MasterDataService = {
  getStates: async (): Promise<LocationOption[]> => {
    try {
      const response = await post(API_ENDPOINTS.fieldOptionsRead, {
        limit: 100,
        offset: 0,
        fieldName: 'state',
        // controllingfieldfk: ['4'],
      });
      if (response?.data?.result?.values && response.data.result.values.length > 0) {
        return response.data.result.values.map((v: any) => ({
          value: String(v.value ?? v.id ?? v.name),
          label: v.name || v.label || v.value,
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch states from API, using fallback', e);
    }
    return [
      { value: '3', label: 'Maharashtra' },
      { value: '4', label: 'Gujarat' },
      { value: '5', label: 'Madhya Pradesh' },
    ];
  },

  getDistricts: async (stateValue?: string): Promise<LocationOption[]> => {
    try {
      if (stateValue && stateValue !== 'all') {
        const response = await post(API_ENDPOINTS.fieldOptionsRead, {
          limit: 100,
          offset: 0,
          fieldName: 'district',
          controllingfieldfk: [String(stateValue)],
        });
        if (response?.data?.result?.values && response.data.result.values.length > 0) {
          return response.data.result.values.map((v: any) => ({
            value: String(v.value ?? v.id ?? v.name),
            label: v.name || v.label || v.value,
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to fetch districts from API, using fallback', e);
    }

    if (stateValue === '4' || stateValue === 'gujarat') {
      return [
        { value: '201', label: 'Ahmedabad' },
        { value: '202', label: 'Surat' },
        { value: '203', label: 'Vadodara' },
      ];
    }
    return [
      { value: '143', label: 'Pune' },
      { value: '144', label: 'Nagpur' },
      { value: '145', label: 'Nashik' },
      { value: '146', label: 'Mumbai Suburban' },
    ];
  },

  getBlocks: async (districtValue?: string): Promise<LocationOption[]> => {
    try {
      if (districtValue && districtValue !== 'all') {
        const response = await post(API_ENDPOINTS.fieldOptionsRead, {
          limit: 100,
          offset: 0,
          fieldName: 'block',
          controllingfieldfk: [String(districtValue)],
        });
        if (response?.data?.result?.values && response.data.result.values.length > 0) {
          return response.data.result.values.map((v: any) => ({
            value: String(v.value ?? v.id ?? v.name),
            label: v.name || v.label || v.value,
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to fetch blocks from API, using fallback', e);
    }

    if (districtValue === '144' || districtValue === 'nagpur') {
      return [
        { value: '301', label: 'Nagpur Rural' },
        { value: '302', label: 'Kamthi' },
        { value: '303', label: 'Hingna' },
      ];
    }
    return [
      { value: '401', label: 'Haveli' },
      { value: '402', label: 'Pune City' },
      { value: '403', label: 'Baramati' },
      { value: '404', label: 'Khed' },
    ];
  },

  getVillages: async (blockValue?: string): Promise<LocationOption[]> => {
    try {
      if (blockValue) {
        const response = await post(API_ENDPOINTS.fieldOptionsRead, {
          fieldName: 'village',
          controllingfieldfk: blockValue,
          limit: 100,
          offset: 0,
        });
        if (response?.data?.result?.values?.length > 0) {
          return response.data.result.values.map((v: any) => ({
            value: v.value || v.id || v.name,
            label: v.name || v.label || v.value,
          }));
        }
      }
    } catch (e) {
      // Fallback
    }
    return [
      { value: 'branch_central', label: 'Central CFL Branch' },
      { value: 'branch_north', label: 'North Sub-center' },
      { value: 'branch_rural_1', label: 'Rural Kendra 1' },
    ];
  },

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
