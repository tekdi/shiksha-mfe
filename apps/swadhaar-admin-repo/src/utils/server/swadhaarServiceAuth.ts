/**
 * Server-only helpers for the Swadhaar middleware service account
 * (SWADHAAR_SERVICE_USERNAME / SWADHAAR_SERVICE_PASSWORD). Never import from client code.
 */
import { trimTrailingSlashes } from '@/utils/url';

export const middlewareUrl = (): string =>
  trimTrailingSlashes(process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'https://swadhaar-middleware-qa.tekdinext.com');

export interface ServiceLoginResult {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

/** POST /user/v1/auth/login with the service account. */
export const loginServiceAccount = async (): Promise<ServiceLoginResult> => {
  const username = process.env.SWADHAAR_SERVICE_USERNAME;
  const password = process.env.SWADHAAR_SERVICE_PASSWORD;
  if (!username || !password) throw new Error('Service account is not configured');

  const resp = await fetch(`${middlewareUrl()}/user/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const result = (await resp.json())?.result;
  if (!resp.ok || !result?.access_token) throw new Error('Service login failed');
  return result;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

/** Access token for server-side lookups, cached until a minute before it expires. */
export const getServiceToken = async (forceRefresh = false): Promise<string> => {
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  const result = await loginServiceAccount();
  const ttlMs = Math.max(0, (Number(result.expires_in) || 3600) - 60) * 1000;
  cachedToken = { value: result.access_token, expiresAt: Date.now() + ttlMs };
  return result.access_token;
};

export interface AdminProfile {
  userId: string;
  firstName: string;
  lastName: string;
}

/**
 * The Admin user who owns a mobile number (POST /user/v1/list), or null. The session tokens come from the shared
 * service account, so this is what tells the portal who actually signed in.
 */
export const findAdminByMobile = async (mobile: string, tenantId: string): Promise<AdminProfile | null> => {
  const list = (token: string) =>
    fetch(`${middlewareUrl()}/user/v1/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, tenantid: tenantId },
      body: JSON.stringify({ limit: 10, offset: 0, filters: { role: 'Admin', mobile }, sort: ['firstName', 'asc'] }),
    });
  let resp = await list(await getServiceToken());
  if (resp.status === 401) resp = await list(await getServiceToken(true));
  if (!resp.ok) return null;
  const result = (await resp.json())?.result;
  const users: any[] = result?.getUserDetails || result?.users || result?.userData || [];
  const user = Array.isArray(users) ? users[0] : null;
  if (!user?.userId) return null;
  return { userId: user.userId, firstName: user.firstName || '', lastName: user.lastName || '' };
};
