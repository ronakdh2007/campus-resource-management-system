// Temporary hardcoded data — field names match DB columns exactly
const complaints = [
  { complaint_id: 1, title: 'Projector not working', description: 'The projector does not turn on.', resource_code: '1AB102', status: 'Pending', created_date: '2026-10-03', resolved_date: null },
  { complaint_id: 2, title: 'AC not cooling', description: 'The AC runs but the room stays hot.', resource_code: 'LHC002', status: 'Pending', created_date: '2026-10-01', resolved_date: null },
  { complaint_id: 3, title: 'Broken chairs in front row', description: 'Three chairs in the front row are broken.', resource_code: '2AB016', status: 'Resolved', created_date: '2026-09-20', resolved_date: '2026-09-22' },
  { complaint_id: 4, title: 'WiFi not working', description: 'No WiFi signal in the room.', resource_code: 'LHC202', status: 'Resolved', created_date: '2026-09-10', resolved_date: '2026-09-12' }
];

// TODO: move to common.js in the cleanup pass — same resource list as resources.js
const campusResources = [
  { resource_code: 'LHC002', resource_type: 'Lecture Hall', building: 'LHC Complex' },
  { resource_code: '2AB016', resource_type: 'Classroom',    building: 'AB2' },
  { resource_code: '1AB102', resource_type: 'Computer Lab', building: 'AB1' },
  { resource_code: 'LHC202', resource_type: 'Classroom',    building: 'LHC' }
];

// Convert 'YYYY-MM-DD' to 'DD-MM-YYYY' — avoid new Date() to prevent timezone bugs
function formatDate(isoStr) {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  return parts[2] + '-' + parts[1] + '-' + parts[0];
}

// Return today as 'YYYY-MM-DD' in local time
function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

function findResource(code) {
  return campusResources.find(function (r) { return r.resource_code === code; });
}

// Populate a <select> with all campus resources, pre-selecting one by code
function populateResourceSelect(selectEl, selectedCode) {
  let html = '<option value="" disabled>Select a resource</option>';
  campusResources.forEach(function (r) {
    const sel = r.resource_code === selectedCode ? 'selected' : '';
    html += '<option value="' + r.resource_code + '" ' + sel + '>' + r.resource_code + '</option>';
  });
  selectEl.innerHTML = html;
}

// Render both complaint grids
function renderComplaints() {
  // String comparison works correctly on ISO 'YYYY-MM-DD' dates
  const sorted = complaints.slice().sort(function (a, b) {
    return b.created_date.localeCompare(a.created_date);
  });

  const pending  = sorted.filter(function (c) { return c.status === 'Pending'; });
  const resolved = sorted.filter(function (c) { return c.status === 'Resolved'; });

  renderGrid(pending,  'pending-grid',  true);
  renderGrid(resolved, 'resolved-grid', false);
}

function renderGrid(list, gridId, isPending) {
  const grid = document.querySelector('#' + gridId);

  if (list.length === 0) {
    grid.innerHTML = '<p class="empty-section-msg">' + (isPending ? 'No pending complaints.' : 'No resolved complaints.') + '</p>';
    return;
  }

  let html = '';
  list.forEach(function (c) {
    const res = findResource(c.resource_code);
    const resolvedRow = !isPending ? '<p>Resolved on: ' + formatDate(c.resolved_date) + '</p>' : '';

    // data-id uses complaint_id so multiple complaints on the same resource work correctly
    html += '<div class="resource-card">'
      + '<h3>' + c.title + '</h3>'
      + '<p>' + (res ? res.resource_type : '—') + '</p>'
      + '<p>' + (res ? res.building : '—') + ' &middot; ' + c.resource_code + '</p>'
      + '<p>Filed on: ' + formatDate(c.created_date) + '</p>'
      + resolvedRow
      + '<p>Status: <span class="status-tag status-' + c.status.toLowerCase() + '">' + c.status + '</span></p>'
      + '<a class="view-details-link" data-id="' + c.complaint_id + '">' + (isPending ? 'View/Edit Details' : 'View Details') + '</a>'
      + '</div>';
  });

  grid.innerHTML = html;
}

// Show the validation modal with a message
function showValidation(message) {
  document.querySelector('#validation-message').textContent = message;
  document.querySelector('#validation-modal-overlay').classList.add('open');
}

// Show the confirmation modal with a heading and message
function showConfirmation(heading, message) {
  document.querySelector('#confirm-modal-heading').textContent = heading;
  document.querySelector('#confirm-modal-message').textContent = message;
  document.querySelector('#confirm-modal-overlay').classList.add('open');
}

// New Complaint modal
function setupNewComplaintModal() {
  const overlay   = document.querySelector('#new-complaint-overlay');
  const openBtn   = document.querySelector('#report-issue-btn');
  const closeBtn  = document.querySelector('#new-complaint-close');
  const selectEl  = document.querySelector('#new-resource-select');
  const titleEl   = document.querySelector('#new-title-input');
  const descEl    = document.querySelector('#new-desc-textarea');
  const submitBtn = document.querySelector('#new-submit-btn');

  openBtn.addEventListener('click', function () {
    populateResourceSelect(selectEl, '');
    titleEl.value = '';
    descEl.value  = '';
    overlay.classList.add('open');
  });

  closeBtn.addEventListener('click', function () {
    overlay.classList.remove('open');
  });

  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) overlay.classList.remove('open');
  });

  submitBtn.addEventListener('click', function () {
    const code  = selectEl.value;
    const title = titleEl.value.trim();
    const desc  = descEl.value.trim();

    if (!code || !title || !desc) {
      showValidation('Please select a resource and fill in the title and description.');
      return;
    }

    const maxId = complaints.reduce(function (max, c) {
      return c.complaint_id > max ? c.complaint_id : max;
    }, 0);

    complaints.push({
      complaint_id:  maxId + 1,
      title:         title,
      description:   desc,
      resource_code: code,
      status:        'Pending',
      created_date:  todayISO(),
      resolved_date: null
    });

    renderComplaints();
    overlay.classList.remove('open');
    titleEl.value  = '';
    descEl.value   = '';
    selectEl.value = '';
    showConfirmation('Complaint Submitted', 'Your complaint has been sent to the administrator.');
  });
}

// Track originals so Save Changes is only enabled when something differs
let originalResource = '';
let originalTitle    = '';
let originalDesc     = '';

function checkForChanges() {
  const changed = document.querySelector('#edit-resource-select').value !== originalResource
               || document.querySelector('#edit-title-input').value.trim()    !== originalTitle
               || document.querySelector('#edit-desc-textarea').value.trim()  !== originalDesc;

  document.querySelector('#edit-save-btn').disabled = !changed;
}

// View/Edit modal (pending complaints)
function setupEditComplaintModal() {
  const overlay  = document.querySelector('#edit-complaint-overlay');
  const closeBtn = document.querySelector('#edit-complaint-close');
  const grid     = document.querySelector('#pending-grid');
  const selectEl = document.querySelector('#edit-resource-select');
  const typeEl   = document.querySelector('#edit-modal-type');
  const buildEl  = document.querySelector('#edit-modal-building');
  const filedEl  = document.querySelector('#edit-modal-filed');
  const statusEl = document.querySelector('#edit-modal-status');
  const titleEl  = document.querySelector('#edit-title-input');
  const descEl   = document.querySelector('#edit-desc-textarea');
  const saveBtn  = document.querySelector('#edit-save-btn');

  let activeId = null;

  grid.addEventListener('click', function (event) {
    if (!event.target.classList.contains('view-details-link')) return;

    const id = Number(event.target.getAttribute('data-id'));
    const complaint = complaints.find(function (c) { return c.complaint_id === id; });
    if (!complaint) return;

    activeId = id;
    const res = findResource(complaint.resource_code);

    populateResourceSelect(selectEl, complaint.resource_code);
    typeEl.textContent  = res ? res.resource_type : '—';
    buildEl.textContent = res ? res.building      : '—';
    filedEl.textContent = formatDate(complaint.created_date);
    statusEl.innerHTML  = '<span class="status-tag status-' + complaint.status.toLowerCase() + '">' + complaint.status + '</span>';
    titleEl.value = complaint.title;
    descEl.value  = complaint.description;

    originalResource = complaint.resource_code;
    originalTitle    = complaint.title;
    originalDesc     = complaint.description;
    saveBtn.disabled = true;

    overlay.classList.add('open');
  });

  // Update Room Type and Building live when the resource changes
  selectEl.addEventListener('change', function () {
    const res = findResource(selectEl.value);
    typeEl.textContent  = res ? res.resource_type : '—';
    buildEl.textContent = res ? res.building      : '—';
    checkForChanges();
  });

  titleEl.addEventListener('input', checkForChanges);
  descEl.addEventListener('input',  checkForChanges);

  closeBtn.addEventListener('click', function () {
    overlay.classList.remove('open');
  });

  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) overlay.classList.remove('open');
  });

  saveBtn.addEventListener('click', function () {
    const title = titleEl.value.trim();
    const desc  = descEl.value.trim();

    if (!title || !desc) {
      showValidation('Please fill in the title and description.');
      return;
    }

    const complaint = complaints.find(function (c) { return c.complaint_id === activeId; });
    complaint.resource_code = selectEl.value;
    complaint.title         = title;
    complaint.description   = desc;

    renderComplaints();
    overlay.classList.remove('open');
    showConfirmation('Complaint Changes Saved', 'Your changes to the complaint have been saved.');
  });
}

// View Details modal (resolved complaints, read-only)
function setupResolvedComplaintModal() {
  const overlay  = document.querySelector('#resolved-complaint-overlay');
  const closeBtn = document.querySelector('#resolved-complaint-close');
  const grid     = document.querySelector('#resolved-grid');

  grid.addEventListener('click', function (event) {
    if (!event.target.classList.contains('view-details-link')) return;

    const id = Number(event.target.getAttribute('data-id'));
    const complaint = complaints.find(function (c) { return c.complaint_id === id; });
    if (!complaint) return;

    const res = findResource(complaint.resource_code);

    document.querySelector('#resolved-modal-title').textContent    = complaint.title;
    document.querySelector('#resolved-modal-code').textContent     = complaint.resource_code;
    document.querySelector('#resolved-modal-type').textContent     = res ? res.resource_type : '—';
    document.querySelector('#resolved-modal-building').textContent = res ? res.building      : '—';
    document.querySelector('#resolved-modal-desc').textContent     = complaint.description;
    document.querySelector('#resolved-modal-filed').textContent    = formatDate(complaint.created_date);
    document.querySelector('#resolved-modal-resolved').textContent = formatDate(complaint.resolved_date);
    document.querySelector('#resolved-modal-status').innerHTML     = '<span class="status-tag status-' + complaint.status.toLowerCase() + '">' + complaint.status + '</span>';

    overlay.classList.add('open');
  });

  closeBtn.addEventListener('click', function () {
    overlay.classList.remove('open');
  });

  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) overlay.classList.remove('open');
  });
}

// Confirmation and validation modals
function setupUtilityModals() {
  const confirmOverlay = document.querySelector('#confirm-modal-overlay');
  document.querySelector('#confirm-modal-close').addEventListener('click', function () {
    confirmOverlay.classList.remove('open');
  });
  confirmOverlay.addEventListener('click', function (event) {
    if (event.target === confirmOverlay) confirmOverlay.classList.remove('open');
  });

  const validationOverlay = document.querySelector('#validation-modal-overlay');
  document.querySelector('#validation-ok-button').addEventListener('click', function () {
    validationOverlay.classList.remove('open');
  });
  document.querySelector('#validation-modal-close').addEventListener('click', function () {
    validationOverlay.classList.remove('open');
  });
  validationOverlay.addEventListener('click', function (event) {
    if (event.target === validationOverlay) validationOverlay.classList.remove('open');
  });
}

applyAccessGate();

if (canAccess) {
  renderComplaints();
  setupNewComplaintModal();
  setupEditComplaintModal();
  setupResolvedComplaintModal();
}

setupUtilityModals();
