(function () {
  'use strict';
  const config = window.GIFT_CONFIG || {};
  const copy = JSON.parse(document.getElementById('giftCopy').textContent);
  const form = document.getElementById('giftForm');
  const emailInput = document.getElementById('giftEmail');
  const submit = document.getElementById('giftSend');
  const status = document.getElementById('giftStatus');
  let widget = null;
  let token = '';
  let busy = false;
  let pending = null;

  const languageBox = document.querySelector('.lang');
  const languageButton = document.getElementById('langCur');
  function closeLanguages() {
    languageBox.classList.remove('open');
    languageButton.setAttribute('aria-expanded','false');
  }
  languageButton.addEventListener('click', () => {
    const open = languageBox.classList.toggle('open');
    languageButton.setAttribute('aria-expanded',String(open));
  });
  document.addEventListener('click', event => { if (!languageBox.contains(event.target)) closeLanguages(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeLanguages(); });
  document.querySelector('a[href="#gift-data"]').addEventListener('click', event => {
    event.preventDefault();
    document.getElementById('gift-data').showModal();
  });

  function message(text, state) {
    status.textContent = text;
    status.dataset.state = state || '';
  }
  const endpointValid = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(config.endpoint || '');
  if (!endpointValid || !config.turnstileSiteKey) return;
  message(copy.verification);
  window.swiftGiftChallengeReady = function () {
    widget = window.turnstile.render('#giftChallenge', {
      sitekey:config.turnstileSiteKey, action:'gift', theme:'dark', language:document.documentElement.lang,
      callback(value) { token = value; if (!busy) { submit.disabled = false; message(''); } },
      'expired-callback'() { token = ''; if (!busy) { submit.disabled = true; message(copy.verification); } },
      'error-callback'() { token = ''; if (!busy) { submit.disabled = true; message(copy.busy,'error'); } }
    });
  };
  const challenge = document.createElement('script');
  challenge.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=swiftGiftChallengeReady&render=explicit';
  challenge.async = true;
  challenge.onerror = () => message(copy.busy,'error');
  document.head.appendChild(challenge);

  function requestStatus(id, attempt) {
    return new Promise((resolve,reject) => {
      const callback = 'swiftGift_' + id + '_' + attempt;
      const script = document.createElement('script');
      let timeout;
      function cleanup() { clearTimeout(timeout); script.remove(); delete window[callback]; }
      window[callback] = result => { cleanup(); resolve(result); };
      script.onerror = () => { cleanup(); reject(new Error('status_unavailable')); };
      timeout = setTimeout(() => { cleanup(); reject(new Error('status_timeout')); }, 10000);
      script.referrerPolicy = 'no-referrer';
      script.src = config.endpoint + '?request=' + encodeURIComponent(id) + '&callback=' + callback;
      document.head.appendChild(script);
    });
  }

  async function deliveryStatus(id) {
    const deadline = Date.now() + 65000;
    for (let attempt = 0; Date.now() < deadline; attempt++) {
      try {
        const result = await requestStatus(id,attempt);
        if (result && result.status && result.status !== 'pending') return result.status;
      } catch (error) { /* A slow redirect can succeed on the next status check. */ }
      await new Promise(resolve => setTimeout(resolve,2000));
    }
    return 'timeout';
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    if (!form.reportValidity()) return;
    if (!token) { message(copy.verification,'error'); return; }
    const email = emailInput.value.trim().toLowerCase();
    if (!pending || pending.email !== email) {
      pending = { email, id:Array.from(crypto.getRandomValues(new Uint8Array(16)),byte => byte.toString(16).padStart(2,'0')).join('') };
    }
    busy = true;
    submit.disabled = true;
    emailInput.readOnly = true;
    form.setAttribute('aria-busy','true');
    submit.textContent = copy.sending;
    message(copy.sending);
    try {
      const body = new URLSearchParams({ email, request:pending.id, lang:document.documentElement.lang, website:document.getElementById('giftWebsite').value, turnstile:token });
      // Google returns an opaque POST response; only the read-only receipt confirms sending.
      const controller = new AbortController();
      const postTimeout = setTimeout(() => controller.abort(),20000);
      try { await fetch(config.endpoint,{ method:'POST', mode:'no-cors', credentials:'omit', body, signal:controller.signal }); }
      catch (error) { /* The send may have completed even if its response was interrupted. */ }
      finally { clearTimeout(postTimeout); }
      const result = await deliveryStatus(pending.id);
      if (result === 'sent' || result === 'already_sent') {
        message(result === 'sent' ? copy.sent : copy.already,'success');
        document.getElementById('giftSuccessText').textContent = copy.successBody.replace('{email}',email);
        const success = document.getElementById('giftSuccess');
        success.hidden = false;
        document.getElementById('giftChallenge').hidden = true;
        success.focus();
        form.hidden = true;
        if (result === 'already_sent') document.getElementById('giftSuccessText').textContent = copy.already;
        return;
      }
      const messages = { out_of_stock:copy.empty, invalid:copy.invalid, verification:copy.verification, unavailable:copy.busy, timeout:copy.timeout };
      message(messages[result] || copy.busy,'error');
      if (result !== 'timeout') pending = null;
    } catch (error) { message(copy.timeout,'error'); }
    finally {
      busy = false;
      emailInput.readOnly = false;
      form.removeAttribute('aria-busy');
      submit.textContent = copy.send;
      token = '';
      if (widget !== null && !form.hidden) window.turnstile.reset(widget);
    }
  });
})();
