/*
  EduPath - Parent Dashboard Scripts

  The dashboard is a single document containing many views. A hash router
  swaps which one is on screen, so each sidebar entry behaves like its own
  page (deep-linkable, back/forward aware) without a separate HTML file.
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

  // ------------------------------------------------------------- view router

  const views = Array.from(document.querySelectorAll('.dash-view'));

  if (views.length) {
    // Any element carrying data-view acts as navigation — sidebar entries and
    // the header's profile control alike.
    const navItems = Array.from(document.querySelectorAll('[data-view]'));
    const titleEl = document.getElementById('dashTitle');
    const baseTitle = 'EduPath';
    const names = views.map(v => v.id.replace(/^view-/, ''));
    const DEFAULT_VIEW = names[0];

    const show = (name, opts) => {
      const target = names.includes(name) ? name : DEFAULT_VIEW;
      const section = document.getElementById('view-' + target);

      views.forEach(v => v.classList.toggle('is-active', v === section));
      navItems.forEach(a => {
        const on = a.dataset.view === target;
        a.classList.toggle('active', on);
        if (on) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });

      // data-title carries entities (e.g. &amp;), so read it back as text
      const label = section.dataset.title || target;
      const decoded = new DOMParser().parseFromString(label, 'text/html').body.textContent;
      if (titleEl) titleEl.textContent = decoded;
      document.title = decoded + ' | ' + baseTitle;

      if (dashboardSidebar) dashboardSidebar.classList.remove('open');

      // Land at the top of the new view, and move focus there for screen
      // readers — but not on first paint, which would scroll unprompted.
      if (opts && opts.userInitiated) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        section.focus({ preventScroll: true });
      }
    };

    const fromHash = (userInitiated) => {
      show((location.hash || '').replace(/^#/, ''), { userInitiated: userInitiated });
    };

    window.addEventListener('hashchange', () => fromHash(true));
    fromHash(false);

    // In-page links to a view (KPI cards, action buttons) route through the
    // same mechanism; clicking the already-active hash fires no hashchange,
    // so handle that case directly.
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const name = link.getAttribute('href').slice(1);
      if (!names.includes(name)) return;

      if (location.hash === '#' + name) {
        e.preventDefault();
        show(name, { userInitiated: true });
      }
    });
  }

  // ------------------------------------------------- application status tabs

  document.querySelectorAll('[data-filter-group]').forEach(group => {
    const key = group.dataset.filterGroup;
    const tabs = Array.from(group.querySelectorAll('.filter-tab'));
    const body = document.querySelector(`[data-filter-target="${key}"]`);
    const empty = document.querySelector(`[data-filter-empty="${key}"]`);
    if (!body) return;

    const rows = Array.from(body.querySelectorAll('tr'));

    group.addEventListener('click', (e) => {
      const tab = e.target.closest('.filter-tab');
      if (!tab) return;

      tabs.forEach(t => t.setAttribute('aria-pressed', String(t === tab)));

      const want = tab.dataset.filter;
      let shown = 0;

      rows.forEach(row => {
        const match = want === 'all' || row.dataset.status === want;
        row.hidden = !match;
        if (match) shown++;
      });

      if (empty) empty.hidden = shown > 0;
    });
  });

  // ------------------------------------------------------------- messages

  const threadBody = document.querySelector('[data-thread-body]');

  if (threadBody) {
    const THREADS = {
      oakridge: {
        name: 'Oakridge International',
        avatar: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=120&q=80',
        messages: [
          { from: 'them', text: 'Good morning! We have reviewed Maya\'s application and would like to invite you both for a parent and child interaction.', at: 'Mon 09:14' },
          { from: 'them', text: 'We have held Nov 15 at 10:30 AM at the Gachibowli campus. Please confirm the slot at your earliest convenience.', at: 'Mon 09:15' },
          { from: 'me', text: 'Thank you! Nov 15 works for us. Is there anything Maya should bring along?', at: 'Mon 11:02' },
          { from: 'them', text: 'Just her original birth certificate for verification. The session lasts about 45 minutes.', at: '2h ago' }
        ]
      },
      stmarys: {
        name: "St. Mary's High School",
        avatar: 'https://images.unsplash.com/photo-1591123120675-6f7f1aae0e5b?auto=format&fit=crop&w=120&q=80',
        messages: [
          { from: 'them', text: 'Your application has been received and logged as ICSE Grade 4.', at: 'Oct 15' },
          { from: 'them', text: 'We still need the medical record before we can move this to review. You can upload it straight into your vault.', at: '1d ago' }
        ]
      },
      dps: {
        name: 'Delhi Public School',
        avatar: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=120&q=80',
        messages: [
          { from: 'me', text: 'Hello, could you confirm whether the transport route covers Linden Avenue?', at: 'Oct 12' },
          { from: 'them', text: 'Yes, route 7 has a stop two minutes from that address.', at: 'Oct 13' },
          { from: 'them', text: 'Thank you — your application is now under review. We will share a decision shortly.', at: '3d ago' }
        ]
      }
    };

    const items = Array.from(document.querySelectorAll('.msg-item[data-thread]'));
    const nameEl = document.querySelector('[data-thread-name]');
    const avatarEl = document.querySelector('[data-thread-avatar]');
    const form = document.querySelector('[data-thread-form]');
    const input = document.querySelector('[data-thread-input]');

    let current = 'oakridge';

    const bubble = (msg) => {
      const el = document.createElement('div');
      el.className = 'msg-bubble' + (msg.from === 'me' ? ' is-mine' : '');
      el.textContent = msg.text;

      const stamp = document.createElement('span');
      stamp.className = 'stamp';
      stamp.textContent = msg.at;
      el.appendChild(stamp);

      return el;
    };

    const paint = () => {
      const thread = THREADS[current];
      threadBody.innerHTML = '';
      thread.messages.forEach(m => threadBody.appendChild(bubble(m)));
      threadBody.scrollTop = threadBody.scrollHeight;

      if (nameEl) nameEl.textContent = thread.name;
      if (avatarEl) avatarEl.src = thread.avatar;
    };

    items.forEach(item => {
      item.addEventListener('click', () => {
        current = item.dataset.thread;
        items.forEach(i => i.setAttribute('aria-pressed', String(i === item)));

        // Opening a thread clears its unread marker
        const dot = item.querySelector('.msg-unread-dot');
        if (dot) dot.remove();

        paint();
      });
    });

    if (form && input) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        THREADS[current].messages.push({ from: 'me', text: text, at: 'Just now' });
        input.value = '';
        paint();
      });
    }

    paint();
  }

  // ------------------------------------------------------- settings switches

  document.querySelectorAll('.switch[role="switch"]').forEach(sw => {
    sw.addEventListener('click', () => {
      sw.setAttribute('aria-pressed', sw.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    });
  });

  // --------------------------------------------------- shortlist remove/undo

  document.querySelectorAll('.shortlist-fav').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.shortlist-card');
      if (!card) return;

      const removed = card.dataset.removed === 'true';
      card.dataset.removed = String(!removed);
      card.style.opacity = removed ? '' : '0.45';
      btn.innerHTML = removed
        ? '<i class="ph-fill ph-heart"></i>'
        : '<i class="ph ph-heart"></i>';
    });
  });

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
