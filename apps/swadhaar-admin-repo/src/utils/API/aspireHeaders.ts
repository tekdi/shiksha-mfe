const isAspireIssuedToken = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const decoded = JSON.parse(window.atob(parts[1]));
    return Boolean(decoded?.iss?.includes('aspireleaders.org'));
  } catch {
    // Not a decodable JWT
    return false;
  }
};

const resolveAspireToken = (): string => {
  const envToken = process.env.NEXT_PUBLIC_ASPIRE_BEARER_TOKEN || '';
  if (typeof window === 'undefined') return envToken;

  const customAspireToken = localStorage.getItem('aspireToken');
  if (customAspireToken) return customAspireToken;

  const storedToken = localStorage.getItem('token');
  return storedToken && isAspireIssuedToken(storedToken) ? storedToken : envToken;
};

const toBearerHeader = (token: string): string => {
  if (!token) return '';
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
};

export const getAspireHeaders = (customHeaders: Record<string, string> = {}): Record<string, string> => ({
  academicyearid: process.env.NEXT_PUBLIC_ACADEMIC_YEAR_ID || '9a9e0daa-50dd-4d0e-8d10-36e7bc808f88',
  tenantid: process.env.NEXT_PUBLIC_TENANT_ID || 'ef99949b-7f3a-4a5f-806a-e67e683e38f3',
  organisationid: process.env.NEXT_PUBLIC_ORG_ID || 'd36d9079-0f42-4ba3-be03-26c9e79509ee',
  Authorization: toBearerHeader(resolveAspireToken()),
  accept: 'application/json, text/plain, */*',
  'content-type': 'application/json',
  ...customHeaders,
});
