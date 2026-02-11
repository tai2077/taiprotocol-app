import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const cwd = process.cwd();
const distAssets = path.join(cwd, 'dist', 'assets');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function toKb(bytes) {
  return bytes / 1024;
}

function readGzipBytes(filePath) {
  const content = fs.readFileSync(filePath);
  return zlib.gzipSync(content).length;
}

function envKb(name, fallback) {
  const parsed = Number(process.env[name] || '');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

assert(fs.existsSync(distAssets), 'dist/assets not found. Run build first.');

const files = fs.readdirSync(distAssets);
const jsFiles = files.filter((f) => f.endsWith('.js'));
const cssFiles = files.filter((f) => f.endsWith('.css'));
const indexJs = jsFiles.find((f) => /^index-[^.]+\.js$/.test(f));
const indexCss = cssFiles.find((f) => /^index-[^.]+\.css$/.test(f));

assert(indexJs, 'Main index JS chunk not found in dist/assets');
assert(indexCss, 'Main index CSS chunk not found in dist/assets');

const indexJsGzipKb = toKb(readGzipBytes(path.join(distAssets, indexJs)));
const indexCssGzipKb = toKb(readGzipBytes(path.join(distAssets, indexCss)));
const totalJsGzipKb = jsFiles.reduce((sum, file) => sum + toKb(readGzipBytes(path.join(distAssets, file))), 0);

const INDEX_JS_GZIP_MAX_KB = envKb('BUNDLE_INDEX_GZIP_MAX_KB', 80);
const INDEX_CSS_GZIP_MAX_KB = envKb('BUNDLE_INDEX_CSS_GZIP_MAX_KB', 12);
const TOTAL_JS_GZIP_MAX_KB = envKb('BUNDLE_TOTAL_JS_GZIP_MAX_KB', 340);

const failures = [];

if (indexJsGzipKb > INDEX_JS_GZIP_MAX_KB) {
  failures.push(`index js gzip ${indexJsGzipKb.toFixed(2)}KB > ${INDEX_JS_GZIP_MAX_KB}KB`);
}
if (indexCssGzipKb > INDEX_CSS_GZIP_MAX_KB) {
  failures.push(`index css gzip ${indexCssGzipKb.toFixed(2)}KB > ${INDEX_CSS_GZIP_MAX_KB}KB`);
}
if (totalJsGzipKb > TOTAL_JS_GZIP_MAX_KB) {
  failures.push(`total js gzip ${totalJsGzipKb.toFixed(2)}KB > ${TOTAL_JS_GZIP_MAX_KB}KB`);
}

console.log(
  [
    `Bundle check:`,
    `- index js gzip: ${indexJsGzipKb.toFixed(2)}KB (limit ${INDEX_JS_GZIP_MAX_KB}KB)`,
    `- index css gzip: ${indexCssGzipKb.toFixed(2)}KB (limit ${INDEX_CSS_GZIP_MAX_KB}KB)`,
    `- total js gzip: ${totalJsGzipKb.toFixed(2)}KB (limit ${TOTAL_JS_GZIP_MAX_KB}KB)`,
  ].join('\n')
);

if (failures.length > 0) {
  throw new Error(`Bundle budget exceeded:\n- ${failures.join('\n- ')}`);
}
