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
| `payLinks`   | PayPal Pay Link per plan                           |
| `payDetails` | Payment instructions and copyable details          |
| `payMethods` | Which methods appear in the dropdown               |
| `faq`        | Questions and answers                              |

`thank-you.html` has its own smaller `CONFIG` with `brand`, `whatsapp` and `email`.
**If you change the WhatsApp number, change it in both files.**

---

## Notes

- The repo is public, so treat everything in it as published. Don't add anything you
  wouldn't put on the page itself — no panel logins, no provider credentials, no
  customer messages.
- No customer data is stored anywhere. The order form builds a WhatsApp message and
  nothing else; there is no database and no server.
- If the site breaks after an edit, open the **commit history**, find the last working
  version, and use **Revert** to undo the change.
