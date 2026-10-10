const fs = require('fs');
const path = require('path');
const { COPY,EMAIL_KEYS } = require('./gift-copy');

const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
const languageNames = { en:'English', fr:'Français', es:'Español', de:'Deutsch', it:'Italiano', nl:'Nederlands' };
const closeLabels = { en:'Close', fr:'Fermer', es:'Cerrar', de:'Schließen', it:'Chiudi', nl:'Sluiten' };

function buildGift({ ROOT, SITE, LANGS }) {
  const urls = LANGS.map(language => ({ ...language, url:`${SITE}/${language.folder ? language.folder + '/' : ''}gift/` }));
  const sitemap = [];
  for (const language of urls) {
    const copy = COPY[language.code];
    const root = language.folder ? '../../' : '../';
    const home = '../';
    const alternates = urls.map(other => `<link rel="alternate" hreflang="${other.code}" href="${other.url}">`).join('\n');
    const switcher = urls.map(other => `<a class="lang-b" href="${root}${other.folder ? other.folder + '/' : ''}gift/" hreflang="${other.code}" aria-current="${other.code === language.code}" title="${esc(languageNames[other.code])}"><img src="${root}assets/flag-${other.code}.webp" alt="" width="26" height="26"><span>${esc(languageNames[other.code])}</span></a>`).join('');
    const schema = { '@context':'https://schema.org', '@graph':[
      { '@type':'WebPage', '@id':language.url + '#webpage', url:language.url, name:copy.title, description:copy.description, inLanguage:language.code, isPartOf:{ '@id':SITE + '/#website' }, publisher:{ '@id':SITE + '/#organization' } },
      { '@type':'BreadcrumbList', itemListElement:[{ '@type':'ListItem', position:1, name:'SwiftChannels', item:SITE + '/' + (language.folder ? language.folder + '/' : '') }, { '@type':'ListItem', position:2, name:copy.title, item:language.url }] }
    ] };
    const clientCopy = Object.fromEntries(['send','sending','unavailable','verification','sent','already','empty','busy','timeout','invalid','successBody'].map(key => [key,copy[key]]));
    const html = `<!DOCTYPE html>
<html lang="${language.code}" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(copy.title)}</title>
<meta name="description" content="${esc(copy.description)}">
<meta name="theme-color" content="#050A18">
<link rel="canonical" href="${language.url}">
${alternates}
<link rel="alternate" hreflang="x-default" href="${urls[0].url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SwiftChannels">
<meta property="og:url" content="${language.url}">
<meta property="og:title" content="${esc(copy.title)}">
<meta property="og:description" content="${esc(copy.description)}">
<meta property="og:image" content="${SITE}/assets/og-card.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(copy.title)}">
<meta name="twitter:description" content="${esc(copy.description)}">
<meta name="twitter:image" content="${SITE}/assets/og-card.jpg">
<link rel="icon" href="${root}favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}assets/seo.css">
<link rel="stylesheet" href="${root}assets/gift.css">
<script type="application/ld+json">${json(schema)}</script>
</head>
<body>
<nav class="top" aria-label="SwiftChannels"><a class="brand" href="${home}"><span class="brand-mark"></span><b>Swift<span>Channels</span></b></a><div class="links"><a href="${home}#plans">${esc(copy.plans)}</a><a href="${home}install.html">${esc(copy.setup)}</a><a href="${home}blog/">Blog</a></div><div class="lang"><button class="lang-cur" id="langCur" type="button" aria-label="${esc(languageNames[language.code])}" aria-expanded="false" aria-controls="langOpts"><img src="${root}assets/flag-${language.code}.webp" alt="" width="32" height="32"></button><div class="lang-opts" id="langOpts">${switcher}</div></div></nav>
<main>
  <section class="gift-main" aria-labelledby="giftHeading">
    <span class="gift-label">${esc(copy.label)}</span>
    <h1 id="giftHeading">${esc(copy.h1)}</h1>
    <p class="gift-intro">${esc(copy.intro)}</p>
    <div class="gift-facts">${copy.facts.map(fact => `<span>${esc(fact)}</span>`).join('')}</div>
    <form class="gift-form" id="giftForm" method="post">
      <label for="giftEmail">${esc(copy.email)}</label>
      <div class="gift-input-row"><input id="giftEmail" name="email" type="email" autocomplete="email" inputmode="email" maxlength="254" required aria-describedby="giftPrivacy giftStatus"><button class="btn" id="giftSend" type="submit" disabled>${esc(copy.send)}</button></div>
      <div class="gift-trap" aria-hidden="true"><label for="giftWebsite">Website</label><input id="giftWebsite" name="website" type="text" tabindex="-1" autocomplete="off"></div>
      <p class="gift-privacy" id="giftPrivacy">${esc(copy.privacy)} <a href="#gift-data">${esc(copy.privacyLink)}</a>.</p>
      <div id="giftChallenge"></div>
      <p class="gift-status" id="giftStatus" role="status" aria-live="polite">${esc(copy.unavailable)}</p>
    </form>
    <noscript><p>${esc(copy.unavailable)}</p></noscript>
    <div class="gift-success" id="giftSuccess" hidden tabindex="-1"><h2>${esc(copy.successTitle)}</h2><p id="giftSuccessText"></p><a href="${home}install.html">${esc(copy.setup)}</a></div>
  </section>
  <section class="gift-media" aria-label="SwiftChannels"><img src="${root}assets/hero-wall.webp" alt="" width="1000" height="1000" loading="lazy"><p>${esc(copy.media)}</p></section>
  <div class="gift-links"><a href="${home}#plans">${esc(copy.plans)}</a><a href="${home}blog/">${esc(copy.blog)}</a></div>
</main>
<footer><b>SwiftChannels</b><a href="${home}">${esc(copy.home)}</a><a href="${home}install.html">${esc(copy.setup)}</a><a href="${home}legal.html">${esc(copy.terms)}</a><a href="mailto:contact@swiftchannels.com">contact@swiftchannels.com</a></footer>
<dialog class="gift-policy" id="gift-data" aria-labelledby="giftPolicyHeading"><h2 id="giftPolicyHeading">${esc(copy.privacyLink)}</h2><p>${esc(copy.questions[3][1])}</p><form method="dialog"><button class="btn" type="submit">${esc(closeLabels[language.code])}</button></form></dialog>
<script id="giftCopy" type="application/json">${json(clientCopy)}</script>
<script src="${root}assets/gift-config.js"></script>
<script src="${root}assets/gift.js"></script>
</body>
</html>
`;
    const directory = path.join(ROOT, language.folder, 'gift');
    fs.mkdirSync(directory, { recursive:true });
    fs.writeFileSync(path.join(directory,'index.html'), html, 'utf8');
    sitemap.push(`  <url>\n    <loc>${language.url}</loc>\n${urls.map(other => `    <xhtml:link rel="alternate" hreflang="${other.code}" href="${other.url}"/>`).join('\n')}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${urls[0].url}"/>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`);
  }
  const emailCopy = Object.fromEntries(Object.entries(COPY).map(([lang,copy]) => [lang,Object.fromEntries(EMAIL_KEYS.map(key => [key,copy[key]]))]));
  const serverDirectory = path.join(ROOT,'services/gift');
  fs.mkdirSync(serverDirectory, { recursive:true });
  fs.writeFileSync(path.join(serverDirectory,'EmailCopy.gs'), `// Generated from scripts/gift-copy.js.\nvar GIFT_EMAIL_COPY = ${JSON.stringify(emailCopy,null,2)};\n`, 'utf8');
  return { sitemap:sitemap.join('\n') };
}

module.exports = { buildGift };
