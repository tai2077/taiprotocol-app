import fs from 'fs';
import path from 'path';

const cwd = process.cwd();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(filePath) {
  return fs.readFileSync(path.join(cwd, filePath), 'utf8');
}

function ensureHttpsUrl(url, fieldName) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${fieldName} is not a valid URL: ${url}`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`${fieldName} must use https: ${url}`);
  }
}

function walkFiles(rootPath, extensions, out = []) {
  const stat = fs.statSync(rootPath);
  if (stat.isFile()) {
    if (extensions.some((ext) => rootPath.endsWith(ext))) out.push(rootPath);
    return out;
  }
  for (const entry of fs.readdirSync(rootPath)) {
    const full = path.join(rootPath, entry);
    const nextStat = fs.statSync(full);
    if (nextStat.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist' || entry.startsWith('.')) continue;
      walkFiles(full, extensions, out);
    } else if (extensions.some((ext) => full.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

const indexHtml = read('index.html');
assert(indexHtml.includes('Content-Security-Policy'), 'index.html missing Content-Security-Policy meta');

const manifestRaw = read('public/tonconnect-manifest.json');
const manifest = JSON.parse(manifestRaw);

assert(Boolean(manifest.url), 'tonconnect-manifest.json missing "url"');
assert(Boolean(manifest.iconUrl), 'tonconnect-manifest.json missing "iconUrl"');
assert(Boolean(manifest.termsOfUseUrl), 'tonconnect-manifest.json missing "termsOfUseUrl"');
assert(Boolean(manifest.privacyPolicyUrl), 'tonconnect-manifest.json missing "privacyPolicyUrl"');

ensureHttpsUrl(manifest.url, 'manifest.url');
ensureHttpsUrl(manifest.iconUrl, 'manifest.iconUrl');
ensureHttpsUrl(manifest.termsOfUseUrl, 'manifest.termsOfUseUrl');
ensureHttpsUrl(manifest.privacyPolicyUrl, 'manifest.privacyPolicyUrl');

const sourceRoots = ['App.tsx', 'index.tsx', 'components', 'screens', 'lib'];
const sources = sourceRoots
  .map((entry) => path.join(cwd, entry))
  .filter((entry) => fs.existsSync(entry))
  .flatMap((entry) => walkFiles(entry, ['.ts', '.tsx']));
const legacyBotRefs = [];
for (const file of sources) {
  const content = fs.readFileSync(file, 'utf8');
  if (/taitoken_bot/i.test(content)) {
    legacyBotRefs.push(path.relative(cwd, file));
  }
}
assert(legacyBotRefs.length === 0, `legacy invite bot link found in:\n- ${legacyBotRefs.join('\n- ')}`);

const invitePatterns = [
  'https://mini.tai.lat/sale?ref=',
  'https://app.tai.lat/sale?ref=',
];
let hasMiniAppInvite = false;
for (const file of sources) {
  const content = fs.readFileSync(file, 'utf8');
  if (invitePatterns.some((pattern) => content.includes(pattern))) {
    hasMiniAppInvite = true;
    break;
  }
}
assert(hasMiniAppInvite, 'No Mini App invite link pattern found in source code');

console.log('Standards check passed');
