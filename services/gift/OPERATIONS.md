# Gift delivery maintenance

## Private data and inventory

Only the public page and generic service source belong in GitHub. The actual
portal/MAC entries and verification secret stay in your private local deployment
folder and Google project/spreadsheet. Keep both private. Use only accounts you
are authorized to distribute. The sender does not create, activate or check
access at the providers.

The supplied dates do not specify a timezone; the importer interprets them as
UTC+1. Expired entries and duplicate MAC codes are excluded locally, and expiry
is checked again before every delivery. Dates in a file are not proof that an
account still works.

Run `setupGiftService` in your Google editor to find the private spreadsheet
link in its execution log. This preserves existing data.

Each new recipient receives five randomly selected, distinct accounts. Accounts
are not reused for different recipients. When fewer than five remain available,
no partial gift is sent.

To replenish inventory, update your private source list and rerun
`npm run gift:setup`. Initialization appends unseen, unexpired MAC codes only;
previous deliveries and reservations remain intact. Do not sort, delete or
replace inventory rows after deliveries begin: delivery records reference their
positions. Do not edit the **Deliveries** tab casually.

## Sending and troubleshooting

Resend sends from **SwiftChannels <gifts@swiftchannels.com>** once the private
API key and domain are configured. Replies use `contact@swiftchannels.com`.
The Google account holds inventory but never sends mail. Missing settings,
paused delivery or a non-SwiftChannels sender address fail before reservation;
no personal Gmail fallback exists. Provider limits are described in
[Resend's pricing](https://resend.com/pricing).

Email sending starts on submission; inbox arrival depends on the recipient's
mail provider. Email addresses are normalized to lowercase. Only one successful
gift is allowed per email address, not per individual person.

The browser checks delivery through a random receipt ID. Receipt responses
contain only status, never email addresses, portals or MAC codes. The public
setup health check returns only readiness and availability booleans.

A script lock prevents concurrent requests from assigning the same accounts.
After a failed or interrupted send, the selection remains reserved:

- A `review` or stale `sending` delivery needs an operator check.
- If email was sent, mark the delivery and its five inventory rows `sent`.
- If it was definitely not sent, set the delivery to `retry`. A new submission
  from the same email reuses the original reserved selection, if still valid.
- Never release reserved accounts while delivery is uncertain.

Check Google's execution log and the recipient before changing any state. A
successful repeat submission does not resend email. A Resend quota, permission
or uncertain-response error also keeps the selection reserved for review.
Check the provider log before approving a retry. The API idempotency key is a
hash of the normalized recipient and is stable across retries; it is an extra
safeguard within the provider's retention window, not a replacement for the
permanent delivery record. A changed payload during a retry may be rejected.
Only mark a delivery retry if you have confirmed it was not accepted previously.

## Updates and local testing

The setup helper regenerates translated email templates from
`scripts/gift-copy.js`, uploads the sender and updates the existing deployment.
Use `npm run gift:update` after changing service code or email copy. This updates
the existing Google deployment without another initialization run, without
resetting deliveries and without sending an email. It writes the public endpoint
and site key into `assets/gift-config.js` only after a successful readiness check.

The prepared widget/settings allow `localhost` for your first real-email test.
After testing, you may remove `localhost` from the widget and set
`ALLOW_LOCAL_PREVIEW` to `false` in Google Script Properties. Running setup again
reenables local preview for testing.

`npm run test:gift`, `npm run test:gift-ui` and `npm run test:gift-email` use mocks
or fictional preview accounts and send no real emails.
The UI tests expect the local website server on port 8899.

The separate `scripts/gift-import.js` tool can export private CSV inventory for
manual maintenance if ever needed; it is not part of the normal setup process.

The selected sender setup is documented in [RESEND-SETUP.md](RESEND-SETUP.md).
`npm run gift:pause` disables delivery in both the service and local form.
`npm run gift:resend` configures the private key and resumes branded sending.
Provider API keys never belong in the public repository or website settings.

## References

- [Google Apps Script web apps](https://developers.google.com/apps-script/guides/web)
- [Google clasp deployment tool](https://github.com/google/clasp)
- [Google MailApp](https://developers.google.com/apps-script/reference/mail/mail-app)
- [Turnstile server verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
