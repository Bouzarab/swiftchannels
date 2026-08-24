# Swift Channels

Static site for swiftchannels.com. No build step, no framework — plain HTML, CSS and JavaScript.
Whatever is on the `main` branch is what visitors see.

```
index.html        the site
thank-you.html    where PayPal sends people after they pay
assets/           images
CNAME             tells GitHub Pages which domain to serve
```

---

## First-time setup

### 1. Create the repository

On github.com press **New repository**.

- Name: `swiftchannels`
- **Public** (GitHub Pages is free only on public repos)
- Do **not** tick "Add a README" — this folder already has one

### 2. Upload the files

On the empty repo page, click **uploading an existing file**, then drag in
`index.html`, `thank-you.html`, `README.md`, `CNAME`, and the `assets` folder.

Write `first version` in the description box and press **Commit changes**.

### 3. Turn on Pages

**Settings → Pages** in the repo.

- Source: **Deploy from a branch**
- Branch: **main**, folder: **/ (root)**
- Press **Save**

The site is live within a minute or two at `https://YOURNAME.github.io/swiftchannels/`.

### 4. Point the domain at GitHub

In your registrar's DNS settings, delete any existing A or CNAME records for the root
and www, then add these five:

| Type  | Name | Value                  |
|-------|------|------------------------|
| A     | @    | 185.199.108.153        |
| A     | @    | 185.199.109.153        |
| A     | @    | 185.199.110.153        |
| A     | @    | 185.199.111.153        |
| CNAME | www  | YOURNAME.github.io     |

Replace `YOURNAME` with your GitHub username. Keep the trailing dot if your
registrar adds one.

DNS takes 20 minutes to a few hours. Once it resolves, go back to
**Settings → Pages**, confirm the custom domain reads `swiftchannels.com`,
and tick **Enforce HTTPS**. If that checkbox is greyed out, the certificate is
still being issued — check again in an hour.

---

## Making a change afterwards

### The quick way — edit in the browser

Good for a price change, a new FAQ line, or fixing a typo.

1. Open the repo on github.com and click the file (`index.html`).
2. Press the **pencil icon** at the top right.
3. Make the edit.
4. Scroll down, write a short description of what you changed, press **Commit changes**.

The live site updates in about a minute. Refresh with **Ctrl+Shift+R** (or Cmd+Shift+R)
to bypass your browser cache.

### Replacing a whole file

When you get a rewritten file (from a new version, or after asking for changes):

1. Open the repo, click **Add file → Upload files**.
2. Drag the new file in — same filename overwrites the old one.
3. Describe the change and press **Commit changes**.

### From your computer, with git

Only needed if you prefer working locally.

```bash
git clone https://github.com/YOURNAME/swiftchannels.git
cd swiftchannels

# ...edit files...

git add .
git commit -m "what changed"
git push
```

---

## Things that live in the code

Everything you'd want to change routinely sits in one `CONFIG` block near the top
of the `<script>` tag in `index.html`:

| Setting      | What it controls                                  |
|--------------|---------------------------------------------------|
| `brand`      | Name shown in the header and footer                |
| `whatsapp`   | Order destination — digits only, no `+` or spaces  |
| `telegram`   | Username without the `@`                           |
| `email`      | Contact address                                    |
| `currency`   | Symbol shown next to prices                        |
| `plans`      | Names, terms, prices, feature lists                |
| `payMethods` | Which methods appear in the dropdown               |
| `faq`        | Questions and answers                              |

`thank-you.html` has its own smaller `CONFIG` with `brand`, `whatsapp` and `email`.
**If you change the WhatsApp number, change it in both files.**

---

## Languages — read this before changing any text

The site is published at five addresses so Google can index each language
separately:

| Address                             | Language |
|-------------------------------------|----------|
| `swiftchannels.com/` + `/legal.html`    | English  |
| `swiftchannels.com/fr/` + `/fr/legal.html` | French   |
| `swiftchannels.com/es/` + `/es/legal.html` | Spanish  |
| `swiftchannels.com/de/` + `/de/legal.html` | German   |
| `swiftchannels.com/ar/` + `/ar/legal.html` | Arabic (right-to-left) |

**Only four files are ever edited by hand:**

- `index.html` — the English page, and the source for all the others
- `legal.html` — the English terms, refunds and privacy page
- `assets/i18n.js` — translations for the main page, keyed by the English sentence
- `assets/legal-i18n.js` — translations for the legal page, same idea

`fr/`, `es/`, `de/` and `ar/` are **generated**. Never edit them directly; your
changes will be overwritten on the next build.

### After any change to index.html, legal.html or the two i18n files

```bash
cd ~/swiftchannels
node build.js          # regenerates all 8 translated pages and sitemap.xml
git add . && git commit -m "what changed"
git push
```

`build.js` opens the English page in a real browser, uses the site's own
translation engine to switch language, and saves the result as a static page —
so the generated pages can never drift from the live behaviour. It also rewrites
`sitemap.xml` with the hreflang alternates.

First time only: `npm install playwright` (the build needs a headless browser).

### Adding or changing wording

Because translations are keyed by the English sentence, **rewriting an English
sentence silently drops that line back to English** on the other four pages. When
you change English copy, update the matching key in `assets/i18n.js` in the same
pass, then rebuild.

### Adding a sixth language

1. Add its block to `assets/i18n.js` and to `assets/legal-i18n.js`, copying the
   shape of `es`.
2. Add its code to `LANGS` at the top of `assets/i18n.js` and of `build.js`.
3. Add a flag to `assets/` and a link to the switcher in `index.html` **and**
   `legal.html`.
4. `node build.js`.

### Getting the pages into Google

After the first push, in Search Console: submit `sitemap.xml`, then use URL
Inspection → **Request indexing** on each of the ten addresses. The sitemap alone
gets them crawled eventually; requesting indexing usually takes days rather than
weeks. Do the language homepages first — the legal pages will be found through the
links on them.

---

## Notes

- The repo is public, so treat everything in it as published. Don't add anything you
  wouldn't put on the page itself — no panel logins, no provider credentials, no
  customer messages.
- No customer data is stored anywhere. The order form builds a WhatsApp message and
  nothing else; there is no database and no server.
- If the site breaks after an edit, open the **commit history**, find the last working
  version, and use **Revert** to undo the change.
