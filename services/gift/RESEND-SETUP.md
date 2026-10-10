# Connect Resend to SwiftChannels gifts

The Resend sending code, dark email templates and private-key setup helper are
already in this project. Your Google inventory and past delivery records stay
in place. Personal Gmail sending has been removed from the code and delivery
is paused until you connect Resend.

Your sender will be **SwiftChannels <gifts@swiftchannels.com>**. Replies go to
`contact@swiftchannels.com`; make sure that address receives mail. Sending from
`gifts@swiftchannels.com` does not itself create an inbox for that address.

## 1. Sign up and add the domain

1. [Create your Resend account](https://resend.com/signup), or sign in.
2. Open [Domains](https://resend.com/domains) and click **Add domain**.
3. Enter **swiftchannels.com**, not a full website URL. You already own the
   domain; you do not need to buy another one.
4. Keep **Sending** enabled and **Receiving** disabled. Your existing mailbox
   service should continue receiving incoming mail.

Resend's [domain guide](https://resend.com/docs/dashboard/domains/introduction)
explains verification and sending from addresses on your verified domain.

## 2. Add the DNS records Resend shows

The domain's current nameservers are `launch1.spaceship.net` and
`launch2.spaceship.net`, so its DNS is managed at [Spaceship](https://www.spaceship.com/).

1. Sign in to Spaceship and open the DNS settings for **swiftchannels.com**.
2. Add the records shown under Resend's **Sending** section. Copy each record's
   type, name, value and any priority exactly. These are account-specific;
   do not use example values from an online tutorial.
3. Leave the existing website records and Google mail records intact.
   A sending MX record on a subdomain such as `send` is different from the
   existing root-domain MX record. Do not replace the root MX record.
4. Return to Resend and start its verification check. Wait until the domain
   shows **Verified**. DNS changes may need time to propagate.

You do not need to change nameservers or move your website. Resend documents
[how to avoid MX conflicts](https://resend.com/docs/knowledge-base/how-do-i-avoid-conflicting-with-my-mx-records).

DNS records used for domain verification are public. You may show me those
records if you need help, but not passwords or API keys.

## 3. Create a restricted API key

1. Open [Resend API Keys](https://resend.com/api-keys) and choose **Create API key**.
2. Name it **SwiftChannels gifts**.
3. Choose **Sending access**, restricted to **swiftchannels.com**. Full access
   is not needed. See [Resend's API-key guide](https://resend.com/docs/dashboard/api-keys/introduction).
4. Copy the key for the hidden Terminal prompt below. Never paste it into this
   chat, the website, Google editor manually or GitHub.

## 4. Connect it with the prepared helper

In your Terminal:

```sh
cd ~/swiftchannels
npm run gift:resend
```

When asked whether the domain shows Verified, type **YES** and press Enter.
At the next prompt, paste the API key and press Enter. The key will not appear
on screen. The helper stores it in the owner-only private folder outside this
repository, uploads it to your private Google service, updates the existing
deployment and reconnects the local form. No code copying, Google initialization
run or website configuration edit is required.

The connection check confirms that the sender settings and inventory are
present; your first real-email test confirms the API key and verified domain
are accepted by Resend. This command does not send a test email automatically.

## 5. Test before publication

Refresh [the local gift page](http://localhost:8899/gift/). Submit an email
address that has not already claimed a gift. An address with a previous
successful delivery will not get another email.

Check your inbox and spam folder. Expand the sender details and confirm the
actual **From** address is `gifts@swiftchannels.com`, with **SwiftChannels** as
the name and `contact@swiftchannels.com` as **Reply-To**. Inspect the five account
details and the dark design. Tell me whether the test succeeds before we
publish the website changes.

If a request fails, do not repeatedly resubmit or reset inventory rows. Check
the Resend email log and Google's delivery record. Failed or uncertain requests
stay reserved for review; there is no personal Gmail fallback.
