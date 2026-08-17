/*
  EduPath - Main Global Scripts
*/

document.addEventListener('DOMContentLoaded', () => {
  // --- Theme Toggle ---
  const themeToggles = document.querySelectorAll('.theme-toggle');
  
  // Check for saved theme preference or system preference
  const savedTheme = localStorage.getItem('edupath-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeIcons('dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    updateThemeIcons('light');
  }

  themeToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('edupath-theme', newTheme);
      updateThemeIcons(newTheme);
    });
  });

  function updateThemeIcons(theme) {
    themeToggles.forEach(toggle => {
      if (theme === 'dark') {
        toggle.innerHTML = '<i class="ph ph-sun"></i>';
      } else {
        toggle.innerHTML = '<i class="ph ph-moon"></i>';
      }
    });
  }

  // --- RTL Toggle ---
  const rtlToggles = document.querySelectorAll('.rtl-toggle');
  
  rtlToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const currentDir = document.documentElement.getAttribute('dir');
      if (currentDir === 'rtl') {
        document.documentElement.removeAttribute('dir');
      } else {
        document.documentElement.setAttribute('dir', 'rtl');
      }
    });
  });

  // --- Mobile Drawer ---
  const navToggles = document.querySelectorAll('.nav-toggle');
  const drawerCloses = document.querySelectorAll('.drawer-close');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');

  if (mobileDrawer && drawerOverlay) {
    const openDrawer = () => {
      mobileDrawer.classList.add('open');
      drawerOverlay.classList.add('open');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    const closeDrawer = () => {
      mobileDrawer.classList.remove('open');
      drawerOverlay.classList.remove('open');
      document.body.style.overflow = '';
    };

    navToggles.forEach(toggle => toggle.addEventListener('click', openDrawer));
    drawerCloses.forEach(toggle => toggle.addEventListener('click', closeDrawer));
    drawerOverlay.addEventListener('click', closeDrawer);
  }
});
