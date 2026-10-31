export const SWADHAAR_TENANT_ID = '35529b5d-526f-4da5-bc6e-64f740023d26';
export const SWADHAAR_CHANNEL_ID = 'swadhaar-channel';
export const SWADHAAR_FRAMEWORK = 'swadhaar-framework';
export const SWADHAAR_ACADEMIC_YEAR_ID = '7708b7c0-08a1-41a7-8755-a06e767b0ed6';

export const TENANT_ID =
  (typeof window !== 'undefined' && localStorage.getItem('tenantId')) ||
  process.env.NEXT_PUBLIC_TENANT_ID ||
  SWADHAAR_TENANT_ID;

export const CHANNEL_ID =
  process.env.NEXT_PUBLIC_CHANNEL_ID || SWADHAAR_CHANNEL_ID;

export const CONTENT_FRAMEWORK =
  process.env.NEXT_PUBLIC_CONTENT_FRAMEWORK || SWADHAAR_FRAMEWORK;

export const TEMPLATE_ID: string =
  process.env.NEXT_PUBLIC_TEMPLATE_ID || 'cm7nbogii000moc3gth63l863';

export const jotFormId = process.env.NEXT_PUBLIC_JOTFORM_ID || '';
