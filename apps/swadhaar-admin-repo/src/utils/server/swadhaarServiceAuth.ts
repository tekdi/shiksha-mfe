/**
 * Server-only helpers for the Swadhaar middleware service account
 * (SWADHAAR_SERVICE_USERNAME / SWADHAAR_SERVICE_PASSWORD). Never import from client code.
 */

export const middlewareUrl = (): string =>
  (process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'https://swadhaar-middleware-qa.tekdinext.com').replace(/\/+$/, '');

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
