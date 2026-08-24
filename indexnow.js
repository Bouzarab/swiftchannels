#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   Swift Channels — IndexNow submitter
   ───────────────────────────────────────────────────────────────────────
   Tells Bing (and Yandex, Seznam, Naver — they share the protocol) that
   pages have changed, instead of waiting to be crawled. Google does not
   use IndexNow; for Google, use Search Console.

   It reads every <loc> in sitemap.xml, so it always submits the current
   set of pages — no list to keep in step.

       node indexnow.js --dry-run     show what would be sent
       node indexnow.js               send it

   Run it AFTER git push, once the new pages are actually live. Submitting
   a URL that 404s teaches Bing the wrong thing.

   The key file must be reachable at:
       https://swiftchannels.com/d119da91893e4ec4910f7aabe77209dd.txt
   That file is public by design — the key proves you control the domain,
   it is not a secret.
   ═══════════════════════════════════════════════════════════════════════ */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const HOST = 'swiftchannels.com';
const KEY  = 'd119da91893e4ec4910f7aabe77209dd';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = { host: 'api.indexnow.org', path: '/indexnow' };

const dryRun = process.argv.includes('--dry-run');

const sitemap = fs.readFileSync(path.join(__dirname, 'sitemap.xml'), 'utf8');
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());

if (!urlList.length) {
  console.error('No <loc> entries found in sitemap.xml — run node build.js first.');
  process.exit(1);
}

const payload = JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList });

console.log(`Submitting ${urlList.length} URLs as ${HOST}`);
urlList.forEach(u => console.log('  ' + u));

if (dryRun) {
  console.log('\n--dry-run: nothing sent. Payload would be:\n');
  console.log(payload);
  process.exit(0);
}

const req = https.request({
  hostname: ENDPOINT.host,
  path: ENDPOINT.path,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    const meaning = {
      200: 'OK — URLs accepted.',
      202: 'Accepted — URLs received, key validation pending.',
      400: 'Bad request — malformed payload.',
      403: 'Forbidden — the key file was not found, or does not contain the key. Check ' + KEY_LOCATION,
      422: 'Unprocessable — a URL does not belong to this host, or the key does not match.',
      429: 'Too many requests — you are submitting too often. Wait, then try again.'
    }[res.statusCode] || 'Unexpected status.';
    console.log(`\nHTTP ${res.statusCode} — ${meaning}`);
    if (body.trim()) console.log(body.trim());
    if (res.statusCode >= 400) process.exitCode = 1;
  });
});

req.on('error', e => {
  console.error('\nRequest failed:', e.message);
  process.exitCode = 1;
});

req.write(payload);
req.end();
