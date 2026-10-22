'use strict';

/**
 * AETHRION server-side IP reputation check.
 * Configure IPQS_API_KEY in Vercel Project Settings -> Environment Variables.
 * Never place the provider key in browser code.
 */
module.exports = async function securityCheck(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const apiKey = process.env.IPQS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      ok: false,
      configured: false,
      blocked: false,
      code: 'VPN_CHECK_NOT_CONFIGURED'
    });
  }

  const realIp = String(req.headers['x-real-ip'] || '').trim();
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = realIp || forwarded;
  if (!ip || ip === '::1' || ip === '127.0.0.1') {
    return res.status(503).json({
      ok: false,
      configured: true,
      blocked: true,
      code: 'IP_UNAVAILABLE'
    });
  }

  try {
    const url = 'https://ipqualityscore.com/api/json/ip/' +
      encodeURIComponent(apiKey) + '/' + encodeURIComponent(ip) +
      '?strictness=1&allow_public_access_points=true';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);
    let upstream;
    try {
      upstream = await fetch(url, { method: 'GET', signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    if (!upstream.ok) {
      return res.status(503).json({
        ok: false,
        configured: true,
        blocked: true,
        code: 'REPUTATION_PROVIDER_UNAVAILABLE'
      });
    }

    const data = await upstream.json();
    if (!data || data.success !== true) {
      return res.status(503).json({
        ok: false,
        configured: true,
        blocked: true,
        code: 'REPUTATION_CHECK_FAILED'
      });
    }

    const vpn = data.vpn === true || data.active_vpn === true;
    const proxy = data.proxy === true;
    const tor = data.tor === true || data.active_tor === true;
    const blocked = vpn || proxy || tor;

    return res.status(200).json({
      ok: true,
      configured: true,
      blocked,
      reason: blocked ? 'VPN_PROXY_OR_TOR' : 'CLEAR',
      flags: { vpn, proxy, tor }
    });
  } catch (error) {
    // Fail closed once protection is configured: a failed reputation check
    // must not silently become an allow decision.
    return res.status(503).json({
      ok: false,
      configured: true,
      blocked: true,
      code: 'REPUTATION_CHECK_UNAVAILABLE'
    });
  }
};
