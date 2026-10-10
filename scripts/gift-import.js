const fs = require('node:fs');
const path = require('node:path');

const HEADERS = ['Account ID','Portal','MAC','Expires at','Channels','State','Recipient','Sent at'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function parseExpiry(value,utcOffsetMinutes) {
  const match = /^(\w+) (\d{1,2}), (\d{4}), (\d{1,2}):(\d{2}) (am|pm)$/i.exec(value.trim());
  if (!match) throw new Error('Unrecognized expiry format.');
  const month = MONTHS.findIndex(name => name.toLowerCase() === match[1].toLowerCase());
  const day = Number(match[2]), year = Number(match[3]), hour = Number(match[4]), minute = Number(match[5]);
  if (month < 0 || hour < 1 || hour > 12 || minute > 59) throw new Error('Invalid expiry date.');
  const convertedHour = hour % 12 + (match[6].toLowerCase() === 'pm' ? 12 : 0);
  const local = new Date(Date.UTC(year,month,day,convertedHour,minute));
  if (local.getUTCMonth() !== month || local.getUTCDate() !== day) throw new Error('Invalid expiry date.');
  return new Date(local.getTime() - utcOffsetMinutes * 60000).toISOString();
}

function parseGiftList(text,{ now = Date.now(), utcOffsetMinutes = 60 } = {}) {
  const records = [];
  let current = null;
  for (const line of text.replace(/^\uFEFF/,'').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const field = /^\s*(Portal|MAC Addr|Exp date|Channels)\s*:\s*(.*?)\s*$/.exec(line);
    if (!field) throw new Error('Unexpected text in account list.');
    if (field[1] === 'Portal') { if (current) records.push(current); current = {}; }
    if (!current || Object.hasOwn(current,field[1])) throw new Error('Missing or repeated account field.');
    current[field[1]] = field[2];
  }
  if (current) records.push(current);
  const eligible = new Map();
  let expired = 0, duplicates = 0;
  records.forEach((record,index) => {
    const mac = String(record['MAC Addr'] || '').toUpperCase();
    const portal = record.Portal || '';
    const channels = record.Channels || '';
    if (!/^https?:\/\/[^\s<>"']+$/i.test(portal) || !/^(?:[A-F0-9]{2}:){5}[A-F0-9]{2}$/.test(mac) || !/^\d+$/.test(channels)) throw new Error('Invalid account entry ' + (index + 1) + '.');
    let expires;
    try { expires = parseExpiry(record['Exp date'] || '',utcOffsetMinutes); }
    catch (error) { throw new Error('Invalid expiry in entry ' + (index + 1) + '.'); }
    if (Date.parse(expires) <= now) { expired++; return; }
    const account = { portal,mac,expires,channels };
    if (eligible.has(mac)) {
      duplicates++;
      if (Date.parse(expires) > Date.parse(eligible.get(mac).expires)) eligible.set(mac,account);
    } else eligible.set(mac,account);
  });
  const accounts = [...eligible.values()];
  return { accounts, summary:{ sourceEntries:records.length, excludedExpired:expired, excludedDuplicateCodes:duplicates, usableDatedEntries:accounts.length, giftsOfFive:Math.floor(accounts.length / 5), expiryUtcOffsetMinutes:utcOffsetMinutes } };
}

function csvCell(value) { return '"' + String(value).replace(/"/g,'""') + '"'; }

function importGiftList(source,output,options) {
  const root = fs.realpathSync(path.join(__dirname,'..'));
  const target = path.resolve(output);
  const directory = path.dirname(target);
  if (target === root || target.startsWith(root + path.sep)) throw new Error('Private accounts must be written outside the website repository.');
  fs.mkdirSync(directory,{ recursive:true,mode:0o700 });
  const realDirectory = fs.realpathSync(directory);
  if (realDirectory === root || realDirectory.startsWith(root + path.sep)) throw new Error('Private accounts must be written outside the website repository.');
  const result = parseGiftList(fs.readFileSync(source,'utf8'),options);
  const rows = result.accounts.map((account,index) => ['gift-' + String(index + 1).padStart(4,'0'),account.portal,account.mac,account.expires,account.channels,'ready','','']);
  const csv = [HEADERS,...rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
  const safeTarget = path.join(realDirectory,path.basename(target));
  if (fs.existsSync(safeTarget) && fs.lstatSync(safeTarget).isSymbolicLink()) throw new Error('Private export cannot overwrite a symbolic link.');
  fs.writeFileSync(safeTarget,csv,{ encoding:'utf8',mode:0o600 });
  fs.chmodSync(safeTarget,0o600);
  return { ...result.summary,privateFile:safeTarget };
}

if (require.main === module) {
  try {
    const source = process.argv[2];
    if (!source) throw new Error('Provide the local account-list path.');
    const output = process.argv[3] || path.join(path.dirname(path.resolve(source)),'SwiftChannels-private-gifts','accounts.csv');
    console.log(JSON.stringify(importGiftList(source,output),null,2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { parseGiftList,parseExpiry,importGiftList };
