let canAccess = false;
let isAdmin = false;
let me = null;

async function loadMe() {
  const res = await fetch('/me');
  if (res.status === 401) {
    // not logged in: go to login and never resolve, so nothing else on the page runs
    window.location.replace('/pages/login.html');
    return new Promise(function () {});
  }
  me = await res.json();
  canAccess = me.canAccess;
  isAdmin = me.isAdmin;
}

// Interactivity for the profile dropdown
function setupProfileDropdown(){
  const profileButton=document.querySelector('.profile-button');
  const profileDropdown=document.querySelector('.profile-dropdown');
  const profileContainer=document.querySelector('.profile-container');
  
  profileButton.addEventListener('click', function(){
     profileDropdown.classList.toggle('open');
     profileButton.classList.toggle('active');
  });
  
  document.addEventListener('click', function(event){
    const clickedInsideMenu=profileContainer.contains(event.target);
    
    if(!clickedInsideMenu){
      profileDropdown.classList.remove('open');
      profileButton.classList.remove('active');
    }
  });
}

// Interactivity for the sidebar
function setupSidebarToggle(){
  const sidebar=document.querySelector('.sidebar');
  const sidebarToggle=document.querySelector('.sidebar-toggle');
  const sidebarCollapse=document.querySelector('.sidebar-collapse');
  const sidebarExpand=document.querySelector('.sidebar-expand');

  // On page load, check if it was collapsed last time, and restore that state
  if (localStorage.getItem('sidebarCollapsed')==='true') {
    sidebar.classList.add('collapsed');
    sidebarCollapse.classList.add('hidden');
    sidebarExpand.classList.remove('hidden');
    document.querySelector('.page-content').classList.add('sidebar-collapsed');
  }

  sidebarToggle.addEventListener('click', function(){
    sidebar.classList.toggle('collapsed');
    sidebarCollapse.classList.toggle('hidden');
    sidebarExpand.classList.toggle('hidden');
    document.querySelector('.page-content').classList.toggle('sidebar-collapsed');

    // Save the new state so the next page load remembers it
    const isNowCollapsed=sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', isNowCollapsed);
  });
}

// Admin sees ONLY the Admin link
function setupAdminSidebarLink(){
  if (!isAdmin) return;
  const sidebarUl = document.querySelector('.sidebar ul');
  if (!sidebarUl) return;
  sidebarUl.innerHTML = '';
  const li = document.createElement('li');
  li.innerHTML = '<a href="admin.html" class="sidebar-links">'
    + '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>'
    + '<span>Admin</span>'
    + '</a>';
  sidebarUl.appendChild(li);
}

// Admin lands on admin.html (profile stays reachable from the header dropdown)
// Which pages each kind of user may open
function pageAllowed(page) {
  if (page === 'admin.html') return isAdmin;
  if (page === 'resources.html' || page === 'bookings.html' || page === 'complaints.html') return canAccess;
  if (page === 'dashboard.html') return !isAdmin;
  return true; // profile and anything else
}

function homePage() {
  return isAdmin ? 'admin.html' : 'dashboard.html';
}

// Returns true if the user may stay on this page, otherwise redirects and returns false
function enforcePageAccess() {
  const page = window.location.pathname.split('/').pop();
  if (pageAllowed(page)) return true;

  let target = homePage();
  try {
    const ref = new URL(document.referrer);
    const refPage = ref.pathname.split('/').pop();
    if (ref.origin === window.location.origin && refPage.endsWith('.html')
        && refPage !== page && refPage !== 'login.html' && pageAllowed(refPage)) {
      target = refPage; // send them back to where they came from
    }
  } catch (e) { /* no referrer (typed URL): use the home page */ }

  rememberDenied(page);
  window.location.replace(target);
  return false;
}

const PAGE_NAMES = {
  'admin.html': 'the Admin page',
  'resources.html': 'Resources',
  'bookings.html': 'Bookings',
  'complaints.html': 'Complaints',
  'dashboard.html': 'the Dashboard'
};

// The redirect happens on one page and the message shows on the next, so we pass it through sessionStorage
function rememberDenied(page) {
  try { sessionStorage.setItem('accessDenied', PAGE_NAMES[page] || 'that page'); } catch (e) {}
}

function showAccessToast() {
  let what = null;
  try {
    what = sessionStorage.getItem('accessDenied');
    sessionStorage.removeItem('accessDenied');
  } catch (e) {}
  if (!what) return;

  const toast = document.createElement('div');
  toast.className = 'access-toast';
  toast.textContent = 'You do not have access to ' + what + '.';
  document.body.appendChild(toast);
  setTimeout(function () { toast.classList.add('access-toast-hide'); }, 4000);
  setTimeout(function () { toast.remove(); }, 4600);
}

// Students who are not presidents only keep Dashboard and Profile in the sidebar
function trimSidebarForStudents() {
  if (isAdmin || canAccess) return;
  document.querySelectorAll('.sidebar-links').forEach(function (a) {
    const p = a.getAttribute('href');
    if (p === 'resources.html' || p === 'bookings.html' || p === 'complaints.html') a.closest('li').remove();
  });
}

// Show the logged-in user's name wherever these hooks exist
function applyUserName() {
  document.querySelectorAll('#header-username, .js-username').forEach(function (el) {
    el.textContent = me.name;
  });
}

// To show the current active sidebar
function setupActiveSidebarLink(){
  const currentPage=window.location.pathname.split('/').pop();
  const links=document.querySelectorAll('.sidebar-links');

  links.forEach(function (link) {
    link.closest('li').classList.remove('active-sidebar-link');   // clear first
  });

  links.forEach(function (link) {
    const linkPage=link.getAttribute('href');
    if (linkPage===currentPage) {
      link.closest('li').classList.add('active-sidebar-link');
    }
  });
}

// Access gate — hide page content for users who lack permission
function applyAccessGate() {
  if (canAccess) return;

  const pageContent = document.querySelector('.page-content');
  const denied = document.querySelector('#access-denied-card');

  // Hide every direct child of .page-content except the h1 heading
  Array.from(pageContent.children).forEach(function (child) {
    if (!child.matches('h1.page-heading')) {
      child.classList.add('hidden');
    }
  });

  // Show the access-denied card (it starts hidden via CSS)
  if (denied) {
    denied.classList.remove('hidden');
  }
}

// Access gate for admin page
function applyAdminGate() {
  const currentPage = window.location.pathname.split('/').pop();
  if (currentPage !== 'admin.html') return;
  if (isAdmin) return;

  const pageContent = document.querySelector('.page-content');
  const denied = document.querySelector('#access-denied-card');

  if (pageContent) {
    Array.from(pageContent.children).forEach(function (child) {
      if (!child.matches('h1.page-heading')) {
        child.classList.add('hidden');
      }
    });
  }

  if (denied) {
    denied.classList.remove('hidden');
  }
}

// Sign out. Placeholder until real login exists: just go back to the login page.
function setupSignOut() {
  const btn = document.querySelector('.signout-button');
  if (!btn) return;
  btn.addEventListener('click', async function () {
    await fetch('/logout', { method: 'POST' });
    window.location.href = '/pages/login.html';
  });
}

setupProfileDropdown();
setupSidebarToggle();
setupSignOut();

// everything that needs to know the role waits for /me
async function initCommon() {
  await loadMe();
  if (!enforcePageAccess()) return new Promise(function () {}); // never resolves, so no page script runs
  setupAdminSidebarLink();
  trimSidebarForStudents();
  setupActiveSidebarLink();
  applyAdminGate();
  applyUserName();
  showAccessToast();
}
const commonReady = initCommon();