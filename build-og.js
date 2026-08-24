#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   Swift Channels — share-card renderer
   ───────────────────────────────────────────────────────────────────────
   Renders assets/og-card.html to assets/og-card.jpg at 1200×630 — the
   image WhatsApp, Facebook, X and iMessage show when the site is shared.

   Edit the prices in assets/og-card.html, then:

       node build-og.js

   Needs the fonts once:  npm install @fontsource/sora @fontsource/inter
   ═══════════════════════════════════════════════════════════════════════ */

const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');

(async () => {
  const src = path.join(__dirname, 'assets', 'og-card.html');
  const out = path.join(__dirname, 'assets', 'og-card.jpg');

  if (!fs.existsSync(path.join(__dirname, 'node_modules', '@fontsource', 'sora'))) {
    console.error('Fonts missing. Run:  npm install @fontsource/sora @fontsource/inter');
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2            // render at 2× then downsample — crisper text
  });

  await page.goto('file://' + src);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);

  const shot = await page.screenshot({ type: 'jpeg', quality: 92, scale: 'css' });
  fs.writeFileSync(out, shot);
  await browser.close();

  console.log(`  ✓ assets/og-card.jpg  (1200×630, ${(shot.length/1024).toFixed(0)} KB)`);
  console.log('\nRemember: after pushing, re-scrape the preview so the old card is dropped —');
  console.log('  Facebook  https://developers.facebook.com/tools/debug/');
  console.log('  X         https://cards-dev.twitter.com/validator');
  console.log('  WhatsApp caches per-device; a fresh chat usually picks it up.');
})();
