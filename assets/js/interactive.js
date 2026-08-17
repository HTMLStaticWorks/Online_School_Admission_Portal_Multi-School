/*
  EduPath - Interactive Sections

  Three self-contained modules, each a no-op unless its root element is on the
  page:
    #matchFinder       (index.html)  live school shortlist
    #costEstimator     (home2.html)  first-year cost breakdown
    #milestoneTimeline (about.html)  selectable company milestones
*/

(function () {
  'use strict';

  // ---------------------------------------------------------------- helpers

  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

  const escapeHTML = (str) => String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const readouts = (root) => {
    const map = {};
    root.querySelectorAll('[data-readout]').forEach(el => {
      map[el.dataset.readout] = el;
    });
    return map;
  };

  /* Wires every [data-group] container inside `root` and calls onChange with
     the current selection state. Options are any [data-value] descendants, so
     a group can render as pills or as image tiles. Single-mode groups always
     keep exactly one option pressed; multi-mode groups toggle freely. */
  function chipGroups(root, onChange) {
    const state = {};

    root.querySelectorAll('[data-group]').forEach(row => {
      const group = row.dataset.group;
      const multi = row.dataset.mode === 'multi';
      const chips = Array.from(row.querySelectorAll('[data-value]'));

      state[group] = multi
        ? chips.filter(c => c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.value)
        : (chips.find(c => c.getAttribute('aria-pressed') === 'true') || chips[0]).dataset.value;

      row.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-value]');
        if (!chip || !chips.includes(chip)) return;

        if (multi) {
          const on = chip.getAttribute('aria-pressed') !== 'true';
          chip.setAttribute('aria-pressed', String(on));
          state[group] = chips
            .filter(c => c.getAttribute('aria-pressed') === 'true')
            .map(c => c.dataset.value);
        } else {
          chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
          state[group] = chip.dataset.value;
        }

        onChange(state);
      });
    });

    return state;
  }

  /* Paints the filled portion of a range track and reports changes. */
  function rangeControl(input, onChange) {
    if (!input) return;

    const paint = () => {
      const min = Number(input.min);
      const pct = ((Number(input.value) - min) / (Number(input.max) - min)) * 100;
      input.style.setProperty('--fill', pct + '%');
    };

    input.addEventListener('input', () => { paint(); onChange(Number(input.value)); });
    paint();
  }

  /* Eases a numeric readout toward a new value instead of snapping. */
  function animateNumber(el, from, to, format, duration) {
    if (el._raf) cancelAnimationFrame(el._raf);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = format(to);
      return;
    }

    const start = performance.now();
    const span = duration || 550;

    const tick = (now) => {
      const p = Math.min((now - start) / span, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(from + (to - from) * eased);
      if (p < 1) el._raf = requestAnimationFrame(tick);
    };

    el._raf = requestAnimationFrame(tick);
  }

  // ------------------------------------------------- 1. School Match Finder

  function initMatchFinder() {
    const root = document.getElementById('matchFinder');
    if (!root) return;

    const img = (id, w) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

    const SCHOOLS = [
      { name: 'Oakridge International', area: 'Gachibowli, Hyderabad', board: 'IB',    fee: 14500, grades: ['early', 'primary', 'middle', 'senior'], strengths: ['academics', 'sports', 'boarding', 'transport'], rating: 4.9, photo: 'photo-1562774053-701939374585' },
      { name: 'Delhi Public School',    area: 'Sector 45, Gurgaon',    board: 'CBSE',  fee: 6800,  grades: ['early', 'primary', 'middle', 'senior'], strengths: ['academics', 'sports', 'transport'],            rating: 4.7, photo: 'photo-1580582932707-520aed937b7b' },
      { name: 'Greenwood High',         area: 'Sarjapur Rd, Bangalore',board: 'ICSE',  fee: 11200, grades: ['primary', 'middle', 'senior'],          strengths: ['sports', 'arts', 'boarding'],                 rating: 4.8, photo: 'photo-1546410531-bb4caa6b424d' },
      { name: "St. Mary's High School", area: 'Heritage Lane, Pune',   board: 'ICSE',  fee: 5400,  grades: ['early', 'primary', 'middle'],           strengths: ['arts', 'academics'],                          rating: 4.6, photo: 'photo-1591123120675-6f7f1aae0e5b' },
      { name: 'Crescent Valley Academy',area: 'Whitefield, Bangalore', board: 'CBSE',  fee: 8900,  grades: ['primary', 'middle', 'senior'],          strengths: ['academics', 'transport', 'arts'],             rating: 4.5, photo: 'photo-1509062522246-3755977927d7' },
      { name: 'Riverdale Public School',area: 'Kharadi, Pune',         board: 'State', fee: 3200,  grades: ['early', 'primary', 'middle', 'senior'], strengths: ['transport', 'sports'],                        rating: 4.3, photo: 'photo-1571260899304-425eee4c7efc' },
      { name: 'Nova Cambridge School',  area: 'Powai, Mumbai',         board: 'IB',    fee: 17800, grades: ['middle', 'senior'],                     strengths: ['academics', 'arts', 'boarding'],              rating: 4.9, photo: 'photo-1592280771190-3e2e4d571952' },
      { name: 'Harmony Montessori',     area: 'Indiranagar, Bangalore',board: 'State', fee: 4100,  grades: ['early', 'primary'],                     strengths: ['arts', 'academics'],                          rating: 4.4, photo: 'photo-1588072432836-e10032774350' },
      { name: 'Aurora Early Years',     area: 'Alwarpet, Chennai',     board: 'IB',    fee: 9600,  grades: ['early', 'primary'],                     strengths: ['arts', 'transport', 'academics'],             rating: 4.6, photo: 'photo-1512941937669-90a1b58e7e9c' }
    ];

    const GRADE_LABEL = {
      early: 'Nursery – KG',
      primary: 'Grade 1 – 5',
      middle: 'Grade 6 – 8',
      senior: 'Grade 9 – 12'
    };

    const out = readouts(root);
    const budgetInput = root.querySelector('#budgetRange');
    let budget = Number(budgetInput.value);

    const score = (school, state) => {
      // Curriculum and priorities each contribute; fee headroom breaks ties.
      let points = 55;

      if (state.board.length) points += state.board.includes(school.board) ? 20 : -25;

      const wanted = state.priority;
      if (wanted.length) {
        const hits = wanted.filter(p => school.strengths.includes(p)).length;
        points += (hits / wanted.length) * 25;
      } else {
        points += 12;
      }

      const headroom = (budget - school.fee) / budget;
      points += Math.max(-20, Math.min(10, headroom * 20));
      points += (school.rating - 4.3) * 8;

      return Math.max(12, Math.min(99, Math.round(points)));
    };

    const render = (state) => {
      const matches = SCHOOLS
        .filter(s => s.grades.includes(state.grade))
        .filter(s => s.fee <= budget)
        .filter(s => !state.board.length || state.board.includes(s.board))
        .map(s => ({ school: s, match: score(s, state) }))
        .sort((a, b) => b.match - a.match);

      // Control readouts
      out.board.textContent = state.board.length ? state.board.join(', ') : 'Any';
      out.priorities.textContent = state.priority.length
        ? state.priority.length + ' selected'
        : 'Pick any';
      out.budget.textContent = budget >= 20000 ? '$20,000+' : money(budget);
      out.count.textContent = matches.length === 1
        ? '1 school'
        : matches.length + ' schools';

      if (!matches.length) {
        out.stage.innerHTML =
          '<div class="empty-state"><i class="ph ph-binoculars" style="font-size:1.75rem;display:block;margin-bottom:.5rem;"></i>' +
          `No ${escapeHTML(GRADE_LABEL[state.grade].toLowerCase())} seats fit those constraints. ` +
          'Widen the fee ceiling or deselect a curriculum.</div>';
        return;
      }

      const [top, ...rest] = matches;

      const hero = `
        <a class="match-hero" href="school-detail.html">
          <img src="${img(top.school.photo, 800)}" alt="${escapeHTML(top.school.name)} campus">
          <div class="match-hero-top">
            <span class="match-hero-board">${escapeHTML(top.school.board)}</span>
            <div class="match-score" style="--score:${top.match};">
              <span>${top.match}%<small>MATCH</small></span>
            </div>
          </div>
          <div class="match-hero-body">
            <h3>${escapeHTML(top.school.name)}</h3>
            <div class="match-hero-meta">
              <span><i class="ph-fill ph-map-pin"></i> ${escapeHTML(top.school.area)}</span>
              <span><i class="ph-fill ph-star" style="color:#F59E0B;"></i> ${top.school.rating}</span>
              <span><i class="ph ph-wallet"></i> ${money(top.school.fee)}/yr</span>
            </div>
          </div>
        </a>`;

      const runners = rest.slice(0, 2).map(({ school, match }) => `
        <a class="match-runner" href="school-detail.html">
          <img src="${img(school.photo, 200)}" alt="${escapeHTML(school.name)} campus" loading="lazy">
          <div class="match-runner-main">
            <div class="name">${escapeHTML(school.name)}</div>
            <div class="meta">${escapeHTML(school.board)} &middot; ${escapeHTML(school.area)} &middot; ${money(school.fee)}/yr</div>
          </div>
          <span class="pct">${match}%</span>
        </a>
      `).join('');

      out.stage.innerHTML = hero + (runners ? `<div class="match-runners">${runners}</div>` : '');
    };

    const state = chipGroups(root, render);
    rangeControl(budgetInput, (value) => { budget = value; render(state); });
    render(state);
  }

  // ---------------------------------------------- 2. Admission Cost Estimator

  function initCostEstimator() {
    const root = document.getElementById('costEstimator');
    if (!root) return;

    const BOARDS = {
      cbse:  { label: 'CBSE',           tuition: 6200,  admission: 1400 },
      icse:  { label: 'ICSE',           tuition: 7400,  admission: 1700 },
      ib:    { label: 'IB / Cambridge', tuition: 15200, admission: 3800 },
      state: { label: 'State Board',    tuition: 3100,  admission: 700 }
    };

    const GRADES = {
      early:   { label: 'Nursery – KG',  factor: 0.82 },
      primary: { label: 'Grade 1 – 5',   factor: 1.00 },
      middle:  { label: 'Grade 6 – 8',   factor: 1.14 },
      senior:  { label: 'Grade 9 – 12',  factor: 1.32 }
    };

    const CITIES = {
      metro: { label: 'Metro',          factor: 1.00 },
      tier2: { label: 'Tier 2 city',    factor: 0.78 },
      tier3: { label: 'Tier 3 / town',  factor: 0.58 }
    };

    const ADDONS = {
      transport: { label: 'School bus',    cost: 900 },
      meals:     { label: 'Meal plan',     cost: 750 },
      boarding:  { label: 'Boarding',      cost: 6400 },
      coaching:  { label: 'Coaching',      cost: 1200 }
    };

    // Segment colours double as the bar and the legend swatches.
    const SEGMENTS = [
      { key: 'tuition',   label: 'Tuition',           color: '#2D4A22' },
      { key: 'admission', label: 'One-time admission',color: '#E89C83' },
      { key: 'materials', label: 'Books & uniform',   color: '#B08D57' },
      { key: 'addons',    label: 'Add-ons',           color: '#14B8A6' }
    ];

    const out = readouts(root);
    const siblingInput = root.querySelector('#siblingRange');
    let children = Number(siblingInput.value);
    let lastTotal = 0;

    const render = (state) => {
      const board = BOARDS[state.board];
      const grade = GRADES[state.grade];
      const city = CITIES[state.city];
      const scale = grade.factor * city.factor;

      const parts = {
        tuition: board.tuition * scale,
        admission: board.admission * city.factor,
        materials: 420 * grade.factor,
        addons: state.addon.reduce((sum, key) => sum + ADDONS[key].cost * city.factor, 0)
      };

      const perChild = Object.values(parts).reduce((a, b) => a + b, 0);

      // Second child 15% off, third 25% off.
      const multipliers = [1, 0.85, 0.75].slice(0, children);
      const gross = perChild * children;
      const total = perChild * multipliers.reduce((a, b) => a + b, 0);
      const savings = gross - total;

      // Control readouts
      out.board.textContent = board.label;
      out.grade.textContent = grade.label;
      out.city.textContent = city.label;
      out.children.textContent = String(children);
      out.addons.textContent = state.addon.length
        ? state.addon.map(k => ADDONS[k].label).join(', ')
        : 'None';

      // Headline
      animateNumber(out.total, lastTotal, total, money, 600);
      lastTotal = total;

      out.permonth.textContent =
        `About ${money(total / 12)} a month across ${children === 1 ? 'one child' : children + ' children'}.`;

      // Breakdown bar + legend (shares are of the pre-discount figure so the
      // segments stay proportional to what each line item actually costs)
      out.bar.innerHTML = SEGMENTS
        .map(seg => `<div class="cost-seg" style="background:${seg.color};" data-key="${seg.key}"></div>`)
        .join('');

      // Widths set after insertion so the transition has something to animate from
      requestAnimationFrame(() => {
        out.bar.querySelectorAll('.cost-seg').forEach(el => {
          const share = gross ? (parts[el.dataset.key] * children / gross) * 100 : 0;
          el.style.width = share + '%';
        });
      });

      out.legend.innerHTML = SEGMENTS.map(seg => `
        <div class="cost-legend-item">
          <span class="cost-swatch" style="background:${seg.color};"></span>
          <span>${seg.label}</span>
          <span class="amount">${money(parts[seg.key] * children)}</span>
        </div>
      `).join('');

      out.savings.textContent = '−' + money(savings);
      out.savingsnote.textContent = children > 1
        ? `${children - 1} sibling discount${children > 2 ? 's' : ''} applied`
        : 'Add a second child to unlock 15% off';
    };

    const state = chipGroups(root, render);
    rangeControl(siblingInput, (value) => { children = value; render(state); });
    render(state);
  }

  // ------------------------------------------------ 3. Milestone Timeline

  function initMilestoneTimeline() {
    const root = document.getElementById('milestoneTimeline');
    if (!root) return;

    const MILESTONES = {
      2019: {
        title: 'A kitchen-table frustration',
        body: 'Our founder filled out the same eleven-page admission form for four different schools in one weekend. That evening the first sketch of a shared student profile went onto the back of an envelope.',
        stats: [['4', 'forms, one child'], ['1', 'very long weekend']],
        img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
        alt: 'Founding team working together at a table'
      },
      2021: {
        title: 'Document Vault opens',
        body: 'Transcripts, birth certificates and ID proofs moved into encrypted storage that parents control. Schools verify against the vault instead of asking for another photocopy.',
        stats: [['128k', 'documents secured'], ['0', 'reported breaches']],
        img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80',
        alt: 'Neatly organised documents and folders'
      },
      2023: {
        title: 'Admissions in your pocket',
        body: 'Real-time status tracking landed on mobile. Parents stopped calling front offices for updates because the dashboard already knew where each application stood.',
        stats: [['72%', 'of visits on mobile'], ['3.1x', 'faster status checks']],
        img: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=900&q=80',
        alt: 'A parent checking application status on a phone'
      },
      2026: {
        title: 'Where we are today',
        body: 'Five hundred partner schools, and an average of fifteen days from first application to a confirmed seat. The eleven-page form is still out there — we just stopped making parents fill it in twice.',
        stats: [['500+', 'partner schools'], ['120k+', 'applications'], ['15', 'day average']],
        img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80',
        alt: 'A bright classroom full of students at work'
      }
    };

    const nodes = Array.from(root.querySelectorAll('.milestone-node'));
    const out = readouts(root);

    const select = (year, focus) => {
      const data = MILESTONES[year];
      if (!data) return;

      nodes.forEach(n => {
        const on = n.dataset.year === String(year);
        n.setAttribute('aria-selected', String(on));
        n.tabIndex = on ? 0 : -1;
        if (on && focus) n.focus();
      });

      out.copy.innerHTML = `
        <span class="eyebrow">${year}</span>
        <h3>${escapeHTML(data.title)}</h3>
        <p style="color: var(--color-text-secondary); font-size: 1.05rem; line-height: 1.7;">${escapeHTML(data.body)}</p>
        <div class="milestone-stats">
          ${data.stats.map(([num, cap]) => `
            <div class="milestone-stat">
              <div class="num">${escapeHTML(num)}</div>
              <div class="cap">${escapeHTML(cap)}</div>
            </div>
          `).join('')}
        </div>
      `;

      out.figure.innerHTML =
        `<img src="${data.img}" alt="${escapeHTML(data.alt)}" loading="lazy">`;

      // Re-trigger the entry animations on each change
      out.copy.style.animation = 'none';
      void out.copy.offsetWidth;
      out.copy.style.animation = '';
    };

    nodes.forEach(node => {
      node.addEventListener('click', () => select(node.dataset.year, false));

      node.addEventListener('keydown', (e) => {
        const i = nodes.indexOf(node);
        let next = null;

        if (e.key === 'ArrowRight') next = nodes[(i + 1) % nodes.length];
        else if (e.key === 'ArrowLeft') next = nodes[(i - 1 + nodes.length) % nodes.length];
        else if (e.key === 'Home') next = nodes[0];
        else if (e.key === 'End') next = nodes[nodes.length - 1];
        else return;

        e.preventDefault();
        select(next.dataset.year, true);
      });
    });

    const initial = nodes.find(n => n.getAttribute('aria-selected') === 'true') || nodes[0];
    if (initial) select(initial.dataset.year, false);
  }

  // ------------------------------------------------------------------ boot

  document.addEventListener('DOMContentLoaded', () => {
    initMatchFinder();
    initCostEstimator();
    initMilestoneTimeline();
  });
})();
