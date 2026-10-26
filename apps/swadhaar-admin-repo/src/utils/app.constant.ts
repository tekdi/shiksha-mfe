export const SWADHAAR_TENANT_ID = '35529b5d-526f-4da5-bc6e-64f740023d26';
export const SWADHAAR_CHANNEL_ID = 'swadhaar-channel';
export const SWADHAAR_FRAMEWORK = 'swadhaar-framework';
export const SWADHAAR_ACADEMIC_YEAR_ID = 'edf1d200-21d8-417e-b844-1d04f92435f4';

export const limit: number = 200;

export const metaTags = {
  title: 'Swadhaar Admin Portal',
  description: 'Swadhaar FinAccess Training, Content & Operations Management Portal',
};

export enum Role {
  SUPER_ADMIN = 'Super Admin',
  ADMIN = 'Admin',
  CONTENT_CREATOR = 'Content Creator',
  REVIEWER = 'Reviewer',
  REPORT_VIEWER = 'Report Viewer',
  TRAINER = 'Trainer',
  LEARNER = 'Learner',
}

export enum LifecycleState {
  DRAFT = 'Draft',
  IN_REVIEW = 'In Review',
  PUBLISHED = 'Published',
  ARCHIVED = 'Archived',
  DELETED = 'Deleted',
}

export enum TenantName {
  SWADHAAR = 'Swadhaar FinAccess',
}

export const Storage = {
  TOKEN: 'token',
  USER_ID: 'userId',
  TENANT_ID: 'tenantId',
  ADMIN_INFO: 'adminInfo',
  PREFERRED_LANGUAGE: 'preferredLanguage',
  SWADHAAR_LANGUAGE: 'swadhaarLanguage',
};
