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

setupProfileDropdown();