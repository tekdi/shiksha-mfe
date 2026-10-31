import TenantService from '@/services/TenantService';
import { getAcademicYearId } from '@/utils/API/academicYear';

const readStored = (key: string): string =>
  (typeof window !== 'undefined' ? localStorage.getItem(key) : null) || '';

/** Tenant of the logged-in session (localStorage.tenantId). */
export const getSessionTenantId = (): string => readStored('tenantId') || TenantService.getTenantId();

/**
 * Headers for the Swadhaar middleware. Token, tenant and user come from the logged-in session in
 * localStorage (token / tenantId / userId); nothing here is hardcoded.
 */
export const getServiceHeaders = (customHeaders: Record<string, string> = {}): Record<string, string> => {
  const token = readStored('token');
  const tenantId = getSessionTenantId();
  const userId = readStored('userId');
  const academicYearId = getAcademicYearId();
  const orgId =
    readStored('organisationId') ||
    process.env.NEXT_PUBLIC_ORG_ID ||
    'd36d9079-0f42-4ba3-be03-26c9e79509ee';

  return {
    academicyearid: academicYearId,
    tenantid: tenantId,
    tenantId: tenantId,
    organisationid: orgId,
    organisationId: orgId,
    'X-Tenant-Id': tenantId,
    'X-Channel-Id': TenantService.getChannelId(),
    ...(userId ? { userId } : {}),
    ...(token ? { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {}),
    accept: 'application/json, text/plain, */*',
    'content-type': 'application/json',
    ...customHeaders,
  };
};
