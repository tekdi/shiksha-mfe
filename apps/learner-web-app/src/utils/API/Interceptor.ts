import axios from 'axios';
import { refresh } from './LoginService';
import { tenantId } from 'apps/learner-web-app/app.config';

const instance = axios.create();

const refreshToken = async () => {
  if (typeof window === 'undefined') return;
  const refresh_token = localStorage.getItem('refreshToken');
  if (refresh_token !== '' && refresh_token !== null) {
    try {
      const response = await refresh({ refresh_token });
      if (response) {
        const accessToken = response?.result?.access_token;
        const newRefreshToken = response?.result?.refresh_token;
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        return accessToken;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }
};

instance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('token');
      if (token && config.url && !config.url.endsWith('user/v1/auth/login')) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const academicYearId = localStorage.getItem('academicYearId');
      if (academicYearId) {
        config.headers.academicyearid = academicYearId;
      }
    }
    // Get tenantId from localStorage
    // Priority: domainTenantId (set when tenant is loaded based on domain) > tenantId > config tenantId
    let domainTenantId: string | null = null;
    let tenantIdFromStorage: string | null = null;

    if (typeof window !== 'undefined') {
      domainTenantId = localStorage.getItem('domainTenantId');
      tenantIdFromStorage = localStorage.getItem('tenantId');
    }

    if (domainTenantId) {
      // Use domainTenantId (set when tenant is loaded based on domain) - this is the correct tenant for the current domain
      config.headers.tenantId = domainTenantId;
      config.headers.tenantid = domainTenantId; // Also set lowercase version
    } else if (tenantIdFromStorage) {
      config.headers.tenantId = tenantIdFromStorage;
      config.headers.tenantid = tenantIdFromStorage; // Also set lowercase version
    } else {
      // Fallback to config tenantId if localStorage doesn't have it
      config.headers.tenantId = tenantId;
      config.headers.tenantid = tenantId; // Also set lowercase version
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log 401 errors for debugging
    if (error?.response?.status === 401) {

    }

    if (
      (error?.response?.status === 401 || error?.response?.data?.responseCode === 401) &&
      !originalRequest._retry
    ) {
      // Don't try to refresh token for /user/auth endpoint - let getUserId handle it
      if (error?.response?.request?.responseURL.includes('/user/auth')) {
        return Promise.reject(error);
      }

      if (error?.response?.request?.responseURL.includes('/auth/refresh')) {
        window.location.href = '/logout';
      } else {
        originalRequest._retry = true;
        try {
          const accessToken = await refreshToken();
          if (!accessToken) {
            window.location.href = '/logout';
            return Promise.reject(error);
          } else {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return instance(originalRequest);
          }
        } catch (refreshError) {
          window.location.href = '/logout';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
