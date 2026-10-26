import { API_ENDPOINTS } from '@/utils/API/APIEndpoints';
import { post, get } from './RestClient';
import { SWADHAAR_TENANT_ID } from '@/utils/app.constant';
import axios from 'axios';

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

/**
 * Step 1: Query user/list to verify if the user exists with role: 'Admin' in Swadhaar
 */
export const checkAdminUserExistence = async (
  mobile: string,
  tenantId: string = SWADHAAR_TENANT_ID
): Promise<any> => {
  const apiUrl = API_ENDPOINTS.adminUserList || API_ENDPOINTS.userList;
  const payload = {
    limit: 10,
    filters: {
      role: 'admin',
      tenantId: tenantId,
      mobile: mobile,
    },
    sort: ['firstName', 'asc'],
    offset: 0,
  };

  try {
    const response = await post(apiUrl, payload, {
      tenantid: tenantId,
      'X-Tenant-Id': tenantId,
    });
    return response?.data;
  } catch (error) {
    console.error('Error in checkAdminUserExistence:', error);
    throw error;
  }
};

/**
 * Step 2: Send OTP to mobile number
 */
export const sendOTP = async (
  mobile: string,
  reason: string = 'login'
): Promise<any> => {
  const apiUrl = API_ENDPOINTS.sendOTP;
  const payload = {
    mobile,
    reason,
  };

  try {
    const response = await post(apiUrl, payload, {
      tenantid: SWADHAAR_TENANT_ID,
      'X-Tenant-Id': SWADHAAR_TENANT_ID,
    });
    return response?.data;
  } catch (error) {
    console.error('Error in sendOTP:', error);
    throw error;
  }
};

/**
 * Step 3: Verify OTP with mobile, reason, otp, and hash
 */
export const verifyOTP = async ({
  mobile,
  reason = 'login',
  otp,
  hash,
}: VerifyOTPParams): Promise<any> => {
  const apiUrl = API_ENDPOINTS.verifyOTP;
  const payload = {
    mobile,
    reason,
    otp,
    hash,
  };

  try {
    const response = await post(apiUrl, payload, {
      tenantid: SWADHAAR_TENANT_ID,
      'X-Tenant-Id': SWADHAAR_TENANT_ID,
    });
    return response?.data;
  } catch (error) {
    console.error('Error in verifyOTP:', error);
    throw error;
  }
};

/**
 * Step 4: Fetch user authentication JWT claims from /user/auth
 */
export const getUserAuth = async (token: string): Promise<any> => {
  const apiUrl = API_ENDPOINTS.userAuth;
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response?.data;
  } catch (error) {
    console.error('Error in getUserAuth:', error);
    throw error;
  }
};

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
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response?.data?.result;
  } catch (error) {
    console.error('Error in getUserId:', error);
    throw error;
  }
};
