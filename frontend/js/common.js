// TODO: replace with real auth check from backend.
// Faculty: always true. Student: true only if they are a club president.
const canAccess = true;

// TODO: replace with real admin check from backend.
const isAdmin = true;

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

// Append Admin link to sidebar if user is an administrator
function setupAdminSidebarLink(){
  if (!isAdmin) return;
  const sidebarUl = document.querySelector('.sidebar ul');
  if (!sidebarUl) return;
  const li = document.createElement('li');
  li.innerHTML = '<a href="admin.html" class="sidebar-links">'
    + '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check-icon lucide-shield-check"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>'
    + '<span>Admin</span>'
    + '</a>';
  sidebarUl.appendChild(li);
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

setupProfileDropdown();
setupSidebarToggle();
setupAdminSidebarLink();
setupActiveSidebarLink();
applyAdminGate();