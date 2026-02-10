import fs from 'fs';
import path from 'path';

const cwd = process.cwd();
const skipApi = process.argv.includes('--skip-api');
const SAMPLE_ADDRESS = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
const REQUEST_TIMEOUT_MS = 12_000;

function parseEnv(content) {
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        if (index === -1) return [line, ''];
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeBase(base) {
  return String(base || '').replace(/\/+$/, '');
}

function buildUrl(base, endpointPath) {
  const cleanBase = normalizeBase(base);
  const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  if (cleanBase.endsWith('/api') && cleanPath.startsWith('/api/')) {
    return `${cleanBase}${cleanPath.slice(4)}`;
  }
  return `${cleanBase}${cleanPath}`;
}

async function fetchWithTimeout(url, init = {}) {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function assertAnyStatus(urls, statuses, label, init = {}, bodyCheck) {
  const errors = [];
  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(url, init);
      const body = await res.text();
      if (statuses.includes(res.status)) {
        if (!bodyCheck || bodyCheck(body)) return;
      }
      errors.push(`${url} -> ${res.status}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${url} -> ${message}`);
    }
  }
  throw new Error(`${label} failed. Tried: ${errors.join('; ')}`);
}

function collectUrls(manifest) {
  return [
    manifest.url,
    manifest.termsOfUseUrl,
    manifest.privacyPolicyUrl,
    manifest.iconUrl,
  ].filter(Boolean);
}

async function main() {
  const envPath = path.join(cwd, '.env.local');
  assert(fs.existsSync(envPath), '.env.local missing');

  const env = parseEnv(fs.readFileSync(envPath, 'utf8'));
  assert(Boolean(env.VITE_API_BASE), 'VITE_API_BASE missing in .env.local');

  const manifestPath = path.join(cwd, 'public', 'tonconnect-manifest.json');
  assert(fs.existsSync(manifestPath), 'public/tonconnect-manifest.json missing');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(Boolean(manifest.url), 'manifest.url missing');
  assert(Boolean(manifest.name), 'manifest.name missing');
  assert(Boolean(manifest.termsOfUseUrl), 'manifest.termsOfUseUrl missing');
  assert(Boolean(manifest.privacyPolicyUrl), 'manifest.privacyPolicyUrl missing');
  assert(Boolean(manifest.iconUrl), 'manifest.iconUrl missing');

  const manifestUrls = collectUrls(manifest);
  for (const rawUrl of manifestUrls) {
    const url = new URL(rawUrl);
    assert(['https:', 'http:'].includes(url.protocol), `Invalid manifest URL protocol: ${rawUrl}`);
  }

  const distIndex = path.join(cwd, 'dist', 'index.html');
  if (fs.existsSync(path.join(cwd, 'dist'))) {
    assert(fs.existsSync(distIndex), 'dist/index.html missing after build');
  }

  if (!skipApi) {
    const base = normalizeBase(env.VITE_API_BASE);
    const baseCandidates = Array.from(
      new Set([
        base,
        base.endsWith('/api') ? base : `${base}/api`,
        base.endsWith('/api') ? base.slice(0, -4) : base,
      ])
    );
    const paths = (endpointPath) => baseCandidates.map((item) => buildUrl(item, endpointPath));

    for (const url of manifestUrls) {
      await assertAnyStatus([url], [200], `Manifest URL check: ${url}`, { method: 'GET' });
    }

    await assertAnyStatus(paths('/price').concat(paths('/api/price')), [200], 'Price API check');
    await assertAnyStatus(paths('/api/sale-v2/recent-purchases'), [200], 'SaleV2 recent purchases check');
    await assertAnyStatus(paths('/api/sale-v2/invite/leaderboard'), [200], 'SaleV2 leaderboard check');
    await assertAnyStatus(paths(`/api/sale-v2/claimable/${SAMPLE_ADDRESS}`), [200], 'SaleV2 claimable check');
    await assertAnyStatus(paths(`/api/users/${SAMPLE_ADDRESS}/portfolio`), [200], 'Portfolio check');
    await assertAnyStatus(paths(`/api/deposit/goals/${SAMPLE_ADDRESS}`), [200], 'Deposit goals check');

    await assertAnyStatus(
      paths('/api/sale-v2/claim-task-reward'),
      [401],
      'SaleV2 claim auth check',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: SAMPLE_ADDRESS }),
      },
      (body) => body.includes('TON_PROOF_REQUIRED')
    );

    await assertAnyStatus(
      paths('/api/marketing/claim'),
      [401],
      'Marketing claim auth check',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: SAMPLE_ADDRESS }),
      }
    );
  }

  console.log('Smoke check passed');
}

main().catch((error) => {
  console.error(`Smoke check failed: ${error.message}`);
  process.exit(1);
});
