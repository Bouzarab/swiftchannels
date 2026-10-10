const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { prepareGiftSetup,publicConfig,googleAuthorized,connectGiftWebsite } = require('./gift-setup');

test('setup prepares a private, owner-only deployment bundle with stable account IDs', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(),'swiftchannels-gift-test-'));
  t.after(() => fs.rmSync(directory,{ recursive:true,force:true }));
  const source = path.join(directory,'fixture.txt');
  fs.writeFileSync(source,'Portal: https://portal.example.test/c/\nMAC Addr: 00:1A:79:00:00:01\nExp date: January 1, 2030, 12:00 am\nChannels: 1000\n');
  const target = path.join(directory,'deployment');
  const options = { directory:target,source,settings:{ turnstileSecret:'private-fixture-secret',resendApiKey:'re_private_fixture_1234567890' },now:Date.parse('2026-10-09') };
  const summary = prepareGiftSetup(options);
  assert.equal(summary.usableDatedEntries,1);
  assert.equal(fs.statSync(target).mode & 0o777,0o700);
  for (const name of fs.readdirSync(target)) assert.equal(fs.statSync(path.join(target,name)).mode & 0o777,0o600,name);
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(target,'PrivateInventory.gs'),'utf8'),context);
  assert.match(context.GIFT_INITIAL_ACCOUNTS[0].id,/^gift-[a-f0-9]{16}$/);
  const original = fs.readFileSync(path.join(target,'PrivateInventory.gs'),'utf8');
  prepareGiftSetup(options);
  assert.equal(fs.readFileSync(path.join(target,'PrivateInventory.gs'),'utf8'),original);
  const manifest = JSON.parse(fs.readFileSync(path.join(target,'appsscript.json'),'utf8'));
  assert.equal(manifest.webapp.access,'ANYONE_ANONYMOUS');
  assert.equal(manifest.webapp.executeAs,'USER_DEPLOYING');
  assert.ok(manifest.urlFetchWhitelist.includes('https://api.resend.com/emails'));
  assert.ok(!manifest.oauthScopes.includes('https://www.googleapis.com/auth/script.send_mail'));
  const privateSettings = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(target,'PrivateSettings.gs'),'utf8'),privateSettings);
  assert.equal(privateSettings.GIFT_INSTALL_SETTINGS.resendApiKey,'re_private_fixture_1234567890');
  assert.equal(privateSettings.GIFT_INSTALL_SETTINGS.resendFrom,'gifts@swiftchannels.com');
  const ignore = fs.readFileSync(path.join(target,'.claspignore'),'utf8').trim().split('\n');
  const allowed = require('micromatch').not([...fs.readdirSync(target),'settings.json','.clasp.json','accounts.csv'],ignore,{ dot:true });
  assert.deepEqual(allowed.sort(),['Code.gs','EmailCopy.gs','PrivateInventory.gs','PrivateSettings.gs','Setup.gs','appsscript.json'].sort());
  assert.throws(() => prepareGiftSetup({ ...options,directory:path.join(__dirname,'../private-gifts') }),/outside/);
  const link = path.join(directory,'repo-link');
  fs.symlinkSync(path.resolve(__dirname,'..'),link);
  assert.throws(() => prepareGiftSetup({ ...options,directory:link }),/outside/);
  fs.symlinkSync(source,path.join(target,'PrivateSettings.gs.link'));
  fs.unlinkSync(path.join(target,'PrivateSettings.gs'));
  fs.renameSync(path.join(target,'PrivateSettings.gs.link'),path.join(target,'PrivateSettings.gs'));
  assert.throws(() => prepareGiftSetup(options),/symbolic links/);
});

test('public connection contains only the endpoint and public verification key', () => {
  const context = vm.createContext({ window:{} });
  vm.runInContext(publicConfig('https://script.google.com/macros/s/example-deployment/exec','public-site-key-123456'),context);
  assert.deepEqual(Object.keys(context.window.GIFT_CONFIG),['endpoint','turnstileSiteKey']);
  assert.throws(() => publicConfig('https://attacker.example/exec','public-site-key-123456'),/invalid/);
  assert.throws(() => publicConfig('https://script.google.com/macros/s/example/exec','bad"key'),/invalid/);
});

test('the login check detects Google\'s successful but unauthenticated response', () => {
  assert.equal(googleAuthorized(() => '{"loggedIn":false}'),false);
  assert.equal(googleAuthorized(() => '{"loggedIn":true}'),true);
  assert.equal(googleAuthorized(() => { throw new Error('expired login'); }),false);
  assert.equal(googleAuthorized(() => 'not json'),false);
});

test('the connection check distinguishes missing initialization from exhausted inventory without enabling the form', async () => {
  let writes = 0;
  const settings = { deploymentId:'example-deployment',turnstileSiteKey:'public-site-key-123456' };
  for (const [health,message] of [[{ ready:false,available:false },/Open Setup\.gs/],[{ ready:true,available:false },/fewer than five eligible/],[{ ready:false,available:true,senderReady:false },/npm run gift:resend/]]) {
    await assert.rejects(connectGiftWebsite({ settings,fetchSender:async () => ({ ok:true,json:async () => health }),writeConfig:() => writes++ }),message);
  }
  assert.equal(writes,0);
});

test('the connection check enables only a ready, stocked Google sender and never sends email', async () => {
  let written;
  const settings = { deploymentId:'example-deployment',turnstileSiteKey:'public-site-key-123456',turnstileSecret:'private-fixture-secret' };
  await connectGiftWebsite({ settings,fetchSender:async url => {
    assert.equal(url,'https://script.google.com/macros/s/example-deployment/exec?health=1');
    return { ok:true,json:async () => ({ ready:true,available:true }) };
  },writeConfig:content => { written = content; } });
  assert.ok(written.includes(settings.turnstileSiteKey));
  assert.ok(!written.includes(settings.turnstileSecret));
});

test('network, permission and incomplete-setting failures cannot overwrite the website connection', async () => {
  let writes = 0;
  const options = { settings:{ deploymentId:'example',turnstileSiteKey:'public-site-key-123456' },writeConfig:() => writes++ };
  await assert.rejects(connectGiftWebsite({ ...options,fetchSender:async () => { throw new Error('timeout'); } }),/did not return/);
  await assert.rejects(connectGiftWebsite({ ...options,fetchSender:async () => ({ ok:false,json:async () => ({ ready:true,available:true }) }) }),/rejected/);
  await assert.rejects(connectGiftWebsite({ ...options,settings:{} }),/No Google deployment/);
  assert.equal(writes,0);
});
