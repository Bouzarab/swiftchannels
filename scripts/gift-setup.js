const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const readline = require('node:readline/promises');
const { parseGiftList } = require('./gift-import');
const { COPY,EMAIL_KEYS } = require('./gift-copy');

const ROOT = path.resolve(__dirname,'..');
const PRIVATE = path.join(os.homedir(),'Downloads','SwiftChannels-private-gifts','deployment');
const SOURCE = path.join(os.homedir(),'Downloads','800X IPTV mac addresses.txt');
const SETTINGS_FILE = path.join(PRIVATE,'settings.json');
const IGNORE = '**/**\n!appsscript.json\n!Code.gs\n!EmailCopy.gs\n!Setup.gs\n!PrivateInventory.gs\n!PrivateSettings.gs\n';

function privateWrite(filename,content) {
  if (fs.existsSync(filename) && fs.lstatSync(filename).isSymbolicLink()) throw new Error('Private setup files cannot be symbolic links.');
  fs.writeFileSync(filename,content,{ encoding:'utf8',mode:0o600 });
  fs.chmodSync(filename,0o600);
}

function prepareGiftSetup({ directory = PRIVATE,source = SOURCE,settings = {},now = Date.now() } = {}) {
  const target = path.resolve(directory);
  if (target === ROOT || target.startsWith(ROOT + path.sep)) throw new Error('Account inventory must stay outside the public website.');
  fs.mkdirSync(target,{ recursive:true,mode:0o700 });
  const real = fs.realpathSync(target);
  if (real === ROOT || real.startsWith(ROOT + path.sep)) throw new Error('Account inventory must stay outside the public website.');
  fs.chmodSync(real,0o700);
  const parsed = parseGiftList(fs.readFileSync(source,'utf8'),{ now });
  const accounts = parsed.accounts.map(account => ({ ...account,id:'gift-' + crypto.createHash('sha256').update(account.mac).digest('hex').slice(0,16) }));
  for (const filename of ['Code.gs','Setup.gs','appsscript.json']) privateWrite(path.join(real,filename),fs.readFileSync(path.join(ROOT,'services/gift',filename),'utf8'));
  const copy = Object.fromEntries(Object.entries(COPY).map(([language,values]) => [language,Object.fromEntries(EMAIL_KEYS.map(key => [key,values[key]]))]));
  privateWrite(path.join(real,'EmailCopy.gs'),'var GIFT_EMAIL_COPY = ' + JSON.stringify(copy,null,2) + ';\n');
  privateWrite(path.join(real,'PrivateInventory.gs'),'var GIFT_INITIAL_ACCOUNTS = ' + JSON.stringify(accounts) + ';\n');
  privateWrite(path.join(real,'PrivateSettings.gs'),'var GIFT_INSTALL_SETTINGS = ' + JSON.stringify({ turnstileSecret:settings.turnstileSecret || '',allowLocalPreview:true,resendApiKey:settings.resendApiKey || '',resendFrom:settings.resendFrom || 'gifts@swiftchannels.com',deliveryPaused:settings.deliveryPaused === true }) + ';\n');
  privateWrite(path.join(real,'.claspignore'),IGNORE);
  return { ...parsed.summary,directory:real };
}

function readSettings() { return fs.existsSync(SETTINGS_FILE) ? JSON.parse(fs.readFileSync(SETTINGS_FILE,'utf8')) : {}; }
function saveSettings(settings) { privateWrite(SETTINGS_FILE,JSON.stringify(settings,null,2) + '\n'); }

function clasp(args,{ inherit = false } = {}) {
  const executable = fs.realpathSync(path.join(ROOT,'node_modules/.bin/clasp'));
  const result = spawnSync(process.execPath,[executable,...args],{ cwd:PRIVATE,encoding:'utf8',stdio:inherit ? 'inherit' : 'pipe' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (!inherit) console.error((result.stderr || result.stdout || '').trim());
    throw new Error('Google setup stopped. Complete the account step shown above, then run the setup command again.');
  }
  return result.stdout || '';
}

function openUrl(url) {
  if (process.platform === 'darwin') spawnSync('open',[url],{ stdio:'ignore' });
  console.log(url);
}

function secretPrompt(label) {
  if (!process.stdin.isTTY) throw new Error('Run this command in your own Terminal to enter the secret privately.');
  return new Promise((resolve,reject) => {
    let value = '';
    process.stdout.write(label);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    function cleanup() { process.stdin.off('data',onData); process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write('\n'); }
    function onData(chunk) {
      for (const character of chunk.toString()) {
        if (character === '\u0003') { cleanup(); reject(new Error('Setup cancelled.')); return; }
        if (character === '\r' || character === '\n') { cleanup(); resolve(value.trim()); return; }
        if (character === '\u007f' || character === '\b') value = value.slice(0,-1);
        else if (character >= ' ') value += character;
      }
    }
    process.stdin.on('data',onData);
  });
}

function publicConfig(endpoint,siteKey) {
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint) || !/^[\w-]{16,200}$/.test(siteKey)) throw new Error('The public sender connection is invalid.');
  return '/* Public connection details only. Accounts and secrets stay in Google. */\nwindow.GIFT_CONFIG = ' + JSON.stringify({ endpoint,turnstileSiteKey:siteKey },null,2) + ';\n';
}

function googleAuthorized(run = clasp) {
  try { return JSON.parse(run(['--json','show-authorized-user'])).loggedIn === true; }
  catch (error) { return false; }
}

async function connectGiftWebsite({ settings = readSettings(),fetchSender = fetch,writeConfig = content => fs.writeFileSync(path.join(ROOT,'assets/gift-config.js'),content,'utf8') } = {}) {
  const endpoint = 'https://script.google.com/macros/s/' + settings.deploymentId + '/exec';
  if (!settings.deploymentId) throw new Error('No Google deployment exists yet. Run npm run gift:setup first.');
  const config = publicConfig(endpoint,settings.turnstileSiteKey || '');
  let response,health;
  try {
    response = await fetchSender(endpoint + '?health=1',{ signal:AbortSignal.timeout(30000) });
    health = await response.json();
  } catch (error) { throw new Error('Google did not return the sender check. Verify the deployment allows Anyone, then run npm run gift:check again.'); }
  if (!response.ok) throw new Error('Google rejected the sender check. Check deployment access before connecting the website.');
  if (health.senderReady === false) throw new Error('Resend delivery is paused or not configured. Follow services/gift/RESEND-SETUP.md, then run npm run gift:resend. Personal Gmail sending is disabled.');
  if (health.ready !== true) throw new Error('The Google sender is not initialized. Open Setup.gs, select initializeGiftService and click Run. Wait for "Gift sender initialized" and "Execution completed", then run npm run gift:check.');
  if (health.available !== true) throw new Error('The Google sender is initialized but has fewer than five eligible accounts. Check the private Gift accounts sheet; no website connection was changed.');
  writeConfig(config);
  console.log('The sender is connected locally. Open http://localhost:8899/gift/ and request a gift using your own email.');
  console.log('The live website still needs publication.');
  return { connected:true };
}

function deployGiftService(settings) {
  const args = ['create-deployment','--description','SwiftChannels gift sender'];
  if (settings.deploymentId) args.push('--deploymentId',settings.deploymentId);
  const deployment = JSON.parse(clasp(['--json',...args]));
  settings.deploymentId = deployment.deploymentId;
  saveSettings(settings);
}

function disableGiftWebsite() {
  fs.writeFileSync(path.join(ROOT,'assets/gift-config.js'),'/* Delivery stays disabled until the private Resend connection is configured. */\nwindow.GIFT_CONFIG = { endpoint:"",turnstileSiteKey:"" };\n','utf8');
}

async function updateGiftService({ connect = true } = {}) {
  const settings = readSettings();
  if (!settings.deploymentId || !fs.existsSync(path.join(PRIVATE,'.clasp.json'))) throw new Error('Run npm run gift:setup before updating the sender.');
  prepareGiftSetup({ settings });
  clasp(['push','--force']);
  deployGiftService(settings);
  if (connect) await connectGiftWebsite({ settings });
  else disableGiftWebsite();
  console.log('Google service updated. Existing deliveries and account reservations were preserved. No email was sent by this update.');
}

async function pauseGiftService() {
  const settings = readSettings();
  settings.deliveryPaused = true;
  saveSettings(settings);
  disableGiftWebsite();
  await updateGiftService({ connect:false });
  console.log('Delivery is paused while Resend is configured. No personal Gmail fallback exists.');
}

async function configureResend() {
  const settings = readSettings();
  if (!settings.deploymentId) throw new Error('The Google inventory service must be set up first.');
  const input = readline.createInterface({ input:process.stdin,output:process.stdout });
  console.log('Use a Sending access API key restricted to your verified swiftchannels.com domain.');
  const verified = (await input.question('Does Resend show swiftchannels.com as Verified? Type YES and press Enter: ')).trim().toUpperCase();
  input.close();
  if (verified !== 'YES') throw new Error('Verify the domain first. Follow services/gift/RESEND-SETUP.md.');
  const key = await secretPrompt('Paste the Resend API key and press Enter (the text stays hidden): ');
  if (!/^re_[a-zA-Z0-9_-]{16,200}$/.test(key)) throw new Error('That does not look like a complete Resend API key. No connection was changed.');
  settings.resendApiKey = key;
  settings.resendFrom = 'gifts@swiftchannels.com';
  settings.deliveryPaused = false;
  saveSettings(settings);
  await updateGiftService();
  console.log('Configured sender: SwiftChannels <gifts@swiftchannels.com>. Replies: contact@swiftchannels.com.');
  console.log('The first real-email test confirms Resend accepts the key and verified sender. No test email has been sent automatically.');
}

async function setup() {
  let settings = readSettings();
  prepareGiftSetup({ settings });
  if (!googleAuthorized()) {
    console.log('Sign in to the Google account that will hold the private gift inventory and approve the Google connection.');
    clasp(['login'],{ inherit:true });
  }
  if (!settings.turnstileSiteKey || !settings.turnstileSecret) {
    console.log('\nCreate a Managed Turnstile widget for swiftchannels.com, www.swiftchannels.com and localhost.');
    openUrl('https://dash.cloudflare.com/?to=/:account/turnstile');
    const input = readline.createInterface({ input:process.stdin,output:process.stdout });
    settings.turnstileSiteKey = (await input.question('Paste its public Site Key, then press Enter: ')).trim();
    input.close();
    settings.turnstileSecret = await secretPrompt('Paste its Secret Key, then press Enter (the text stays hidden): ');
    if (![settings.turnstileSiteKey,settings.turnstileSecret].every(value => /^[\w-]{16,200}$/.test(value))) throw new Error('A verification key is incomplete. Run setup again with the widget keys.');
    saveSettings(settings);
  }
  if (!fs.existsSync(path.join(PRIVATE,'.clasp.json'))) {
    console.log('\nCreating your Google gift project.');
    try { clasp(['create-script','--type','standalone','--title','SwiftChannels gifts','--rootDir','.']); }
    catch (error) {
      console.log('If Google says its Apps Script API is disabled, turn it on here, then run setup again:');
      openUrl('https://script.google.com/home/usersettings');
      throw error;
    }
  }
  fs.chmodSync(path.join(PRIVATE,'.clasp.json'),0o600);
  // Google creation pulls an empty starter file; replace it with the prepared service.
  const prepared = prepareGiftSetup({ settings });
  console.log('Uploading the sender and ' + prepared.usableDatedEntries + ' private account entries.');
  clasp(['push','--force']);
  const project = JSON.parse(fs.readFileSync(path.join(PRIVATE,'.clasp.json'),'utf8'));
  console.log('\nIn the Google editor, click Setup.gs in Files, select initializeGiftService, click Run, and approve its permissions.');
  console.log('That run creates and fills the private spreadsheet automatically.');
  console.log('Do not select setupGiftService in Code.gs: it creates the sheet without importing accounts.');
  openUrl('https://script.google.com/home/projects/' + encodeURIComponent(project.scriptId) + '/edit');
  const confirmation = readline.createInterface({ input:process.stdin,output:process.stdout });
  await confirmation.question('After the log shows "Gift sender initialized" and "Execution completed", return here and press Enter: ');
  confirmation.close();
  deployGiftService(settings);
  if (!settings.resendApiKey || settings.deliveryPaused) {
    disableGiftWebsite();
    console.log('Google inventory is ready. Follow services/gift/RESEND-SETUP.md and run npm run gift:resend to enable branded sending.');
    return;
  }
  console.log('Checking the deployed sender before connecting the website.');
  await connectGiftWebsite({ settings });
  console.log('Tell Codex when you receive it so the final check and publication can be completed.');
}

if (require.main === module) {
  const action = process.argv[2] || 'prepare';
  if (action === 'prepare') {
    try {
      const summary = prepareGiftSetup({ settings:readSettings() });
      console.log('Prepared Google service files, automatic inventory import, and ' + summary.usableDatedEntries + ' private account entries.');
      console.log('Google login: ' + (fs.existsSync(path.join(os.homedir(),'.clasprc.json')) ? 'present' : 'needed'));
      console.log('Verification widget: ' + (readSettings().turnstileSecret ? 'configured' : 'needed'));
    } catch (error) { console.error(error.message); process.exitCode = 1; }
  } else if (action === 'connect') setup().catch(error => { console.error(error.message); process.exitCode = 1; });
  else if (action === 'check') connectGiftWebsite().catch(error => { console.error(error.message); process.exitCode = 1; });
  else if (action === 'update') updateGiftService().catch(error => { console.error(error.message); process.exitCode = 1; });
  else if (action === 'pause') pauseGiftService().catch(error => { console.error(error.message); process.exitCode = 1; });
  else if (action === 'resend') configureResend().catch(error => { console.error(error.message); process.exitCode = 1; });
  else { console.error('Use prepare, connect, check, update, pause or resend.'); process.exitCode = 1; }
}

module.exports = { prepareGiftSetup,publicConfig,googleAuthorized,connectGiftWebsite };
