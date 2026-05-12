import '@testing-library/jest-dom';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...rest }: any) =>
    // eslint-disable-next-line @next/next/no-img-element
    require('react').createElement('img', { src, alt, ...rest }),
}));

// Mock TenantContext
jest.mock('@learner/context/TenantContext', () => ({
  useTenant: () => ({ tenant: null, contentFilter: null }),
}));
