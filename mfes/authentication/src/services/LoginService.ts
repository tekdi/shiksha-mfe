import axios from 'axios';
import { post } from '@shared-lib';
import API_ENDPOINTS from '../utils/API/APIEndpoints';

interface LoginParams {
  username: string;
  password: string;
}

interface RefreshParams {
  refresh_token: string;
}

export const login = async ({
  username,
  password,
}: LoginParams): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.accountLogin

  try {
    const response = await post(apiUrl, { username, password });
    return response?.data;
  } catch (error) {
    console.error('error in login', error);
    throw error;
  }
};

export const refresh = async ({
  refresh_token,
}: RefreshParams): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.authRefresh
  try {
    const response = await post(apiUrl, { refresh_token });
    return response?.data;
  } catch (error) {
    console.error('error in login', error);
    throw error;
  }
};

export const logout = async (refreshToken: string): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.authLogout
  try {
    const response = await post(apiUrl, { refresh_token: refreshToken });
    return response;
  } catch (error) {
    console.error('error in logout', error);
    throw error;
  }
};

export const resetPassword = async (
  newPassword: any): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.resetPassword
  try {
    const response = await post(apiUrl, { newPassword });
    return response?.data;
  } catch (error) {
    console.error('error in reset', error);
    throw error;
  }
};

export const forgotPasswordAPI = async (
  newPassword: any  , token: any): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.forgotPassword
  try {
    const response = await post(apiUrl, { newPassword, token });
    return response?.data;
  } catch (error) {
    console.error('error in reset', error);
    throw error;
  }
};


export const resetPasswordLink = async (
  username: any , ): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.passwordResetLink
  try {
    let redirectUrl = process.env.NEXT_PUBLIC_FRONTEND_BASE_URL  || ''
    if(redirectUrl === ''  && typeof window !== 'undefined' ){
      redirectUrl = window.location.origin
    }
    const response = await post(apiUrl, { username  , redirectUrl});
    return response?.data;
  } catch (error) {
    console.error('error in reset', error);
    throw error;
  }
};

export const getUserId = async (): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.userAuth;

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No token found in localStorage');
      throw new Error('Authorization token not found');
    }

    console.log('🔍 Calling getUserId API:', apiUrl);
    console.log('🔑 Using token:', token.substring(0, 20) + '...');

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ getUserId API success:', response?.data);
    return response?.data?.result;
  } catch (error: any) {
    console.error('❌ Error in fetching user details:', {
      url: apiUrl,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message
    });
    throw error;
  }
};
