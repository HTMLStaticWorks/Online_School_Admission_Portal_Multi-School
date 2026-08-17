/*
  EduPath - Parent Dashboard Scripts
*/

document.addEventListener('DOMContentLoaded', () => {
  // --- Sidebar Toggle (Mobile) ---
  const sidebarToggle = document.getElementById('sidebarToggle');
  const dashboardSidebar = document.getElementById('dashboardSidebar');
  
  if (sidebarToggle && dashboardSidebar) {
    sidebarToggle.addEventListener('click', () => {
      dashboardSidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024) {
        if (!dashboardSidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
          dashboardSidebar.classList.remove('open');
        }
      }
    });
  }

  // --- Document Upload Mock (Application Detail / Document Vault) ---
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach(input => {
    input.addEventListener('change', function(e) {
      if (this.files && this.files.length > 0) {
        const fileName = this.files[0].name;
        const formGroup = this.closest('.form-group');
        if (formGroup) {
          let fileNameDisplay = formGroup.querySelector('.file-name-display');
          if (!fileNameDisplay) {
            fileNameDisplay = document.createElement('div');
            fileNameDisplay.className = 'file-name-display';
            fileNameDisplay.style.marginTop = '0.5rem';
            fileNameDisplay.style.fontSize = '0.875rem';
            fileNameDisplay.style.color = 'var(--color-status-admitted)';
            fileNameDisplay.innerHTML = `<i class="ph ph-check-circle"></i> ${fileName} attached`;
            formGroup.appendChild(fileNameDisplay);
          } else {
            fileNameDisplay.innerHTML = `<i class="ph ph-check-circle"></i> ${fileName} attached`;
          }
        }
      }
    });
  });
});
