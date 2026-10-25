const emailStep = document.querySelector('#email-step');
const codeStep = document.querySelector('#code-step');
const emailInput = document.querySelector('#login-email');
const codeInput = document.querySelector('#login-code');
const errorEl = document.querySelector('#login-error');

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { ok: res.ok, data: await res.json() };
}

// already logged in? skip the login page
fetch('/me').then(function (res) {
  if (res.ok) return res.json().then(function (u) {
    window.location.replace(u.isAdmin ? '/pages/admin.html' : '/pages/dashboard.html');
  });
});

codeInput.addEventListener('input', function () {
  codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 6);
});

document.querySelector('#send-code-btn').addEventListener('click', async function () {
  errorEl.textContent = '';
  const email = emailInput.value.trim().toLowerCase();
  if (!email) { errorEl.textContent = 'Please enter your email.'; return; }

  const r = await post('/auth/request-otp', { email: email });
  if (!r.ok) { errorEl.textContent = r.data.error; return; }

  document.querySelector('#code-sent-msg').textContent = 'We sent a 6-digit code to ' + email + '.';
  emailStep.classList.add('hidden');
  codeStep.classList.remove('hidden');
  codeInput.focus();
});

document.querySelector('#verify-code-btn').addEventListener('click', async function () {
  errorEl.textContent = '';
  const r = await post('/auth/verify-otp', {
    email: emailInput.value.trim().toLowerCase(),
    code: codeInput.value
  });
  if (!r.ok) { errorEl.textContent = r.data.error; return; }
  window.location.href = r.data.redirect;
});

document.querySelector('#change-email-btn').addEventListener('click', function () {
  codeStep.classList.add('hidden');
  emailStep.classList.remove('hidden');
  codeInput.value = '';
  errorEl.textContent = '';
});

emailInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') document.querySelector('#send-code-btn').click();
});
codeInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') document.querySelector('#verify-code-btn').click();
});