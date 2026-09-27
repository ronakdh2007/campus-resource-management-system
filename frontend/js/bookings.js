// Temporary hardcoded data
const currentBookings = [
  { resource_code: "LHC002", resource_type: "Lecture Hall", building: "LHC Complex", capacity: 200, status: "Pending", booking_date: "2026-09-27", slots: ["1:00 PM - 2:00 PM"], purpose: "Guest lecture" },
  { resource_code: "1AB102", resource_type: "Computer Lab", building: "AB1", capacity: 60, status: "Approved", booking_date: "2026-11-08", slots: ["3:00 PM - 4:00 PM", "4:00 PM - 5:00 PM"], purpose: "Coding workshop" }
];

const bookingHistory = [
  { resource_code: "2AB016", resource_type: "Classroom", building: "AB2", capacity: 80, booking_date: "2026-12-25", slots: ["10:00 AM - 11:00 AM"], purpose: "Club meeting" }
];

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
  let html = '';
  list.forEach(function (b) {
    html += `
      <div class="resource-card">
        <h3>${b.resource_code}</h3>
        <p>${b.resource_type}</p>
        <p>${b.building}</p>
        <p>Capacity: ${b.capacity}</p>
        ${isCurrent ? `<p>Booking Status: <span class="status-tag status-${b.status.toLowerCase()}">${b.status}</span></p>` : ''}
        <a class="view-details-link" data-code="${b.resource_code}">${isCurrent ? 'View/Edit Booking Details' : 'View Booking Details'}</a>
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
      const code = event.target.getAttribute('data-code');
      activeBooking = currentBookings.find(function (b) { return b.resource_code === code; });

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

  document.querySelector('#save-changes-button').addEventListener('click', function () {
    const selected = document.querySelectorAll('#edit-slot-options .slot-option.selected');
    const purpose = document.querySelector('#edit-purpose-input').value.trim();
    const date = document.querySelector('#edit-date-input').value;

    if (selected.length === 0 || purpose === '' || date === '') {
      document.querySelector('#validation-message').textContent = 'Please select a time slot and enter a purpose.';
      document.querySelector('#validation-modal-overlay').classList.add('open');
      return;
    }

    activeBooking.slots = Array.from(selected).map(function (btn) { return btn.getAttribute('data-slot'); });
    activeBooking.purpose = purpose;
    activeBooking.booking_date = date;
    activeBooking.status = 'Pending';

    renderAllBookings();
    overlay.classList.remove('open');
    savedOverlay.classList.add('open');
  });

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
      const code = event.target.getAttribute('data-code');
      const booking = bookingHistory.find(function (b) { return b.resource_code === code; });

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

renderAllBookings();
setupCurrentBookingModal();
setupHistoryModal();
setupEditSlotDropdown();