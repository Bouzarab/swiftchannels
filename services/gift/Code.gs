/* Deploy this in Google Apps Script. No account details belong in this repository. */
var GIFT_SHEET = 'Gift accounts';
var CLAIMS_SHEET = 'Deliveries';
var GIFT_HEADERS = ['Account ID','Portal','MAC','Expires at','Channels','State','Recipient','Sent at'];
var CLAIM_HEADERS = ['Email','Request ID','Account rows','State','Updated at','Language'];

function setupGiftService() {
  var properties = PropertiesService.getScriptProperties();
  var id = properties.getProperty('GIFT_SPREADSHEET_ID');
  var spreadsheet = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create('SwiftChannels private gifts');
  properties.setProperty('GIFT_SPREADSHEET_ID',spreadsheet.getId());
  [ [GIFT_SHEET,GIFT_HEADERS], [CLAIMS_SHEET,CLAIM_HEADERS] ].forEach(function (entry) {
    var sheet = spreadsheet.getSheetByName(entry[0]) || spreadsheet.insertSheet(entry[0]);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1,1,1,entry[1].length).setValues([entry[1]]);
      sheet.setFrozenRows(1);
    }
    sheet.getRange('A:H').setNumberFormat('@');
  });
  console.log('Private gift inventory: ' + spreadsheet.getUrl());
  return spreadsheet.getUrl();
}

function doGet(event) {
  var parameters = event && event.parameter || {};
  if (parameters.health === '1') return giftHealth_();
  var callback = String(parameters.callback || '');
  var request = String(parameters.request || '');
  if (!/^swiftGift_[a-f0-9]{32}_\d+$/.test(callback) || !/^[a-f0-9]{32}$/.test(request)) {
    return giftOutput_({ status:'invalid' });
  }
  // The receipt contains no email address, portal, MAC or other customer data.
  var status = CacheService.getScriptCache().get('gift-receipt-' + request) || 'pending';
  return ContentService.createTextOutput(callback + '(' + JSON.stringify({ status:status }) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function giftHealth_() {
  try {
    var properties = PropertiesService.getScriptProperties();
    var initialized = properties.getProperty('GIFT_INITIALIZED') === 'true' && Boolean(properties.getProperty('TURNSTILE_SECRET'));
    var senderReady = Boolean(giftSenderSettings_());
    if (!initialized) return giftOutput_({ ready:false, available:false, senderReady:senderReady });
    var spreadsheet = SpreadsheetApp.openById(properties.getProperty('GIFT_SPREADSHEET_ID'));
    var rows = spreadsheet.getSheetByName(GIFT_SHEET).getDataRange().getValues();
    var records = spreadsheet.getSheetByName(CLAIMS_SHEET).getDataRange().getValues();
    return giftOutput_({ ready:senderReady, available:giftSelect_(rows,function () { return 0; },records).length === 5, senderReady:senderReady });
  } catch (error) { return giftOutput_({ ready:false, available:false, senderReady:false }); }
}

function doPost(event) {
  var parameters = event && event.parameter || {};
  var request = String(parameters.request || '');
  if (!/^[a-f0-9]{32}$/.test(request)) return giftOutput_({ status:'invalid' });
  var lock;
  try {
    var email = String(parameters.email || '').trim().toLowerCase();
    if (parameters.website || email.length > 254 || !/^[a-z0-9][a-z0-9.!#$%&'*+/=?^_`{|}~-]*@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(email)) {
      return giftReceipt_(request,'invalid');
    }
    var properties = PropertiesService.getScriptProperties();
    if (!properties.getProperty('GIFT_SPREADSHEET_ID') || !properties.getProperty('TURNSTILE_SECRET') || !giftSenderSettings_()) {
      return giftReceipt_(request,'unavailable');
    }
    if (!giftVerify_(String(parameters.turnstile || ''),properties.getProperty('TURNSTILE_SECRET'))) {
      return giftReceipt_(request,'verification');
    }
    lock = LockService.getScriptLock();
    if (!lock.tryLock(15000)) return giftReceipt_(request,'unavailable');
    var spreadsheet = SpreadsheetApp.openById(properties.getProperty('GIFT_SPREADSHEET_ID'));
    var inventory = spreadsheet.getSheetByName(GIFT_SHEET);
    var claims = spreadsheet.getSheetByName(CLAIMS_SHEET);
    if (!inventory || !claims) return giftReceipt_(request,'unavailable');
    var language = Object.prototype.hasOwnProperty.call(GIFT_EMAIL_COPY,parameters.lang) ? parameters.lang : 'en';
    var records = claims.getDataRange().getValues();
    var previous = records.findIndex(function (row,index) { return index > 0 && row[0] === email; });
    if (previous >= 0 && records[previous][3] === 'sent') return giftReceipt_(request,'already_sent');
    // A crash after sending requires review; do not automatically send a second email.
    if (previous >= 0 && records[previous][3] !== 'retry') return giftReceipt_(request,'unavailable');
    var rows = inventory.getDataRange().getValues();
    var selected;
    if (previous >= 0) {
      selected = String(records[previous][2]).split(',').map(function (number) {
        var index = Number(number) - 1;
        return { index:index, account:rows[index] ? giftAccount_(rows[index]) : null };
      });
      if (selected.length !== 5 || selected.some(function (item) {
        return item.index < 1 || !item.account || rows[item.index][6] !== email || rows[item.index][5] !== 'reserved';
      }) || new Set(selected.map(function (item) { return item.account.mac; })).size !== 5) return giftReceipt_(request,'unavailable');
      if (selected.some(function (item) { return Date.parse(item.account.expires) <= Date.now(); })) return giftReceipt_(request,'unavailable');
    } else {
      selected = giftSelect_(rows,Math.random,records);
      if (selected.length !== 5) return giftReceipt_(request,'out_of_stock');
    }
    var accounts = selected.map(function (item) { return item.account; });
    var claimRow = previous >= 0 ? previous + 1 : claims.getLastRow() + 1;
    // Store the selection first; retries keep these same five accounts.
    claims.getRange(claimRow,1,1,6).setValues([[email,request,selected.map(function (item) { return item.index + 1; }).join(','),'sending',new Date().toISOString(),language]]);
    selected.forEach(function (item) { inventory.getRange(item.index + 1,6,1,3).setValues([['reserved',email,'']]); });
    SpreadsheetApp.flush();
    try {
      giftSend_(giftEmail_(email,language,accounts,GIFT_EMAIL_COPY[language].setupNote));
    } catch (error) {
      claims.getRange(claimRow,4).setValue('review');
      // Keep the five accounts reserved while the operator checks delivery.
      return giftReceipt_(request,'unavailable');
    }
    claims.getRange(claimRow,4,1,2).setValues([['sent',new Date().toISOString()]]);
    selected.forEach(function (item) { inventory.getRange(item.index + 1,6,1,3).setValues([['sent',email,new Date().toISOString()]]); });
    SpreadsheetApp.flush();
    return giftReceipt_(request,'sent');
  } catch (error) {
    return giftReceipt_(request,'unavailable');
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function giftSenderSettings_() {
  var settings = typeof GIFT_INSTALL_SETTINGS === 'undefined' ? {} : GIFT_INSTALL_SETTINGS;
  if (settings.deliveryPaused) return null;
  var properties = PropertiesService.getScriptProperties();
  var key = settings.resendApiKey || properties.getProperty('RESEND_API_KEY') || '';
  var from = settings.resendFrom || properties.getProperty('RESEND_FROM') || 'gifts@swiftchannels.com';
  if (!/^re_[a-zA-Z0-9_-]{16,200}$/.test(key) || !/^[a-z0-9][a-z0-9._+-]*@swiftchannels\.com$/i.test(from)) return null;
  return { key:key, from:from };
}

function giftSend_(message) {
  var sender = giftSenderSettings_();
  if (!sender) throw new Error('Resend is not configured. Personal Gmail sending is disabled.');
  // A stable hash protects approved retries within Resend's retention window without logging the address in the key.
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,'swiftchannels-gift:' + message.to,Utilities.Charset.UTF_8);
  var key = digest.map(function (value) { return ('0' + (value & 255).toString(16)).slice(-2); }).join('');
  var response = UrlFetchApp.fetch('https://api.resend.com/emails',{
    method:'post', contentType:'application/json', muteHttpExceptions:true,
    headers:{ Authorization:'Bearer ' + sender.key, 'Idempotency-Key':'swiftchannels-gift-' + key },
    payload:JSON.stringify({ from:'SwiftChannels <' + sender.from + '>', to:[message.to], reply_to:message.replyTo, subject:message.subject, html:message.htmlBody, text:message.body })
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) throw new Error('Resend did not accept the gift email. Review the delivery before retrying.');
  var result = JSON.parse(response.getContentText());
  if (!result || typeof result.id !== 'string' || !result.id) throw new Error('Resend did not confirm email acceptance.');
}

function giftVerify_(token,secret) {
  if (!token || token.length > 2048) return false;
  var response = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
    method:'post', payload:{ secret:secret, response:token }, muteHttpExceptions:true
  });
  if (response.getResponseCode() !== 200) return false;
  var result = JSON.parse(response.getContentText());
  var properties = PropertiesService.getScriptProperties();
  var hosts = ['swiftchannels.com','www.swiftchannels.com'];
  if (properties.getProperty('ALLOW_LOCAL_PREVIEW') === 'true') hosts.push('localhost');
  return result.success === true && result.action === 'gift' && hosts.indexOf(result.hostname) >= 0;
}

function giftAccount_(row) {
  var portal = String(row[1] || '').trim();
  var mac = String(row[2] || '').trim().toUpperCase();
  var expires = row[3] instanceof Date ? row[3].toISOString() : String(row[3] || '').trim();
  var channels = String(row[4] || '').trim();
  if (!/^https?:\/\/[^\s<>"']+$/i.test(portal) || !/^(?:[A-F0-9]{2}:){5}[A-F0-9]{2}$/.test(mac) || !Number.isFinite(Date.parse(expires)) || !/^\d+$/.test(channels)) return null;
  return { portal:portal, mac:mac, expires:expires, channels:channels };
}

function giftSelect_(rows,random,records) {
  var used = new Set();
  rows.slice(1).forEach(function (row) { if (row[6] || ['reserved','sent'].indexOf(String(row[5]).toLowerCase()) >= 0) used.add(String(row[2]).trim().toUpperCase()); });
  // The delivery record also protects selections if a sheet write was interrupted.
  (records || []).slice(1).forEach(function (record) {
    String(record[2]).split(',').forEach(function (number) {
      var row = rows[Number(number) - 1];
      if (row) used.add(String(row[2]).trim().toUpperCase());
    });
  });
  var eligible = [];
  rows.forEach(function (row,index) {
    if (index < 1 || String(row[5]).toLowerCase() !== 'ready' || row[6]) return;
    var account = giftAccount_(row);
    if (!account || Date.parse(account.expires) <= Date.now() || used.has(account.mac)) return;
    used.add(account.mac);
    eligible.push({ index:index, account:account });
  });
  if (eligible.length < 5) return [];
  // Partial Fisher-Yates gives five distinct, uniformly sampled accounts.
  for (var index = 0; index < 5; index++) {
    var target = index + Math.floor(random() * (eligible.length - index));
    var swap = eligible[index];
    eligible[index] = eligible[target];
    eligible[target] = swap;
  }
  return eligible.slice(0,5);
}

function giftEmail_(email,language,accounts,notes) {
  var copy = GIFT_EMAIL_COPY[language];
  var base = 'https://swiftchannels.com/' + (language === 'en' ? '' : language + '/');
  var body = copy.emailIntro + '\n\n' + accounts.map(function (account,index) {
    return copy.account + ' ' + (index + 1) + '\n' + copy.portal + ': ' + account.portal + '\n' + copy.mac + ': ' + account.mac + '\n' + copy.expiry + ': ' + account.expires + '\n' + copy.channels + ': ' + account.channels;
  }).join('\n\n') + '\n\n' + copy.notes + '\n' + notes + '\n\n' + copy.emailClose + '\n\n' + base + 'install.html\n' + base + '#plans';
  var sections = accounts.map(function (account,index) {
    var expiry = new Date(account.expires).toISOString();
    return [
      '<tr><td style="padding:0 0 16px">',
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#0D162F" style="width:100%;table-layout:fixed;background-color:#0D162F;border:1px solid #1B2C54;border-radius:8px">',
      '<tr><td class="account-pad" style="padding:22px 24px">',
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>',
      '<td width="36" valign="middle" style="width:36px;color:#49D9FF;font:700 13px/1.5 monospace">' + String(index + 1).padStart(2,'0') + '</td>',
      '<td><h2 style="margin:0;color:#E9EFFC;font:700 18px/1.4 Sora,Arial,sans-serif">' + giftEscape_(copy.account) + ' ' + (index + 1) + '</h2></td></tr></table>',
      '<p style="margin:18px 0 5px;color:#93A6CC;font-size:12px;line-height:1.5">' + giftEscape_(copy.portal) + '</p>',
      '<a href="' + giftEscape_(account.portal) + '" style="display:block;color:#49D9FF;font-size:14px;line-height:1.7;text-decoration:underline;overflow-wrap:anywhere;word-break:break-all">' + giftEscape_(account.portal) + '</a>',
      '<p style="margin:18px 0 5px;color:#93A6CC;font-size:12px;line-height:1.5">' + giftEscape_(copy.mac) + '</p>',
      '<p style="margin:0 0 20px;color:#E9EFFC;font:700 20px/1.5 \'JetBrains Mono\',Consolas,monospace"><strong>' + giftEscape_(account.mac) + '</strong></p>',
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;border-top:1px solid #1B2C54"><tr>',
      '<td width="65%" valign="top" style="padding-top:14px"><p style="margin:0 0 5px;color:#93A6CC;font-size:12px">' + giftEscape_(copy.expiry) + '</p>',
      '<p style="margin:0;color:#E9EFFC;font-size:14px;line-height:1.6">' + expiry.slice(0,10) + '<br><span style="color:#93A6CC;font-size:12px">' + expiry.slice(11,16) + ' UTC</span></p></td>',
      '<td width="35%" valign="top" align="right" style="padding-top:14px"><p style="margin:0 0 5px;color:#93A6CC;font-size:12px;overflow-wrap:anywhere">' + giftEscape_(copy.channels) + '</p>',
      '<p style="margin:0;color:#E9EFFC;font-size:18px;font-weight:700;line-height:1.6">' + giftEscape_(Number(account.channels).toLocaleString(language)) + '</p></td></tr></table>',
      '</td></tr></table></td></tr>'
    ].join('');
  }).join('');
  // Inline colors and presentation tables keep the email usable without client CSS support.
  var html = [
    '<!DOCTYPE html><html lang="' + language + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    '<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><title>' + giftEscape_(copy.subject) + '</title>',
    '<style>body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table{border-collapse:separate;mso-table-lspace:0;mso-table-rspace:0}body{color-scheme:dark}img{border:0;outline:none;text-decoration:none}a{overflow-wrap:anywhere}@media only screen and (max-width:600px){.email-edge{padding:12px!important}.email-pad{padding:24px 12px!important}.account-pad{padding:18px!important}.email-heading{font-size:28px!important}.email-button{padding:14px 16px!important}}</style></head>',
    '<body bgcolor="#050A18" style="margin:0;padding:0;width:100%;background-color:#050A18;color:#E9EFFC;font:16px/1.7 Inter,Arial,sans-serif;letter-spacing:0">',
    '<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">' + giftEscape_(copy.emailIntro) + '</div>',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#050A18" style="width:100%;background-color:#050A18"><tr><td class="email-edge" align="center" style="padding:24px">',
    '<!--[if mso]><table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;table-layout:fixed"><tr><td class="email-pad" style="padding:24px">',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-bottom:1px solid #1B2C54"><tr>',
    '<td width="46" style="width:46px;padding-bottom:24px"><img src="https://swiftchannels.com/assets/email-mark.png" alt="" width="32" height="32" style="display:block;width:32px;height:32px"></td>',
    '<td style="padding-bottom:24px;color:#E9EFFC;font:700 20px/1.4 Sora,Arial,sans-serif"><strong>SwiftChannels</strong></td></tr></table>',
    '<h1 class="email-heading" style="margin:32px 0 12px;color:#E9EFFC;font:700 34px/1.2 Sora,Arial,sans-serif;overflow-wrap:anywhere">' + giftEscape_(copy.emailHeading) + '</h1>',
    '<p style="margin:0 0 28px;color:#93A6CC;font-size:15px;line-height:1.8">' + giftEscape_(copy.emailIntro) + '</p>',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed">' + sections + '</table>',
    '<h2 style="margin:20px 0 10px;color:#E9EFFC;font:700 20px/1.4 Sora,Arial,sans-serif">' + giftEscape_(copy.notes) + '</h2>',
    '<p style="margin:0 0 16px;color:#93A6CC;font-size:14px;line-height:1.8">' + giftEscape_(notes).replace(/\r?\n/g,'<br>') + '</p>',
    '<p style="margin:0 0 24px;font-size:14px;line-height:1.7"><a href="' + base + 'install.html" style="color:#49D9FF;text-decoration:underline">' + giftEscape_(copy.setup) + '</a></p>',
    '<p style="margin:0;color:#93A6CC;font-size:14px;line-height:1.8">' + giftEscape_(copy.emailClose) + '</p>',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:28px 0 32px">',
    '<a class="email-button" href="' + base + '#plans" style="display:inline-block;max-width:100%;box-sizing:border-box;padding:15px 24px;background-color:#2F6BFF;border:1px solid #5A8CFF;border-radius:6px;color:#FFFFFF;text-decoration:none;text-align:center;font-size:14px;font-weight:700;line-height:1.5;overflow-wrap:anywhere">' + giftEscape_(copy.emailPlans) + '</a>',
    '</td></tr></table>',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #1B2C54"><tr><td style="padding-top:24px">',
    '<p style="margin:0 0 12px;color:#93A6CC;font-size:12px;line-height:1.8">' + giftEscape_(copy.privacy) + '</p>',
    '<p style="margin:0;color:#93A6CC;font-size:12px;line-height:1.8"><a href="https://swiftchannels.com" style="color:#93A6CC;text-decoration:none">swiftchannels.com</a><br>',
    '<a href="mailto:contact@swiftchannels.com" style="color:#49D9FF;text-decoration:none">contact@swiftchannels.com</a></p>',
    '</td></tr></table></td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>'
  ].join('');
  return { to:email, subject:copy.subject, body:body, htmlBody:html, name:'SwiftChannels', replyTo:'contact@swiftchannels.com' };
}

function giftReceipt_(request,status) {
  CacheService.getScriptCache().put('gift-receipt-' + request,status,600);
  return giftOutput_({ status:status });
}

function giftOutput_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function giftEscape_(value) {
  return String(value).replace(/[&<>"']/g,function (char) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]; });
}
