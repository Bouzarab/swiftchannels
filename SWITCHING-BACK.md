# WhatsApp is switched off

The number is gone from the site. Orders now go through `order.html`, which
posts them to a Google Form whose responses land in a Google Sheet.

Everything here is temporary. When you have the new number, read
**Turning WhatsApp back on** at the bottom.

---

## 1. Finish the Google Form (one-time, ~15 minutes)

Until this is done, the send button falls back to opening the customer's own
email app addressed to `contact@swiftchannels.com`. That works, but it depends
on them having an email app set up, and nothing is collected in a sheet — so
do this soon.

**Build the form**

1. Go to <https://forms.google.com> and start a blank form. Call it
   *Swift Channels — orders*.
2. Add **twelve short-answer questions**, in this order and with these titles:

   `Reference`, `Name`, `Phone`, `Email`, `Plan`, `Devices`,
   `Watch on`, `MAC`, `Pay by`, `Total`, `Notes`, `Language`

   Do not mark any of them required — a customer who leaves the notes box
   empty must still get through.
3. Click **Responses → Link to Sheets → Create new spreadsheet**. That sheet is
   your CSV; **File → Download → CSV** any time you want it as a file.
4. Still under **Responses**, open the three-dot menu and tick
   **Get email notifications for new responses**. Make sure the Google account
   you built the form with is the one that reads `contact@swiftchannels.com`,
   or set up forwarding.

**Find the twelve field ids**

1. Click **Send → link icon → copy** to get the public form URL, open it.
2. Right-click the page → **View page source**, then search the source for
   `entry.` — you will find `entry.123456789` once per question, in the same
   order as your questions.
3. Note them down, one per question.

**Paste them into the site**

Open `order.html` and find the `CONFIG` block near the bottom. Fill it in:

```js
const CONFIG = {
  email: 'contact@swiftchannels.com',
  orderForm: {
    action: 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse',
    fields: {
      ref:  'entry.111111111',  name:   'entry.222222222',
      phone:'entry.333333333',  email:  'entry.444444444',
      plan: 'entry.555555555',  devices:'entry.666666666',
      device:'entry.777777777', mac:    'entry.888888888',
      method:'entry.999999999', total:  'entry.101010101',
      notes:'entry.111111112',  lang:   'entry.121212121'
    }
  }
};
```

`YOUR_FORM_ID` is the long string in the form URL between `/d/e/` and
`/viewform`. The address must end in **`/formResponse`**, not `/viewform`.

Then run `node build.js` so the four translated copies pick up the same
config, and push. Place a test order yourself and check the row lands in the
sheet.

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
