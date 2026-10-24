let currentBookings = [];
let bookingHistory = [];

function todayISO() {
  const n = new Date();
  return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
}

// "09:00:00" or "09:00:00.000000" -> "9:00 AM"
function to12(t) {
  const parts = t.slice(0, 8).split(':');
  let h = Number(parts[0]);
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + parts[1] + ' ' + period;
}

// "9:00 AM" -> "09:00:00"
function to24(str) {
  const [time, period] = str.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':00';
}

async function loadBookings() {
  const res = await fetch('/bookings');
  const data = await res.json();
  const today = todayISO();
  currentBookings = [];
  bookingHistory = [];

  data.forEach(function (b) {
    b.slots = b.slots
      .filter(function (s) { return s.start_time; })
      .sort(function (a, c) { return a.start_time.localeCompare(c.start_time); })
      .map(function (s) { return to12(s.start_time) + ' - ' + to12(s.end_time); });

    const active = (b.status === 'Pending' || b.status === 'Approved') && b.booking_date >= today;
    (active ? currentBookings : bookingHistory).push(b);
  });
}

let originalSlots = [];
let originalPurpose = '';
let originalDate = '';

function generateTimeSlots() {
  const slots = [];
  for (let hour = 9; hour < 20; hour++) {
    const start = formatHour(hour);
    const end = formatHour(hour + 1);
    slots.push(`${start} - ${end}`);
  }
  return slots;
}

function formatHour(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}

function renderBookingCards(list, gridId, isCurrent) {
  const grid = document.querySelector('#' + gridId);
  if (list.length === 0) {
    grid.innerHTML = '<p class="empty-section-msg">No bookings here.</p>';
    return;
  }
  let html = '';
  list.forEach(function (b) {
    html += `
      <div class="resource-card">
        <h3>${b.resource_code}</h3>
        <p>${b.resource_type}</p>
        <p>${b.building}</p>
        <p>Capacity: ${b.capacity}</p>
        <p>Booking Status: <span class="status-tag status-${b.status.toLowerCase()}">${b.status}</span></p>
        <a class="view-details-link" data-id="${b.booking_id}">${isCurrent ? 'View/Edit Booking Details' : 'View Booking Details'}</a>
      </div>
    `;
  });
  grid.innerHTML = html;
}

function renderAllBookings() {
  renderBookingCards(currentBookings, 'current-bookings-grid', true);
  renderBookingCards(bookingHistory, 'booking-history-grid', false);
}

function updateEditToggleLabel() {
  const toggle = document.querySelector('#edit-slot-toggle');
  const selected = document.querySelectorAll('#edit-slot-options .slot-option.selected');
  toggle.textContent = selected.length === 0 ? 'Select Time Slot(s)' : selected.length + ' slot(s) selected';
}

function setupEditSlotDropdown() {
  const container = document.querySelector('#edit-slot-container');
  const toggle = document.querySelector('#edit-slot-toggle');
  const dropdown = document.querySelector('#edit-slot-dropdown');
  const optionsWrapper = document.querySelector('#edit-slot-options');

  let html = '';
  generateTimeSlots().forEach(function (slot) {
    html += `<button class="slot-option" data-slot="${slot}">${slot}</button>`;
  });
  optionsWrapper.innerHTML = html;

  toggle.addEventListener('click', function () {
    dropdown.classList.toggle('open');
  });

  optionsWrapper.addEventListener('click', function (event) {
    if (event.target.classList.contains('slot-option')) {
      event.target.classList.toggle('selected');
      updateEditToggleLabel();
      checkForChanges();
    }
  });

  document.addEventListener('click', function (event) {
    if (!container.contains(event.target)) dropdown.classList.remove('open');
  });
}

function setupCurrentBookingModal() {
  const grid = document.querySelector('#current-bookings-grid');
  const overlay = document.querySelector('#current-modal-overlay');
  const savedOverlay = document.querySelector('#saved-modal-overlay');
  let activeBooking = null;

  grid.addEventListener('click', function (event) {
    if (event.target.classList.contains('view-details-link')) {
      const id = Number(event.target.getAttribute('data-id'));
      activeBooking = currentBookings.find(function (b) { return b.booking_id === id; });

      document.querySelector('#current-modal-code').textContent = activeBooking.resource_code;
      document.querySelector('#current-modal-type').textContent = activeBooking.resource_type;
      document.querySelector('#current-modal-building').textContent = activeBooking.building;
      document.querySelector('#current-modal-capacity').textContent = activeBooking.capacity;
      document.querySelector('#current-modal-status').textContent = activeBooking.status;
      document.querySelector('#edit-purpose-input').value = activeBooking.purpose;
      document.querySelector('#edit-date-input').value = activeBooking.booking_date;

      document.querySelectorAll('#edit-slot-options .slot-option').forEach(function (btn) {
        const slot = btn.getAttribute('data-slot');
        btn.classList.toggle('selected', activeBooking.slots.includes(slot));
      });
      
      originalSlots = activeBooking.slots.slice();
      originalPurpose = activeBooking.purpose;
      originalDate = activeBooking.booking_date;

      updateEditToggleLabel();
      checkForChanges();

      overlay.classList.add('open');
    }
  });
  
  document.querySelector('#edit-purpose-input').addEventListener('input', checkForChanges);
  document.querySelector('#edit-date-input').addEventListener('change', checkForChanges);

  document.querySelector('#current-modal-close').addEventListener('click', function () {
    overlay.classList.remove('open');
  });

  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) overlay.classList.remove('open');
  });

  document.querySelector('#save-changes-button').addEventListener('click', async function () {
    const selected = document.querySelectorAll('#edit-slot-options .slot-option.selected');
    const purpose = document.querySelector('#edit-purpose-input').value.trim();
    const date = document.querySelector('#edit-date-input').value;

    if (selected.length === 0 || purpose === '' || date === '') {
      document.querySelector('#validation-message').textContent = 'Please select a time slot and enter a purpose.';
      document.querySelector('#validation-modal-overlay').classList.add('open');
      return;
    }

    const slots = Array.from(selected).map(function (btn) {
      const parts = btn.getAttribute('data-slot').split(' - ');
      return { start_time: to24(parts[0]), end_time: to24(parts[1]) };
    });

    const res = await fetch('/bookings/' + activeBooking.booking_id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_date: date, purpose: purpose, slots: slots })
    });
    const data = await res.json();

    if (!res.ok) {
      document.querySelector('#validation-message').textContent = data.error;
      document.querySelector('#validation-modal-overlay').classList.add('open');
      return;
    }

    await loadBookings();
    renderAllBookings();
    overlay.classList.remove('open');
    savedOverlay.classList.add('open');
  });

  // Cancel button: first add <button id="cancel-booking-button">Cancel Booking</button> next to Save in bookings.html
  const cancelBtn = document.querySelector('#cancel-booking-button');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', async function () {
      if (!confirm('Cancel this booking?')) return;
      const res = await fetch('/bookings/' + activeBooking.booking_id + '/cancel', { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) {
        document.querySelector('#validation-message').textContent = data.error;
        document.querySelector('#validation-modal-overlay').classList.add('open');
        return;
      }
      await loadBookings();
      renderAllBookings();
      overlay.classList.remove('open');
    });
  }

  savedOverlay.addEventListener('click', function (event) {
    if (event.target === savedOverlay) savedOverlay.classList.remove('open');
  });
  document.querySelector('#saved-modal-close').addEventListener('click', function () {
    savedOverlay.classList.remove('open');
  });

  document.querySelector('#validation-ok-button').addEventListener('click', function () {
    document.querySelector('#validation-modal-overlay').classList.remove('open');
  });
  document.querySelector('#validation-modal-close').addEventListener('click', function () {
    document.querySelector('#validation-modal-overlay').classList.remove('open');
  });
}

function setupHistoryModal() {
  const grid = document.querySelector('#booking-history-grid');
  const overlay = document.querySelector('#history-modal-overlay');

  grid.addEventListener('click', function (event) {
    if (event.target.classList.contains('view-details-link')) {
      const id = Number(event.target.getAttribute('data-id'));
      const booking = bookingHistory.find(function (b) { return b.booking_id === id; });

      document.querySelector('#history-modal-code').textContent = booking.resource_code;
      document.querySelector('#history-modal-type').textContent = booking.resource_type;
      document.querySelector('#history-modal-building').textContent = booking.building;
      document.querySelector('#history-modal-capacity').textContent = booking.capacity;
      document.querySelector('#history-modal-date').textContent = booking.booking_date;
      document.querySelector('#history-modal-slot').textContent = booking.slots.join(', ');
      document.querySelector('#history-modal-purpose').textContent = booking.purpose;

      overlay.classList.add('open');
    }
  });

  document.querySelector('#history-modal-close').addEventListener('click', function () {
    overlay.classList.remove('open');
  });
  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) overlay.classList.remove('open');
  });
}

function checkForChanges() {
  const selected = Array.from(document.querySelectorAll('#edit-slot-options .slot-option.selected'))
    .map(function (btn) { return btn.getAttribute('data-slot'); })
    .sort();
  const currentPurpose = document.querySelector('#edit-purpose-input').value.trim();
  const currentDate = document.querySelector('#edit-date-input').value;
  const sortedOriginal = originalSlots.slice().sort();

  const slotsChanged = JSON.stringify(selected) !== JSON.stringify(sortedOriginal);
  const purposeChanged = currentPurpose !== originalPurpose;
  const dateChanged = currentDate !== originalDate;

  document.querySelector('#save-changes-button').disabled = !(slotsChanged || purposeChanged || dateChanged);
}

async function init() {
  await commonReady;
  applyAccessGate();
  if (!canAccess) return;
  await loadBookings();
  renderAllBookings();
  setupCurrentBookingModal();
  setupHistoryModal();
  setupEditSlotDropdown();
}
init();