# Activate the SwiftChannels gift page

**Current next step:** your Google inventory is already initialized. You chose
Resend, so follow [RESEND-SETUP.md](RESEND-SETUP.md). Do not repeat the Google
setup below. Only your Resend account, domain verification and API-key entry
need manual work. Personal Gmail delivery is disabled during the switch.

The website pages, translated emails, Google service files and setup helper are
already in this project. The private account list has been prepared separately
in `~/Downloads/SwiftChannels-private-gifts/deployment/`, not in the public
website or GitHub.

You do not need to copy code, upload a CSV, create a spreadsheet, configure
Google script properties, copy a deployment URL or edit website files. The
helper does those tasks. Only the following account steps need you.

## 1. Allow the Google connection

Open [Google Apps Script settings](https://script.google.com/home/usersettings)
using the Google account that should hold the private inventory. Turn on **Google Apps
Script API**.

In your Mac's Terminal, paste these two lines and press Enter:

```sh
cd ~/swiftchannels
npm run gift:setup
```

When the Google sign-in page opens, choose that same account and approve the
connection. This Google account holds the private inventory and delivery
records. Resend, not that account's Gmail address, sends gift emails.

**Sender privacy:** gift delivery uses Resend with a verified SwiftChannels
address. There is no MailApp or Gmail fallback. Before public launch, complete
[RESEND-SETUP.md](RESEND-SETUP.md) and test the actual From address.

## 2. Create the verification widget

The helper opens [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile).
Sign in or create a Cloudflare account, then:

- Add a widget named **SwiftChannels gift**.
- Select **Managed**.
- Add `swiftchannels.com`, `www.swiftchannels.com` and `localhost` as hostnames.
- Copy its **Site Key** into the Terminal when asked, then press Enter.
- Copy its **Secret Key** into the next prompt, then press Enter. It stays hidden.

Do not paste the secret key into this chat or the website. The helper saves it
privately and uploads it only to your Google project. Your website does not
need to use Cloudflare hosting to use Turnstile.

## 3. Approve sending from your Google account

The helper creates your Google project and opens its editor. At the top:

- Click **Setup.gs** in the **Files** list on the left.
- Select **initializeGiftService** from the function menu at the top.
- Click **Run**, then review and approve the requested permissions.
- Wait until the log shows **Gift sender initialized. New accounts imported:**
  followed by **Execution completed**.
- Return to the Terminal and press Enter.

This run creates the private spreadsheet and loads the eligible accounts
automatically. The helper then deploys the inventory service. It connects the
website only if Resend is already configured; otherwise finish RESEND-SETUP.md.
You do not need to use Google's Deploy menu.

Do not run **setupGiftService** in **Code.gs** instead. That function only creates
the spreadsheet and does not import the accounts. If you already deployed and
the connection check failed, run **initializeGiftService** in **Setup.gs**, then
use these Terminal lines to finish without repeating setup or deployment:

```sh
cd ~/swiftchannels
npm run gift:check
```

If Google warns that the app is unverified, check that it is your own
**SwiftChannels gifts** project and review the permissions before continuing.
If your Google Workspace administrator blocks access, ask them to allow your
project; the helper cannot override that policy.

## 4. Check your first email

Open [the local gift page](http://localhost:8899/gift/), submit your own email,
and check the inbox and spam folder. It should contain five distinct accounts
with their portal links, MAC codes, expiry dates and channel counts.

Submit the same email again: it should report that your gift was already sent,
without sending another one. Tell me when this check succeeds so I can check
the final connection and prepare publication.

**Until setup succeeds, automatic email delivery is not active.** A local
connection is not live on swiftchannels.com until the website changes are
published.

If you stop partway through, run the same Terminal command again. It reuses the
saved Google project and appends only new accounts; it does not reset existing
deliveries or make previously assigned accounts available again.

Routine account maintenance and delivery troubleshooting are documented in
[OPERATIONS.md](OPERATIONS.md), separate from these setup steps.
