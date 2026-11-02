import axios from 'axios';

/**
 * Swadhaar learner sign-in (OTP) against the Swadhaar middleware's /user/v1 routes.
 * These calls run before a session exists, so they send the Swadhaar tenant explicitly instead of
 * relying on the shared interceptor's tenant lookup.
 */
/** Swadhaar has its own middleware; the shared NEXT_PUBLIC_MIDDLEWARE_URL points at another tenant's backend. */
export const SWADHAAR_BASE_URL =
  process.env.NEXT_PUBLIC_SWADHAAR_MIDDLEWARE_URL || 'https://swadhaar-middleware-qa.tekdinext.com';
export const SWADHAAR_ACADEMIC_YEAR_ID = '7708b7c0-08a1-41a7-8755-a06e767b0ed6';
export const SWADHAAR_ORGANISATION_ID = 'd36d9079-0f42-4ba3-be03-26c9e79509ee';
export const SWADHAAR_TENANT_ID = '35529b5d-526f-4da5-bc6e-64f740023d26';
export const SWADHAAR_CHANNEL_ID = 'swadhaar-channel';

const tenantHeaders = (tenantId: string = SWADHAAR_TENANT_ID): Record<string, string> => ({
  tenantid: tenantId,
  'X-Tenant-Id': tenantId,
  'X-Channel-Id': SWADHAAR_CHANNEL_ID,
  'Content-Type': 'application/json',
});

const SERVICE_TOKEN_KEY = 'swadhaarServiceAuth';
const EXPIRY_SKEW_MS = 60 * 1000;

interface ServiceAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const readServiceAuth = (): ServiceAuth | null => {
  try {
    const raw = sessionStorage.getItem(SERVICE_TOKEN_KEY);
    return raw ? (JSON.parse(raw) as ServiceAuth) : null;
  } catch {
    return null;
  }
};

const saveServiceAuth = (auth: ServiceAuth) => {
  try {
    sessionStorage.setItem(SERVICE_TOKEN_KEY, JSON.stringify(auth));
  } catch {
    // storage unavailable: the token is simply fetched again next time
  }
};

/**
 * POST /user/v1/auth/login with the Swadhaar service account. The learner has no token before OTP sign-in,
 * so this one is used for the pre-login calls (user list, send/verify OTP). Cached in sessionStorage until it
 * expires; access_token and refresh_token are both kept.
 */
export const getSwadhaarServiceToken = async (): Promise<string | null> => {
  const cached = readServiceAuth();
  if (cached && cached.expiresAt - EXPIRY_SKEW_MS > Date.now()) return cached.accessToken;

  const username = process.env.NEXT_PUBLIC_SWADHAAR_SERVICE_USERNAME;
  const password = process.env.NEXT_PUBLIC_SWADHAAR_SERVICE_PASSWORD;
  if (!username || !password) {
    console.warn('Swadhaar service login skipped: NEXT_PUBLIC_SWADHAAR_SERVICE_USERNAME/PASSWORD are not set (restart the dev server after editing .env)');
    return null;
  }

  try {
    const response = await axios.post(
      `${SWADHAAR_BASE_URL}/user/v1/auth/login`,
      { username, password },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const result = response?.data?.result;
    if (!result?.access_token) {
      console.warn('Swadhaar service login returned no access_token');
      return null;
    }
    saveServiceAuth({
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      expiresAt: Date.now() + (Number(result.expires_in) || 0) * 1000,
    });
    return result.access_token;
  } catch (error) {
    console.warn('Swadhaar service login failed', error);
    return null;
  }
};

/** Tenant headers plus the service token's Authorization when one could be fetched. */
const preLoginHeaders = async (tenantId?: string): Promise<Record<string, string>> => {
  const token = await getSwadhaarServiceToken();
  return token ? { ...tenantHeaders(tenantId), Authorization: `Bearer ${token}` } : tenantHeaders(tenantId);
};

/** POST /user/v1/send-otp. The Swadhaar middleware only accepts reason "signup" (it rejects "login").  The OTP hash comes back under result.hash (or result.data.hash). */
export const sendSwadhaarOtp = async (mobile: string, reason = 'signup', tenantId?: string): Promise<any> => {
  const response = await axios.post(`${SWADHAAR_BASE_URL}/user/v1/send-otp`, { mobile, reason }, { headers: await preLoginHeaders(tenantId) });
  return response?.data;
};

/** POST /user/v1/verify-otp. On success the result carries the session token. */
export const verifySwadhaarOtp = async (
  params: { mobile: string; otp: string; hash: string; reason?: string },
  tenantId?: string
): Promise<any> => {
  const response = await axios.post(
    `${SWADHAAR_BASE_URL}/user/v1/verify-otp`,
    { mobile: params.mobile, reason: params.reason ?? 'signup', otp: params.otp, hash: params.hash },
    { headers: await preLoginHeaders(tenantId) }
  );
  return response?.data;
};

/**
 * Learner session after a successful OTP check. verify-otp only answers { success: true }, so the learner's own
 * token comes from POST /user/v1/auth/login with username = mobile and the password learners are created with
 * (NEXT_PUBLIC_SWADHAAR_LEARNER_PASSWORD). Returns the login result (access_token, refresh_token) or throws.
 */
export const loginSwadhaarLearner = async (mobile: string, tenantId?: string): Promise<any> => {
  const password = process.env.NEXT_PUBLIC_SWADHAAR_LEARNER_PASSWORD;
  if (!password) throw new Error('NEXT_PUBLIC_SWADHAAR_LEARNER_PASSWORD is not set');
  const response = await axios.post(
    `${SWADHAAR_BASE_URL}/user/v1/auth/login`,
    { username: mobile, password },
    { headers: tenantHeaders(tenantId) }
  );
  return response?.data?.result;
};

/** GET /user/v1/auth: the signed-in user's id, name and tenant data for the given token. */
export const getSwadhaarAuthUser = async (token: string, tenantId?: string): Promise<any> => {
  const response = await axios.get(`${SWADHAAR_BASE_URL}/user/v1/auth`, {
    headers: { ...tenantHeaders(tenantId), Authorization: `Bearer ${token}` },
  });
  return response?.data?.result;
};

/**
 * POST /user/v1/list filtered by mobile, called with the service token before OTP is sent. Returns true/false
 * when the service answers, and null when it could not be asked, so the caller lets the OTP step decide.
 */
export const checkSwadhaarUserExists = async (mobile: string, tenantId?: string): Promise<boolean | null> => {
  try {
    const response = await axios.post(
      `${SWADHAAR_BASE_URL}/user/v1/list`,
      { limit: 10, offset: 0, filters: { tenantId: tenantId ?? SWADHAAR_TENANT_ID, mobile }, sort: ['firstName', 'asc'] },
      { headers: await preLoginHeaders(tenantId) }
    );
    const result = response?.data?.result;
    const users = result?.getUserDetails || result?.users || result?.userData || [];
    return Array.isArray(users) && users.length > 0;
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 404) return false;
    return null;
  }
};
