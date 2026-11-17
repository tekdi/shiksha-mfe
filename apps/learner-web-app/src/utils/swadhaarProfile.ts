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

/** The location shown on a profile: the admin-set cflLocation field, else "State, Block, City" from the custom fields. */
export const getDisplayLocation = (profileData: any): string => {
  const fields: any[] = Array.isArray(profileData?.customFields) ? profileData.customFields : [];
  const cflLocation = fields.find((f: any) => f?.fieldId === 'cflLocation')?.value;
  return cflLocation || getProfileLocation(profileData);
};

/** Label key for a profile's location row: "District Incharge Location", "ARM Location" or "Trainer Location". */
export const getLocationLabelKey = (role?: string | null): string => {
  const r = String(role || '').trim().toUpperCase();
  if (r === 'ARM') return 'LEARNER_APP.PROFILE.FIELD_LOCATION_ARM';
  if (r === 'CFL' || r === 'DI' || r === 'CFL INCHARGE' || r === 'DISTRICT INCHARGE') return 'LEARNER_APP.PROFILE.FIELD_LOCATION_DI';
  return 'LEARNER_APP.PROFILE.FIELD_LOCATION_TRAINER';
};

/** Role of the user in the tenant they log in to (the admin-assigned role), falling back to profile.role */
export const getProfileRole = (profileData: any): string =>
  profileData?.tenantData?.[0]?.roleName || profileData?.role || localStorage.getItem('userRole') || '';

const isUrl = (value: any): value is string => typeof value === 'string' && /^https?:\/\//i.test(value);

/**
 * The profile photo URL. The photo is saved in the profile's `name`, but the profile read does not always return it,
 * so the URL kept in localStorage after the upload is the fallback. A plain display name is not a photo and is skipped.
 */
export const getProfilePhotoUrl = (profileData?: any, uploadedUrl?: string | null): string | null =>
  [
    uploadedUrl,
    profileData?.name,
    profileData?.basicDetails?.image,
    typeof window !== 'undefined' ? localStorage.getItem('profilePicture') : null,
  ].find(isUrl) || null;
