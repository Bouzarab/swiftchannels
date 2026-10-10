const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function buildEmailPreviews() {
  const root = path.resolve(__dirname,'..');
  const context = vm.createContext({});
  for (const file of ['EmailCopy.gs','Code.gs']) vm.runInContext(fs.readFileSync(path.join(root,'services/gift',file),'utf8'),context);
  const accounts = Array.from({ length:5 },(_,index) => ({
    portal:'https://portal.example.test/c/',mac:'00:1A:79:00:00:' + String(index + 1).padStart(2,'0'),
    expires:'2030-01-01T00:00:00.000Z',channels:String(10000 + index * 1000)
  }));
  const directory = path.join(root,'notes');
  fs.mkdirSync(directory,{ recursive:true });
  for (const language of Object.keys(context.GIFT_EMAIL_COPY)) {
    const email = context.giftEmail_('preview@example.test',language,accounts,context.GIFT_EMAIL_COPY[language].setupNote);
    const filename = 'gift-email-preview' + (language === 'en' ? '' : '-' + language) + '.html';
    fs.writeFileSync(path.join(directory,filename),email.htmlBody,'utf8');
  }
  console.log('Generated six local email previews with fictional accounts. No emails sent.');
}

if (require.main === module) buildEmailPreviews();
module.exports = { buildEmailPreviews };
