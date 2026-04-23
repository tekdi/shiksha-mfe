/* eslint-disable @nx/enforce-module-boundaries */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getCookie } from '@workspace/utils/cookieHelper';
import Cookies from 'js-cookie';

// Mock data
export const mockData: Record<string, any> = {
  '94f936dc-7fce-4b92-9a9b-0ebb3076793f': {
    CHANNEL_ID: 'Colab-channel',
    CONTENT_FRAMEWORK: 'Colab-framework',
    COLLECTION_FRAMEWORK: 'Colab-framework',
    LOGO_CONFIG: {
      sidebar: '/tenants/colab-logo.png',
      login: '/tenants/colab-logo.png',
      favicon: '/tenants/colab-favicon.ico',
      alt: 'Colab Logo'
    }
  },

  '6c386899-7a00-4733-8447-5ef925bbf700': {
    CHANNEL_ID: 'KEF-channel',
    CONTENT_FRAMEWORK: 'KEF-framework',
    COLLECTION_FRAMEWORK: 'KEF-framework',
    LOGO_CONFIG: {
      sidebar: '/tenants/kef-logo.png',
      login: '/tenants/kef-logo.png',
      favicon: '/tenants/kef-favicon.ico',
      alt: 'KEF Logo'
    }
  },
  '3a849655-30f6-4c2b-8707-315f1ed64fbd': {
    CHANNEL_ID: 'atree-channel',
    CONTENT_FRAMEWORK: 'atree-framework',
    COLLECTION_FRAMEWORK: 'atree-framework',
    LOGO_CONFIG: {
      sidebar: '/tenants/atree-logo.png',
      login: '/tenants/atree-logo.png',
      favicon: '/tenants/atree-favicon.ico',
      alt: 'ATREE Logo'
    }
  },
  'ebae40d1-b78a-4f73-8756-df5e4b060436': {
    CHANNEL_ID: 'shikshalokam-channel',
    CONTENT_FRAMEWORK: 'shikshalokam-framework',
    COLLECTION_FRAMEWORK: 'shikshalokam-framework',
    LOGO_CONFIG: {
      sidebar: '/tenants/shikshalokam-logo.png',
      login: '/tenants/shikshalokam-logo.png',
      favicon: '/tenants/shikshalokam-favicon.ico',
      alt: 'Shikshalokam Logo'
    }
  },
  '35529b5d-526f-4da5-bc6e-64f740023d26': {
    CHANNEL_ID: 'swadhaar-channel',
    CONTENT_FRAMEWORK: 'swadhaar-framework',
    COLLECTION_FRAMEWORK: 'swadhaar-framework',
    academicYearId:'edf1d200-21d8-417e-b844-1d04f92435f4',
    LOGO_CONFIG: {
      sidebar: '/tenants/swadhaar-logo.png',
      login: '/tenants/swadhaar-logo.png',
      favicon: '/tenants/swadhaar-favicon.ico',
      alt: 'Swadhaar Logo'
    }
  },
  '8cf74da8-392d-4d02-8ac3-ae2204e34c0a': {
    CHANNEL_ID: 'oblf-channel',
    CONTENT_FRAMEWORK: 'oblf-framework',
    COLLECTION_FRAMEWORK: 'oblf-framework',
    academicYearId:'86137077-6c90-477f-b4b1-0804c3878cf0',
    LOGO_CONFIG: {
      sidebar: '/tenants/oblf-logo.png',
      login: '/tenants/oblf-logo.png',
      favicon: '/tenants/oblf-favicon.ico',
      alt: 'OBLF Logo'
    }
  },
  'e2a27046-16c2-4e8b-a493-1d2bc11d290c': {
    CHANNEL_ID: 'shikshagraha-channel',
    CONTENT_FRAMEWORK: 'shikshagraha-framework',
    COLLECTION_FRAMEWORK: 'shikshagraha-framework',
    LOGO_CONFIG: {
      sidebar: '/tenants/shikshagraha-logo.png',
      login: '/tenants/shikshagraha-logo.png',
      favicon: '/tenants/shikshagraha-favicon.ico',
      alt: 'Shikshagraha Logo'
    }
  },
  '87f15a01-7a03-4ff3-9943-20f5875b4791': {
    CHANNEL_ID: 'badal',
    CONTENT_FRAMEWORK: 'badal-framework',
    COLLECTION_FRAMEWORK: 'badal-framework',
    LOGO_CONFIG: {
      sidebar: '/tenants/badal-logo.png',
      login: '/tenants/badal-logo.png',
      favicon: '/tenants/badal-favicon.ico',
      alt: 'Badal Logo'
    }
  },
    '49db8074-ec4a-4d36-a542-8365a815c288':{
     CHANNEL_ID: 'shikshagrahanew-channel',
    CONTENT_FRAMEWORK: 'shikshagrahanew-framework',
    COLLECTION_FRAMEWORK: 'shikshagrahanew-framework',
    LOGO_CONFIG: {
      sidebar: '/tenants/shikshagrahanew-logo.png',
      login: '/tenants/shikshagrahanew-logo.png',
      favicon: '/tenants/shikshagrahanew-favicon.ico',
      alt: 'Shikshagraha New Logo'
    }
  },
  '6ee099fa-6875-4acf-b271-04f72ef4d7ab':{
    CHANNEL_ID: 'kenya-channel',
    CONTENT_FRAMEWORK: 'kenya-framework',
    COLLECTION_FRAMEWORK: 'kenya-framework',
    LOGO_CONFIG: {
      sidebar: '/tenants/tekdi-logo.png',
      login: '/tenants/tekdi-logo.png',
      favicon: '/tenants/kenya-favicon.ico',
      alt: 'Kenya Logo'
    }
  },
  '4366ab31-d3b2-44b3-9eb3-52c043127756':{
    CHANNEL_ID: 'agrinettest-channel',
    CONTENT_FRAMEWORK: 'agrinettest-framework',
    COLLECTION_FRAMEWORK: 'agrinettest-framework',
    LOGO_CONFIG: {
      sidebar: '/tenants/tekdi-logo.png',
      login: '/tenants/tekdi-logo.png',
      favicon: '/tenants/kenya-favicon.ico',
      alt: 'Kenya Logo'
    }
  },
  '06c00145-1fd1-4932-8b61-fd7ddcfbc3c6':{
    CHANNEL_ID: 'krdpr-channel',
    CONTENT_FRAMEWORK: 'krdpr-framework',
    COLLECTION_FRAMEWORK: 'krdpr-framework',
    academicYearId:'fcad7d6e-8fc5-4121-bff6-e423e23e0525',
    LOGO_CONFIG: {
      sidebar: '/tenants/tekdi-logo.png',
      login: '/tenants/tekdi-logo.png',
      favicon: '/tenants/kenya-favicon.ico',
      alt: 'Kenya Logo'
    }
  },
};



export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Try to get tenant ID from multiple sources
  const queryTenantId = req.query.tenantId as string;
  const cookieTenantId = getCookie(req, 'tenantId');
  const headerTenantId = req.headers['tenantid'] as string;
  const envTenantId =
    typeof window !== 'undefined'
      ? Cookies.get('tenantId') || localStorage.getItem('tenantId')
      : null;

  // Use the first available tenant ID
  const tenantId =
    queryTenantId ||
    cookieTenantId ||
    headerTenantId ||
    envTenantId ||
    '6c386899-7a00-4733-8447-5ef925bbf700';

  console.log('Tenant ID sources:', {
    query: queryTenantId,
    cookie: cookieTenantId,
    header: headerTenantId,
    env: envTenantId,
    final: tenantId,
  });

  if (!tenantId) {
    return res.status(400).json({ error: 'Invalid or missing tenantId' });
  }

  const config = mockData[tenantId];

  if (!config) {
    console.log('Available tenant IDs:', Object.keys(mockData));
    return res.status(404).json({
      error: 'Tenant not found',
      requestedTenantId: tenantId,
      availableTenantIds: Object.keys(mockData),
    });
  }

  return res.status(200).json(config);
}
