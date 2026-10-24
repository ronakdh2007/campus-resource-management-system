async function initDashboard() {
  await commonReady;

  // students who are not presidents have no bookings or complaints to show
  if (!canAccess) {
    document.querySelectorAll('.dashboard-section, .next-booking-prompt').forEach(function (el) {
      el.classList.add('hidden');
    });
    const msg = document.createElement('p');
    msg.className = 'empty-section-msg';
    msg.textContent = 'Booking and complaint features are available to club presidents and faculty. Contact an administrator if you should have access.';
    document.querySelector('.page-content').appendChild(msg);
    return;
  }

  const res = await fetch('/dashboard');
  const d = await res.json();

  document.querySelector('#stat-bookings-total').textContent = d.bookings.total;
  document.querySelector('#stat-bookings-pending').textContent = d.bookings.pending;
  document.querySelector('#stat-complaints-total').textContent = d.complaints.total;
  document.querySelector('#stat-complaints-resolved').textContent = d.complaints.resolved;
  document.querySelector('#stat-complaints-pending').textContent = d.complaints.pending;
}
initDashboard();