let currentUser = null;
let departments = [];

async function loadProfileData() {
  const [meRes, depRes] = await Promise.all([fetch('/me'), fetch('/departments')]);
  const me = await meRes.json();
  departments = await depRes.json();
  currentUser = {
    user_id: me.user_id,
    name: me.name,
    email: me.email,
    phone: me.phone ? me.phone.replace(/\D/g, '').slice(-10) : '',
    role: me.role,
    department_id: me.department_id,
    club_affiliation: me.club ? me.club.club_name + ' (President)' : null
  };
}

// Original profile values to track form modifications
let originalName = '';
let originalDept = '';
let originalPhone = '';

// Find department by ID
function findDepartment(id) {
  return departments.find(function (d) { return d.department_id === id; });
}

// Compute initials from full name
function getInitials(name) {
  if (!name) return 'RM';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

// Populate department dropdown options
function populateDepartmentSelect() {
  const selectEl = document.querySelector('#profile-dept-select');
  let html = '<option value="" disabled>Select Department</option>';
  departments.forEach(function (d) {
    html += '<option value="' + d.department_id + '">' + d.department_name + ' (' + d.department_code + ')</option>';
  });
  selectEl.innerHTML = html;
}

// Render profile overview card, account details and sync header username
function renderProfileOverview() {
  const dept = findDepartment(currentUser.department_id);

  document.querySelector('#header-username').textContent = currentUser.name;
  document.querySelector('#profile-avatar').textContent = getInitials(currentUser.name);
  document.querySelector('#overview-name').textContent = currentUser.name;
  document.querySelector('#overview-role').textContent = currentUser.role;
  document.querySelector('#overview-email').textContent = currentUser.email;
  document.querySelector('#overview-dept').textContent = dept ? dept.department_name : 'No Department Assigned';
  document.querySelector('#overview-club').textContent = currentUser.club_affiliation || 'No Active Club Affiliation';
  document.querySelector('#security-user-id').textContent = currentUser.user_id;

  const roleDisplay = document.querySelector('#account-role-display');
  const permissionsText = document.querySelector('#account-permissions-text');

  if (roleDisplay) {
    roleDisplay.textContent = currentUser.role;
  }

  if (permissionsText) {
    if (currentUser.role === 'Admin') {
      permissionsText.textContent = 'Full administrative access across all modules (Dashboard, Bookings, Complaints, Clubs, Resources, Timetable, Profile).';
    } else if (currentUser.role === 'Faculty') {
      permissionsText.textContent = 'Faculty access to browse & book campus resources, file complaints, and view dashboard.';
    } else if (currentUser.club_affiliation && currentUser.club_affiliation.indexOf('President') !== -1) {
      permissionsText.textContent = 'Club President access to browse & book campus resources, file complaints, and view dashboard.';
    } else {
      permissionsText.textContent = 'Student access to Dashboard and Profile. (Contact an administrator to be assigned as a club president to unlock booking privileges).';
    }
  }
}

// Populate input fields with user values
function populateProfileForm() {
  const nameInput = document.querySelector('#profile-name-input');
  const emailInput = document.querySelector('#profile-email-input');
  const roleInput = document.querySelector('#profile-role-input');
  const deptSelect = document.querySelector('#profile-dept-select');
  const phoneInput = document.querySelector('#profile-phone-input');

  nameInput.value = currentUser.name;
  emailInput.value = currentUser.email;
  roleInput.value = currentUser.role;
  deptSelect.value = currentUser.department_id ? String(currentUser.department_id) : '';
  phoneInput.value = currentUser.phone || '';

  originalName = currentUser.name;
  originalDept = currentUser.department_id ? String(currentUser.department_id) : '';
  originalPhone = currentUser.phone || '';

  document.querySelector('#save-profile-btn').disabled = true;
}

// Check if any personal details have changed
function checkForProfileChanges() {
  const currentName = document.querySelector('#profile-name-input').value.trim();
  const currentDept = document.querySelector('#profile-dept-select').value;
  const currentPhone = document.querySelector('#profile-phone-input').value.trim();

  const changed = (currentName !== originalName)
    || (currentDept !== originalDept)
    || (currentPhone !== originalPhone);

  document.querySelector('#save-profile-btn').disabled = !changed;
}

// Setup listeners for personal profile form
function setupProfileForm() {
  const nameInput = document.querySelector('#profile-name-input');
  const deptSelect = document.querySelector('#profile-dept-select');
  const phoneInput = document.querySelector('#profile-phone-input');
  const saveBtn = document.querySelector('#save-profile-btn');

  nameInput.addEventListener('input', checkForProfileChanges);
  deptSelect.addEventListener('change', checkForProfileChanges);
  
  // keep only digits, max 10, BEFORE checking for changes (listeners run in the order added)
  phoneInput.addEventListener('input', function () {
    phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
    checkForProfileChanges();
  });

  saveBtn.addEventListener('click', async function () {
    const name = nameInput.value.trim();
    const deptId = deptSelect.value;
    const phone = phoneInput.value.trim();

    if (!name) { showValidation('Please enter your full name.'); return; }
    if (!deptId) { showValidation('Please select a department.'); return; }
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      showValidation('Phone number must be exactly 10 digits and start with 6, 7, 8 or 9.');
      return;
    }

    const res = await fetch('/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, phone: phone, department_id: Number(deptId) })
    });
    const data = await res.json();
    if (!res.ok) { showValidation(data.error); return; }

    currentUser.name = name;
    currentUser.department_id = Number(deptId);
    currentUser.phone = phone;
    originalName = name;
    originalDept = String(deptId);
    originalPhone = phone;

    renderProfileOverview();
    document.querySelectorAll('.js-username').forEach(function (el) { el.textContent = name; });
    saveBtn.disabled = true;
    showConfirmation('Profile Updated', 'Your personal details have been updated successfully.');
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

async function initProfile() {
  await commonReady;
  setupUtilityModals();
  await loadProfileData();
  populateDepartmentSelect();
  renderProfileOverview();
  populateProfileForm();
  setupProfileForm();
}
initProfile();