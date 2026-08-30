// Temporary hardcoded data
const resources=[
  { resource_code: "LHC002", room_number: "002", resource_type: "Lecture Hall", building: "LHC Complex", capacity: 200, status: "Available" },
  { resource_code: "2AB016", room_number: "016", resource_type: "Classroom", building: "AB2", capacity: 80, status: "Unavailable" },
  { resource_code: "1AB102", room_number: "102", resource_type: "Computer Lab", building: "AB1", capacity: 60, status: "Available" },
  { resource_code: "LHC202", room_number: "202", resource_type: "Classroom", building: "LHC", capacity: 80, status: "Maintenance" }
];

// For resource rendering
function renderResources() {
  const grid = document.querySelector('#resource-grid');
  const countDisplay = document.querySelector('#resource-count');

  countDisplay.textContent = resources.length;

  let cardsHTML='';
  resources.forEach(function (resource) {
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

  grid.innerHTML=cardsHTML;
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

  document.querySelector('#book-button').addEventListener('click', function () {
    const selectedSlots = document.querySelectorAll('.slot-option.selected');

    if (selectedSlots.length === 0) {
      document.querySelector('#validation-message').textContent = 'Please select at least one time slot before booking.';
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
    if (event.target.classList.contains('slot-option')) {
      event.target.classList.toggle('selected');
      updateToggleLabel();
    }
  });

  function updateToggleLabel() {
    const selected = document.querySelectorAll('.slot-option.selected');
    if (selected.length === 0) {
      toggle.textContent = 'Select Time Slot(s)';
    } else {
      toggle.textContent = selected.length + ' slot(s) selected';
    }
  }

  document.addEventListener('click', function (event) {
    if (!container.contains(event.target)) {
      dropdown.classList.remove('open');
    }
  });
}

renderResources();
setupResourceModal();
setupSlotDropdown();