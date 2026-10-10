const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { parseGiftList } = require('./gift-import');

function bundle(id,offset = 0) {
  return Array.from({ length:5 },(_,index) => [id + '-' + index,'https://portal.example.test/c/','00:1A:79:00:00:' + (offset + index).toString(16).padStart(2,'0'),'2030-01-01T00:00:00.000Z','1000','ready','','']);
}

function service(options = {}) {
  const properties = new Map(Object.entries({ GIFT_SPREADSHEET_ID:'private', TURNSTILE_SECRET:'secret',RESEND_API_KEY:'re_test_key_1234567890',RESEND_FROM:'gifts@swiftchannels.com' }));
  const cache = new Map();
  const sent = [];
  const resendRequests = [];
  let locked = false;
  const sheets = new Map();
  function sheet(rows) {
    return {
      rows,
      getLastRow() { return rows.length; },
      getDataRange() { return { getValues:() => rows.map(row => row.slice()) }; },
      getRange(row,column,height = 1,width = 1) {
        return {
          setValues(values) {
            for (let y = 0; y < height; y++) {
              rows[row - 1 + y] ||= [];
              for (let x = 0; x < width; x++) rows[row - 1 + y][column - 1 + x] = values[y][x];
            }
          },
          setValue(value) { this.setValues([[value]]); },
          setNumberFormat() { return this; }
        };
      }
    };
  }
  sheets.set('Gift accounts',sheet([['Account ID','Portal','MAC','Expires at','Channels','State','Recipient','Sent at'],...(options.bundles || [bundle('gift-1')]).flat()]));
  sheets.set('Deliveries',sheet([Array(6).fill('header')]));
  const spreadsheet = { getSheetByName:name => sheets.get(name),getId:() => 'private',getUrl:() => 'https://sheets.example.test/private' };
  const context = vm.createContext({
    console,
    PropertiesService:{ getScriptProperties:() => ({ getProperty:key => properties.get(key) || null,setProperty:(key,value) => properties.set(key,value) }) },
    SpreadsheetApp:{ openById:() => spreadsheet, flush() {} },
    LockService:{ getScriptLock:() => ({ tryLock() { if (locked) return false; locked = true; return true; }, hasLock:() => locked, releaseLock() { locked = false; } }) },
    MailApp:{ sendEmail() { throw new Error('Personal Gmail sending must never be called.'); },getRemainingDailyQuota() { throw new Error('Google email quota is irrelevant to Resend.'); } },
    Utilities:{ DigestAlgorithm:{ SHA_256:'sha256' },Charset:{ UTF_8:'utf8' },computeDigest:(algorithm,value) => Array.from(crypto.createHash(algorithm).update(value).digest()) },
    UrlFetchApp:{ fetch(url,request) {
      if (url === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') return { getResponseCode:() => 200,getContentText:() => JSON.stringify({ success:options.verified !== false,action:'gift',hostname:options.hostname || 'swiftchannels.com' }) };
      assert.equal(url,'https://api.resend.com/emails');
      resendRequests.push(request);
      if (options.mailError) throw new Error('mail failed');
      if (options.quota === 0) return { getResponseCode:() => 429,getContentText:() => '{}' };
      if (options.resendStatus || options.malformedResend) return { getResponseCode:() => options.resendStatus || 200,getContentText:() => '{}' };
      const payload = JSON.parse(request.payload);
      sent.push({ to:payload.to[0],subject:payload.subject,body:payload.text,htmlBody:payload.html,replyTo:payload.reply_to,name:'SwiftChannels',from:payload.from });
      if (options.onSend) options.onSend(context);
      return { getResponseCode:() => 200,getContentText:() => JSON.stringify({ id:'test-message-id' }) };
    } },
    CacheService:{ getScriptCache:() => ({ put:(key,value) => cache.set(key,value), get:key => cache.get(key) }) },
    ContentService:{ MimeType:{ JSON:'json', JAVASCRIPT:'javascript' }, createTextOutput:text => ({ text, setMimeType() { return this; } }) }
  });
  for (const filename of ['EmailCopy.gs','Code.gs','Setup.gs']) vm.runInContext(fs.readFileSync(path.join(__dirname,'../services/gift',filename),'utf8'),context);
  let sequence = 0;
  function claim(email = 'visitor@example.test',extra = {}) {
    const request = (++sequence).toString(16).padStart(32,'0');
    const result = context.doPost({ parameter:{ email, request, lang:'en', turnstile:'valid-token', ...extra } });
    return { status:JSON.parse(result.text).status, request };
  }
  return { context, claim, sent, sheets, properties,resendRequests };
}

test('a claim sends exactly five accounts and records the reservation before sending', () => {
  const sender = service({ onSend(context) { assert.equal(context.SpreadsheetApp.openById().getSheetByName('Gift accounts').rows.filter(row => row[5] === 'reserved').length,5); } });
  assert.equal(sender.claim().status,'sent');
  assert.equal(sender.sent.length,1);
  assert.equal((sender.sent[0].body.match(/MAC address:/g) || []).length,5);
  assert.equal((sender.sent[0].body.match(/Expiry:/g) || []).length,5);
  assert.equal(sender.sent[0].replyTo,'contact@swiftchannels.com');
  assert.equal(sender.sheets.get('Gift accounts').rows.filter(row => row[5] === 'sent').length,5);
});

test('repeat claims normalize email and send only once', () => {
  const sender = service();
  assert.equal(sender.claim(' Visitor@Example.test ').status,'sent');
  assert.equal(sender.claim('visitor@example.test').status,'already_sent');
  assert.equal(sender.sent.length,1);
});

test('different recipients receive different unique bundles', () => {
  const sender = service({ bundles:[bundle('one'),bundle('two',10)] });
  assert.equal(sender.claim('one@example.test').status,'sent');
  assert.equal(sender.claim('two@example.test').status,'sent');
  assert.notEqual(sender.sent[0].body,sender.sent[1].body);
  const codes = sender.sent.flatMap(message => message.body.match(/(?:[A-F0-9]{2}:){5}[A-F0-9]{2}/g));
  assert.equal(new Set(codes).size,10);
  assert.equal(sender.claim('three@example.test').status,'out_of_stock');
});

test('random sampling chooses five distinct codes and changes with its random input', () => {
  const sender = service({ bundles:[bundle('one'),bundle('two',10)] });
  const rows = sender.sheets.get('Gift accounts').rows;
  const first = sender.context.giftSelect_(rows,() => 0).map(item => item.account.mac);
  const last = sender.context.giftSelect_(rows,() => 0.9999).map(item => item.account.mac);
  assert.equal(first.length,5);
  assert.equal(new Set(first).size,5);
  assert.notDeepEqual(first,last);
});

test('expired, duplicate and already allocated codes cannot enter the random selection', () => {
  const sender = service({ bundles:[bundle('one'),bundle('two',10),bundle('three',20)] });
  const rows = sender.sheets.get('Gift accounts').rows;
  rows[1][3] = '2020-01-01T00:00:00Z';
  rows[2][5] = 'sent'; rows[2][6] = 'other@example.test';
  rows.push(rows[2].slice().map((value,index) => index === 5 ? 'ready' : index === 6 ? '' : value));
  const selected = sender.context.giftSelect_(rows,() => 0);
  assert.equal(selected.length,5);
  assert.equal(new Set(selected.map(item => item.account.mac)).size,5);
  assert.ok(selected.every(item => item.account.mac !== rows[1][2] && item.account.mac !== rows[2][2]));
});

test('an interrupted reservation is protected by its delivery record', () => {
  const sender = service({ bundles:[bundle('one'),bundle('two',10)] });
  const rows = sender.sheets.get('Gift accounts').rows;
  const records = [Array(6).fill('header'),['other@example.test','a'.repeat(32),'2,3,4,5,6','sending','2026-10-09','en']];
  const selected = sender.context.giftSelect_(rows,() => 0,records);
  assert.ok(selected.every(item => item.index >= 6));
});

test('fewer than five available accounts does not send a partial gift', () => {
  const sender = service({ bundles:[bundle('one').slice(0,4)] });
  assert.equal(sender.claim().status,'out_of_stock');
  assert.equal(sender.sent.length,0);
  assert.ok(sender.sheets.get('Gift accounts').rows.slice(1).every(row => row[5] === 'ready'));
});

test('an operator-approved retry keeps the original five random accounts', () => {
  const options = { mailError:true,bundles:[bundle('one'),bundle('two',10)] };
  const sender = service(options);
  assert.equal(sender.claim().status,'unavailable');
  const selection = sender.sheets.get('Deliveries').rows[1][2];
  sender.sheets.get('Deliveries').rows[1][3] = 'retry';
  options.mailError = false;
  assert.equal(sender.claim().status,'sent');
  assert.equal(sender.sheets.get('Deliveries').rows[1][2],selection);
});

test('importer removes expired and duplicate codes and keeps the later expiry', () => {
  const source = (mac,date) => 'Portal : https://portal.example.test/c/\nMAC Addr: ' + mac + '\nExp date: ' + date + '\nChannels: 1000\n\n';
  const result = parseGiftList(source('00:1A:79:00:00:01','January 1, 2030, 12:00 am') + source('00:1A:79:00:00:01','January 1, 2031, 12:00 am') + source('00:1A:79:00:00:02','January 1, 2020, 12:00 am'),{ now:Date.parse('2026-10-09T00:00:00Z') });
  assert.equal(result.summary.sourceEntries,3);
  assert.equal(result.summary.excludedExpired,1);
  assert.equal(result.summary.excludedDuplicateCodes,1);
  assert.equal(result.accounts.length,1);
  assert.equal(result.accounts[0].expires,'2030-12-31T23:00:00.000Z');
  assert.throws(() => parseGiftList('Unexpected instructions in input'),/Unexpected text/);
});

test('bot verification, honeypot, email validation and sender setup fail without sending', () => {
  for (const options of [{ verified:false },{ hostname:'attacker.example' }]) {
    const sender = service(options);
    assert.equal(sender.claim().status,'verification');
    assert.equal(sender.sent.length,0);
  }
  const sender = service();
  assert.equal(sender.claim('not-an-email').status,'invalid');
  assert.equal(sender.claim('=SUM(1)@example.test').status,'invalid');
  assert.equal(sender.claim('visitor@example.test',{ website:'spam' }).status,'invalid');
  sender.properties.delete('TURNSTILE_SECRET');
  assert.equal(sender.claim().status,'unavailable');
  assert.equal(sender.sent.length,0);
});

test('provider quota errors reserve for review; malformed accounts never send a partial gift', () => {
  const exhausted = service({ quota:0 });
  assert.equal(exhausted.claim().status,'unavailable');
  assert.equal(exhausted.sheets.get('Gift accounts').rows[1][5],'reserved');
  assert.equal(exhausted.sheets.get('Deliveries').rows[1][3],'review');
  assert.equal(exhausted.sent.length,0);
  const incomplete = bundle('bad');
  incomplete[0][2] = '';
  const sender = service({ bundles:[incomplete] });
  assert.equal(sender.claim().status,'out_of_stock');
  assert.equal(sender.sent.length,0);
});

test('mail errors reserve access and require review before retry', () => {
  const sender = service({ mailError:true });
  assert.equal(sender.claim().status,'unavailable');
  assert.equal(sender.sheets.get('Gift accounts').rows.filter(row => row[5] === 'reserved').length,5);
  assert.equal(sender.sheets.get('Deliveries').rows[1][3],'review');
  assert.equal(sender.claim().status,'unavailable');
  assert.equal(sender.claim('another@example.test').status,'out_of_stock');
});

test('the assignment lock prevents overlapping allocation', () => {
  let overlapping;
  const sender = service({ onSend(context) {
    overlapping = JSON.parse(context.doPost({ parameter:{ email:'overlap@example.test', request:'b'.repeat(32), turnstile:'valid', lang:'en' } }).text).status;
  } });
  assert.equal(sender.claim().status,'sent');
  assert.equal(overlapping,'unavailable');
  assert.equal(sender.sent.length,1);
});

test('receipt responses are read-only and contain no email or account details', () => {
  const sender = service();
  const claim = sender.claim();
  const receipt = sender.context.doGet({ parameter:{ request:claim.request, callback:'swiftGift_' + claim.request + '_0' } }).text;
  assert.match(receipt,/"status":"sent"/);
  assert.doesNotMatch(receipt,/example\.test|MAC|00:1A|portal/);
  const invalid = sender.context.doGet({ parameter:{ request:claim.request, callback:'alert(1);//' } }).text;
  assert.equal(JSON.parse(invalid).status,'invalid');
  assert.equal(sender.sent.length,1);
});

test('all six localized emails include the local setup guide and plans', () => {
  for (const language of ['en','fr','es','de','it','nl']) {
    const sender = service();
    assert.equal(sender.claim('visitor@example.test',{ lang:language }).status,'sent');
    const prefix = 'https://swiftchannels.com/' + (language === 'en' ? '' : language + '/');
    assert.ok(sender.sent[0].body.includes(prefix + 'install.html'));
    assert.ok(sender.sent[0].htmlBody.includes(prefix + '#plans'));
    assert.ok(sender.sent[0].htmlBody.includes('<strong>SwiftChannels</strong>'));
    assert.ok(sender.sent[0].htmlBody.includes('bgcolor="#050A18"'));
    assert.ok(sender.sent[0].htmlBody.includes('role="presentation"'));
    assert.ok(sender.sent[0].htmlBody.includes(sender.context.GIFT_EMAIL_COPY[language].emailHeading));
    assert.ok(sender.sent[0].htmlBody.includes(sender.context.GIFT_EMAIL_COPY[language].setup));
    assert.ok(sender.sent[0].htmlBody.includes('mailto:contact@swiftchannels.com'));
    assert.equal((sender.sent[0].htmlBody.match(/bgcolor="#0D162F"/g) || []).length,5);
    assert.equal(sender.sent[0].name,'SwiftChannels');
    assert.doesNotMatch(sender.sent[0].htmlBody,/background:white|#f3f5f8|Bouzarabdelouahd/i);
  }
});

test('email HTML escapes access data and preserves a plain-text alternative', () => {
  const sender = service();
  const account = { portal:'https://portal.example.test/c/?a=1&b=2',mac:'<unsafe>',expires:'2030-01-01T00:00:00Z',channels:'1000' };
  const email = sender.context.giftEmail_('visitor@example.test','en',[account],'<script>alert(1)</script>\nNext line');
  assert.ok(email.htmlBody.includes('a=1&amp;b=2'));
  assert.ok(email.htmlBody.includes('&lt;unsafe&gt;'));
  assert.ok(email.htmlBody.includes('&lt;script&gt;alert(1)&lt;/script&gt;<br>Next line'));
  assert.ok(!email.htmlBody.includes('<script>'));
  assert.ok(email.body.includes('MAC address: <unsafe>'));
});

test('initialization appends new accounts without changing delivered or reserved rows', () => {
  const sender = service();
  const rows = sender.sheets.get('Gift accounts').rows;
  rows[1][5] = 'sent'; rows[1][6] = 'delivered@example.test';
  rows[2][5] = 'reserved'; rows[2][6] = 'reserved@example.test';
  const original = JSON.stringify(rows);
  sender.context.GIFT_INSTALL_SETTINGS = { turnstileSecret:'private-test-secret',allowLocalPreview:true };
  sender.context.GIFT_INITIAL_ACCOUNTS = [...bundle('existing'),...bundle('new',20)].map(row => ({ id:row[0],portal:row[1],mac:row[2],expires:row[3],channels:row[4] }));
  assert.equal(sender.context.initializeGiftService().imported,5);
  assert.equal(JSON.stringify(rows.slice(0,6)),original);
  assert.equal(sender.context.initializeGiftService().imported,0);
  assert.equal(rows.length,11);
  assert.equal(sender.properties.get('GIFT_INITIALIZED'),'true');
  assert.equal(sender.properties.get('TURNSTILE_SECRET'),'private-test-secret');
  assert.equal(sender.sent.length,0);
});

test('initialization refuses missing settings and excludes expired or duplicate inventory', () => {
  const sender = service();
  assert.throws(() => sender.context.initializeGiftService(),/local setup helper/);
  const accounts = bundle('new',20).map(row => ({ id:row[0],portal:row[1],mac:row[2],expires:row[3],channels:row[4] }));
  accounts[0].expires = '2020-01-01T00:00:00Z';
  accounts.push({ ...accounts[1] },{ ...accounts[2],mac:'invalid' });
  assert.equal(sender.context.seedGiftInventory_(sender.sheets.get('Gift accounts'),accounts),4);
  sender.sheets.get('Gift accounts').rows[0][0] = 'unexpected';
  assert.throws(() => sender.context.seedGiftInventory_(sender.sheets.get('Gift accounts'),accounts),/headers/);
});

test('deployment readiness reveals only booleans and does not consume inventory', () => {
  const sender = service();
  const before = JSON.stringify([...sender.sheets.values()].map(sheet => sheet.rows));
  const health = () => JSON.parse(sender.context.doGet({ parameter:{ health:'1' } }).text);
  assert.deepEqual(health(),{ ready:false,available:false,senderReady:true });
  sender.properties.set('GIFT_INITIALIZED','true');
  assert.deepEqual(health(),{ ready:true,available:true,senderReady:true });
  assert.equal(JSON.stringify([...sender.sheets.values()].map(sheet => sheet.rows)),before);
  sender.sheets.get('Gift accounts').rows[1][5] = 'reserved';
  assert.deepEqual(health(),{ ready:true,available:false,senderReady:true });
  assert.equal(sender.sent.length,0);
});

test('Resend uses only the branded sender, private API key, HTML and text alternatives', () => {
  const sender = service();
  assert.equal(sender.claim().status,'sent');
  assert.equal(sender.sent[0].from,'SwiftChannels <gifts@swiftchannels.com>');
  assert.equal(sender.resendRequests[0].headers.Authorization,'Bearer re_test_key_1234567890');
  assert.match(sender.resendRequests[0].headers['Idempotency-Key'],/^swiftchannels-gift-[a-f0-9]{64}$/);
  assert.ok(!sender.resendRequests[0].headers['Idempotency-Key'].includes('visitor'));
});

test('the uploaded private Resend configuration works without a manual Google properties edit', () => {
  const sender = service();
  sender.properties.delete('RESEND_API_KEY');
  sender.context.GIFT_INSTALL_SETTINGS = { deliveryPaused:false,resendApiKey:'re_uploaded_private_key_1234567890',resendFrom:'gifts@swiftchannels.com' };
  assert.equal(sender.claim().status,'sent');
  assert.equal(sender.resendRequests[0].headers.Authorization,'Bearer re_uploaded_private_key_1234567890');
  assert.equal(sender.sent[0].from,'SwiftChannels <gifts@swiftchannels.com>');
});

test('missing keys, personal sending addresses and a paused sender fail before reserving accounts', () => {
  for (const mutate of [
    sender => sender.properties.delete('RESEND_API_KEY'),
    sender => sender.properties.set('RESEND_FROM','personal@gmail.com'),
    sender => { sender.context.GIFT_INSTALL_SETTINGS = { deliveryPaused:true }; }
  ]) {
    const sender = service();
    mutate(sender);
    sender.properties.set('GIFT_INITIALIZED','true');
    assert.equal(sender.claim().status,'unavailable');
    assert.equal(sender.sent.length,0);
    assert.equal(sender.resendRequests.length,0);
    assert.equal(sender.sheets.get('Gift accounts').rows[1][5],'ready');
    const health = JSON.parse(sender.context.doGet({ parameter:{ health:'1' } }).text);
    assert.equal(health.ready,false);
    assert.equal(health.senderReady,false);
  }
});

test('operator-approved retries reuse the idempotency key; rejected or malformed responses never confirm sending', () => {
  const options = { mailError:true };
  const sender = service(options);
  assert.equal(sender.claim().status,'unavailable');
  sender.sheets.get('Deliveries').rows[1][3] = 'retry';
  options.mailError = false;
  assert.equal(sender.claim().status,'sent');
  assert.equal(sender.resendRequests[0].headers['Idempotency-Key'],sender.resendRequests[1].headers['Idempotency-Key']);
  for (const failure of [{ resendStatus:401 },{ resendStatus:403 },{ resendStatus:500 },{ malformedResend:true }]) {
    const rejected = service(failure);
    assert.equal(rejected.claim().status,'unavailable');
    assert.equal(rejected.sent.length,0);
    assert.equal(rejected.sheets.get('Deliveries').rows[1][3],'review');
  }
});
