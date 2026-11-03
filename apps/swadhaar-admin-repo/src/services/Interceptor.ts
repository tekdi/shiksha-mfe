import axios from 'axios';
import TenantService from './TenantService';
import { ensureAcademicYear, getAcademicYearId } from '@/utils/API/academicYear';

const instance = axios.create();

const DEFAULT_ORG_ID = 'd36d9079-0f42-4ba3-be03-26c9e79509ee';

type RequestHeaders = Record<string, any>;

/** Sets each named header to `value` unless the caller already provided it. */
const setIfMissing = (headers: RequestHeaders, names: string[], value?: string | null) => {
  if (!value) return;
  names.forEach((name) => {
    if (!headers[name]) headers[name] = value;
  });
};

const readStored = (key: string): string | null =>
  typeof window !== 'undefined' && window.localStorage ? localStorage.getItem(key) : null;

instance.interceptors.request.use(
  async (config) => {
    if (!config.url?.includes('/academicyears/')) {
      await ensureAcademicYear();
    }

    const token = readStored('token');
    if (token && config.url && !config.url.endsWith('user/v1/auth/login') && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // The active academic year always wins over a value a caller built earlier
    config.headers.academicyearid = getAcademicYearId();

    const orgId = readStored('organisationId') || process.env.NEXT_PUBLIC_ORG_ID || DEFAULT_ORG_ID;
    setIfMissing(config.headers, ['organisationid', 'organisationId'], orgId);
    setIfMissing(config.headers, ['userId', 'userid'], readStored('userId'));

    const tenantId = TenantService.getTenantId();
    // Standard headers across Sunbird / Shiksha / Swadhaar APIs (preserve if already provided)
    if (!config.headers.tenantid && !config.headers.tenantId) {
      config.headers.tenantid = tenantId;
    }
    setIfMissing(config.headers, ['X-Tenant-Id'], tenantId);
    setIfMissing(config.headers, ['X-Channel-Id'], TenantService.getChannelId());

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
