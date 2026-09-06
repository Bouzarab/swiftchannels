#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets/blog/posters');

const WIKI = {
  '13th': '13th (film)',
  'Seven': 'Seven (1995 film)',
  'GoodFellas': 'Goodfellas',
  'Heat': 'Heat (1995 film)',
  'City of God': 'City of God (2002 film)',
  'The Matrix': 'The Matrix',
  'Arrival': 'Arrival (film)',
  'Coco': 'Coco (2017 film)',
  'The Others': 'The Others (2001 film)',
  'The Innocents': 'The Innocents (1961 film)',
  '1917': '1917 (2019 film)',
  'Thief': 'Thief (1981 film)',
  'The Town': 'The Town (2010 film)',
  'The Bridge': 'The Bridge (2011 TV series)',
  'Dark': 'Dark (TV series)',
  'The Office': 'The Office (American TV series)',
  'Rome': 'Rome (TV series)',
  'Merlin': 'Merlin (2008 TV series)',
  'The Staircase': 'The Staircase (2004 TV series)',
  'The Witch': 'The Witch (2015 film)',
  'The Jinx: The Life and Deaths of Robert Durst': 'The Jinx (miniseries)',
  'The Act of Killing': 'The Act of Killing',
  'The Shining': 'The Shining (film)',
  'Black Swan': 'Black Swan (film)',
  'Hereditary': 'Hereditary (film)',
  'Nebraska': 'Nebraska (film)'
};

Object.assign(WIKI, {
  'Avatar: The Last Airbender': 'Avatar: The Last Airbender',
  'Band of Brothers': 'Band of Brothers (miniseries)',
  'Better Call Saul': 'Better Call Saul',
  'Bridge of Spies': 'Bridge of Spies',
  'Burning': 'Burning (2018 film)',
  'Chernobyl': 'Chernobyl (miniseries)',
  'Come and See': 'Come and See',
  'Deadwood': 'Deadwood (TV series)',
  'Ex Machina': 'Ex Machina (film)',
  'Fleabag': 'Fleabag',
  'Ford v Ferrari': 'Ford v Ferrari',
  'Free Solo': 'Free Solo',
  'Gomorrah': 'Gomorrah (TV series)',
  'Gone Girl': 'Gone Girl (film)',
  'Groundhog Day': 'Groundhog Day (film)',
  'Halt and Catch Fire': 'Halt and Catch Fire (TV series)',
  'Hoop Dreams': 'Hoop Dreams',
  'Inside Man': 'Inside Man',
  'Interstellar': 'Interstellar (film)',
  'Money Heist': 'Money Heist',
  'Munich': 'Munich (film)',
  'Parks and Recreation': 'Parks and Recreation',
  'Prisoners': 'Prisoners (2013 film)',
  'Rosemary\'s Baby': 'Rosemary\'s Baby (film)',
  'Rush': 'Rush (2013 film)',
  'Senna': 'Senna (film)',
  'Six Feet Under': 'Six Feet Under (TV series)',
  'Stand by Me': 'Stand by Me (film)',
  'Succession': 'Succession (TV series)',
  'The Americans': 'The Americans',
  'The Bourne Ultimatum': 'The Bourne Ultimatum',
  'The Crown': 'The Crown (TV series)',
  'The Fugitive': 'The Fugitive (1993 film)',
  'The Last Dance': 'The Last Dance (miniseries)',
  'The Last Kingdom': 'The Last Kingdom (TV series)',
  'The Leftovers': 'The Leftovers (TV series)',
  'The Martian': 'The Martian (film)',
  'The Queen\'s Gambit': 'The Queen\'s Gambit (miniseries)',
  'The Sixth Sense': 'The Sixth Sense',
  'The Sopranos': 'The Sopranos',
  'The Sting': 'The Sting',
  'The Thin Red Line': 'The Thin Red Line (1998 film)',
  'The Verdict': 'The Verdict',
  'The West Wing': 'The West Wing',
  'The Wrestler': 'The Wrestler (2008 film)',
  'Top Gun: Maverick': 'Top Gun: Maverick',
  'Touching the Void': 'Touching the Void',
  'Unbelievable': 'Unbelievable (miniseries)',
  'When They See Us': 'When They See Us',
  'Wind River': 'Wind River (film)',
  'Witness for the Prosecution': 'Witness for the Prosecution (1957 film)',
  'Won\'t You Be My Neighbor?': 'Won\'t You Be My Neighbor? (film)',
  'Y tu mamá también': 'Y tu mamá también',
  'Zodiac': 'Zodiac (film)'
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

function slug(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function svgText(s, max = 18) {
  const words = s.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function writeFallback(title) {
  const name = `${slug(title)}.svg`;
  const lines = svgText(title).map((line, i) =>
    `<text x="32" y="${230 + i * 44}" font-family="Sora, Arial, sans-serif" font-size="34" font-weight="800" fill="#E9EFFC">${line.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</text>`
  ).join('');
  fs.writeFileSync(path.join(OUT, name), `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="960" viewBox="0 0 640 960">
<defs>
<linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#2F6BFF"/><stop offset=".58" stop-color="#0D162F"/><stop offset="1" stop-color="#49D9FF"/></linearGradient>
<radialGradient id="r" cx=".2" cy=".18" r=".8"><stop offset="0" stop-color="#ffffff" stop-opacity=".22"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
</defs>
<rect width="640" height="960" fill="#050A18"/>
<rect x="24" y="24" width="592" height="912" rx="28" fill="url(#g)"/>
<rect x="24" y="24" width="592" height="912" rx="28" fill="url(#r)"/>
<text x="32" y="90" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800" fill="#49D9FF" letter-spacing="4">SWIFTCHANNELS</text>
${lines}
<text x="32" y="882" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="800" fill="#E9EFFC">IMDb 7+</text>
</svg>
`, 'utf8');
  return {
    src: `assets/blog/posters/${name}`,
    page: '',
    source: 'Generated SwiftChannels fallback artwork'
  };
}

function titlesFromPosts() {
  const titles = new Set();
  for (const dir of fs.readdirSync(path.join(ROOT, 'posts'))) {
    const file = path.join(ROOT, 'posts', dir, 'en.md');
    if (!fs.existsSync(file)) continue;
    const m = /^picks: "([^"]+)"/m.exec(fs.readFileSync(file, 'utf8'));
    if (!m) continue;
    m[1].split('|').forEach(t => titles.add(t));
  }
  return [...titles].sort();
}

async function wikiSummary(title) {
  const page = WIKI[title] || title;
  const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(page.replace(/ /g, '_'));
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'SwiftChannelsBlogBuilder/1.0 (poster cache)' } });
    if (res.ok) return res.json();
    if (res.status !== 429) throw new Error(`${res.status} ${page}`);
    await sleep(1500 * (i + 1));
  }
  throw new Error(`429 ${page}`);
}

async function download(url, file) {
  const clean = url.replace(/\?.*$/, '');
  for (let i = 0; i < 4; i++) {
    const res = await fetch(clean, { headers: { 'User-Agent': 'SwiftChannelsBlogBuilder/1.0 (poster cache)' } });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(file, buf);
      return;
    }
    if (res.status !== 429) throw new Error(`${res.status} ${clean}`);
    await sleep(1800 * (i + 1));
  }
  throw new Error(`429 ${clean}`);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const jsonFile = path.join(OUT, 'posters.json');
  const map = fs.existsSync(jsonFile) ? JSON.parse(fs.readFileSync(jsonFile, 'utf8')) : {};
  const titles = titlesFromPosts();
  for (const title of titles) {
    if (map[title] && fs.existsSync(path.join(ROOT, map[title].src))) {
      console.log(`keep ${title}`);
      continue;
    }
    try {
      await sleep(700);
      const data = await wikiSummary(title);
      const img = data.thumbnail?.source || data.originalimage?.source;
      if (!img) {
        map[title] = writeFallback(title);
        console.log(`fallback ${title}: no image`);
        continue;
      }
      const ext = /\.png(?:$|\?)/i.test(img) ? 'png' : /\.webp(?:$|\?)/i.test(img) ? 'webp' : 'jpg';
      const name = `${slug(title)}.${ext}`;
      await download(img, path.join(OUT, name));
      map[title] = {
        src: `assets/blog/posters/${name}`,
        page: data.content_urls?.desktop?.page || '',
        source: img.replace(/\?.*$/, '')
      };
      console.log(`saved ${title}`);
    } catch (e) {
      map[title] = writeFallback(title);
      console.log(`fallback ${title}: ${e.message}`);
    }
  }
  fs.writeFileSync(path.join(OUT, 'posters.json'), JSON.stringify(map, null, 2) + '\n', 'utf8');
  console.log(`Saved ${Object.keys(map).length}/${titles.length} poster records.`);
})();
