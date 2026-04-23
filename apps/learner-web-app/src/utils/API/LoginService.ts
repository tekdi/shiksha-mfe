/* eslint-disable @typescript-eslint/no-inferrable-types */
// import { get, post } from "./RestClient";
import axios from 'axios';
import { post } from './RestClient';
import { API_ENDPOINTS } from './EndUrls';

interface LoginParams {
  username: string;
  password: string;
}

interface RefreshParams {
  refresh_token: string;
}

interface VerifyLinkParams {
  username: string;
  magicCode: string;
}

export const login = async ({
  username,
  password,
}: LoginParams): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.accountLogin;

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
  const apiUrl: string = API_ENDPOINTS.authRefresh;
  try {
    const response = await post(apiUrl, { refresh_token });
    return response?.data;
  } catch (error) {
    console.error('error in login', error);
    throw error;
  }
};
export const logout = async (refreshToken: string): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.authLogout;
  try {
    const response = await post(apiUrl, { refresh_token: refreshToken });
    return response;
  } catch (error) {
    console.error('error in logout', error);
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

    if (error?.response?.status === 401) {
      // Clear all localStorage data
      localStorage.clear();
      // Clear sessionStorage as well
      sessionStorage.clear();
      // Clear all cookies
      document.cookie.split(";").forEach(function (c) {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(
            /=.*/,
            "=;expires=" + new Date().toUTCString() + ";path=/"
          );
      });
      // Force redirect to login page
      window.location.replace('/login');
      // Return null to prevent further execution
      return null;
    }
    
    console.error('Error in fetching user details', error);
    throw error;
  }
};
export const resetPassword = async (newPassword: any): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.resetPassword;
  try {
    const response = await post(apiUrl, { newPassword });
    return response?.data;
  } catch (error) {
    console.error('error in reset', error);
    throw error;
  }
};

export const verifyMagicLink = async ({
  username,
  magicCode,
}: VerifyLinkParams): Promise<any> => {
  // Construct the URL with magic code and redirect parameter
  const redirectUrl = encodeURIComponent(`${process.env.NEXT_PORTAL_URL}/dashboard`);
  const apiUrl: string = `${API_ENDPOINTS.verifyMagicLink}/${magicCode}?redirect=${redirectUrl}`;
  
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });
    return response?.data;
  } catch (error) {
    console.error('error in verify magic link', error);
    throw error;
  }
};
