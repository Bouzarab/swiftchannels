# Connecting the order button to a Google Sheet

> **Already done — 26 August 2026.** The form is built and
> `assets/order-config.js` is filled in with its address and the twelve ids.
> Keep this file as the reference for changing the form, adding a question,
> or rebuilding it from scratch. Parts 1–4 describe how it was set up.

**Time needed:** about 15 minutes, once.
**What you end up with:** every order a customer sends lands as a new row in a
Google Sheet (downloadable as CSV) and arrives in your inbox as an email.

Until this is done the site still works — the send button just opens the
customer's own email app with the order written out. Nothing is lost, but
nothing is collected in a sheet either.

---

## Part 1 — Build the form (5 min)

1. Go to **<https://forms.google.com>** and click the **Blank form** tile.
   Sign in with the Google account that reads `contact@swiftchannels.com`
   (or one that forwards to it).

2. Click the form title at the top and name it **Swift Channels — orders**.
   Ignore the description box.

3. The form starts with one empty question. Click on it, type
   **`Reference`** as the question title, and set the answer type (the
   dropdown on the right) to **Short answer**.

4. Click the **⊕** button in the floating toolbar to add the next question.
   Repeat until you have **twelve questions**, in exactly this order, all of
   them **Short answer**:

   | # | Question title |
   |---|----------------|
   | 1 | `Reference` |
   | 2 | `Name` |
   | 3 | `Phone` |
   | 4 | `Email` |
   | 5 | `Plan` |
   | 6 | `Devices` |
   | 7 | `Watch on` |
   | 8 | `MAC` |
   | 9 | `Pay by` |
   | 10 | `Total` |
   | 11 | `Notes` |
   | 12 | `Language` |

   > **Leave every question OFF for "Required".** If even one is required, an
   > order where that box is empty (a customer with no notes, a phone with no
   > MAC address) is silently rejected and never reaches you.

5. Click the **⚙ Settings** tab at the top and check these:
   - **Collect email addresses** → **Off** (we already ask for it ourselves)
   - **Limit to 1 response** → **Off**
   - **Restrict to users in your organisation** (if shown) → **Off**

---

## Part 2 — Send the responses to a sheet and your inbox (2 min)

1. Click the **Responses** tab.
2. Click the green **Link to Sheets** icon → **Create a new spreadsheet** →
   **Create**. That sheet is your customer list. To get it as a CSV file:
   **File → Download → Comma-separated values**.
3. Back on the **Responses** tab, click the **⋮** (three dots) and tick
   **Get email notifications for new responses**. Now every order also pings
   your inbox.

---

## Part 3 — Get the twelve ids (5 min)

Each question has a hidden id like `entry.874219503`. The easiest way to read
them off is the pre-filled link trick — no page source, no guessing.

1. Click the **⋮** (three dots) at the **top right of the form editor** →
   **Get pre-filled link**.
2. A preview of your form opens. **Type the question's own title into its own
   box** — put the word `Reference` in the Reference box, `Name` in the Name
   box, and so on for all twelve. (Any text works; using the title just makes
   the next step readable.)
3. Scroll down, click **Get link**, then **COPY LINK** in the little bar that
   appears at the bottom.
4. Paste that link into a blank document. It looks like this, all on one line:

```
https://docs.google.com/forms/d/e/1FAIpQLSdXXXXXXXXXXXXXXXXXXXX/viewform?usp=pp_url
&entry.874219503=Reference&entry.115509388=Name&entry.402913776=Phone
&entry.998211455=Email&entry.310277841=Plan&entry.677341220=Devices
&entry.554098317=Watch+on&entry.208874663=MAC&entry.771330924=Pay+by
&entry.140556982=Total&entry.663019854=Notes&entry.297014338=Language
```

Now you can read every id straight off: the one immediately before
`=Reference` is the Reference id, the one before `=Name` is the Name id, and
so on.

You also need the **form address**, which is the first part of that same link:
take everything up to `/viewform` and **replace `/viewform` with
`/formResponse`**:

```
https://docs.google.com/forms/d/e/1FAIpQLSdXXXXXXXXXXXXXXXXXXXX/formResponse
```

> It must end in **`/formResponse`**. A link ending in `/viewform` will not work.

---

## Part 4 — Put them on the site (3 min)

Open **one** file: `~/swiftchannels/assets/order-config.js`. Every language
version of the site reads it, so there is nothing else to edit and no rebuild
to run.

Fill in `action` and the twelve `entry.` ids, keeping the quotes:

```js
window.ORDER_CONFIG = {

  email: 'contact@swiftchannels.com',

  orderForm: {

    action: 'https://docs.google.com/forms/d/e/1FAIpQLSdXXXXXXXXXXXXXXXXXXXX/formResponse',

    fields: {
      ref:     'entry.874219503',   /* Reference  */
      name:    'entry.115509388',   /* Name       */
      phone:   'entry.402913776',   /* Phone      */
      email:   'entry.998211455',   /* Email      */
      plan:    'entry.310277841',   /* Plan       */
      devices: 'entry.677341220',   /* Devices    */
      device:  'entry.554098317',   /* Watch on   */
      mac:     'entry.208874663',   /* MAC        */
      method:  'entry.771330924',   /* Pay by     */
      total:   'entry.140556982',   /* Total      */
      notes:   'entry.663019854',   /* Notes      */
      lang:    'entry.297014338'    /* Language   */
    }
  }
};
```

Watch the two easy mistakes: every value keeps its **quotes**, and every line
except the last one inside `fields` ends with a **comma**.

Then push:

```bash
cd ~/swiftchannels
git add -A
git commit -m "Connect order form to Google Sheet"
git push
```

---

## Part 5 — Test it (2 min)

1. Wait a minute for GitHub Pages to rebuild, then open **swiftchannels.com**.
2. Fill in the order form with your own details and click **Send my order**.
3. On the page that appears, click the send button. It should say *sent*.
4. Open your Google Sheet. A new row should be there with your details.
5. Check your inbox for the notification email.

Do the same once on **swiftchannels.com/fr/** to confirm the translated pages
post to the same sheet.

---

## If something goes wrong

**Nothing arrives in the sheet.**
Check the `action` ends in `/formResponse`, not `/viewform`. Then check that
no question in the form is marked *Required*.

**Some columns are empty.**
Two ids are swapped or one is mistyped. Re-do Part 3 and compare carefully —
`ref` is the Reference column, `device` is *Watch on*, `devices` is the
*number* of devices. Those two are easy to mix up.

**The button opens an email app instead of sending.**
That is the fallback, and it means `action` is still empty or the page has not
picked up your change yet. Hard-refresh the page (Cmd+Shift+R) and check the
file was pushed.

**"Sorry, this form is no longer accepting responses."**
In the form's **Responses** tab, make sure **Accepting responses** is on.
