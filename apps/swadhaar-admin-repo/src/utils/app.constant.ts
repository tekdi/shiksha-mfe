export const SWADHAAR_TENANT_ID = '35529b5d-526f-4da5-bc6e-64f740023d26';
/** Role assigned to users created from the admin portal (user/v1/create) */
export const SWADHAAR_USER_ROLE_ID = 'a0262d32-6200-4ba1-adbb-bb2883ba27a2';
export const SWADHAAR_CHANNEL_ID = 'swadhaar-channel';
export const SWADHAAR_FRAMEWORK = 'swadhaar-framework';
export const SWADHAAR_ACADEMIC_YEAR_ID = '7708b7c0-08a1-41a7-8755-a06e767b0ed6';

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
