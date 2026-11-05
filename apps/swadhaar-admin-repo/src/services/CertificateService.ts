import { API_ENDPOINTS } from '@/utils/API/APIEndpoints';
import { post } from './RestClient';
import { getServiceHeaders } from '@/utils/API/serviceHeaders';

/* =========================================================================
 * TypeScript Interfaces for Certificate Service
 * ========================================================================= */

export interface IssueCertificatePayload {
  issuanceDate: string;
  expirationDate?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  userId: string;
  courseId: string;
  courseName: string;
}

export interface IssueCertificateResponse {
  id: string;
  ver: string;
  ts: string;
  params: {
    resmsgid: string;
    status: string;
    err: string | null;
    errmsg: string | null;
    successmessage?: string;
  };
  responseCode: number;
  result: {
    credential: {
      id: string;
      type: string[];
      proof?: any;
      issuer: string;
      issuanceDate: string;
      expirationDate?: string;
      credentialSubject: {
        id: string;
        type: string;
        userId: string;
        courseId: string;
        issuedOn?: string;
        lastName: string;
        firstName: string;
        courseName: string;
        middleName?: string;
        certificateId?: string;
      };
      [key: string]: any;
    };
    credentialSchemaId?: string;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: any;
  };
}

export interface GenerateDidResponse {
  id: string;
  ver: string;
  ts: string;
  params: {
    resmsgid: string;
    status: string;
    err: string | null;
    errmsg: string | null;
    successmessage?: string;
  };
  responseCode: number;
  result: Array<{
    '@context': string[];
    id: string;
    alsoKnownAs: string[];
    service: any[];
    verificationMethod: any[];
    authentication: string[];
    assertionMethod: string[];
    [key: string]: any;
  }>;
}

export interface CredentialSchemaPayload {
  schema: {
    type: string;
    version: string;
    name: string;
    author: string;
    authored: string;
    schema: Record<string, any>;
    tags?: string[];
    status?: string;
  };
}

export interface DidGeneratePayload {
  content: Array<{
    alsoKnownAs: string[];
    services: any[];
    method: 'rcw' | (string & {});
  }>;
}

/* =========================================================================
 * Certificate Service Implementation
 * ========================================================================= */

export interface CertificateTemplate {
  templateId: string;
  title: string;
}

/**
 * List the certificate templates available to the tenant
 * POST /lms-service/v1/certificate/templates-list
 */
export const getCertificateTemplates = async (): Promise<CertificateTemplate[]> => {
  const response = await post<any>(
    API_ENDPOINTS.certificateTemplatesList,
    { templateType: 'certificate', isAllocated: false, limit: 100, offset: 0 },
    getServiceHeaders()
  );
  const list: any[] = response?.data?.result?.templates || [];
  return list
    .filter((t) => t?.templateId)
    .map((t) => ({ templateId: t.templateId, title: t.title || t.templateId }));
};

/**
 * Attach a certificate template to courses
 * POST /lms-service/v1/certificate/course-template
 */
export const attachCourseTemplate = async (templateId: string, courseIds: string[]): Promise<void> => {
  if (!templateId || courseIds.length === 0) return;
  await post<any>(
    API_ENDPOINTS.certificateCourseTemplate,
    { templateId: [templateId], contextId: courseIds },
    getServiceHeaders()
  );
};

export const CertificateService = {
  /**
   * Issue a verifiable completion certificate
   * POST /importuserspecific/certificate/issue
   */
  issueCertificate: async (
    payload: IssueCertificatePayload,
    customHeaders?: Record<string, string>
  ): Promise<IssueCertificateResponse> => {
    try {
      const url = API_ENDPOINTS.issueCertificate;
      const headers = getServiceHeaders(customHeaders);
      const response = await post<IssueCertificatePayload>(url, payload, headers);
      return response?.data;
    } catch (error) {
      console.error('Error in CertificateService.issueCertificate:', error);
      throw error;
    }
  },

  /**
   * Generate DID for a specific user
   * POST /importuserspecific/certificate/generateDid
   */
  generateDid: async (
    userId: string,
    customHeaders?: Record<string, string>
  ): Promise<GenerateDidResponse> => {
    try {
      const url = API_ENDPOINTS.generateDid;
      const headers = getServiceHeaders(customHeaders);
      const response = await post<{ userId: string }>(url, { userId }, headers);
      return response?.data;
    } catch (error) {
      console.error('Error in CertificateService.generateDid:', error);
      throw error;
    }
  },

  /**
   * Create verifiable credential schema
   * POST /credential-schema
   */
  createSchema: async (
    payload: CredentialSchemaPayload,
    customHeaders?: Record<string, string>
  ): Promise<any> => {
    try {
      const url = API_ENDPOINTS.credentialSchema;
      const headers = getServiceHeaders(customHeaders);
      const response = await post<CredentialSchemaPayload>(url, payload, headers);
      return response?.data;
    } catch (error) {
      console.error('Error in CertificateService.createSchema:', error);
      throw error;
    }
  },

  /**
   * Direct DID generation
   * POST /did/generate
   */
  generateDirectDid: async (
    payload: DidGeneratePayload,
    customHeaders?: Record<string, string>
  ): Promise<any> => {
    try {
      const url = API_ENDPOINTS.didGenerate;
      const headers = getServiceHeaders(customHeaders);
      const response = await post<DidGeneratePayload>(url, payload, headers);
      return response?.data;
    } catch (error) {
      console.error('Error in CertificateService.generateDirectDid:', error);
      throw error;
    }
  },

  /**
   * Check learner course completion status for certificate eligibility
   * POST /tracking/user_certificate/user_course_status
   */
  getUserCourseStatus: async (
    payload: { userId: string; courseId: string },
    customHeaders?: Record<string, string>
  ): Promise<any> => {
    try {
      const url = API_ENDPOINTS.courseStatus;
      const headers = getServiceHeaders(customHeaders);
      const response = await post(url, payload, headers);
      return response?.data;
    } catch (error) {
      console.error('Error in CertificateService.getUserCourseStatus:', error);
      throw error;
    }
  },

  /**
   * Search course-wise learner certification status
   * POST /tracking/user_certificate/status/search
   */
  searchCourseLearnerStatus: async (
    payload: any,
    customHeaders?: Record<string, string>
  ): Promise<any> => {
    try {
      const url = API_ENDPOINTS.courseWiseLernerList;
      const headers = getServiceHeaders(customHeaders);
      const response = await post(url, payload, headers);
      return response?.data;
    } catch (error) {
      console.error('Error in CertificateService.searchCourseLearnerStatus:', error);
      throw error;
    }
  },

  /**
   * Render or download certificate
   * POST /tracking/certificate/render
   */
  renderCertificate: async (
    certificateId: string,
    customHeaders?: Record<string, string>
  ): Promise<any> => {
    try {
      const url = API_ENDPOINTS.renderCertificate;
      const headers = getServiceHeaders(customHeaders);
      const response = await post(url, { certificateId }, headers);
      return response?.data;
    } catch (error) {
      console.error('Error in CertificateService.renderCertificate:', error);
      throw error;
    }
  },
};

export default CertificateService;
