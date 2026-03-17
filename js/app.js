/* ============================================
   SETTLE CLT — App Initialization
   Theme toggle, scroll animations, utilities
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initScrollAnimations();
  initNavbarScroll();
  initChecklistPreview();
});

/* ── Theme Toggle ── */
function initTheme() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  const savedTheme = localStorage.getItem('settle-clt-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('settle-clt-theme', next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  const knob = document.querySelector('.theme-toggle__knob');
  if (knob) {
    knob.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
}

/* ── Scroll Animations ── */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  elements.forEach((el) => observer.observe(el));
}

/* ── Navbar Scroll Effect ── */
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    if (currentScroll > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  }, { passive: true });
}

/* ── Checklist Preview Interaction ── */
function initChecklistPreview() {
  const items = document.querySelectorAll('.checklist-item');
  items.forEach((item) => {
    item.addEventListener('click', () => {
      item.classList.toggle('done');
      const check = item.querySelector('.checklist-item__check');
      if (check) {
        check.textContent = item.classList.contains('done') ? '✓' : '';
      }
    });
  });
}

/* ── Smooth Scroll ── */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;

    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
