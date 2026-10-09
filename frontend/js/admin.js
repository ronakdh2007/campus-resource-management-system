// Temporary hardcoded data matching database tables exactly
const users = [
  { user_id: 1, name: 'Admin', email: 'admin@muj.manipal.edu', role: 'Admin', department_id: 1 },
  { user_id: 2, name: 'Aarav Sharma', email: 'aarav.2410101001@muj.manipal.edu', role: 'Student', department_id: 1 },
  { user_id: 3, name: 'Diya Patel', email: 'diya.2410101002@muj.manipal.edu', role: 'Student', department_id: 2 },
  { user_id: 4, name: 'Kabir Verma', email: 'kabir.2410101003@muj.manipal.edu', role: 'Student', department_id: 3 },
  { user_id: 5, name: 'Dr. Ramesh Kumar', email: 'ramesh.kumar@jaipur.manipal.edu', role: 'Faculty', department_id: 1 },
  { user_id: 6, name: 'Dr. Sunita Rao', email: 'sunita.rao@jaipur.manipal.edu', role: 'Faculty', department_id: 2 }
];

const departments = [
  { department_id: 1, department_code: 'CSE', department_name: 'Computer Science & Engineering' },
  { department_id: 2, department_code: 'ECE', department_name: 'Electronics & Communication Engineering' },
  { department_id: 3, department_code: 'MECH', department_name: 'Mechanical Engineering' },
  { department_id: 4, department_code: 'DSE', department_name: 'Data Science & Engineering' }
];

const resources = [
  { resource_code: 'LHC002', room_number: '002', resource_type: 'Lecture Hall', building: 'LHC Complex', capacity: 200, floor: 0, status: 'Available' },
  { resource_code: '2AB016', room_number: '016', resource_type: 'Classroom', building: 'AB2', capacity: 80, floor: 0, status: 'Unavailable' },
  { resource_code: '1AB102', room_number: '102', resource_type: 'Computer Lab', building: 'AB1', capacity: 60, floor: 1, status: 'Available' },
  { resource_code: 'LHC202', room_number: '202', resource_type: 'Classroom', building: 'LHC Complex', capacity: 80, floor: 2, status: 'Maintenance' },
  { resource_code: '1AB205', room_number: '205', resource_type: 'Seminar Hall', building: 'AB1', capacity: 120, floor: 2, status: 'Available' }
];

const clubs = [
  { club_id: 1, club_name: 'Coding Club', president_user_id: 2, faculty_user_id: 5 },
  { club_id: 2, club_name: 'Robotics Society', president_user_id: 3, faculty_user_id: 6 },
  { club_id: 3, club_name: 'Literary Club', president_user_id: null, faculty_user_id: 5 }
];

const currentAdmin = { user_id: 1, name: 'Admin' };

const bookings = [
  { booking_id: 1, user_id: 2, resource_code: '1AB102', club_id: 1, booking_date: '2026-10-20', purpose: 'Hackathon Practice', status: 'Approved', approved_by: 1, approval_date: '2026-10-05', slots: ['2:00 PM - 4:00 PM'] },
  { booking_id: 2, user_id: 3, resource_code: '1AB102', club_id: 2, booking_date: '2026-10-20', purpose: 'Robotics Workshop', status: 'Pending', approved_by: null, approval_date: null, slots: ['3:00 PM - 5:00 PM'] },
  { booking_id: 3, user_id: 5, resource_code: 'LHC002', club_id: null, booking_date: '2026-10-26', purpose: 'Extra Lecture', status: 'Pending', approved_by: null, approval_date: null, slots: ['10:00 AM - 12:00 PM'] },
  { booking_id: 4, user_id: 2, resource_code: '1AB205', club_id: 1, booking_date: '2026-11-04', purpose: 'Tech Talk', status: 'Pending', approved_by: null, approval_date: null, slots: ['4:00 PM - 5:00 PM'] },
  { booking_id: 5, user_id: 4, resource_code: '2AB016', club_id: null, booking_date: '2026-10-08', purpose: 'Study Session', status: 'Rejected', approved_by: 1, approval_date: '2026-10-06', slots: ['11:00 AM - 12:00 PM'] }
];

const complaints = [
  { complaint_id: 1, title: 'Projector flickering', description: 'The projector in LHC002 is constantly flickering.', resource_code: 'LHC002', user_id: 2, status: 'Pending', created_date: '2026-10-02', resolved_by: null, resolved_date: null },
  { complaint_id: 2, title: 'AC remote missing', description: 'AC remote is not available in room 102.', resource_code: '1AB102', user_id: 3, status: 'Pending', created_date: '2026-10-04', resolved_by: null, resolved_date: null },
  { complaint_id: 3, title: 'Broken front row chair', description: 'Chair broken in 2AB016 front row.', resource_code: '2AB016', user_id: 4, status: 'Resolved', created_date: '2026-09-20', resolved_by: 1, resolved_date: '2026-09-22' },
  { complaint_id: 4, title: 'Whiteboard marker tray damaged', description: 'Tray under whiteboard is coming loose.', resource_code: 'LHC202', user_id: 5, status: 'Resolved', created_date: '2026-09-25', resolved_by: 1, resolved_date: '2026-09-27' }
];

const timetable = [
  { timetable_id: 1, subject_code: 'CS201', day: 'Monday', start_time: '10:00', end_time: '12:00', department_id: 1, resource_code: 'LHC002' },
  { timetable_id: 2, subject_code: 'EC302', day: 'Tuesday', start_time: '14:00', end_time: '16:00', department_id: 2, resource_code: '2AB016' },
  { timetable_id: 3, subject_code: 'CS305', day: 'Wednesday', start_time: '09:00', end_time: '11:00', department_id: 1, resource_code: '1AB102' },
  { timetable_id: 4, subject_code: 'DS201', day: 'Friday', start_time: '11:00', end_time: '13:00', department_id: 4, resource_code: 'LHC202' }
];

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

  approveBtn.addEventListener('click', function () {
    const booking = bookings.find(function (b) { return b.booking_id === activeBookingId; });
    if (!booking) return;

    const res = findResource(booking.resource_code);

    // Check (a): resource status must be Available
    if (!res || res.status !== 'Available') {
      showValidation('Cannot approve booking: resource ' + booking.resource_code + ' is currently ' + (res ? res.status : 'Unavailable') + '.');
      return;
    }

    // Check (b): no conflict with another Approved booking on the same date and slot
    let clashBooking = null;
    bookings.forEach(function (other) {
      if (other.booking_id === booking.booking_id) return;
      if (other.status !== 'Approved') return;
      if (other.resource_code !== booking.resource_code) return;
      if (other.booking_date !== booking.booking_date) return;

      booking.slots.forEach(function (slotA) {
        const rangeA = parseSlotRange(slotA);
        other.slots.forEach(function (slotB) {
          const rangeB = parseSlotRange(slotB);
          if (rangesOverlap(rangeA.start, rangeA.end, rangeB.start, rangeB.end)) {
            clashBooking = other;
          }
        });
      });
    });

    if (clashBooking) {
      showValidation('Cannot approve booking: clashes with an already approved booking (ID #' + clashBooking.booking_id + ') on ' + formatDate(booking.booking_date) + '.');
      return;
    }

    // Check (c): no conflict with timetable rows on that weekday
    const weekday = getWeekday(booking.booking_date);
    let clashTimetable = null;

    timetable.forEach(function (row) {
      if (row.resource_code !== booking.resource_code) return;
      if (row.day.toLowerCase() !== weekday.toLowerCase()) return;

      const rowStart = timeToMinutes(row.start_time);
      const rowEnd = timeToMinutes(row.end_time);

      booking.slots.forEach(function (slot) {
        const slotRange = parseSlotRange(slot);
        if (rangesOverlap(slotRange.start, slotRange.end, rowStart, rowEnd)) {
          clashTimetable = row;
        }
      });
    });

    if (clashTimetable) {
      showValidation('Cannot approve booking: clashes with timetable entry (' + clashTimetable.subject_code + ' on ' + clashTimetable.day + ' ' + clashTimetable.start_time + ' - ' + clashTimetable.end_time + ').');
      return;
    }

    // All checks passed: approve booking
    booking.status = 'Approved';
    booking.approved_by = currentAdmin.user_id;
    booking.approval_date = todayISO();

    renderBookingsTab();
    updateBadges();
    overlay.classList.remove('open');
    showConfirmation('Booking Approved', 'Booking request #' + booking.booking_id + ' has been approved.');
  });

  rejectBtn.addEventListener('click', function () {
    const booking = bookings.find(function (b) { return b.booking_id === activeBookingId; });
    if (!booking) return;

    booking.status = 'Rejected';
    booking.approved_by = currentAdmin.user_id;
    booking.approval_date = todayISO();

    renderBookingsTab();
    updateBadges();
    overlay.classList.remove('open');
    showConfirmation('Booking Rejected', 'Booking request #' + booking.booking_id + ' has been rejected.');
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

  resolveBtn.addEventListener('click', function () {
    const complaint = complaints.find(function (c) { return c.complaint_id === activeComplaintId; });
    if (!complaint) return;

    complaint.status = 'Resolved';
    complaint.resolved_by = currentAdmin.user_id;
    complaint.resolved_date = todayISO();

    renderComplaintsTab();
    updateBadges();
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

  submitBtn.addEventListener('click', function () {
    const name = nameInput.value.trim();

    if (!name) {
      showValidation('Please enter a club name.');
      return;
    }

    const exists = clubs.some(function (c) {
      return c.club_name.toLowerCase() === name.toLowerCase();
    });

    if (exists) {
      showValidation('A club with the name "' + name + '" already exists.');
      return;
    }

    const maxId = clubs.reduce(function (max, c) {
      return c.club_id > max ? c.club_id : max;
    }, 0);

    clubs.push({
      club_id: maxId + 1,
      club_name: name,
      president_user_id: null,
      faculty_user_id: null
    });

    renderClubsTab();
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

  saveBtn.addEventListener('click', function () {
    const club = clubs.find(function (c) { return c.club_id === activeClubId; });
    if (!club) return;

    club.president_user_id = presSelect.value ? Number(presSelect.value) : null;
    club.faculty_user_id = advSelect.value ? Number(advSelect.value) : null;

    renderClubsTab();
    overlay.classList.remove('open');
    showConfirmation('Club Updated', 'Leadership for ' + club.club_name + ' has been updated.');
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

  // Open in Add Mode
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

  // Open in Edit Mode
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

  saveBtn.addEventListener('click', function () {
    const code = codeInput.value.trim().toUpperCase();
    const room = roomInput.value.trim();
    const type = typeInput.value.trim();
    const build = buildInput.value.trim();
    const capStr = capInput.value.trim();
    const floorStr = floorInput.value.trim();
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

    const capNum = parseInt(capStr, 10);
    if (isNaN(capNum) || capNum <= 0) {
      showValidation('Capacity must be a positive integer greater than 0.');
      return;
    }

    const floorNum = parseInt(floorStr, 10);
    if (isNaN(floorNum) || floorNum < 0) {
      showValidation('Floor must be a valid non-negative integer (0 or greater).');
      return;
    }

    if (!isEditMode) {
      const duplicate = resources.some(function (r) {
        return r.resource_code.toLowerCase() === code.toLowerCase();
      });

      if (duplicate) {
        showValidation('Resource code "' + code + '" already exists.');
        return;
      }

      resources.push({
        resource_code: code,
        room_number: room,
        resource_type: type,
        building: build,
        capacity: capNum,
        floor: floorNum,
        status: status
      });

      renderResourcesTab();
      overlay.classList.remove('open');
      showConfirmation('Resource Added', 'Resource ' + code + ' has been created successfully.');
    } else {
      const res = findResource(activeCode);
      if (!res) return;

      res.room_number = room;
      res.resource_type = type;
      res.building = build;
      res.capacity = capNum;
      res.floor = floorNum;
      res.status = status;

      renderResourcesTab();
      overlay.classList.remove('open');
      showConfirmation('Resource Updated', 'Resource ' + res.resource_code + ' has been updated successfully.');
    }
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
      + 'CS101,Monday,09:00,10:00,CSE,LHC002\n'
      + 'EC201,Tuesday,11:00,12:00,ECE,2AB016\n'
      + 'ME102,Wednesday,14:00,15:00,MECH,1AB102\n';

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
  confirmBtn.addEventListener('click', function () {
    if (stagedRows.length === 0) return;

    let maxId = timetable.reduce(function (max, t) {
      return t.timetable_id > max ? t.timetable_id : max;
    }, 0);

    stagedRows.forEach(function (r) {
      maxId += 1;
      timetable.push({
        timetable_id: maxId,
        subject_code: r.subject_code,
        day: r.day,
        start_time: r.start_time,
        end_time: r.end_time,
        department_id: r.department_id,
        resource_code: r.resource_code
      });
    });

    const count = stagedRows.length;
    stagedRows = [];
    previewArea.classList.add('hidden');
    fileInput.value = '';
    filenameEl.textContent = 'No file chosen';

    renderTimetableTab();
    showConfirmation('Timetable Uploaded', count + ' entries added to the timetable successfully.');
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

// Initialise page if user has administrator access
if (typeof isAdmin !== 'undefined' && isAdmin) {
  renderBookingsTab();
  renderComplaintsTab();
  renderClubsTab();
  renderResourcesTab();
  renderTimetableTab();
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
}

setupUtilityModals();
