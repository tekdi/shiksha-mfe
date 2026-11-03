import type { NextApiRequest, NextApiResponse } from 'next';
import { SWADHAAR_TENANT_ID } from '@/utils/app.constant';
import { loginServiceAccount, middlewareUrl } from '@/utils/server/swadhaarServiceAuth';

/**
 * Verifies the OTP with /user/v1/verify-otp (which only answers { success: true }) and, only when it
 * is valid, issues the session tokens from the Swadhaar service account login.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mobile, otp, hash } = req.body || {};
  const reason = String(req.body?.reason || 'signup');
  const tenantId = String(req.body?.tenantId || SWADHAAR_TENANT_ID);
  if (!/^\d{10}$/.test(String(mobile ?? '')) || !/^\d{4,8}$/.test(String(otp ?? '')) || !hash) {
    return res.status(400).json({ verified: false, message: 'Invalid request' });
  }

  try {
    const verifyResp = await fetch(`${middlewareUrl()}/user/v1/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', tenantid: tenantId },
      body: JSON.stringify({ mobile, reason, otp, hash }),
    });
    const verifyJson = await verifyResp.json().catch(() => ({}));
    if (!verifyResp.ok || verifyJson?.result?.success !== true) {
      return res.status(401).json({
        verified: false,
        message: verifyJson?.params?.errmsg || 'Invalid or expired OTP',
      });
    }

    const session = await loginServiceAccount();
    return res.status(200).json({
      verified: true,
      access_token: session.access_token,
      refresh_token: session.refresh_token || '',
    });
  } catch {
    return res.status(502).json({ verified: false, message: 'Unable to verify the OTP. Please try again.' });
  }
}
