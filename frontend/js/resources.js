// Temporary hardcoded data
const resources=[
  { resource_code: "LHC002", room_number: "002", resource_type: "Lecture Hall", building: "LHC Complex", capacity: 200, status: "Available" },
  { resource_code: "2AB016", room_number: "016", resource_type: "Classroom", building: "AB2", capacity: 80, status: "Unavailable" },
  { resource_code: "1AB102", room_number: "102", resource_type: "Computer Lab", building: "AB1", capacity: 60, status: "Available" },
  { resource_code: "LHC202", room_number: "202", resource_type: "Classroom", building: "LHC", capacity: 80, status: "Maintenance" }
];

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
    const purpose = document.querySelector('#purpose-input').value.trim();
    const date = document.querySelector('#date-input').value;

    if (selectedSlots.length === 0 || purpose === '' || date === '') {
      document.querySelector('#validation-message').textContent = 'Please select a date, time slot, and enter a purpose before booking.';
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

function applyFilters() {
  let filtered = resources;

  const selectedBuildings = getCheckedValues('building');
  const selectedRoomTypes = getCheckedValues('roomType');
  const selectedStatuses = getCheckedValues('status');
  const minCapacity = document.querySelector('#capacity-min').value;
  const maxCapacity = document.querySelector('#capacity-max').value;

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

renderResources();
setupResourceModal();
setupSlotDropdown();
setupFilters();
setupSearch();
applyAccessGate();