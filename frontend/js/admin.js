let users = [], departments = [], resources = [], clubs = [], bookings = [], complaints = [], timetable = [];

// "09:00:00" -> "9:00 AM"
function to12(t) {
  const p = t.slice(0, 8).split(':');
  let h = Number(p[0]);
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + p[1] + ' ' + period;
}

async function api(method, url, body) {
  const res = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  return { ok: res.ok, data: await res.json() };
}

async function loadAdminData() {
  const res = await fetch('/admin/overview');
  const d = await res.json();
  users = d.users; departments = d.departments; resources = d.resources;
  clubs = d.clubs; complaints = d.complaints; timetable = d.timetable;
  bookings = d.bookings.map(function (b) {
    b.slots = b.slots
      .filter(function (s) { return s.start_time; })
      .sort(function (a, c) { return a.start_time.localeCompare(c.start_time); })
      .map(function (s) { return to12(s.start_time) + ' - ' + to12(s.end_time); });
    return b;
  });
}

// reload from the DB and redraw every tab
async function refreshAll() {
  await loadAdminData();
  renderBookingsTab();
  renderComplaintsTab();
  renderClubsTab();
  renderResourcesTab();
  renderTimetableTab();
  renderUsersTab();
  updateBadges();
}

// Convert YYYY-MM-DD to DD-MM-YYYY
function formatDate(isoStr) {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  return parts[2] + '-' + parts[1] + '-' + parts[0];
}

// Return today as YYYY-MM-DD
function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

// Find resource by code
function findResource(code) {
  return resources.find(function (r) { return r.resource_code === code; });
}

// Find user by ID
function findUser(id) {
  return users.find(function (u) { return u.user_id === id; });
}

// Find department by ID
function findDepartment(id) {
  return departments.find(function (d) { return d.department_id === id; });
}

// Find club by ID
function findClub(id) {
  return clubs.find(function (c) { return c.club_id === id; });
}

// Get day name for a YYYY-MM-DD string
function getWeekday(isoDate) {
  const parts = isoDate.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  const dateObj = new Date(y, m - 1, d);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dateObj.getDay()];
}

// Convert 12h or 24h time string to minutes from midnight
function timeToMinutes(str) {
  str = str.trim().toUpperCase();
  const isPM = str.indexOf('PM') !== -1;
  const isAM = str.indexOf('AM') !== -1;
  const clean = str.replace(/[AP]M/, '').trim();
  const parts = clean.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts.length > 1 ? parseInt(parts[1], 10) : 0;
  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;
  return h * 60 + m;
}

// Parse a slot string like 1:00 PM - 2:00 PM into start and end minutes
function parseSlotRange(slotStr) {
  const parts = slotStr.split('-');
  return {
    start: timeToMinutes(parts[0]),
    end: timeToMinutes(parts[1])
  };
}

// Check if two time ranges overlap
function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
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

// Update the pending count badges on tab buttons
function updateBadges() {
  const pendingBookings = bookings.filter(function (b) { return b.status === 'Pending'; }).length;
  const pendingComplaints = complaints.filter(function (c) { return c.status === 'Pending'; }).length;

  const bBadge = document.querySelector('#badge-bookings');
  if (pendingBookings > 0) {
    bBadge.textContent = pendingBookings;
    bBadge.classList.remove('hidden');
  } else {
    bBadge.classList.add('hidden');
  }

  const cBadge = document.querySelector('#badge-complaints');
  if (pendingComplaints > 0) {
    cBadge.textContent = pendingComplaints;
    cBadge.classList.remove('hidden');
  } else {
    cBadge.classList.add('hidden');
  }
}

// Render pending and processed bookings grids
function renderBookingsTab() {
  const pendingGrid = document.querySelector('#admin-pending-bookings-grid');
  const processedGrid = document.querySelector('#admin-processed-bookings-grid');

  const pendingList = bookings.filter(function (b) { return b.status === 'Pending'; });
  pendingList.sort(function (a, b) {
    return a.booking_date.localeCompare(b.booking_date);
  });

  const processedList = bookings.filter(function (b) { return b.status !== 'Pending'; });
  processedList.sort(function (a, b) {
    return b.booking_date.localeCompare(a.booking_date);
  });

  if (pendingList.length === 0) {
    pendingGrid.innerHTML = '<p class="empty-section-msg">No pending booking requests.</p>';
  } else {
    let phtml = '';
    pendingList.forEach(function (b) {
      const res = findResource(b.resource_code);
      const user = findUser(b.user_id);
      const club = b.club_id ? findClub(b.club_id) : null;
      const clubText = club ? club.club_name : 'Faculty booking';

      phtml += '<div class="resource-card">'
        + '<h3>' + b.resource_code + '</h3>'
        + '<p>' + (res ? res.resource_type : '—') + '</p>'
        + '<p>' + (res ? res.building : '—') + '</p>'
        + '<p>Date: ' + formatDate(b.booking_date) + '</p>'
        + '<p>Requested by: ' + (user ? user.name : '—') + '</p>'
        + '<p>' + clubText + '</p>'
        + '<p>Status: <span class="status-tag status-' + b.status.toLowerCase() + '">' + b.status + '</span></p>'
        + '<a class="view-details-link" data-id="' + b.booking_id + '">Review Request</a>'
        + '</div>';
    });
    pendingGrid.innerHTML = phtml;
  }

  if (processedList.length === 0) {
    processedGrid.innerHTML = '<p class="empty-section-msg">No processed bookings.</p>';
  } else {
    let rhtml = '';
    processedList.forEach(function (b) {
      const res = findResource(b.resource_code);
      const user = findUser(b.user_id);
      const club = b.club_id ? findClub(b.club_id) : null;
      const clubText = club ? club.club_name : 'Faculty booking';

      rhtml += '<div class="resource-card">'
        + '<h3>' + b.resource_code + '</h3>'
        + '<p>' + (res ? res.resource_type : '—') + '</p>'
        + '<p>' + (res ? res.building : '—') + '</p>'
        + '<p>Date: ' + formatDate(b.booking_date) + '</p>'
        + '<p>Requested by: ' + (user ? user.name : '—') + '</p>'
        + '<p>' + clubText + '</p>'
        + '<p>Status: <span class="status-tag status-' + b.status.toLowerCase() + '">' + b.status + '</span></p>'
        + '<a class="view-details-link" data-id="' + b.booking_id + '">View Details</a>'
        + '</div>';
    });
    processedGrid.innerHTML = rhtml;
  }
}

// Render pending and resolved complaints grids
function renderComplaintsTab() {
  const pendingGrid = document.querySelector('#admin-pending-complaints-grid');
  const resolvedGrid = document.querySelector('#admin-resolved-complaints-grid');

  const pendingList = complaints.filter(function (c) { return c.status === 'Pending'; });
  pendingList.sort(function (a, b) {
    return b.created_date.localeCompare(a.created_date);
  });

  const resolvedList = complaints.filter(function (c) { return c.status === 'Resolved'; });
  resolvedList.sort(function (a, b) {
    return b.created_date.localeCompare(a.created_date);
  });

  if (pendingList.length === 0) {
    pendingGrid.innerHTML = '<p class="empty-section-msg">No pending complaints.</p>';
  } else {
    let phtml = '';
    pendingList.forEach(function (c) {
      const res = findResource(c.resource_code);
      const user = findUser(c.user_id);

      phtml += '<div class="resource-card">'
        + '<h3>' + c.title + '</h3>'
        + '<p>' + (res ? res.resource_type : '—') + '</p>'
        + '<p>' + (res ? res.building : '—') + ' &middot; ' + c.resource_code + '</p>'
        + '<p>Filed by: ' + (user ? user.name : '—') + '</p>'
        + '<p>Filed on: ' + formatDate(c.created_date) + '</p>'
        + '<p>Status: <span class="status-tag status-' + c.status.toLowerCase() + '">' + c.status + '</span></p>'
        + '<a class="view-details-link" data-id="' + c.complaint_id + '">Review Complaint</a>'
        + '</div>';
    });
    pendingGrid.innerHTML = phtml;
  }

  if (resolvedList.length === 0) {
    resolvedGrid.innerHTML = '<p class="empty-section-msg">No resolved complaints.</p>';
  } else {
    let rhtml = '';
    resolvedList.forEach(function (c) {
      const res = findResource(c.resource_code);
      const user = findUser(c.user_id);

      rhtml += '<div class="resource-card">'
        + '<h3>' + c.title + '</h3>'
        + '<p>' + (res ? res.resource_type : '—') + '</p>'
        + '<p>' + (res ? res.building : '—') + ' &middot; ' + c.resource_code + '</p>'
        + '<p>Filed by: ' + (user ? user.name : '—') + '</p>'
        + '<p>Filed on: ' + formatDate(c.created_date) + '</p>'
        + '<p>Resolved on: ' + formatDate(c.resolved_date) + '</p>'
        + '<p>Status: <span class="status-tag status-' + c.status.toLowerCase() + '">' + c.status + '</span></p>'
        + '<a class="view-details-link" data-id="' + c.complaint_id + '">View Details</a>'
        + '</div>';
    });
    resolvedGrid.innerHTML = rhtml;
  }
}

// Render all clubs
function renderClubsTab() {
  const grid = document.querySelector('#clubs-grid');
  if (clubs.length === 0) {
    grid.innerHTML = '<p class="empty-section-msg">No clubs registered.</p>';
    return;
  }

  let html = '';
  clubs.forEach(function (c) {
    const pres = c.president_user_id ? findUser(c.president_user_id) : null;
    const adv = c.faculty_user_id ? findUser(c.faculty_user_id) : null;

    const presText = pres ? pres.name + ' (' + pres.email + ')' : 'Not assigned';
    const advText = adv ? adv.name : 'Not assigned';

    html += '<div class="resource-card">'
      + '<h3>' + c.club_name + '</h3>'
      + '<p>President: ' + presText + '</p>'
      + '<p>Faculty Advisor: ' + advText + '</p>'
      + '<a class="view-details-link manage-club-link" data-id="' + c.club_id + '">Manage Club</a>'
      + '</div>';
  });
  grid.innerHTML = html;
}

// Render resources grid and update the type datalist
function renderResourcesTab() {
  const grid = document.querySelector('#admin-resources-grid');
  const datalist = document.querySelector('#type-datalist');

  const types = [];
  resources.forEach(function (r) {
    if (r.resource_type && types.indexOf(r.resource_type) === -1) {
      types.push(r.resource_type);
    }
  });

  let dhtml = '';
  types.forEach(function (t) {
    dhtml += '<option value="' + t + '">';
  });
  datalist.innerHTML = dhtml;

  if (resources.length === 0) {
    grid.innerHTML = '<p class="empty-section-msg">No campus resources found.</p>';
    return;
  }

  let html = '';
  resources.forEach(function (r) {
    html += '<div class="resource-card">'
      + '<h3>' + r.resource_code + '</h3>'
      + '<p>' + r.resource_type + '</p>'
      + '<p>' + r.building + ' &middot; Room ' + r.room_number + '</p>'
      + '<p>Floor: ' + r.floor + ' &middot; Capacity: ' + r.capacity + '</p>'
      + '<p>Status: <span class="status-tag status-' + r.status.toLowerCase() + '">' + r.status + '</span></p>'
      + '<a class="view-details-link edit-resource-link" data-code="' + r.resource_code + '">Edit Resource</a>'
      + '</div>';
  });
  grid.innerHTML = html;
}

// Render current timetable table sorted by weekday and start time
function renderTimetableTab() {
  const tbody = document.querySelector('#timetable-tbody');
  const countEl = document.querySelector('#timetable-count');

  const weekdayOrder = {
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
    'Sunday': 7
  };

  const sorted = timetable.slice().sort(function (a, b) {
    const diff = (weekdayOrder[a.day] || 8) - (weekdayOrder[b.day] || 8);
    if (diff !== 0) return diff;
    return a.start_time.localeCompare(b.start_time);
  });

  countEl.textContent = '(' + sorted.length + ' entries)';

  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:rgb(150,150,150);">No timetable entries found.</td></tr>';
    return;
  }

  let html = '';
  sorted.forEach(function (t) {
    const dept = findDepartment(t.department_id);
    const deptText = dept ? dept.department_code : '—';

    html += '<tr>'
      + '<td>' + t.day + '</td>'
      + '<td>' + t.start_time + ' - ' + t.end_time + '</td>'
      + '<td>' + t.subject_code + '</td>'
      + '<td>' + deptText + '</td>'
      + '<td>' + t.resource_code + '</td>'
      + '</tr>';
  });
  tbody.innerHTML = html;
}

// Tab bar switching logic
function setupTabNavigation() {
  const tabs = document.querySelectorAll('.admin-tab');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');

      const target = tab.getAttribute('data-tab');
      document.querySelectorAll('.tab-section').forEach(function (sec) {
        sec.classList.add('hidden');
      });

      const activeSec = document.querySelector('#section-' + target);
      if (activeSec) {
        activeSec.classList.remove('hidden');
      }
    });
  });
}

// Pending booking review modal with approve and reject checks
function setupPendingBookingModal() {
  const overlay = document.querySelector('#pending-booking-overlay');
  const closeBtn = document.querySelector('#pending-booking-close');
  const grid = document.querySelector('#admin-pending-bookings-grid');
  const approveBtn = document.querySelector('#pb-approve-btn');
  const rejectBtn = document.querySelector('#pb-reject-btn');

  let activeBookingId = null;

  grid.addEventListener('click', function (event) {
    if (!event.target.classList.contains('view-details-link')) return;

    const id = Number(event.target.getAttribute('data-id'));
    const booking = bookings.find(function (b) { return b.booking_id === id; });
    if (!booking) return;

    activeBookingId = id;
    const res = findResource(booking.resource_code);
    const user = findUser(booking.user_id);
    const club = booking.club_id ? findClub(booking.club_id) : null;

    document.querySelector('#pb-modal-code').textContent = booking.resource_code;
    document.querySelector('#pb-modal-type').textContent = res ? res.resource_type : '—';
    document.querySelector('#pb-modal-building').textContent = res ? res.building : '—';
    document.querySelector('#pb-modal-capacity').textContent = res ? res.capacity : '—';
    document.querySelector('#pb-modal-res-status').innerHTML = res
      ? '<span class="status-tag status-' + res.status.toLowerCase() + '">' + res.status + '</span>'
      : '—';
    document.querySelector('#pb-modal-date').textContent = formatDate(booking.booking_date);
    document.querySelector('#pb-modal-slots').textContent = booking.slots.join(', ');
    document.querySelector('#pb-modal-purpose').textContent = booking.purpose;
    document.querySelector('#pb-modal-user').textContent = user ? user.name + ' (' + user.email + ')' : '—';
    document.querySelector('#pb-modal-club').textContent = club ? club.club_name : 'Faculty booking';

    overlay.classList.add('open');
  });

  approveBtn.addEventListener('click', async function () {
    if (!activeBookingId) return;
    const r = await api('PUT', '/admin/bookings/' + activeBookingId + '/approve');
    if (!r.ok) { showValidation(r.data.error); return; }
    await refreshAll();
    overlay.classList.remove('open');
    showConfirmation('Booking Approved', 'Booking request #' + activeBookingId + ' has been approved.');
  });

  rejectBtn.addEventListener('click', async function () {
    if (!activeBookingId) return;
    const r = await api('PUT', '/admin/bookings/' + activeBookingId + '/reject');
    if (!r.ok) { showValidation(r.data.error); return; }
    await refreshAll();
    overlay.classList.remove('open');
    showConfirmation('Booking Rejected', 'Booking request #' + activeBookingId + ' has been rejected.');
  });

  closeBtn.addEventListener('click', function () {
    overlay.classList.remove('open');
  });

  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) overlay.classList.remove('open');
  });
}

// Processed booking read-only details modal
function setupProcessedBookingModal() {
  const overlay = document.querySelector('#processed-booking-overlay');
  const closeBtn = document.querySelector('#processed-booking-close');
  const grid = document.querySelector('#admin-processed-bookings-grid');

  grid.addEventListener('click', function (event) {
    if (!event.target.classList.contains('view-details-link')) return;

    const id = Number(event.target.getAttribute('data-id'));
    const booking = bookings.find(function (b) { return b.booking_id === id; });
    if (!booking) return;

    const res = findResource(booking.resource_code);
    const user = findUser(booking.user_id);
    const club = booking.club_id ? findClub(booking.club_id) : null;
    const approver = booking.approved_by ? findUser(booking.approved_by) : null;

    document.querySelector('#prb-modal-code').textContent = booking.resource_code;
    document.querySelector('#prb-modal-type').textContent = res ? res.resource_type : '—';
    document.querySelector('#prb-modal-building').textContent = res ? res.building : '—';
    document.querySelector('#prb-modal-capacity').textContent = res ? res.capacity : '—';
    document.querySelector('#prb-modal-date').textContent = formatDate(booking.booking_date);
    document.querySelector('#prb-modal-slots').textContent = booking.slots.join(', ');
    document.querySelector('#prb-modal-purpose').textContent = booking.purpose;
    document.querySelector('#prb-modal-user').textContent = user ? user.name + ' (' + user.email + ')' : '—';
    document.querySelector('#prb-modal-club').textContent = club ? club.club_name : 'Faculty booking';
    document.querySelector('#prb-modal-status').innerHTML = '<span class="status-tag status-' + booking.status.toLowerCase() + '">' + booking.status + '</span>';

    const processedText = approver
      ? approver.name + ' on ' + formatDate(booking.approval_date)
      : 'System / User';
    document.querySelector('#prb-modal-processed-by').textContent = processedText;

    overlay.classList.add('open');
  });

  closeBtn.addEventListener('click', function () {
    overlay.classList.remove('open');
  });

  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) overlay.classList.remove('open');
  });
}

// Admin pending complaint review modal
function setupPendingComplaintModal() {
  const overlay = document.querySelector('#admin-pending-complaint-overlay');
  const closeBtn = document.querySelector('#admin-pending-complaint-close');
  const grid = document.querySelector('#admin-pending-complaints-grid');
  const resolveBtn = document.querySelector('#apc-resolve-btn');

  let activeComplaintId = null;

  grid.addEventListener('click', function (event) {
    if (!event.target.classList.contains('view-details-link')) return;

    const id = Number(event.target.getAttribute('data-id'));
    const complaint = complaints.find(function (c) { return c.complaint_id === id; });
    if (!complaint) return;

    activeComplaintId = id;
    const res = findResource(complaint.resource_code);
    const user = findUser(complaint.user_id);

    document.querySelector('#apc-modal-title').textContent = complaint.title;
    document.querySelector('#apc-modal-code').textContent = complaint.resource_code;
    document.querySelector('#apc-modal-type').textContent = res ? res.resource_type : '—';
    document.querySelector('#apc-modal-building').textContent = res ? res.building : '—';
    document.querySelector('#apc-modal-desc').textContent = complaint.description;
    document.querySelector('#apc-modal-filed').textContent = formatDate(complaint.created_date);
    document.querySelector('#apc-modal-user').textContent = user ? user.name + ' (' + user.email + ')' : '—';
    document.querySelector('#apc-modal-status').innerHTML = '<span class="status-tag status-' + complaint.status.toLowerCase() + '">' + complaint.status + '</span>';

    overlay.classList.add('open');
  });

  resolveBtn.addEventListener('click', async function () {
    if (!activeComplaintId) return;
    const r = await api('PUT', '/admin/complaints/' + activeComplaintId + '/resolve');
    if (!r.ok) { showValidation(r.data.error); return; }
    await refreshAll();
    overlay.classList.remove('open');
    showConfirmation('Complaint Resolved', 'The complaint has been marked as resolved.');
  });

  closeBtn.addEventListener('click', function () {
    overlay.classList.remove('open');
  });

  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) overlay.classList.remove('open');
  });
}

// Admin resolved complaint details modal
function setupResolvedComplaintModal() {
  const overlay = document.querySelector('#admin-resolved-complaint-overlay');
  const closeBtn = document.querySelector('#admin-resolved-complaint-close');
  const grid = document.querySelector('#admin-resolved-complaints-grid');

  grid.addEventListener('click', function (event) {
    if (!event.target.classList.contains('view-details-link')) return;

    const id = Number(event.target.getAttribute('data-id'));
    const complaint = complaints.find(function (c) { return c.complaint_id === id; });
    if (!complaint) return;

    const res = findResource(complaint.resource_code);
    const user = findUser(complaint.user_id);
    const resolver = complaint.resolved_by ? findUser(complaint.resolved_by) : null;

    document.querySelector('#arc-modal-title').textContent = complaint.title;
    document.querySelector('#arc-modal-code').textContent = complaint.resource_code;
    document.querySelector('#arc-modal-type').textContent = res ? res.resource_type : '—';
    document.querySelector('#arc-modal-building').textContent = res ? res.building : '—';
    document.querySelector('#arc-modal-desc').textContent = complaint.description;
    document.querySelector('#arc-modal-filed').textContent = formatDate(complaint.created_date);
    document.querySelector('#arc-modal-user').textContent = user ? user.name + ' (' + user.email + ')' : '—';
    document.querySelector('#arc-modal-status').innerHTML = '<span class="status-tag status-' + complaint.status.toLowerCase() + '">' + complaint.status + '</span>';
    document.querySelector('#arc-modal-resolved-by').textContent = resolver ? resolver.name : 'Admin';
    document.querySelector('#arc-modal-resolved-date').textContent = formatDate(complaint.resolved_date);

    overlay.classList.add('open');
  });

  closeBtn.addEventListener('click', function () {
    overlay.classList.remove('open');
  });

  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) overlay.classList.remove('open');
  });
}

// Modal for creating a new club
function setupNewClubModal() {
  const overlay = document.querySelector('#new-club-overlay');
  const openBtn = document.querySelector('#new-club-btn');
  const closeBtn = document.querySelector('#new-club-close');
  const nameInput = document.querySelector('#new-club-name');
  const submitBtn = document.querySelector('#new-club-submit-btn');

  openBtn.addEventListener('click', function () {
    nameInput.value = '';
    overlay.classList.add('open');
  });

  submitBtn.addEventListener('click', async function () {
    const name = nameInput.value.trim();
    if (!name) { showValidation('Please enter a club name.'); return; }

    const r = await api('POST', '/admin/clubs', { club_name: name });
    if (!r.ok) { showValidation(r.data.error); return; }

    await refreshAll();
    overlay.classList.remove('open');
    nameInput.value = '';
    showConfirmation('Club Created', 'The club "' + name + '" has been registered.');
  });

  closeBtn.addEventListener('click', function () {
    overlay.classList.remove('open');
  });

  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) overlay.classList.remove('open');
  });
}

// Modal for managing club leadership
function setupManageClubModal() {
  const overlay = document.querySelector('#manage-club-overlay');
  const closeBtn = document.querySelector('#manage-club-close');
  const grid = document.querySelector('#clubs-grid');
  const headingEl = document.querySelector('#manage-club-name-heading');
  const presSelect = document.querySelector('#manage-president-select');
  const advSelect = document.querySelector('#manage-advisor-select');
  const saveBtn = document.querySelector('#manage-club-save-btn');

  let activeClubId = null;
  let originalPresident = '';
  let originalAdvisor = '';

  function checkForClubChanges() {
    const currentPres = presSelect.value;
    const currentAdv = advSelect.value;
    const changed = (currentPres !== originalPresident) || (currentAdv !== originalAdvisor);
    saveBtn.disabled = !changed;
  }

  grid.addEventListener('click', function (event) {
    if (!event.target.classList.contains('manage-club-link')) return;

    const id = Number(event.target.getAttribute('data-id'));
    const club = clubs.find(function (c) { return c.club_id === id; });
    if (!club) return;

    activeClubId = id;
    headingEl.textContent = 'Manage ' + club.club_name;

    // Populate President options: students not president of other clubs
    let phtml = '<option value="">None</option>';
    const students = users.filter(function (u) { return u.role === 'Student'; });

    students.forEach(function (s) {
      const isPresOther = clubs.some(function (c) {
        return c.club_id !== club.club_id && c.president_user_id === s.user_id;
      });

      if (!isPresOther) {
        const sel = club.president_user_id === s.user_id ? 'selected' : '';
        phtml += '<option value="' + s.user_id + '" ' + sel + '>' + s.name + ' (' + s.email + ')</option>';
      }
    });
    presSelect.innerHTML = phtml;

    // Populate Faculty Advisor options: all faculty
    let ahtml = '<option value="">None</option>';
    const facultyList = users.filter(function (u) { return u.role === 'Faculty'; });

    facultyList.forEach(function (f) {
      const sel = club.faculty_user_id === f.user_id ? 'selected' : '';
      ahtml += '<option value="' + f.user_id + '" ' + sel + '>' + f.name + ' (' + f.email + ')</option>';
    });
    advSelect.innerHTML = ahtml;

    originalPresident = club.president_user_id ? String(club.president_user_id) : '';
    originalAdvisor = club.faculty_user_id ? String(club.faculty_user_id) : '';
    saveBtn.disabled = true;

    overlay.classList.add('open');
  });

  presSelect.addEventListener('change', checkForClubChanges);
  advSelect.addEventListener('change', checkForClubChanges);

  saveBtn.addEventListener('click', async function () {
    const club = clubs.find(function (c) { return c.club_id === activeClubId; });
    if (!club) return;

    const r = await api('PUT', '/admin/clubs/' + activeClubId, {
      president_user_id: presSelect.value ? Number(presSelect.value) : null,
      faculty_user_id: advSelect.value ? Number(advSelect.value) : null
    });
    if (!r.ok) { showValidation(r.data.error); return; }

    const clubName = club.club_name;
    await refreshAll();
    overlay.classList.remove('open');
    showConfirmation('Club Updated', 'Leadership for ' + clubName + ' has been updated.');
  });

  closeBtn.addEventListener('click', function () {
    overlay.classList.remove('open');
  });

  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) overlay.classList.remove('open');
  });
}

// Modal for adding or editing a campus resource
function setupResourceModal() {
  const overlay = document.querySelector('#resource-edit-overlay');
  const openBtn = document.querySelector('#add-resource-btn');
  const closeBtn = document.querySelector('#resource-edit-close');
  const grid = document.querySelector('#admin-resources-grid');

  const headingEl = document.querySelector('#resource-edit-heading');
  const codeInput = document.querySelector('#re-code');
  const roomInput = document.querySelector('#re-room');
  const typeInput = document.querySelector('#re-type');
  const buildInput = document.querySelector('#re-building');
  const capInput = document.querySelector('#re-capacity');
  const floorInput = document.querySelector('#re-floor');
  const statusSelect = document.querySelector('#re-status');
  const saveBtn = document.querySelector('#resource-edit-save-btn');

  let isEditMode = false;
  let activeCode = '';
  let originalData = {};

  // in edit mode, Save is enabled only when something changed
  function checkForResourceChanges() {
    if (!isEditMode) return;
    const changed = roomInput.value.trim() !== originalData.room
      || typeInput.value.trim() !== originalData.type
      || buildInput.value.trim() !== originalData.building
      || capInput.value.trim() !== originalData.capacity
      || floorInput.value.trim() !== originalData.floor
      || statusSelect.value !== originalData.status;
    saveBtn.disabled = !changed;
  }

  // Open in Add mode
  openBtn.addEventListener('click', function () {
    isEditMode = false;
    activeCode = '';
    headingEl.textContent = 'Add Resource';
    codeInput.value = '';
    codeInput.disabled = false;
    roomInput.value = '';
    typeInput.value = '';
    buildInput.value = '';
    capInput.value = '';
    floorInput.value = '';
    statusSelect.value = 'Available';
    saveBtn.disabled = false;
    overlay.classList.add('open');
  });

  // Open in Edit mode
  grid.addEventListener('click', function (event) {
    if (!event.target.classList.contains('edit-resource-link')) return;

    const code = event.target.getAttribute('data-code');
    const res = findResource(code);
    if (!res) return;

    isEditMode = true;
    activeCode = code;
    headingEl.textContent = 'Edit Resource: ' + code;

    codeInput.value = res.resource_code;
    codeInput.disabled = true;
    roomInput.value = res.room_number;
    typeInput.value = res.resource_type;
    buildInput.value = res.building;
    capInput.value = res.capacity;
    floorInput.value = res.floor;
    statusSelect.value = res.status;

    originalData = {
      room: String(res.room_number),
      type: res.resource_type,
      building: res.building,
      capacity: String(res.capacity),
      floor: String(res.floor),
      status: res.status
    };

    saveBtn.disabled = true;
    overlay.classList.add('open');
  });

  [roomInput, typeInput, buildInput, capInput, floorInput].forEach(function (el) {
    el.addEventListener('input', checkForResourceChanges);
  });
  statusSelect.addEventListener('change', checkForResourceChanges);

  saveBtn.addEventListener('click', async function () {
    const code = codeInput.value.trim().toUpperCase();
    const room = roomInput.value.trim();
    const type = typeInput.value.trim();
    const build = buildInput.value.trim();
    const capNum = parseInt(capInput.value.trim(), 10);
    const floorNum = parseInt(floorInput.value.trim(), 10);
    const status = statusSelect.value;

    if (!isEditMode && (!code || code.length > 10)) {
      showValidation('Please enter a valid resource code (max 10 characters).');
      return;
    }
    if (!room || room.length > 10) {
      showValidation('Please enter a valid room number (max 10 characters).');
      return;
    }
    if (!type || !build) {
      showValidation('Please fill in both the resource type and building.');
      return;
    }
    if (isNaN(capNum) || capNum <= 0) {
      showValidation('Capacity must be a positive integer greater than 0.');
      return;
    }
    if (isNaN(floorNum) || floorNum < 0) {
      showValidation('Floor must be a valid non-negative integer (0 or greater).');
      return;
    }

    const body = { resource_code: code, room_number: room, resource_type: type,
                   building: build, capacity: capNum, floor: floorNum, status: status };
    const r = isEditMode
      ? await api('PUT', '/admin/resources/' + activeCode, body)
      : await api('POST', '/admin/resources', body);
    if (!r.ok) { showValidation(r.data.error); return; }

    await refreshAll();
    overlay.classList.remove('open');
    showConfirmation(isEditMode ? 'Resource Updated' : 'Resource Added',
      'Resource ' + (isEditMode ? activeCode : code) + ' has been saved successfully.');
  });

  closeBtn.addEventListener('click', function () {
    overlay.classList.remove('open');
  });

  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) overlay.classList.remove('open');
  });
}

// Timetable CSV upload and sample download logic
function setupTimetableUpload() {
  const fileInput = document.querySelector('#csv-file-input');
  const filenameEl = document.querySelector('#csv-filename');
  const sampleLink = document.querySelector('#csv-sample-link');
  const previewArea = document.querySelector('#csv-preview-area');
  const validTbody = document.querySelector('#csv-valid-tbody');
  const validCountEl = document.querySelector('#valid-count');
  const invalidListEl = document.querySelector('#csv-invalid-list');
  const confirmBtn = document.querySelector('#confirm-upload-btn');

  let stagedRows = [];

  // Download sample CSV
  sampleLink.addEventListener('click', function (event) {
    event.preventDefault();
        const csvContent = 'subject_code,day,start_time,end_time,department_code,resource_code\n'
      + 'CSC2102,Monday,11:30,12:20,CSE,RLHC0201\n'
      + 'CSC2130,Tuesday,09:50,11:30,CSE,L2AB0113\n'
      + 'CSC2131,Tuesday,09:50,11:30,CSE,L1AB0116\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timetable_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Handle CSV file selection and parsing
  fileInput.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) return;

    filenameEl.textContent = file.name;

    const reader = new FileReader();
    reader.onload = function (e) {
      parseAndValidateCSV(e.target.result);
    };
    reader.readAsText(file);
  });

  function parseAndValidateCSV(content) {
    const rawLines = content.split(/\r?\n/);
    const lines = [];

    rawLines.forEach(function (l) {
      if (l.trim().length > 0) lines.push(l.trim());
    });

    if (lines.length === 0) {
      showValidation('The selected CSV file is empty.');
      return;
    }

    const expectedHeader = 'subject_code,day,start_time,end_time,department_code,resource_code';
    if (lines[0].toLowerCase() !== expectedHeader) {
      showValidation('Invalid header row. Must exactly match:\n' + expectedHeader);
      return;
    }

    const validRows = [];
    const invalidRows = [];
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    for (let i = 1; i < lines.length; i++) {
      const lineNum = i + 1;
      const cols = lines[i].split(',').map(function (c) { return c.trim(); });

      if (cols.length !== 6) {
        invalidRows.push('Line ' + lineNum + ': expected 6 columns, got ' + cols.length);
        continue;
      }

      const subject = cols[0];
      const rawDay = cols[1];
      const start = cols[2];
      const end = cols[3];
      const deptCode = cols[4];
      const resCode = cols[5];

      if (!subject || !rawDay || !start || !end || !deptCode || !resCode) {
        invalidRows.push('Line ' + lineNum + ': all fields are required.');
        continue;
      }

      if (validDays.indexOf(rawDay.toLowerCase()) === -1) {
        invalidRows.push('Line ' + lineNum + ': invalid day "' + rawDay + '".');
        continue;
      }

      const normalizedDay = rawDay.charAt(0).toUpperCase() + rawDay.slice(1).toLowerCase();

      const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!timeRegex.test(start) || !timeRegex.test(end)) {
        invalidRows.push('Line ' + lineNum + ': times must be 24h format HH:MM.');
        continue;
      }

      const startM = timeToMinutes(start);
      const endM = timeToMinutes(end);
      if (endM <= startM) {
        invalidRows.push('Line ' + lineNum + ': end_time (' + end + ') must be greater than start_time (' + start + ').');
        continue;
      }

      const dept = departments.find(function (d) {
        return d.department_code.toLowerCase() === deptCode.toLowerCase();
      });
      if (!dept) {
        invalidRows.push('Line ' + lineNum + ': unknown department_code "' + deptCode + '".');
        continue;
      }

      const res = resources.find(function (r) {
        return r.resource_code.toLowerCase() === resCode.toLowerCase();
      });
      if (!res) {
        invalidRows.push('Line ' + lineNum + ': unknown resource_code "' + resCode + '".');
        continue;
      }

      const alreadyExists = timetable.some(function (t) {
        return t.subject_code.toLowerCase() === subject.toLowerCase()
          && t.day.toLowerCase() === normalizedDay.toLowerCase()
          && t.start_time === start
          && t.resource_code.toLowerCase() === res.resource_code.toLowerCase();
      });

      if (alreadyExists) {
        invalidRows.push('Line ' + lineNum + ': duplicate entry already in timetable (' + subject + ', ' + normalizedDay + ', ' + start + ', ' + res.resource_code + ').');
        continue;
      }

      validRows.push({
        subject_code: subject,
        day: normalizedDay,
        start_time: start,
        end_time: end,
        department_id: dept.department_id,
        department_code: dept.department_code,
        resource_code: res.resource_code
      });
    }

    stagedRows = validRows;
    validCountEl.textContent = validRows.length;

    let vhtml = '';
    validRows.forEach(function (r) {
      vhtml += '<tr>'
        + '<td>' + r.day + '</td>'
        + '<td>' + r.start_time + ' - ' + r.end_time + '</td>'
        + '<td>' + r.subject_code + '</td>'
        + '<td>' + r.department_code + '</td>'
        + '<td>' + r.resource_code + '</td>'
        + '</tr>';
    });
    validTbody.innerHTML = vhtml;

    if (invalidRows.length > 0) {
      let ihtml = '';
      invalidRows.forEach(function (err) {
        ihtml += '<div class="csv-invalid-item">' + err + '</div>';
      });
      invalidListEl.innerHTML = ihtml;
      invalidListEl.classList.remove('hidden');
    } else {
      invalidListEl.innerHTML = '';
      invalidListEl.classList.add('hidden');
    }

    previewArea.classList.remove('hidden');
    confirmBtn.disabled = !(validRows.length > 0 && invalidRows.length === 0);
  }

  // Confirm and save uploaded timetable entries
  confirmBtn.addEventListener('click', async function () {
    if (stagedRows.length === 0) return;

    const r = await api('POST', '/admin/timetable', { rows: stagedRows });
    if (!r.ok) { showValidation(r.data.error); return; }

    const count = stagedRows.length;
    stagedRows = [];
    previewArea.classList.add('hidden');
    fileInput.value = '';
    filenameEl.textContent = 'No file chosen';

    await refreshAll();
    showConfirmation('Timetable Uploaded', count + ' entries added to the timetable successfully.');
  });
}

// Escape text before putting it into innerHTML
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// Users tab: list with search and filters
function renderUsersTab() {
  const q = document.querySelector('#user-search').value.trim().toLowerCase();
  const roleF = document.querySelector('#user-role-filter').value;
  const deptF = document.querySelector('#user-dept-filter').value;

  const list = users.filter(function (u) {
    return (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      && (!roleF || u.role === roleF)
      && (!deptF || String(u.department_id) === deptF);
  });

  document.querySelector('#user-count').textContent = '(' + list.length + ')';
  const tbody = document.querySelector('#users-tbody');
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:rgb(150,150,150);">No users found.</td></tr>';
    return;
  }

  let html = '';
  list.forEach(function (u) {
    const dept = findDepartment(u.department_id);
    const roleCell = u.role === 'Admin'
      ? '<span class="user-locked">Admin (locked)</span>'
      : '<select class="admin-select user-role-select" data-id="' + u.user_id + '" data-old="' + u.role + '">'
        + ['Student', 'Faculty', 'Admin'].map(function (r) {
            return '<option' + (r === u.role ? ' selected' : '') + '>' + r + '</option>';
          }).join('')
        + '</select>';
    html += '<tr><td>' + esc(u.name) + '</td><td>' + esc(u.email) + '</td><td>'
      + (dept ? esc(dept.department_code) : '—') + '</td><td>' + roleCell + '</td></tr>';
  });
  tbody.innerHTML = html;
}

function setupUsersTab() {
  const deptSel = document.querySelector('#user-dept-filter');
  departments.forEach(function (d) {
    deptSel.insertAdjacentHTML('beforeend',
      '<option value="' + d.department_id + '">' + esc(d.department_code) + '</option>');
  });

  document.querySelector('#user-search').addEventListener('input', renderUsersTab);
  document.querySelector('#user-role-filter').addEventListener('change', renderUsersTab);
  deptSel.addEventListener('change', renderUsersTab);
  document.querySelector('#user-clear-filters').addEventListener('click', function () {
    document.querySelector('#user-search').value = '';
    document.querySelector('#user-role-filter').value = '';
    deptSel.value = '';
    renderUsersTab();
  });

  document.querySelector('#users-tbody').addEventListener('change', async function (event) {
    if (!event.target.classList.contains('user-role-select')) return;
    const sel = event.target;
    const id = Number(sel.getAttribute('data-id'));
    const newRole = sel.value;
    const warn = newRole === 'Admin'
      ? 'Make this user an ADMIN? You will not be able to change their role afterwards.'
      : 'Change this user\'s role to ' + newRole + '?';

    if (!confirm(warn)) { sel.value = sel.getAttribute('data-old'); return; }

    const r = await api('PUT', '/admin/users/' + id + '/role', { role: newRole });
    if (!r.ok) {
      sel.value = sel.getAttribute('data-old');
      showValidation(r.data.error);
      return;
    }
    await refreshAll();
  });
}

// Global utility modals
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

commonReady.then(async function () {
  setupUtilityModals();
  if (!isAdmin) return;
  await loadAdminData();
  renderBookingsTab();
  renderComplaintsTab();
  renderClubsTab();
  renderResourcesTab();
  renderTimetableTab();
  renderUsersTab();
  updateBadges();

  setupTabNavigation();
  setupPendingBookingModal();
  setupProcessedBookingModal();
  setupPendingComplaintModal();
  setupResolvedComplaintModal();
  setupNewClubModal();
  setupManageClubModal();
  setupResourceModal();
  setupTimetableUpload();
  setupUsersTab();
});