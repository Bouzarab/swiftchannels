#!/usr/bin/env python3
"""Build fr/ es/ de/ ar/ thank-you.html from the English source without a browser.

Uses the site's own translation table (assets/i18n.js) so there is one set of
translations, not two. Run from the repo root:  python3 prerender-ty.py
"""
import json, os, re, subprocess, sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
os.chdir(ROOT)

SITE = 'https://swiftchannels.com'
LANGS = [('fr', 'ltr', 'fr_FR'), ('es', 'ltr', 'es_ES'),
         ('de', 'ltr', 'de_DE'), ('ar', 'rtl', 'ar_MA')]
ALL = [('en', ''), ('fr', 'fr'), ('es', 'es'), ('de', 'de'), ('ar', 'ar')]
PAGE = 'thank-you.html'

DUMP = ("global.window={};global.document={};"
        "eval(require('fs').readFileSync('assets/i18n.js','utf8'));"
        "process.stdout.write(JSON.stringify(window.I18N));")
I18N = json.loads(subprocess.check_output(['node', '-e', DUMP]).decode('utf-8'))

norm = lambda s: re.sub(r'\s+', ' ', s).strip()

import datetime
YEAR = datetime.date.today().year


def translate_text(html, lang):
    """Replace every translatable text run, the way the engine does."""
    D = I18N[lang]

    def one(m):
        raw = m.group(1)
        key = norm(raw)
        if key not in D:
            return m.group(0)
        pre = raw[:len(raw) - len(raw.lstrip())]
        post = raw[len(raw.rstrip()):]
        return '>' + pre + D[key] + post + '<'

    def attr(m):
        val = m.group(2)
        return m.group(1) + D.get(norm(val), val) + '"'

    html = re.sub(r'>([^<>]*[^\s<>][^<>]*)<', one, html)
    html = re.sub(r'\b((?:placeholder|title|aria-label|alt)=")([^"]*)"', attr, html)
    return html


def protect_scripts(html):
    """Pull <script>/<style> bodies out so their contents are never touched."""
    store = []

    def hide(m):
        store.append(m.group(0))
        return '\x00%d\x00' % (len(store) - 1)

    html = re.sub(r'<script\b(?![^>]*\bsrc=)[^>]*>.*?</script>', hide, html, flags=re.S)
    html = re.sub(r'<style\b[^>]*>.*?</style>', hide, html, flags=re.S)
    return html, store


def restore(html, store):
    return re.sub(r'\x00(\d+)\x00', lambda m: store[int(m.group(1))], html)


def build(lang, direction, og):
    s = open(PAGE, encoding='utf-8').read()
    D = I18N[lang]

    s, store = protect_scripts(s)

    # ── data-i18n-html blocks: replaced whole, markup and all ──
    def html_block(m):
        key = m.group('key')
        return m.group('open') + D.get(key, m.group('body')) + m.group('close')

    s = re.sub(r'(?P<open><(?P<tag>\w+)[^>]*data-i18n-html="(?P<key>[^"]+)"[^>]*>)'
               r'(?P<body>.*?)(?P<close></(?P=tag)>)',
               html_block, s, flags=re.S)

    s = translate_text(s, lang)

    # ── head ──
    s = s.replace('<html lang="en">', '<html lang="%s" dir="%s">' % (lang, direction), 1)
    s = re.sub(r'<title>.*?</title>',
               lambda m: '<title>%s</title>' % D.get('__ty_title', m.group(0)[7:-8]),
               s, count=1, flags=re.S)
    if '__ty_desc' in D:
        s = re.sub(r'(<meta name="description" content=")[^"]*(")',
                   lambda m: m.group(1) + D['__ty_desc'] + m.group(2), s, count=1)

    # ── the engine must not re-translate a page that is already translated ──
    s = s.replace('<script src="assets/i18n.js"></script>',
                  "<script>window.PAGE_LANG='%s';</script>\n"
                  '<script src="assets/i18n.js"></script>' % lang, 1)

    # ── relative paths move down one folder ──
    def repath(m):
        attr, val = m.group(1), m.group(2)
        if re.match(r'^(https?:|mailto:|tel:|#|/|\.\./|data:)', val):
            return m.group(0)
        if val.split('#')[0] in ('legal.html', 'index.html', 'channels.html',
                                 'install.html', 'order.html', 'thank-you.html'):
            return m.group(0)
        return '%s="../%s"' % (attr, val)

    s = re.sub(r'\b(src|href)="([^"]*)"', repath, s)

    # ── language switcher: flags become links, the active one is marked ──
    def langbtn(m):
        code = m.group('code')
        tag = m.group(0)
        tag = re.sub(r'aria-current="[^"]*"', 'aria-current="%s"' % str(code == lang).lower(), tag)
        folder = '' if code == 'en' else code + '/'
        return tag[:-1] + ' href="../%s%s">' % (folder, PAGE)

    s = re.sub(r'<button class="lang-b"[^>]*data-lang="(?P<code>\w+)"[^>]*>', langbtn, s)
    s = s.replace('<img src="../assets/flag-en.webp" alt="" width="34" height="34">',
                  '<img src="../assets/flag-%s.webp" alt="" width="34" height="34">' % lang, 1)

    # ── canonical + hreflang, so the five versions index separately ──
    links = ['<link rel="canonical" href="%s/%s/%s">' % (SITE, lang, PAGE)]
    for code, folder in ALL:
        href = '%s/%s%s' % (SITE, folder + '/' if folder else '', PAGE)
        links.append('<link rel="alternate" hreflang="%s" href="%s">' % (code, href))
    links.append('<link rel="alternate" hreflang="x-default" href="%s/%s">' % (SITE, PAGE))
    s = s.replace('</head>', '\n'.join(links) + '\n</head>', 1)

    s = re.sub(r'(<meta property="og:locale" content=")[^"]*(")',
               lambda m: m.group(1) + og + m.group(2), s, count=1)

    # ── the page's own JS runs before serialising, so mirror what it does ──
    s = re.sub(r'<a href="#" id="wa2">[^<]*</a>\s*·\s*', '', s, count=1)
    s = s.replace('<a href="#" id="mail">',
                  '<a href="mailto:contact@swiftchannels.com" id="mail">', 1)
    s = s.replace('<span id="yr"></span>', '<span id="yr">%d</span>' % YEAR, 1)

    s = restore(s, store)

    os.makedirs(lang, exist_ok=True)
    open(os.path.join(lang, PAGE), 'w', encoding='utf-8').write(s)
    print('%s/%s' % (lang, PAGE), len(s), 'bytes')


for lang, direction, og in LANGS:
    build(lang, direction, og)
print('done')
