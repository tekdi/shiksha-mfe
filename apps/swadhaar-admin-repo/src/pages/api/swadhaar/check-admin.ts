import type { NextApiRequest, NextApiResponse } from 'next';
import { SWADHAAR_TENANT_ID } from '@/utils/app.constant';
import { getServiceToken, middlewareUrl } from '@/utils/server/swadhaarServiceAuth';

/**
 * Server-side check that a mobile number belongs to an Admin user.
 * The user list API needs a bearer token before anyone is logged in, so this route signs in with a
 * service account (SWADHAAR_SERVICE_USERNAME / SWADHAAR_SERVICE_PASSWORD, server-only env) and keeps
 * the token on the server. The browser only receives { exists }.
 */

const listAdmins = (token: string, mobile: string, tenantId: string) =>
  fetch(`${middlewareUrl()}/user/v1/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      tenantid: tenantId,
    },
    body: JSON.stringify({
      limit: 10,
      offset: 0,
      filters: { role: 'Admin', mobile },
      sort: ['firstName', 'asc'],
    }),
  });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const mobile = String(req.body?.mobile ?? '').trim();
  const tenantId = String(req.body?.tenantId || SWADHAAR_TENANT_ID);
  if (!/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ error: 'Invalid mobile number' });
  }

  try {
    let resp = await listAdmins(await getServiceToken(), mobile, tenantId);
    if (resp.status === 401) {
      resp = await listAdmins(await getServiceToken(true), mobile, tenantId);
    }
    // The user service answers 404 when no user matches the filters
    if (resp.status === 404) return res.status(200).json({ exists: false });
    if (!resp.ok) return res.status(502).json({ error: 'User lookup failed' });

    const json = await resp.json();
    const result = json?.result;
    const users = result?.getUserDetails || result?.users || result?.userData || [];
    return res.status(200).json({ exists: Array.isArray(users) && users.length > 0 });
  } catch {
    return res.status(502).json({ error: 'User lookup failed' });
  }
}
