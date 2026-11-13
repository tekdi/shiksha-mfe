import { extractCustomFieldValue } from '@learner/utils/API/userService';

// State, block and city, as labelled in the Swadhaar user profile (older profiles use STATE / DISTRICT)
const LOCATION_FIELDS = [['STATES', 'STATE'], ['BLOCK'], ['CITY', 'DISTRICT']];

/** Location "State, Block, City" from the user's own custom fields; '' when none is set. */
export const getProfileLocation = (profileData: any): string => {
  const fields: any[] = Array.isArray(profileData?.customFields) ? profileData.customFields : [];
  return LOCATION_FIELDS.map((keys) => {
    const field = fields.find((f: any) => keys.includes(String(f?.label ?? f?.name ?? '').toUpperCase()));
    return extractCustomFieldValue(field) || '';
  })
    .filter(Boolean)
    .join(', ');
};

/** Role of the user in the tenant they log in to (the admin-assigned role), falling back to profile.role */
export const getProfileRole = (profileData: any): string =>
  profileData?.tenantData?.[0]?.roleName || profileData?.role || localStorage.getItem('userRole') || '';
