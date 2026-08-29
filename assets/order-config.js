/* ══════════════════════════════════════════════════════════════════════
   SWIFT CHANNELS — WHERE ORDERS GO
   ══════════════════════════════════════════════════════════════════════

   This is the ONLY file you edit to connect the order button to your
   Google Form. Every language version of the site reads it, so you fill
   it in once — no rebuild, no other file to touch.

   While `action` below is empty, the send button falls back to opening
   the customer's own email app addressed to `email`. That works, but
   nothing is collected in a sheet. Follow GOOGLE-FORM-SETUP.md.
   ══════════════════════════════════════════════════════════════════════ */

window.ORDER_CONFIG = {

  /* Where order emails should reach you. */
  email: 'contact@swiftchannels.com',

  orderForm: {

    /* STEP 1 — paste your form's POST address here.
       It looks like:
       https://docs.google.com/forms/d/e/1FAIpQLSd...long...ABC/formResponse
       It MUST end in /formResponse (not /viewform). */
    action: 'https://docs.google.com/forms/d/e/1FAIpQLSfZcHPnJ60jAQ9VAisLxJj4zhmg4OnIYbpD3lV34iY2mMr0-Q/formResponse',

    /* STEP 2 — paste the entry id of each question here.
       Each one looks like 'entry.123456789'. Keep the quotes. */
    fields: {
      ref:     'entry.40346840',     /* Reference  */
      name:    'entry.1501774247',   /* Name       */
      phone:   'entry.1600242544',   /* Phone      */
      email:   'entry.706598786',    /* Email      */
      plan:    'entry.1556551537',   /* Plan       */
      devices: 'entry.1562916630',   /* Devices    */
      device:  'entry.680529541',    /* Watch on   */
      mac:     'entry.1142793434',   /* MAC        */
      method:  'entry.1286162887',   /* Pay by     */
      total:   'entry.1516916128',   /* Total      */
      notes:   'entry.341763312',    /* Notes      */
      lang:    'entry.1652809889',   /* Language   */
      invitedBy: 'entry.1716936100'  /* Invited by */
    }
  }
};
