let resources = [];

async function loadResources() {
  const response = await fetch('/resources');
  if (!response.ok) throw new Error('Server error: ' + response.status);
  resources = await response.json();
}

// For resource rendering
function renderResources(list) {
  const dataToRender = list || resources;
  const grid = document.querySelector('#resource-grid');
  const countDisplay = document.querySelector('#resource-count');

  countDisplay.textContent = dataToRender.length;

  let cardsHTML = '';
  dataToRender.forEach(function (resource) {
    cardsHTML += `
      <div class="resource-card">
        <h3>${resource.resource_code}</h3>
        <p>${resource.resource_type}</p>
        <p>${resource.building}</p>
        <p>Capacity: ${resource.capacity}</p>
        <span class="status-tag status-${resource.status.toLowerCase()}">${resource.status}</span>
        <br>
        <a class="view-details-link" data-code="${resource.resource_code}">View Details</a>
      </div>
    `;
  });

  grid.innerHTML = cardsHTML;
}

function to24(t) { // "9:00 AM" -> "09:00:00"
  const [time, period] = t.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':00';
}

let availabilityToken = 0;

function updateSlotLabel() {
  const n = document.querySelectorAll('.slot-option.selected').length;
  document.querySelector('#slot-dropdown-toggle').textContent = n === 0 ? 'Select Time Slot(s)' : n + ' slot(s) selected';
}

function toMinutes(hhmm) { // "13:10" -> 790
  const p = hhmm.split(':');
  return Number(p[0]) * 60 + Number(p[1]);
}

// grey out the slots that clash with a class or an approved booking on the chosen date
async function refreshSlotAvailability() {
  const myToken = ++availabilityToken;
  const code = document.querySelector('#modal-room-code').textContent;
  const date = document.querySelector('#date-input').value;
  let blocked = [];

  if (date) {
    const res = await fetch('/availability?resource_code=' + encodeURIComponent(code) + '&date=' + date);
    if (myToken !== availabilityToken) return; // a newer request replaced this one
    if (res.ok) {
      const data = await res.json();
      data.classes.forEach(function (r) { blocked.push({ start: r.start_time, end: r.end_time, why: 'Class scheduled' }); });
      data.booked.forEach(function (r) { blocked.push({ start: r.start_time, end: r.end_time, why: 'Already booked' }); });
    }
  }

  document.querySelectorAll('.slot-option').forEach(function (btn) {
    const parts = btn.dataset.slot.split(' - ');
    const start = toMinutes(to24(parts[0]));
    const end = toMinutes(to24(parts[1]));
    const hit = blocked.find(function (b) { return toMinutes(b.start) < end && toMinutes(b.end) > start; });
    btn.disabled = !!hit;
    btn.title = hit ? hit.why : '';
    if (hit) btn.classList.remove('selected');
  });
  updateSlotLabel();
}

// For resource modal
function setupResourceModal() {
  const grid = document.querySelector('#resource-grid');
  const detailsOverlay = document.querySelector('#details-modal-overlay');
  const confirmOverlay = document.querySelector('#confirm-modal-overlay');

  grid.addEventListener('click', function (event) {
    if (event.target.classList.contains('view-details-link')) {
      const code = event.target.getAttribute('data-code');
      const resource = resources.find(function (r) { return r.resource_code === code; });

      document.querySelector('#modal-room-code').textContent = resource.resource_code;
      document.querySelector('#modal-room-type').textContent = resource.resource_type;
      document.querySelector('#modal-building').textContent = resource.building;
      document.querySelector('#modal-capacity').textContent = resource.capacity;
      document.querySelector('#modal-status').textContent = resource.status;

      document.querySelectorAll('.slot-option.selected').forEach(function (btn) {
        btn.classList.remove('selected');
      });
      document.querySelector('#slot-dropdown-toggle').textContent = 'Select Time Slot(s)';
      document.querySelector('#slot-dropdown').classList.remove('open');
      
      document.querySelector('#purpose-input').value = '';
      
      document.querySelector('#date-input').value = '';
      refreshSlotAvailability();

      detailsOverlay.classList.add('open');
    }
  });

  document.querySelector('#details-modal-close').addEventListener('click', function () {
    detailsOverlay.classList.remove('open');
  });

  detailsOverlay.addEventListener('click', function (event) {
    if (event.target === detailsOverlay) {
      detailsOverlay.classList.remove('open');
    }
  });

  document.querySelector('#book-button').addEventListener('click', async function () {
    const selectedSlots = document.querySelectorAll('.slot-option.selected');
    const purpose = document.querySelector('#purpose-input').value.trim();
    const date = document.querySelector('#date-input').value;

    if (selectedSlots.length === 0 || purpose === '' || date === '') {
      document.querySelector('#validation-message').textContent = 'Please select a date, time slot, and enter a purpose before booking.';
      document.querySelector('#validation-modal-overlay').classList.add('open');
      return;
    }

    const slots = Array.from(selectedSlots).map(function (btn) {
      const [s, e] = btn.dataset.slot.split(' - ');
      return { start_time: to24(s), end_time: to24(e) };
    });

    const response = await fetch('/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resource_code: document.querySelector('#modal-room-code').textContent,
        booking_date: date,
        purpose: purpose,
        slots: slots
      })
    });

    if (!response.ok) {
      const data = await response.json();
      document.querySelector('#validation-message').textContent = data.error;
      document.querySelector('#validation-modal-overlay').classList.add('open');
      return;
    }

    detailsOverlay.classList.remove('open');
    confirmOverlay.classList.add('open');
  });

  document.querySelector('#confirm-modal-close').addEventListener('click', function () {
    confirmOverlay.classList.remove('open');
  });
  
  document.querySelector('#validation-ok-button').addEventListener('click', function () {
    document.querySelector('#validation-modal-overlay').classList.remove('open');
  });
  
  document.querySelector('#validation-modal-close').addEventListener('click', function () {
    document.querySelector('#validation-modal-overlay').classList.remove('open');
  });

  document.querySelector('#validation-modal-overlay').addEventListener('click', function (event) {
    if (event.target === document.querySelector('#validation-modal-overlay')) {
      document.querySelector('#validation-modal-overlay').classList.remove('open');
    }
  });

  confirmOverlay.addEventListener('click', function (event) {
    if (event.target === confirmOverlay) {
      confirmOverlay.classList.remove('open');
    }
  });
}

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

function setupSlotDropdown() {
  const container = document.querySelector('#slot-dropdown-container');
  const toggle = document.querySelector('#slot-dropdown-toggle');
  const dropdown = document.querySelector('#slot-dropdown');
  const optionsWrapper = document.querySelector('#slot-options');

  const slots = generateTimeSlots();
  let optionsHTML = '';
  slots.forEach(function (slot) {
    optionsHTML += `<button class="slot-option" data-slot="${slot}">${slot}</button>`;
  });
  optionsWrapper.innerHTML = optionsHTML;

  toggle.addEventListener('click', function () {
    dropdown.classList.toggle('open');
  });

  optionsWrapper.addEventListener('click', function (event) {
    if (event.target.classList.contains('slot-option') && !event.target.disabled) {
      event.target.classList.toggle('selected');
      updateSlotLabel();
    }
  });

  // new: when the date changes, re-check which slots are free
  document.querySelector('#date-input').addEventListener('change', refreshSlotAvailability);

  document.addEventListener('click', function (event) {
    if (!container.contains(event.target)) {
      dropdown.classList.remove('open');
    }
  });
}

function getUniqueValues(field) {
  const values = resources.map(function (r) { return r[field]; });
  return Array.from(new Set(values));
}

function populateCheckboxSubdropdown(containerId, values, groupName) {
  const container = document.querySelector('#' + containerId);
  let html = '';
  values.forEach(function (value, index) {
    html += `<label class="filter-checkbox-row">
      <input type="checkbox" class="sub-filter-checkbox" data-group="${groupName}" value="${value}"> ${value}
    </label>`;
  });
  container.innerHTML = html;
}

function getCheckedValues(groupName) {
  const checked = document.querySelectorAll('.sub-filter-checkbox[data-group="' + groupName + '"]:checked');
  return Array.from(checked).map(function (cb) { return cb.value; });
}

function setupFilters() {
  const filterToggle = document.querySelector('#filter-toggle');
  const filterDropdown = document.querySelector('#filter-dropdown');
  const filterContainer = document.querySelector('#filter-container');
  const noFilterCheckbox = document.querySelector('#filter-nofilter');
  const typeCheckboxes = document.querySelectorAll('.filter-type-checkbox');

  populateCheckboxSubdropdown('subdropdown-building', getUniqueValues('building'), 'building');
  populateCheckboxSubdropdown('subdropdown-roomType', getUniqueValues('resource_type'), 'roomType');
  populateCheckboxSubdropdown('subdropdown-status', getUniqueValues('status'), 'status');

  filterToggle.addEventListener('click', function () {
    filterDropdown.classList.toggle('open');
    filterToggle.classList.toggle('active');
  });

  document.addEventListener('click', function (event) {
    if (!filterContainer.contains(event.target)) {
      filterDropdown.classList.remove('open');
      filterToggle.classList.remove('active');
      document.querySelectorAll('.filter-subdropdown').forEach(function (sd) {
        sd.classList.remove('open');
      });
    }
  });

  typeCheckboxes.forEach(function (checkbox) {
    checkbox.addEventListener('change', function () {
      document.querySelectorAll('.filter-subdropdown').forEach(function (sd) {
        sd.classList.remove('open');
      });

      const type = checkbox.getAttribute('data-type');
      if (checkbox.checked) {
        document.querySelector('#subdropdown-' + type).classList.add('open');
        noFilterCheckbox.checked = false;
      }

      applyFilters();
    });
  });

  noFilterCheckbox.addEventListener('change', function () {
    if (noFilterCheckbox.checked) {
      typeCheckboxes.forEach(function (cb) { cb.checked = false; });
      document.querySelectorAll('.sub-filter-checkbox').forEach(function (cb) { cb.checked = false; });
      document.querySelector('#capacity-min').value = '';
      document.querySelector('#capacity-max').value = '';
      document.querySelectorAll('.filter-subdropdown').forEach(function (sd) { sd.classList.remove('open'); });
      applyFilters();
    }
  });

  filterDropdown.addEventListener('change', function (event) {
    if (event.target.classList.contains('sub-filter-checkbox') || event.target.classList.contains('capacity-input')) {
      applyFilters();
    }
  });
}

function setupSearch() {
  const searchInput = document.querySelector('.search-input');

  searchInput.addEventListener('input', function () {
    applyFilters();
  });
}

function applyFilters() {
  let filtered = resources;

  const searchTerm = document.querySelector('.search-input').value.toLowerCase().trim();
  const selectedBuildings = getCheckedValues('building');
  const selectedRoomTypes = getCheckedValues('roomType');
  const selectedStatuses = getCheckedValues('status');
  const minCapacity = document.querySelector('#capacity-min').value;
  const maxCapacity = document.querySelector('#capacity-max').value;

  if (searchTerm) {
    filtered = filtered.filter(function (r) {
      return r.resource_code.toLowerCase().includes(searchTerm) ||
             r.resource_type.toLowerCase().includes(searchTerm) ||
             r.building.toLowerCase().includes(searchTerm);
    });
  }
  if (selectedBuildings.length > 0) {
    filtered = filtered.filter(function (r) { return selectedBuildings.includes(r.building); });
  }
  if (selectedRoomTypes.length > 0) {
    filtered = filtered.filter(function (r) { return selectedRoomTypes.includes(r.resource_type); });
  }
  if (selectedStatuses.length > 0) {
    filtered = filtered.filter(function (r) { return selectedStatuses.includes(r.status); });
  }
  if (minCapacity) {
    filtered = filtered.filter(function (r) { return r.capacity >= Number(minCapacity); });
  }
  if (maxCapacity) {
    filtered = filtered.filter(function (r) { return r.capacity <= Number(maxCapacity); });
  }

  renderResources(filtered);
}

async function init() {
  try {
    await commonReady;
    await loadResources();
  } catch (err) {
    console.error(err);
    document.querySelector('#resource-grid').textContent = 'Could not load resources.';
    return;
  }
  renderResources();
  setupResourceModal();
  setupSlotDropdown();
  setupFilters();
  setupSearch();
  applyAccessGate();
}

init();