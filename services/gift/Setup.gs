function initializeGiftService() {
  if (typeof GIFT_INSTALL_SETTINGS === 'undefined' || !GIFT_INSTALL_SETTINGS.turnstileSecret) {
    throw new Error('Complete the local setup helper before initializing the sender.');
  }
  if (typeof GIFT_INITIAL_ACCOUNTS === 'undefined') throw new Error('The private account inventory has not been uploaded.');
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('The sender is busy. Run initialization again shortly.');
  try {
    var properties = PropertiesService.getScriptProperties();
    properties.setProperty('TURNSTILE_SECRET',GIFT_INSTALL_SETTINGS.turnstileSecret);
    properties.setProperty('ALLOW_LOCAL_PREVIEW',GIFT_INSTALL_SETTINGS.allowLocalPreview ? 'true' : 'false');
    setupGiftService();
    var spreadsheet = SpreadsheetApp.openById(properties.getProperty('GIFT_SPREADSHEET_ID'));
    var imported = seedGiftInventory_(spreadsheet.getSheetByName(GIFT_SHEET),GIFT_INITIAL_ACCOUNTS);
    properties.setProperty('GIFT_INITIALIZED','true');
    console.log('Gift sender initialized. New accounts imported: ' + imported + '.');
    return { initialized:true, imported:imported };
  } finally { lock.releaseLock(); }
}

function seedGiftInventory_(sheet,accounts) {
  var existing = sheet.getDataRange().getValues();
  if (JSON.stringify(existing[0]) !== JSON.stringify(GIFT_HEADERS)) throw new Error('The inventory headers do not match the prepared sender.');
  var known = new Set(existing.slice(1).map(function (row) { return String(row[2]).trim().toUpperCase(); }));
  var additions = [];
  accounts.forEach(function (account) {
    var row = [account.id,account.portal,account.mac,account.expires,account.channels,'ready','',''];
    var valid = giftAccount_(row);
    if (!valid || Date.parse(valid.expires) <= Date.now() || known.has(valid.mac)) return;
    known.add(valid.mac);
    additions.push(row);
  });
  if (additions.length) {
    var target = sheet.getRange(sheet.getLastRow() + 1,1,additions.length,GIFT_HEADERS.length);
    target.setNumberFormat('@');
    target.setValues(additions);
    SpreadsheetApp.flush();
  }
  return additions.length;
}
