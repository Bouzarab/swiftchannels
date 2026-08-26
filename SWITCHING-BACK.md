# WhatsApp is switched off

The number is gone from the site. Orders now go through `order.html`, which
posts them to a Google Form whose responses land in a Google Sheet.

Everything here is temporary. When you have the new number, read
**Turning WhatsApp back on** at the bottom.

---

## 1. The Google Form — done

Orders now post to the Google Form and land in its Google Sheet. If `action`
in `assets/order-config.js` is ever emptied, the send button falls back to
opening the customer's own email app addressed to `contact@swiftchannels.com`,
so nothing breaks — it just stops collecting into the sheet.

**Step-by-step instructions are in [GOOGLE-FORM-SETUP.md](GOOGLE-FORM-SETUP.md).**

The short version: build a twelve-question Google Form, link it to a sheet,
read the twelve `entry.` ids off a pre-filled link, and paste them into
`assets/order-config.js`. That single file is read by all five language
versions, so there is nothing else to edit and no rebuild to run.

---

## 2. What changed while WhatsApp is off

| Where | Before | Now |
|-------|--------|-----|
| Order button | opened WhatsApp with the order text | goes to `order.html` |
| `order.html` | did not exist | shows the order, one button sends it |
| Quick-answers panel | WhatsApp link | `mailto:contact@swiftchannels.com` |
| Setup guide help buttons | WhatsApp | `mailto:contact@swiftchannels.com` |
| Footer WhatsApp link | present | removed |
| Thank-you page receipt button | WhatsApp | email |
| Legal page contact line | email · WhatsApp +212 … | email only |
| Copy that said "on WhatsApp" | — | says "by email" |

The **WhatsApp number field in the order form stayed**. You still collect the
customer's number so you can reach them once the new line is running.

---

## 3. Turning WhatsApp back on

1. In **`index.html`** and **`thank-you.html`**, put the new number back:

   ```js
   whatsapp: '212XXXXXXXXX',   // digits only, country code, no + or spaces
   ```

   That single value is the switch. Every link guarded by `if(waBase)` starts
   working again on its own, the footer link reappears, the order button goes
   back to opening WhatsApp, and `order.html` stops being used.

2. In **`install.html`**, change the one line near the bottom back:

   ```js
   document.querySelectorAll('[data-wa-link]').forEach(a => a.href = 'https://wa.me/212XXXXXXXXX');
   ```

3. Put the number back on the legal page — `legal.html`, the **Contact** line.

4. The wording changed from "WhatsApp" to "email" in about a dozen sentences.
   Ask me to switch it back and I will do it across all five languages in one
   pass; the old English strings are still in `assets/i18n.js`,
   `assets/install-i18n.js` and `assets/channels-i18n.js` next to the new ones,
   so nothing was lost.

5. `order.html` and `assets/order-i18n.js` can stay. Nothing links to them once
   the number is back, and they are marked `noindex`. Keep them for the next
   time you need to take WhatsApp down.

6. `node build.js`, then push.
