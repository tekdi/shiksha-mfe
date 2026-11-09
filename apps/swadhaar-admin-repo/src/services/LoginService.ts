import { API_ENDPOINTS } from '@/utils/API/APIEndpoints';
import { post, get } from './RestClient';
import { SWADHAAR_TENANT_ID } from '@/utils/app.constant';

interface LoginParams {
  username: string;
  password?: string;
  otp?: string;
}

interface RefreshParams {
  refresh_token: string;
}

export interface VerifyOTPParams {
  mobile: string;
  reason?: string;
  otp: string;
  hash: string;
}

const OTP_REASON = 'signup';

const getStoredTenantId = (): string =>
  (typeof window !== 'undefined' && localStorage.getItem('tenantId')) || SWADHAAR_TENANT_ID;

/**
 * Step 1: Verify the mobile belongs to an Admin user of the tenant.
 * Goes through /api/swadhaar/check-admin, which calls /user/v1/list with a server-held service token.
 */
export const checkAdminUserExistence = async (
  mobile: string,
  tenantId: string = getStoredTenantId()
): Promise<boolean> => {
  const response = await fetch('/api/swadhaar/check-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, tenantId }),
  });
  if (!response.ok) {
    throw new Error('Unable to verify the account. Please try again.');
  }
  const data = await response.json();
  return Boolean(data?.exists);
};

/**
 * Step 2: Send OTP to mobile number
 */
export const sendOTP = async (
  whatsapp: string,
  reason: string = OTP_REASON
): Promise<any> => {
  const apiUrl = API_ENDPOINTS.sendOTP;
  try {
    const response = await post(apiUrl, { whatsapp, reason }, { tenantid: getStoredTenantId() });
    return response?.data;
  } catch (error) {
    console.error('Error in sendOTP:', error);
    throw error;
  }
};

export interface VerifyOTPResult {
  verified: boolean;
  access_token?: string;
  refresh_token?: string;
  /** The admin who verified the OTP (the tokens are the service account's) */
  profile?: { userId: string; firstName: string; lastName: string } | null;
  message?: string;
}

/**
 * Step 3: Verify OTP (mobile, reason, otp and the hash returned by send-otp).
 * Goes through /api/swadhaar/verify-login: verify-otp only answers { success: true }, so the server
 * issues the session tokens after a valid OTP.
 */
export const verifyOTP = async ({
  mobile,
  reason = OTP_REASON,
  otp,
  hash,
}: VerifyOTPParams): Promise<VerifyOTPResult> => {
  const response = await fetch('/api/swadhaar/verify-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, reason, otp, hash, tenantId: getStoredTenantId() }),
  });
  const data = await response.json().catch(() => ({}));
  return response.ok && data?.verified
    ? data
    : { verified: false, message: data?.message };
};

/**
 * Step 4: Fetch user authentication JWT claims from /user/auth
 */
export const getUserAuth = async (token: string): Promise<any> => {
  const apiUrl = API_ENDPOINTS.userAuth;
  try {
    const response = await get(apiUrl, {
      Authorization: `Bearer ${token}`,
    });
    return response?.data;
  } catch (error) {
    console.error('Error in getUserAuth:', error);
    throw error;
  }
};

export { syncActiveAcademicYear } from '@/utils/API/academicYear';

/**
 * Step 5: Fetch full user profile details from /user/read/{userId}?fieldvalue=true
 */
export const getUserDetails = async (
  userId: string,
  token?: string
): Promise<any> => {
  const apiUrl = API_ENDPOINTS.userRead(userId, true);
  try {
    const headers: Record<string, string> = {
      tenantid: SWADHAAR_TENANT_ID,
      'X-Tenant-Id': SWADHAAR_TENANT_ID,
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await get(apiUrl, headers);
    return response?.data;
  } catch (error) {
    console.error('Error in getUserDetails:', error);
    throw error;
  }
};

export const login = async ({
  username,
  password,
}: LoginParams): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.accountLogin;
  try {
    const response = await post(apiUrl, { username, password });
    return response?.data;
  } catch (error) {
    console.error('Error in login:', error);
    throw error;
  }
};

export const refresh = async ({
  refresh_token,
}: RefreshParams): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.authRefresh;
  try {
    const response = await post(apiUrl, { refresh_token });
    return response?.data;
  } catch (error) {
    console.error('Error in refresh:', error);
    throw error;
  }
};

export const logout = async (refreshToken: string): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.authLogout;
  try {
    const response = await post(apiUrl, { refresh_token: refreshToken });
    return response;
  } catch (error) {
    console.error('Error in logout:', error);
    throw error;
  }
};

export const getUserId = async (): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.userAuth;
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authorization token not found');
    }
    const response = await get(apiUrl, {
      Authorization: `Bearer ${token}`,
    });
    return response?.data?.result;
  } catch (error) {
    console.error('Error in getUserId:', error);
    throw error;
  }
};
