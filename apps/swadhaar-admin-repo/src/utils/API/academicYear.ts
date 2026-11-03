import { API_ENDPOINTS } from '@/utils/API/APIEndpoints';
import { SWADHAAR_ACADEMIC_YEAR_ID, SWADHAAR_TENANT_ID } from '@/utils/app.constant';

const STORAGE_KEY = 'academicYearId';

/** Academic year sent as the academicyearid header: session value first, configured default otherwise. */
export const getAcademicYearId = (): string =>
  (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null) ||
  process.env.NEXT_PUBLIC_ACADEMIC_YEAR_ID ||
  SWADHAAR_ACADEMIC_YEAR_ID;

let inFlight: Promise<string | null> | null = null;

/**
 * Loads the tenant's active academic year (POST /user/v1/academicyears/list) into
 * localStorage.academicYearId. Uses fetch directly so it never passes through the axios interceptor.
 */
export const syncActiveAcademicYear = (token: string, tenantId: string = SWADHAAR_TENANT_ID): Promise<string | null> => {
  if (inFlight !== null) return inFlight;
  inFlight = (async () => {
    try {
      const resp = await fetch(API_ENDPOINTS.academicYearsList, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
          tenantid: tenantId,
        },
        body: '{}',
      });
      const years: any[] = (await resp.json())?.result || [];
      const active = Array.isArray(years) ? years.find((y) => y?.isActive) || years[0] : null;
      if (active?.id) {
        localStorage.setItem(STORAGE_KEY, active.id);
        return active.id as string;
      }
    } catch (error) {
      console.warn('Could not load the active academic year:', error);
    }
    return null;
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
};

/** For sessions created before the year was fetched: load it once the first API call needs it. */
export const ensureAcademicYear = async (): Promise<void> => {
  if (typeof window === 'undefined' || localStorage.getItem(STORAGE_KEY)) return;
  const token = localStorage.getItem('token');
  if (!token) return;
  await syncActiveAcademicYear(token, localStorage.getItem('tenantId') || SWADHAAR_TENANT_ID);
};
