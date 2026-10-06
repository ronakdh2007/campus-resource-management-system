// TODO: replace with real auth check from backend.
// Faculty: always true. Student: true only if they are a club president.
const canAccess = true;

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

setupProfileDropdown();
setupSidebarToggle();
setupActiveSidebarLink();