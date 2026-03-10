/* ─── shell.js v2 — 3D tilt engine, particles, magnetic btns, toasts ─── */

const NAV_ITEMS = [
  { id:'dashboard',     icon:'📊', label:'Dashboard',     screen:'screenDashboard',    section:'main' },
  { id:'members',       icon:'👥', label:'Members',        screen:'screenCrud',         section:'main' },
  { id:'events',        icon:'📅', label:'Events',         screen:'screenCrud',         section:'main', sub:'events' },
  { id:'reports',       icon:'📈', label:'Reports',        screen:'screenReports',      section:'main' },
  { id:'notifications', icon:'🔔', label:'Notifications',  screen:'screenNotifications',section:'main', badge:5 },
  { id:'resources',     icon:'📂', label:'Resources',      screen:'screenCrud',         section:'manage', sub:'resources' },
  { id:'finances',      icon:'💰', label:'Finances',       screen:'screenReports',      section:'manage' },
  { id:'settings',      icon:'⚙️',  label:'Settings',      screen:'screenCrud',         section:'system' },
];

let currentNav = 'dashboard';
let sidebarCollapsed = false;

/* ═══ BUILD SHELL ═══ */
function buildShell() {
  const theme = localStorage.getItem('ams-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);

  const shell = document.getElementById('appShell');
  if (!shell) return;

  shell.innerHTML = `
    <div class="blob-wrap"><div class="blob blob-1"></div><div class="blob blob-2"></div><div class="blob blob-3"></div></div>
    <div class="bg-mesh"></div>
    <canvas id="particleCanvas" style="position:fixed;inset:0;z-index:0;pointer-events:none;opacity:1.0"></canvas>

    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">🏛</div>
        <div class="sidebar-logo-text">AMS <span>Admin</span></div>
      </div>
      <nav class="sidebar-nav" id="sidebarNav"></nav>
      <div class="sidebar-user">
        <div class="user-avatar">SD</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">Shraddha Deshmukh</div>
          <div class="sidebar-user-role">Super Admin</div>
        </div>
      </div>
    </aside>

    <div class="main-content" id="mainContent">
      <header class="topbar" id="topbar">
        <button class="topbar-btn" onclick="toggleSidebar()" aria-label="Toggle sidebar">☰</button>
        <div style="margin-right:auto">
          <div class="topbar-title" id="topbarTitle">Dashboard</div>
        </div>
        <div class="topbar-search" role="search">
          <span class="search-icon">🔍</span>
          <input type="text" placeholder="Search members, events, reports…" aria-label="Search" id="globalSearch"/>
        </div>
        <div class="topbar-actions">
          <button class="topbar-btn" onclick="toggleTheme()" id="themeBtn" aria-label="Toggle theme">☀️</button>
          <button class="topbar-btn" onclick="navigateTo('notifications')" aria-label="Notifications">
            🔔<span class="topbar-notif-dot"></span>
          </button>
          <div class="dropdown" id="profileDropdown">
            <div class="topbar-profile" onclick="toggleProfileMenu()" role="button" aria-haspopup="true">
              <div class="topbar-profile-info">
                <div class="topbar-profile-name">Shraddha Deshmukh</div>
                <div class="topbar-profile-role">Super Admin</div>
              </div>
              <div class="user-avatar" style="width:34px;height:34px;font-size:13px">SD</div>
            </div>
            <div class="dropdown-menu" id="profileMenu">
              <div class="dropdown-item" onclick="navigateTo('settings')">⚙️ &nbsp;Account Settings</div>
              <div class="dropdown-item">🔐 &nbsp;Security</div>
              <div class="dropdown-item">📋 &nbsp;Audit Log</div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item" onclick="window.location.href='login.html'" style="color:var(--danger)">🚪 &nbsp;Sign Out</div>
            </div>
          </div>
        </div>
      </header>
      <div id="screensWrap" style="position:relative;z-index:1;"></div>
    </div>
    <div class="toast-container" id="toastContainer"></div>
  `;

  buildSidebarNav();
  updateThemeBtn();
  initParticles();
  initTiltCards();
  initMagneticBtns();

  document.addEventListener('click', e => {
    const dd = document.getElementById('profileMenu');
    const btn = document.getElementById('profileDropdown');
    if (dd && btn && !btn.contains(e.target)) dd.classList.remove('open');
  });
}

/* ═══ SIDEBAR NAV ═══ */
function buildSidebarNav() {
  const nav = document.getElementById('sidebarNav');
  if (!nav) return;
  let cur = ''; let html = '';
  NAV_ITEMS.forEach(item => {
    if (item.section !== cur) {
      const L = { main:'Navigation', manage:'Management', system:'System' };
      html += `<div class="nav-section-title">${L[item.section]||item.section}</div>`;
      cur = item.section;
    }
    const active = currentNav === item.id ? 'active' : '';
    const badge  = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';
    html += `<div class="nav-item ${active}" onclick="navigateTo('${item.id}')" role="button" tabindex="0" aria-label="${item.label}" aria-current="${active?'page':'false'}">
      <span class="nav-icon" aria-hidden="true">${item.icon}</span>
      <span class="nav-label">${item.label}</span>${badge}
    </div>`;
  });
  nav.innerHTML = html;
}

function navigateTo(id) {
  currentNav = id;
  const item = NAV_ITEMS.find(n => n.id === id);
  if (!item) return;
  buildSidebarNav();
  const titles = { dashboard:'Dashboard', members:'Members', events:'Events', reports:'Reports', notifications:'Notifications', resources:'Resources', finances:'Finances', settings:'Settings' };
  document.getElementById('topbarTitle').textContent = titles[id] || id;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const scr = document.getElementById(item.screen);
  if (scr) { scr.classList.add('active'); reinitAnimations(scr); }
  if (item.sub && typeof setCrudMode === 'function') setCrudMode(item.sub);
  if (id === 'members' && typeof setCrudMode === 'function') setCrudMode('members');
  if (id === 'settings' && typeof setCrudMode === 'function') setCrudMode('settings');
  if ((id==='reports'||id==='finances') && typeof setReportsMode === 'function') setReportsMode(id);
  setTimeout(() => { initTiltCards(); initMagneticBtns(); }, 100);
  window.scrollTo(0,0);
}

function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  document.getElementById('sidebar').classList.toggle('collapsed', sidebarCollapsed);
  document.getElementById('mainContent').classList.toggle('collapsed', sidebarCollapsed);
}
function toggleProfileMenu() { document.getElementById('profileMenu').classList.toggle('open'); }
function toggleTheme() {
  const h = document.documentElement;
  const d = h.getAttribute('data-theme') === 'dark';
  h.setAttribute('data-theme', d ? 'light' : 'dark');
  localStorage.setItem('ams-theme', d ? 'light' : 'dark');
  updateThemeBtn();
}
function updateThemeBtn() {
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
}

/* ═══ PARTICLES ═══ */
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  const DOTS = Array.from({ length: 90 }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
    r: Math.random() * 1.8 + 0.5,
    a: Math.random() * 0.5 + 0.1,
    c: ['124,110,250','0,229,201','255,107,138'][Math.floor(Math.random()*3)]
  }));

  let mouseX = W/2, mouseY = H/2;
  document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

  function drawParticles() {
    ctx.clearRect(0, 0, W, H);
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    DOTS.forEach(d => {
      d.x += d.vx; d.y += d.vy;
      if (d.x < 0) d.x = W; if (d.x > W) d.x = 0;
      if (d.y < 0) d.y = H; if (d.y > H) d.y = 0;

      /* connection lines */
      DOTS.forEach(o => {
        const dx = d.x - o.x, dy = d.y - o.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${d.c},${(0.12 * (1 - dist/120)) * (isDark ? 1 : 0.5)})`;
          ctx.lineWidth = 4.5;
          ctx.moveTo(d.x, d.y); ctx.lineTo(o.x, o.y);
          ctx.stroke();
        }
      });

      /* dots */
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${d.c},${d.a * (isDark ? 1 : 0.5)})`;
      ctx.fill();
    });
    requestAnimationFrame(drawParticles);
  }
  drawParticles();
  window.addEventListener('resize', () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight; });
}

/* ═══ 3D TILT ═══ */
function initTiltCards() {
  document.querySelectorAll('.glass,.stat-card,.tilt-card').forEach(card => {
    if (card._tiltBound) return;
    card._tiltBound = true;

    /* add shine layer if not present */
    if (!card.querySelector('.tilt-shine')) {
      const shine = document.createElement('div');
      shine.className = 'tilt-shine';
      card.appendChild(shine);
    }

    card.addEventListener('mousemove', e => {
      const r   = card.getBoundingClientRect();
      const cx  = r.left + r.width  / 2;
      const cy  = r.top  + r.height / 2;
      const dx  = (e.clientX - cx) / (r.width  / 2);
      const dy  = (e.clientY - cy) / (r.height / 2);
      const rx  = -dy * 6;
      const ry  =  dx * 6;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
      card.style.transition = 'transform 0.08s ease';
      /* move shine */
      const shine = card.querySelector('.tilt-shine');
      const mx = ((e.clientX - r.left) / r.width)  * 100;
      const my = ((e.clientY - r.top)  / r.height) * 100;
      if (shine) { shine.style.setProperty('--mx', mx+'%'); shine.style.setProperty('--my', my+'%'); shine.style.opacity = '1'; }
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.4s var(--spring)';
      const shine = card.querySelector('.tilt-shine');
      if (shine) shine.style.opacity = '0';
    });
  });
}

/* ═══ MAGNETIC BUTTONS ═══ */
function initMagneticBtns() {
  document.querySelectorAll('.btn-primary,.btn-accent').forEach(btn => {
    if (btn._magBound) return;
    btn._magBound = true;
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width  / 2);
      const dy = e.clientY - (r.top  + r.height / 2);
      btn.style.transform = `translate(${dx * 0.16}px, ${dy * 0.20}px) scale(1.04)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
}

/* reinit on screen change */
function reinitAnimations(scr) {
  setTimeout(() => {
    scr.querySelectorAll('.glass,.stat-card').forEach((el,i) => {
      el.style.animation = 'none';
      el.style.opacity   = '0';
      el.style.transform = 'translateY(20px)';
      setTimeout(() => {
        el.style.transition = `opacity 0.45s ease ${i*0.06}s, transform 0.5s var(--spring) ${i*0.06}s`;
        el.style.opacity    = '';
        el.style.transform  = '';
        requestAnimationFrame(() => { el.style.animation = ''; });
      }, 20);
    });
  }, 30);
}

/* ═══ TOAST ═══ */
function showToast(type, title, msg) {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span>
    <div class="toast-content"><div class="toast-title">${title}</div><div class="toast-msg">${msg}</div></div>
    <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Dismiss">✕</button>`;
  c.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 5000);
}

/* ═══ CONFIRM ═══ */
function confirmDialog(msg, onConfirm) {
  const id = 'confirmDlg';
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div'); el.id = id; el.className = 'modal-backdrop';
    el.innerHTML = `<div class="modal glass" style="max-width:400px">
      <div class="modal-header"><div class="modal-title">⚠️ Confirm Action</div></div>
      <div class="modal-body"><p id="confirmMsg" style="color:var(--text-secondary);font-size:var(--text-sm)"></p></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="confirmNo">Cancel</button>
        <button class="btn btn-danger" id="confirmYes">Confirm</button>
      </div></div>`;
    document.body.appendChild(el);
  }
  document.getElementById('confirmMsg').textContent = msg;
  el.classList.add('show');
  document.getElementById('confirmNo').onclick  = () => el.classList.remove('show');
  document.getElementById('confirmYes').onclick = () => { el.classList.remove('show'); onConfirm(); };
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop.show').forEach(m => m.classList.remove('show'));
    document.querySelectorAll('.dropdown-menu.open').forEach(d => d.classList.remove('open'));
  }
});
