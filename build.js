#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   Swift Channels — language page builder
   ───────────────────────────────────────────────────────────────────────
   index.html is the single source of truth, in English.
   This script opens it in a real browser, asks the site's own translation
   engine to switch language, and saves the result as a static page:

       fr/index.html   es/index.html   de/index.html   ar/index.html

   Each generated page carries its own <html lang>, canonical, hreflang set
   and Open Graph locale, so Google indexes the five versions separately.
   sitemap.xml is rewritten to match.

   Run it after ANY change to index.html or assets/i18n.js:

       node build.js

   Requires Playwright once:  npm install playwright
   ═══════════════════════════════════════════════════════════════════════ */

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');

const SITE  = 'https://swiftchannels.com';
const ROOT  = __dirname;
const LANGS = [
  { code:'en', dir:'ltr', folder:'',   ogLocale:'en_GB' },
  { code:'fr', dir:'ltr', folder:'fr', ogLocale:'fr_FR' },
  { code:'es', dir:'ltr', folder:'es', ogLocale:'es_ES' },
  { code:'de', dir:'ltr', folder:'de', ogLocale:'de_DE' },
  { code:'ar', dir:'rtl', folder:'ar', ogLocale:'ar_MA' }
];

const urlFor = f => f ? `${SITE}/${f}/` : `${SITE}/`;

(async () => {
  const browser = await chromium.launch();
  const built = [];

  for (const L of LANGS.filter(l => l.folder)) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto('file://' + path.join(ROOT, 'index.html'));
    await page.waitForFunction(() => window.i18n && document.querySelector('.plan'));

    /* the site's own engine does the translating — one implementation, not two */
    await page.evaluate(l => window.i18n.apply(l, false), L.code);
    await page.waitForTimeout(350);

    const html = await page.evaluate(cfg => {
      const { code, dir, folder, ogLocale, site, langs } = cfg;
      const abs = f => f ? site + '/' + f + '/' : site + '/';

      document.documentElement.setAttribute('lang', code);
      document.documentElement.setAttribute('dir', dir);

      /* the page now lives one folder down */
      document.querySelectorAll('[src],[href]').forEach(el => {
        for (const attr of ['src','href']) {
          const v = el.getAttribute(attr);
          if (!v) continue;
          if (/^(https?:|mailto:|tel:|#|\/|\.\.\/|data:)/.test(v)) continue;
          el.setAttribute(attr, '../' + v);
        }
      });

      /* head: canonical, hreflang, Open Graph */
      const head = document.head;
      head.querySelectorAll('link[rel="canonical"],link[rel="alternate"]').forEach(e => e.remove());

      const canon = document.createElement('link');
      canon.rel = 'canonical';
      canon.href = abs(folder);
      head.appendChild(canon);

      langs.forEach(l => {
        const a = document.createElement('link');
        a.rel = 'alternate';
        a.hreflang = l.code;
        a.href = abs(l.folder);
        head.appendChild(a);
      });
      const xd = document.createElement('link');
      xd.rel = 'alternate';
      xd.hreflang = 'x-default';
      xd.href = abs('');
      head.appendChild(xd);

      const setMeta = (sel, val) => {
        const m = head.querySelector(sel);
        if (m) m.setAttribute('content', val);
      };
      setMeta('meta[property="og:url"]', abs(folder));
      setMeta('meta[property="og:locale"]', ogLocale);
      setMeta('meta[property="og:title"]', document.title);
      const desc = head.querySelector('meta[name="description"]');
      if (desc) {
        setMeta('meta[property="og:description"]', desc.getAttribute('content'));
        setMeta('meta[name="twitter:description"]', desc.getAttribute('content'));
      }
      setMeta('meta[name="twitter:title"]', document.title);

      /* switcher: links relative to this folder, active flag marked */
      document.querySelectorAll('.lang-b').forEach(a => {
        const to = a.getAttribute('data-lang');
        const target = langs.find(l => l.code === to);
        a.setAttribute('href', target.folder ? '../' + target.folder + '/' : '../');
        a.setAttribute('aria-current', String(to === code));
      });

      /* tell the engine this page is already translated */
      const flag = document.createElement('script');
      flag.textContent = "window.PAGE_LANG='" + code + "';";
      const i18nScript = document.querySelector('script[src$="i18n.js"]');
      i18nScript.parentNode.insertBefore(flag, i18nScript);

      /* reveal classes and the generated order reference are runtime noise */
      document.querySelectorAll('.rv.in').forEach(e => e.classList.remove('in'));
      const ref = document.getElementById('ref');
      if (ref) ref.textContent = '—';

      return '<!DOCTYPE html>\n' + document.documentElement.outerHTML + '\n';
    }, { code:L.code, dir:L.dir, folder:L.folder, ogLocale:L.ogLocale, site:SITE, langs:LANGS });

    if (errors.length) {
      console.error(`  ✗ ${L.code}: ${errors.join(' | ')}`);
      process.exitCode = 1;
    }

    const dir = path.join(ROOT, L.folder);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
    console.log(`  ✓ ${L.folder}/index.html  (${(html.length/1024).toFixed(0)} KB)`);
    built.push(L);
    await page.close();
  }

  await browser.close();

  /* ── sitemap with hreflang alternates on every entry ── */
  const today = fs.statSync(path.join(ROOT,'index.html')).mtime.toISOString().slice(0,10);
  const alternates = LANGS.map(l =>
    `      <xhtml:link rel="alternate" hreflang="${l.code}" href="${urlFor(l.folder)}"/>`
  ).join('\n') +
  `\n      <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor('')}"/>`;

  const entries = LANGS.map(l => `  <url>
    <loc>${urlFor(l.folder)}</loc>
${alternates}
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${l.folder ? '0.9' : '1.0'}</priority>
  </url>`).join('\n');

  fs.writeFileSync(path.join(ROOT,'sitemap.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
  <url>
    <loc>${SITE}/legal.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
`, 'utf8');
  console.log('  ✓ sitemap.xml');
  console.log(`\nBuilt ${built.length} language pages. Commit and push.`);
})();
