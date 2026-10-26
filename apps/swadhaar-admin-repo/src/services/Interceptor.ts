import axios from 'axios';
import TenantService from './TenantService';
import { SWADHAAR_ACADEMIC_YEAR_ID } from '@/utils/app.constant';

const instance = axios.create();

instance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('token');
      if (token && config.url && !config.url.endsWith('user/v1/auth/login') && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const academicYearId = localStorage.getItem('academicYearId') || SWADHAAR_ACADEMIC_YEAR_ID;
      if (academicYearId && !config.headers.academicyearid) {
        config.headers.academicyearid = academicYearId;
      }
    } else if (!config.headers.academicyearid) {
      config.headers.academicyearid = SWADHAAR_ACADEMIC_YEAR_ID;
    }
    
    const tenantId = TenantService.getTenantId();
    const channelId = TenantService.getChannelId();

    // Standard headers across Sunbird / Shiksha MFE APIs (preserve if already provided)
    if (!config.headers.tenantid) {
      config.headers.tenantid = tenantId;
    }
    if (!config.headers['X-Tenant-Id']) {
      config.headers['X-Tenant-Id'] = tenantId;
    }
    if (!config.headers['X-Channel-Id']) {
      config.headers['X-Channel-Id'] = channelId;
    }

    return config;
  },
  (error) => {
    throw error;
  }
);

instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined' && !error.config?.url?.includes('aspireleaders.org')) {
      window.location.href = '/logout';
    }
    throw error;
  }
);

export default instance;
