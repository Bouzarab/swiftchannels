const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const base = process.env.GIFT_PREVIEW_URL || 'http://127.0.0.1:8899';
const languages = ['en','fr','es','de','it','nl'];

async function main() {
  const browser = await chromium.launch();
  const failures = [];
  try {
    const preview = await browser.newContext();
    await preview.route('**/assets/gift-config.js',route => route.fulfill({ contentType:'application/javascript',body:'window.GIFT_CONFIG={endpoint:"",turnstileSiteKey:""};' }));
    const page = await preview.newPage();
    page.on('pageerror',error => failures.push(error.message));
    page.on('response',response => { if (response.url().startsWith(base) && response.status() >= 400) failures.push(response.status() + ' ' + response.url()); });
    for (const language of languages) {
      const url = base + '/' + (language === 'en' ? '' : language + '/') + 'gift/';
      for (const width of [1440,768,390,320]) {
        await page.setViewportSize({ width,height:950 });
        await page.goto(url,{ waitUntil:'networkidle' });
        const state = await page.evaluate(() => ({
          language:document.documentElement.lang,
          overflow:document.documentElement.scrollWidth - document.documentElement.clientWidth,
          images:Array.from(document.images).every(image => image.complete && image.naturalWidth > 0),
          schema:JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent),
          links:Array.from(document.querySelectorAll('a[href],link[rel="stylesheet"],script[src]')).map(link => link.href || link.src)
        }));
        assert.equal(state.language,language);
        assert.ok(state.overflow <= 1,language + ': overflow at ' + width);
        assert.ok(state.images,language + ': image missing');
        assert.equal(state.schema['@graph'][0].inLanguage,language);
        assert.ok(await page.locator('#giftSend').isDisabled());
        assert.ok(await page.locator('#giftStatus').textContent());
        for (const link of state.links.filter(link => link.startsWith(base))) {
          const response = await page.request.get(link);
          assert.equal(response.status(),200,'Broken local link: ' + link);
        }
      }
      await page.locator('#langCur').click();
      assert.equal(await page.locator('.lang-b').count(),6);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#langCur').getAttribute('aria-expanded'),'false');
      await page.locator('a[href="#gift-data"]').click();
      assert.equal(await page.locator('#gift-data').getAttribute('open'),'');
      assert.equal(await page.locator('.gift-details').count(),0);
      await page.keyboard.press('Escape');
      const home = await page.request.get(base + '/' + (language === 'en' ? '' : language + '/'));
      assert.ok((await home.text()).includes('href="gift/"'));
    }
    for (const [width,name] of [[1440,'desktop'],[390,'mobile']]) {
      await page.setViewportSize({ width,height:950 });
      await page.goto(base + '/gift/',{ waitUntil:'networkidle' });
      await page.screenshot({ path:path.join(__dirname,'../notes/gift-preview-' + name + '.png'),fullPage:true });
    }
    await preview.close();

    for (const result of ['sent','already_sent','out_of_stock','unavailable','verification']) {
      const context = await browser.newContext();
      await context.route('**/assets/gift-config.js',route => route.fulfill({ contentType:'application/javascript',body:'window.GIFT_CONFIG={endpoint:"https://script.google.com/macros/s/test/exec",turnstileSiteKey:"test"};' }));
      await context.route('https://challenges.cloudflare.com/turnstile/v0/api.js*',route => route.fulfill({ contentType:'application/javascript',body:'window.turnstile={render:function(selector,options){window.giftTestChallenge=options;setTimeout(function(){options.callback("test-token")},0);return 1},reset:function(){}};window.swiftGiftChallengeReady();' }));
      let posts = 0;
      await context.route('https://script.google.com/macros/s/test/exec*',async route => {
        if (route.request().method() === 'POST') {
          posts++;
          const fields = new URLSearchParams(route.request().postData());
          assert.equal(fields.get('email'),'visitor@example.test');
          assert.equal(fields.get('lang'),'fr');
          assert.ok(fields.get('turnstile'));
          await route.fulfill({ contentType:'text/plain',body:'opaque response is not delivery confirmation' });
        } else {
          const url = new URL(route.request().url());
          await route.fulfill({ contentType:'application/javascript',body:url.searchParams.get('callback') + '(' + JSON.stringify({ status:result }) + ');' });
        }
      });
      const formPage = await context.newPage();
      formPage.on('pageerror',error => failures.push(error.message));
      await formPage.goto(base + '/fr/gift/');
      await formPage.waitForFunction(() => !document.getElementById('giftSend').disabled);
      await formPage.locator('#giftEmail').fill('Visitor@example.test');
      await formPage.locator('#giftSend').click();
      if (result === 'sent' || result === 'already_sent') {
        await formPage.locator('#giftSuccess').waitFor({ state:'visible' });
        assert.ok(await formPage.locator('#giftForm').isHidden());
      } else {
        await formPage.waitForFunction(() => document.getElementById('giftStatus').dataset.state === 'error');
        assert.ok(await formPage.locator('#giftSuccess').isHidden());
        assert.ok(await formPage.locator('#giftForm').isVisible());
      }
      assert.equal(posts,1);
      await context.close();
    }
    const sitemap = fs.readFileSync(path.join(__dirname,'../sitemap.xml'),'utf8');
    for (const match of sitemap.matchAll(/<priority>(.*?)<\/priority>/g)) assert.ok(Number.isFinite(Number(match[1])) && Number(match[1]) >= 0 && Number(match[1]) <= 1,'Invalid sitemap priority: ' + match[1]);
    assert.equal((sitemap.match(/<loc>https:\/\/swiftchannels\.com\/(?:[a-z]{2}\/)?gift\/<\/loc>/g) || []).length,6);
    assert.deepEqual(failures,[]);
    console.log('PASS: Six languages at four widths; local links, images, form outcomes, and sitemap verified. No real emails sent.');
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
