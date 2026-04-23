import axios from 'axios';
import Cookies from 'js-cookie';
import { refresh } from './LoginService';
import TenantService from './TenantService';

const instance = axios.create({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
});

const refreshToken = async () => {
  const refresh_token = Cookies.get('refreshToken');
  if (refresh_token && refresh_token !== '') {
    try {
      const response = await refresh({ refresh_token });
      if (response) {
        const accessToken = response?.result?.access_token;
        const newRefreshToken = response?.result?.refresh_token;
        Cookies.set('token', accessToken, { expires: 7 });
        Cookies.set('refreshToken', newRefreshToken, { expires: 7 });
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
    if (typeof window !== 'undefined') {
      const token = Cookies.get('token');
      if (token && config.url && !config.url.endsWith('user/v1/auth/login')) {
        config.headers.Authorization = `Bearer ${token}`;
      }
       const academicYearId = localStorage.getItem("academicYearId");
      if (academicYearId) {
        config.headers.academicyearid = academicYearId;
      }
    }
    // Only set tenant ID on client side
    if (typeof window !== 'undefined') {
      config.headers.tenantid = TenantService.getTenantId();
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

    if (
      error?.response?.data?.responseCode === 401 &&
      !originalRequest._retry
    ) {
      if (error?.response?.request?.responseURL.includes('/auth/refresh')) {
        window.location.href = '/logout';
      } else {
        originalRequest._retry = true;
        try {
          const accessToken = await refreshToken();
          if (!accessToken) {
            window.location.href = '/logout';
          } else {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return instance(originalRequest);
          }
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
