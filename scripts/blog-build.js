const fs = require('fs');
const path = require('path');

const LABELS = {
  en: {
    blog: 'Blog', home: 'Home', channels: 'Channels', setup: 'Setup', order: 'Order now',
    intro: 'Films, series and watch-next guides selected around strong IMDb ratings.',
    upcoming: 'No articles are published yet.', read: 'Read article',
    published: 'Published', imdb: 'IMDb rating', minutes: 'min read',
    footer: 'Free 24-hour test, 8,000+ live channels, and a large film and series library.',
    rss: 'RSS feed', cta: 'Watch it via SwiftChannels IPTV', related: 'Keep exploring',
    relPlans: 'Compare SwiftChannels plans', relChannels: 'See the full channel list', relSetup: 'Open the setup guide', relFaq: 'Read the IPTV FAQ',
    about: 'About', faq: 'FAQ', terms: 'Terms'
  },
  fr: {
    blog: 'Blog', home: 'Accueil', channels: 'Chaînes', setup: 'Installation', order: 'Commander',
    intro: 'Films, séries et idées à regarder ensuite, choisis autour de bonnes notes IMDb.',
    upcoming: 'Aucun article publié pour le moment.', read: "Lire l'article",
    published: 'Publié', imdb: 'Note IMDb', minutes: 'min de lecture',
    footer: 'Test gratuit de 24 heures, 8 000+ chaînes en direct et une grande bibliothèque films et séries.',
    rss: 'Flux RSS', cta: 'Le regarder via SwiftChannels IPTV', related: 'Continuer à explorer',
    relPlans: 'Comparer les offres SwiftChannels', relChannels: 'Voir la liste des chaînes', relSetup: 'Ouvrir le guide d’installation', relFaq: 'Lire la FAQ IPTV',
    about: 'À propos', faq: 'FAQ', terms: 'Conditions'
  },
  es: {
    blog: 'Blog', home: 'Inicio', channels: 'Canales', setup: 'Instalación', order: 'Pedir ahora',
    intro: 'Películas, series y guías para seguir viendo, elegidas con buenas puntuaciones IMDb.',
    upcoming: 'Todavía no hay artículos publicados.', read: 'Leer artículo',
    published: 'Publicado', imdb: 'Puntuación IMDb', minutes: 'min de lectura',
    footer: 'Prueba gratis de 24 horas, más de 8.000 canales en vivo y una gran biblioteca de películas y series.',
    rss: 'RSS', cta: 'Verlo vía SwiftChannels IPTV', related: 'Seguir explorando',
    relPlans: 'Comparar planes SwiftChannels', relChannels: 'Ver la lista de canales', relSetup: 'Abrir la guía de instalación', relFaq: 'Leer la FAQ IPTV',
    about: 'Sobre nosotros', faq: 'FAQ', terms: 'Términos'
  },
  de: {
    blog: 'Blog', home: 'Start', channels: 'Sender', setup: 'Einrichtung', order: 'Jetzt bestellen',
    intro: 'Filme, Serien und Watch-next-Guides, ausgewählt nach starken IMDb-Bewertungen.',
    upcoming: 'Noch keine Artikel veröffentlicht.', read: 'Artikel lesen',
    published: 'Veröffentlicht', imdb: 'IMDb-Bewertung', minutes: 'Min. Lesezeit',
    footer: 'Kostenloser 24-Stunden-Test, 8.000+ Live-Sender und eine große Film- und Serienbibliothek.',
    rss: 'RSS-Feed', cta: 'Über SwiftChannels IPTV ansehen', related: 'Weiter ansehen',
    relPlans: 'SwiftChannels Tarife vergleichen', relChannels: 'Vollständige Senderliste ansehen', relSetup: 'Einrichtungsanleitung öffnen', relFaq: 'IPTV FAQ lesen',
    about: 'Über uns', faq: 'FAQ', terms: 'AGB'
  },
  it: {
    blog: 'Blog', home: 'Home', channels: 'Canali', setup: 'Configurazione', order: 'Ordina ora',
    intro: 'Film, serie e guide su cosa vedere dopo, scelti con forti valutazioni IMDb.',
    upcoming: 'Nessun articolo pubblicato per ora.', read: "Leggi l'articolo",
    published: 'Pubblicato', imdb: 'Valutazione IMDb', minutes: 'min di lettura',
    footer: 'Prova gratuita di 24 ore, oltre 8.000 canali live e una grande libreria di film e serie.',
    rss: 'Feed RSS', cta: 'Guardalo via SwiftChannels IPTV', related: 'Continua a esplorare',
    relPlans: 'Confronta i piani SwiftChannels', relChannels: 'Vedi la lista canali', relSetup: 'Apri la guida alla configurazione', relFaq: 'Leggi la FAQ IPTV',
    about: 'Chi siamo', faq: 'FAQ', terms: 'Condizioni'
  },
  nl: {
    blog: 'Blog', home: 'Home', channels: 'Kanalen', setup: 'Installatie', order: 'Bestel nu',
    intro: 'Films, series en kijktips, gekozen rond sterke IMDb-scores.',
    upcoming: 'Nog geen artikelen gepubliceerd.', read: 'Lees artikel',
    published: 'Gepubliceerd', imdb: 'IMDb-score', minutes: 'min leestijd',
    footer: 'Gratis 24 uur testen, 8.000+ livekanalen en een grote film- en seriebibliotheek.',
    rss: 'RSS-feed', cta: 'Kijk via SwiftChannels IPTV', related: 'Verder kijken',
    relPlans: 'Vergelijk SwiftChannels pakketten', relChannels: 'Bekijk de volledige zenderlijst', relSetup: 'Open de installatiegids', relFaq: 'Lees de IPTV FAQ',
    about: 'Over ons', faq: 'FAQ', terms: 'Voorwaarden'
  }
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function attr(s) { return esc(s).replace(/`/g, '&#96;'); }

function parseFrontMatter(src) {
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/m.exec(src);
  if (!m) throw new Error('Missing front matter');
  const meta = {};
  m[1].split('\n').forEach(line => {
    const i = line.indexOf(':');
    if (i < 0) return;
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    meta[line.slice(0, i).trim()] = v;
  });
  return { meta, body: m[2].trim() };
}

function mdInline(s) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function posterFor(title, posterMap, prefix) {
  const item = posterMap[title];
  return item ? prefix + item.src : '';
}

function fallbackPoster(title, label) {
  return `<span>${esc(label)}</span><strong>${esc(title)}</strong><em>IMDb 7+</em>`;
}

function recoCard(raw, idx, posterMap, prefix, label) {
  const m = /^\*\*([^*]+)\*\* \((\d{4})\) - ([\s\S]+?) \[(IMDb [^\]]+)\]\(([^)]+)\)$/.exec(raw);
  if (!m) return `<li>${mdInline(raw)}</li>`;
  const [, title, year, note, imdbLabel, imdb] = m;
  const poster = posterFor(title, posterMap, prefix);
  return `<li class="reco-card">
    <a class="poster-card" href="${attr(imdb)}" aria-label="${attr(title)} on IMDb">
      ${poster ? `<img src="${attr(poster)}" alt="${attr(title)} poster" loading="lazy" decoding="async"><span class="poster-year">${esc(year)}</span>` : fallbackPoster(title, year)}
    </a>
    <div class="reco-copy"><span>${String(idx).padStart(2, '0')}</span><h3>${esc(title)}</h3><p>${mdInline(note)}</p><a href="${attr(imdb)}">${esc(imdbLabel)}</a></div>
  </li>`;
}

function parseRecommendations(md) {
  return md.split(/\r?\n/).map(line => {
    const m = /^\d+\.\s+\*\*([^*]+)\*\* \((\d{4})\) - ([\s\S]+?) \[(IMDb [^\]]+)\]\(([^)]+)\)$/.exec(line.trim());
    if (!m) return null;
    return { title: m[1], year: m[2], description: m[3], imdbLabel: m[4], imdb: m[5] };
  }).filter(Boolean);
}

function markdownToHtml(md, posterMap, prefix, label) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let list = false;
  const closeList = () => { if (list) { out.push('</ol>'); list = false; } };
  for (const line of lines) {
    if (!line.trim()) { closeList(); continue; }
    const h = /^(#{2,3})\s+(.+)$/.exec(line);
    if (h) { closeList(); out.push(`<h${h[1].length}>${mdInline(h[2])}</h${h[1].length}>`); continue; }
    const li = /^\d+\.\s+(.+)$/.exec(line);
    if (li) { if (!list) { out.push('<ol class="reco-list">'); list = true; } out.push(recoCard(li[1], out.filter(x => x.includes('reco-card')).length + 1, posterMap, prefix, label)); continue; }
    closeList();
    out.push(`<p>${mdInline(line)}</p>`);
  }
  closeList();
  return out.join('\n');
}

function relatedLinks(labels, prefix) {
  return `<section class="related-links"><h2>${esc(labels.related)}</h2><div><a href="${prefix}#plans">${esc(labels.relPlans)}</a><a href="${prefix}channels.html">${esc(labels.relChannels)}</a><a href="${prefix}install.html">${esc(labels.relSetup)}</a><a href="${prefix}faq.html">${esc(labels.relFaq)}</a></div></section>`;
}

function relPrefix(lang, isPost) {
  if (lang === 'en') return isPost ? '../../' : '../';
  return isPost ? '../../../' : '../../';
}

function localPrefix(isPost) {
  return isPost ? '../../' : '../';
}

function pageUrl(site, lang, slug) {
  const prefix = lang === 'en' ? '' : `${lang}/`;
  return `${site}/${prefix}blog/${slug ? slug + '/' : ''}`;
}

function langPath(lang, slug) {
  const prefix = lang === 'en' ? '' : `${lang}/`;
  return `${prefix}blog/${slug ? slug + '/index.html' : 'index.html'}`;
}

function localDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Casablanca',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function languageSwitcher(rootPrefix, langs, postsByLang, currentLang, postId) {
  const names = { en:'English', fr:'Français', es:'Español', de:'Deutsch', it:'Italiano', nl:'Nederlands' };
  return langs.map(L => {
    const p = postId ? postsByLang.get(`${postId}:${L.code}`) : null;
    const slug = p ? `${p.meta.slug}/` : '';
    const href = `${rootPrefix}${L.code === 'en' ? '' : L.code + '/'}blog/${slug}`;
    return `<a class="lang-b" href="${href}" data-lang="${L.code}" hreflang="${L.code}" aria-current="${L.code === currentLang}" title="${names[L.code]}"><img src="${rootPrefix}assets/flag-${L.code}.webp" alt="" width="32" height="32"><span>${names[L.code]}</span></a>`;
  }).join('');
}

function head({ title, description, url, image, lang, alternates, type = 'website', rss }) {
  return `<!DOCTYPE html>
<html lang="${lang}" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${attr(description)}">
<meta name="theme-color" content="#050A18">
<link rel="canonical" href="${url}">
${alternates}
${rss ? `<link rel="alternate" type="application/rss+xml" title="${esc(title)} RSS" href="${rss}">` : ''}
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="SwiftChannels">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(description)}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(title)}">
<meta name="twitter:description" content="${attr(description)}">
<meta name="twitter:image" content="${image}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${url.includes('/blog/') && !url.endsWith('/blog/') ? relPrefix(lang, true) : relPrefix(lang, false)}assets/blog.css">
</head>`;
}

function shell({ body, labels, lang, assetPrefix, localPrefix, switcher }) {
  return `${body.replace('<!--NAV-->', `<nav class="top"><a class="brand" href="${localPrefix}"><span class="brand-mark"></span><b>Swift<span>Channels</span></b></a><div class="links"><a href="${localPrefix}channels.html">${labels.channels}</a><a href="${localPrefix}install.html">${labels.setup}</a><a href="${localPrefix}blog/">${labels.blog}</a></div><div class="lang"><button class="lang-cur" type="button" id="langCur" aria-expanded="false"><img src="${assetPrefix}assets/flag-${lang}.webp" alt="" width="32" height="32"></button><div class="lang-opts" id="langOpts">${switcher}</div></div><a class="btn" href="${localPrefix}#order">${labels.order}</a></nav>`)}
<script>
const cur=document.getElementById('langCur'), box=document.querySelector('.lang');
if(cur&&box){cur.addEventListener('click',()=>{const open=box.classList.toggle('open');cur.setAttribute('aria-expanded',String(open));});document.addEventListener('click',e=>{if(!box.contains(e.target)){box.classList.remove('open');cur.setAttribute('aria-expanded','false');}});}
</script>
</body>
</html>
`;
}

function articleArt(meta, prefix = '', posterMap = {}, href = '') {
  const title = String(meta.picks || '').split('|').filter(Boolean)[0];
  const poster = title ? posterFor(title, posterMap, prefix) : '';
  const inner = `${poster ? `<img src="${attr(poster)}" alt="${attr(title)} poster" loading="lazy" decoding="async">` : ''}<span>${esc(meta.family)}</span><strong>${esc(meta.number)}</strong>`;
  return href
    ? `<a class="art art-${meta.family}" href="${attr(href)}" aria-label="${attr(meta.title)}">${inner}</a>`
    : `<div class="art art-${meta.family}">${inner}</div>`;
}

function posterDeck(meta, variant, posterMap, prefix) {
  const titles = String(meta.picks || '').split('|').filter(Boolean).slice(0, 5);
  return `<div class="poster-deck poster-deck-${variant}" aria-label="Featured titles">
    ${titles.map(title => {
      const poster = posterFor(title, posterMap, prefix);
      return `<div class="mini-poster">${poster ? `<img src="${attr(poster)}" alt="${attr(title)} poster" loading="lazy" decoding="async"><span>${esc(meta.familyLabel)}</span>` : fallbackPoster(title, meta.familyLabel)}</div>`;
    }).join('')}
  </div>`;
}

function buildBlog({ ROOT, SITE, LANGS }) {
  const srcDir = path.join(ROOT, 'posts');
  const today = process.env.BLOG_BUILD_DATE || localDate();
  const previewAll = process.env.BLOG_PREVIEW_ALL === '1';
  const posts = [];
  if (!fs.existsSync(srcDir)) return { sitemap: '' };
  for (const dir of fs.readdirSync(srcDir).sort()) {
    const full = path.join(srcDir, dir);
    if (!fs.statSync(full).isDirectory()) continue;
    for (const f of fs.readdirSync(full).filter(x => x.endsWith('.md'))) {
      const lang = f.replace(/\.md$/, '');
      const parsed = parseFrontMatter(fs.readFileSync(path.join(full, f), 'utf8'));
      posts.push({ id: dir, lang, ...parsed });
    }
  }
  const postsByLang = new Map(posts.map(p => [`${p.id}:${p.lang}`, p]));
  const posterFile = path.join(ROOT, 'assets/blog/posters/posters.json');
  const posterMap = fs.existsSync(posterFile) ? JSON.parse(fs.readFileSync(posterFile, 'utf8')) : {};
  const due = p => previewAll || p.meta.publishDate <= today;
  const duePosts = posts.filter(due);
  const sitemap = [];

  for (const dir of ['blog', ...LANGS.filter(l => l.folder).map(l => path.join(l.folder, 'blog'))]) {
    fs.rmSync(path.join(ROOT, dir), { recursive: true, force: true });
  }

  for (const L of LANGS) {
    const labels = LABELS[L.code];
    const langPosts = posts.filter(p => p.lang === L.code).sort((a, b) => a.meta.number - b.meta.number);
    const visible = langPosts.filter(due);
    const assetPrefix = relPrefix(L.code, false);
    const pagePrefix = localPrefix(false);
    const indexUrl = pageUrl(SITE, L.code, '');
    const alternates = LANGS.map(x => `<link rel="alternate" hreflang="${x.code}" href="${pageUrl(SITE, x.code, '')}">`).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${pageUrl(SITE, 'en', '')}">`;
    const cards = visible.map(p => `<article class="post-card">
      ${articleArt(p.meta, assetPrefix, posterMap, `${p.meta.slug}/`)}
      <div><span class="chip">${esc(p.meta.familyLabel)}</span><h2><a href="${p.meta.slug}/">${esc(p.meta.title)}</a></h2><p>${esc(p.meta.summary)}</p><small>${labels.published}: ${p.meta.publishDate} · IMDb 7.0+</small><a class="read" href="${p.meta.slug}/">${labels.read}</a></div>
    </article>`).join('\n');
    const doc = `${head({ title: `SwiftChannels ${labels.blog}`, description: labels.intro, url: indexUrl, image: `${SITE}/assets/og-card.jpg`, lang: L.code, alternates, rss: `${pageUrl(SITE, L.code, '')}feed.xml` })}
<body>
<div class="bg"></div>
<!--NAV-->
<main class="wrap">
  <header class="blog-hero"><p>SwiftChannels Blog</p><h1>${esc(labels.blog)}</h1><span>${esc(labels.intro)}</span></header>
  <section class="grid">${cards || `<p>${esc(labels.upcoming)}</p>`}</section>
</main>
<footer><b>SwiftChannels</b><span>${esc(labels.footer)}</span><a href="${pagePrefix}legal.html">${esc(labels.terms)}</a><a href="feed.xml">${esc(labels.rss)}</a></footer>`;
    const out = path.join(ROOT, langPath(L.code, ''));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, shell({ body: doc, labels, lang: L.code, assetPrefix, localPrefix: pagePrefix, switcher: languageSwitcher(assetPrefix, LANGS, postsByLang, L.code, null) }), 'utf8');
    sitemap.push({ loc: indexUrl, lastmod: today, priority: L.code === 'en' ? '0.8' : '0.7', alternates: LANGS.map(x => [x.code, pageUrl(SITE, x.code, '')]) });

    const feedItems = visible.slice(0, 20).map(p => `<item><title>${esc(p.meta.title)}</title><link>${pageUrl(SITE, L.code, p.meta.slug)}</link><guid>${pageUrl(SITE, L.code, p.meta.slug)}</guid><pubDate>${new Date(p.meta.publishDate + 'T08:00:00Z').toUTCString()}</pubDate><description>${esc(p.meta.summary)}</description></item>`).join('\n');
    fs.writeFileSync(path.join(path.dirname(out), 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>SwiftChannels ${labels.blog}</title><link>${indexUrl}</link><description>${esc(labels.intro)}</description>${feedItems}</channel></rss>\n`, 'utf8');
  }

  for (const p of duePosts) {
    const labels = LABELS[p.lang];
    const assetPrefix = relPrefix(p.lang, true);
    const pagePrefix = localPrefix(true);
    const url = pageUrl(SITE, p.lang, p.meta.slug);
    const alternates = LANGS.map(x => {
      const peer = postsByLang.get(`${p.id}:${x.code}`);
      return `<link rel="alternate" hreflang="${x.code}" href="${pageUrl(SITE, x.code, peer.meta.slug)}">`;
    }).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${pageUrl(SITE, 'en', postsByLang.get(`${p.id}:en`).meta.slug)}">`;
    const recs = parseRecommendations(p.body);
    const json = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BlogPosting',
          '@id': `${url}#blogposting`,
          headline: p.meta.title,
          description: p.meta.summary,
          datePublished: p.meta.publishDate,
          dateModified: p.meta.publishDate,
          inLanguage: p.lang,
          image: `${SITE}/assets/og-card.jpg`,
          author: { '@type': 'Organization', name: 'SwiftChannels' },
          publisher: { '@type': 'Organization', name: 'SwiftChannels', logo: { '@type': 'ImageObject', url: `${SITE}/assets/logo-512.png` } },
          mainEntityOfPage: { '@id': `${url}#webpage` }
        },
        {
          '@type': 'WebPage',
          '@id': `${url}#webpage`,
          url,
          name: p.meta.title,
          description: p.meta.summary,
          inLanguage: p.lang,
          breadcrumb: { '@id': `${url}#breadcrumb` }
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${url}#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'SwiftChannels', item: `${SITE}/` },
            { '@type': 'ListItem', position: 2, name: labels.blog, item: pageUrl(SITE, p.lang, '') },
            { '@type': 'ListItem', position: 3, name: p.meta.title, item: url }
          ]
        },
        {
          '@type': 'ItemList',
          '@id': `${url}#recommendations`,
          name: p.meta.title,
          itemListOrder: 'https://schema.org/ItemListOrderAscending',
          numberOfItems: recs.length,
          itemListElement: recs.map((r, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: r.imdb,
            item: {
              '@type': p.meta.family === 'series' ? 'TVSeries' : 'Movie',
              name: r.title,
              datePublished: r.year,
              description: r.description,
              sameAs: r.imdb
            }
          }))
        }
      ]
    };
    const variant = (Number(p.meta.number) % 4) + 1;
    const doc = `${head({ title: `${p.meta.title} | SwiftChannels`, description: p.meta.summary, url, image: `${SITE}/assets/og-card.jpg`, lang: p.lang, alternates, type: 'article' })}
<body>
<div class="bg"></div>
<!--NAV-->
<main class="article article-v${variant} wrap">
  <a class="crumb" href="../">${esc(labels.blog)}</a>
  <header><div class="headline"><span class="chip">${esc(p.meta.familyLabel)}</span><h1>${esc(p.meta.title)}</h1><p>${esc(p.meta.summary)}</p><div class="meta">${labels.published}: ${p.meta.publishDate} · ${labels.imdb}: 7.0+ · 4 ${labels.minutes}</div></div>${posterDeck(p.meta, variant, posterMap, assetPrefix)}</header>
  <article class="content">${markdownToHtml(p.body, posterMap, assetPrefix, p.meta.familyLabel)}</article>
  <div class="watch-cta"><a class="btn cta-btn" href="${pagePrefix}#plans">${esc(labels.cta)}</a></div>
  ${relatedLinks(labels, pagePrefix)}
</main>
<footer><b>SwiftChannels</b><span>${esc(labels.footer)}</span><a href="${pagePrefix}about.html">${esc(labels.about)}</a><a href="${pagePrefix}faq.html">${esc(labels.faq)}</a><a href="${pagePrefix}legal.html">${esc(labels.terms)}</a><a href="${pagePrefix}blog/feed.xml">${esc(labels.rss)}</a></footer>
<script type="application/ld+json">${JSON.stringify(json, null, 2)}</script>`;
    const out = path.join(ROOT, langPath(p.lang, p.meta.slug));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, shell({ body: doc, labels, lang: p.lang, assetPrefix, localPrefix: pagePrefix, switcher: languageSwitcher(assetPrefix, LANGS, postsByLang, p.lang, p.id) }), 'utf8');
    sitemap.push({ loc: url, lastmod: p.meta.publishDate, priority: '0.6', alternates: LANGS.map(x => [x.code, pageUrl(SITE, x.code, postsByLang.get(`${p.id}:${x.code}`).meta.slug)]) });
  }

  return { sitemap: sitemap.map(entry => `  <url>
    <loc>${entry.loc}</loc>
${entry.alternates.map(([code, href]) => `      <xhtml:link rel="alternate" hreflang="${code}" href="${href}"/>`).join('\n')}
      <xhtml:link rel="alternate" hreflang="x-default" href="${entry.alternates.find(x => x[0] === 'en')[1]}"/>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n') };
}

module.exports = { buildBlog };
