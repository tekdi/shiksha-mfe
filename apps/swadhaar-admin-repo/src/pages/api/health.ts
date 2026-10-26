import type { NextApiRequest, NextApiResponse } from 'next';
import { SWADHAAR_TENANT_ID, SWADHAAR_CHANNEL_ID, SWADHAAR_FRAMEWORK } from '@/utils/app.constant';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    status: 'ok',
    service: 'swadhaar-admin-repo',
    tenant: 'Swadhaar FinAccess',
    tenantId: SWADHAAR_TENANT_ID,
    channelId: SWADHAAR_CHANNEL_ID,
    framework: SWADHAAR_FRAMEWORK,
    timestamp: new Date().toISOString(),
  });
}
