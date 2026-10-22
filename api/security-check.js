'use strict';

/**
 * AETHRION server-side IP reputation check.
 * Configure IPQS_API_KEY in Vercel Project Settings -> Environment Variables.
 * Never place the provider key in browser code or in the repository.
 */
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 1500;
const ipCache = new Map();

function reply(res, status, payload) {
  return res.status(status).json(payload);
}

module.exports = async function securityCheck(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Vary', 'x-real-ip');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return reply(res, 405, { ok: false, configured: true, blocked: true, code: 'METHOD_NOT_ALLOWED' });
  }

  const apiKey = process.env.IPQS_API_KEY;
  if (!apiKey) {
    return reply(res, 503, {
      ok: false, configured: false, blocked: true, code: 'VPN_CHECK_NOT_CONFIGURED'
    });
  }

  // Use the hosting platform's client-IP header only; do not trust arbitrary
  // client-provided x-forwarded-for values as an authoritative identity.
  const ip = String(req.headers['x-real-ip'] || '').trim();
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.indexOf(',') !== -1) {
    return reply(res, 503, { ok: false, configured: true, blocked: true, code: 'IP_UNAVAILABLE' });
  }

  const now = Date.now();
  const cached = ipCache.get(ip);
  if (cached && cached.expiresAt > now) {
    return reply(res, 200, {
      ok: true, configured: true, blocked: cached.blocked,
      reason: cached.blocked ? 'VPN_PROXY_OR_TOR' : 'CLEAR',
      flags: cached.flags, cached: true
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
      return reply(res, 503, { ok: false, configured: true, blocked: true, code: 'REPUTATION_PROVIDER_UNAVAILABLE' });
    }
    const data = await upstream.json();
    if (!data || data.success !== true) {
      return reply(res, 503, { ok: false, configured: true, blocked: true, code: 'REPUTATION_CHECK_FAILED' });
    }

    const flags = {
      vpn: data.vpn === true || data.active_vpn === true,
      proxy: data.proxy === true,
      tor: data.tor === true || data.active_tor === true
    };
    const blocked = flags.vpn || flags.proxy || flags.tor;

    if (ipCache.size >= MAX_CACHE_ENTRIES) {
      const firstKey = ipCache.keys().next().value;
      if (firstKey) ipCache.delete(firstKey);
    }
    ipCache.set(ip, { blocked, flags, expiresAt: now + CACHE_TTL_MS });

    return reply(res, 200, {
      ok: true, configured: true, blocked,
      reason: blocked ? 'VPN_PROXY_OR_TOR' : 'CLEAR',
      flags, cached: false
    });
  } catch (error) {
    return reply(res, 503, {
      ok: false, configured: true, blocked: true, code: 'REPUTATION_CHECK_UNAVAILABLE'
    });
  }
};
