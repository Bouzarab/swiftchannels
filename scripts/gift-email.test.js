const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { buildEmailPreviews } = require('./gift-email-preview');

async function main() {
  buildEmailPreviews();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.route('https://swiftchannels.com/assets/email-mark.png',route => route.fulfill({ path:path.join(__dirname,'../assets/email-mark.png'),contentType:'image/png' }));
    const errors = [];
    page.on('pageerror',error => errors.push(error.message));
    for (const language of ['en','fr','es','de','it','nl']) {
      const suffix = language === 'en' ? '' : '-' + language;
      for (const width of [900,390,320]) {
        await page.setViewportSize({ width,height:1000 });
        await page.goto('http://127.0.0.1:8899/notes/gift-email-preview' + suffix + '.html');
        await page.locator('img').evaluate(image => image.decode());
        const state = await page.evaluate(() => ({
          lang:document.documentElement.lang,
          overflow:document.documentElement.scrollWidth - innerWidth,
          background:getComputedStyle(document.body).backgroundColor,
          accounts:document.querySelectorAll('table[bgcolor="#0D162F"]').length,
          image:document.querySelector('img').naturalWidth,
          overflowingText:Array.from(document.querySelectorAll('p,h1,h2,a')).filter(element => element.scrollWidth > element.clientWidth + 1).map(element => element.textContent)
        }));
        assert.equal(state.lang,language);
        assert.ok(state.overflow <= 1,language + ': overflow at ' + width);
        assert.deepEqual(state.overflowingText,[],language + ': overflowing text at ' + width);
        assert.equal(state.background,'rgb(5, 10, 24)');
        assert.equal(state.accounts,5);
        assert.ok(state.image > 0);
        if (language === 'en' && width !== 320) await page.screenshot({ path:path.join(__dirname,'../notes/gift-email-' + (width === 900 ? 'desktop' : 'mobile') + '.png'),fullPage:true });
      }
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: Dark email previews in six languages at desktop and mobile widths. No real accounts or emails used.');
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error);process.exitCode = 1; });
