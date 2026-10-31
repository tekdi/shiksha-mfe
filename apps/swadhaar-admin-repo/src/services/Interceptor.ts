import axios from 'axios';
import TenantService from './TenantService';
import { ensureAcademicYear, getAcademicYearId } from '@/utils/API/academicYear';

const instance = axios.create();

instance.interceptors.request.use(
  async (config) => {
    if (!config.url?.includes('/academicyears/')) {
      await ensureAcademicYear();
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('token');
      if (token && config.url && !config.url.endsWith('user/v1/auth/login') && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // The active academic year always wins over a value a caller built earlier
      config.headers.academicyearid = getAcademicYearId();

      const storedOrgId = localStorage.getItem('organisationId') || process.env.NEXT_PUBLIC_ORG_ID || 'd36d9079-0f42-4ba3-be03-26c9e79509ee';
      if (storedOrgId) {
        if (!config.headers.organisationid) {
          config.headers.organisationid = storedOrgId;
        }
        if (!config.headers.organisationId) {
          config.headers.organisationId = storedOrgId;
        }
      }

      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        if (!config.headers.userId) {
          config.headers.userId = storedUserId;
        }
        if (!config.headers.userid) {
          config.headers.userid = storedUserId;
        }
      }
    } else {
      config.headers.academicyearid = getAcademicYearId();
      const defaultOrgId = process.env.NEXT_PUBLIC_ORG_ID || 'd36d9079-0f42-4ba3-be03-26c9e79509ee';
      if (!config.headers.organisationid) {
        config.headers.organisationid = defaultOrgId;
      }
      if (!config.headers.organisationId) {
        config.headers.organisationId = defaultOrgId;
      }
    }

    const tenantId = TenantService.getTenantId();
    const channelId = TenantService.getChannelId();

    // Standard headers across Sunbird / Shiksha / Swadhaar APIs (preserve if already provided)
    if (!config.headers.tenantid && !config.headers.tenantId) {
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
    const url = error.config?.url || '';
    // Do NOT redirect to /logout on 401, to allow page rendering without kicking the user out
    if (error?.response?.status === 401) {
      console.warn('401 Unauthorized encountered for:', url);
      // Suppress forced logout to allow page rendering without kicking user out
    }
    throw error;
  }
);

export default instance;
