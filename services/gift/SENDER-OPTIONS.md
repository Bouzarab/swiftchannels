# Send gifts without exposing a personal address

**Selected: Resend.** The sending code is now prepared and personal Gmail
delivery is removed. Follow [RESEND-SETUP.md](RESEND-SETUP.md) to activate it.
The options below are background comparison, not additional setup requirements.

The previous service used Google MailApp. Its display name was **SwiftChannels**
and its reply address was `contact@swiftchannels.com`, but the actual sending
address remained the deploying Google account. Google documents the distinction
between the sender and [Reply-To](https://developers.google.com/apps-script/reference/mail/mail-app).
Changing the display name is not a privacy solution.

The options below hide your personal address from recipients, not from the
service provider. Do not send public gifts until the verified-domain Resend
connection and first real-email test succeed.

## Resend: recommended for automatic gifts

- [Create an account](https://resend.com/signup).
- The [free plan](https://resend.com/pricing) includes 3,000 emails per month,
  capped at 100 per day.
- [Verify your domain](https://resend.com/docs/dashboard/domains/introduction)
  using the DNS records Resend provides.
- Your sender can be **SwiftChannels <gifts@swiftchannels.com>** or a verified
  domain address such as `contact@swiftchannels.com`.
- The existing Google account can continue managing the private spreadsheet;
  only email sending moves to Resend's API.

Creating the provider account and proving domain ownership need your account
access. Once those are ready, the sending integration can be added in this
project; that integration is now prepared. The API key must stay private, never
in the website or this chat.
Keep your existing root-domain mail records: do not replace working mailbox
records just to set up sending. Receiving replies requires a working mailbox
or separately configured receiving service.

## Brevo: higher daily free allowance

- [Create an account](https://www.brevo.com/).
- Its [free tier](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans)
  includes 300 sends per day and supports transactional email.
- Verify your brand sender and authenticate the domain, then connect its API
  to the gift service. The sender can use a verified SwiftChannels address.
- Provider account approval, limits and acceptable-use rules still apply.

This is a reasonable alternative if the daily allowance matters more. It is
not connected merely by creating an account; the current MailApp sender must
be replaced in the service.

## Brand-only Gmail: simplest, but not a custom domain

Create a separate free Google account with a brand-only address and display
name **SwiftChannels**, then deploy the service under that account. A possible
address is `swiftchannels.gifts@gmail.com`, if available. It avoids using your
personal sender address but will not display `@swiftchannels.com`. This requires
a new owner deployment and authorizations; it is not just a website setting.

## Existing Google Workspace: check before adding a provider

The domain's MX records currently point to Google. This does not prove that a
working Google Workspace mailbox exists. If you already have one, deploy from
its brand-only mailbox, or use an approved Gmail alias. Alias sending requires
[GmailApp's from option](https://developers.google.com/apps-script/reference/gmail/gmail-app#getAliases()),
not the current MailApp implementation, and broader Gmail authorization.
Existing Workspace aliases may avoid another subscription; Workspace itself
is not a free custom-domain email service.

Recommended addresses: `gifts@swiftchannels.com` for automatic gifts,
`support@swiftchannels.com` for help, and `contact@swiftchannels.com` for general
messages. Use **SwiftChannels** as the sender name. Keep replies directed to an
address that actually receives mail.
