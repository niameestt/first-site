document.addEventListener('DOMContentLoaded', () => {
  const FAVORITES_STORAGE_KEY = 'aegis_core_favorites_v1';

  // =========================================================
  // 1. VIEW NAVIGATION (HOME / CONTACT / AUTH)
  // =========================================================
  const views = {
    home: document.getElementById('view-home'),
    contact: document.getElementById('view-contact'),
    auth: document.getElementById('view-auth')
  };

  const navButtons = document.querySelectorAll('.nav-link');
  const mobileNav = document.getElementById('mobile-nav');
  const menuToggle = document.getElementById('menu-toggle');

  function setActiveView(viewName) {
    if (!views[viewName]) return;

    Object.entries(views).forEach(([key, el]) => {
      if (!el) return;
      el.classList.toggle('is-visible', key === viewName);
    });

    navButtons.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.view === viewName);
    });

    if (mobileNav && menuToggle) {
      mobileNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    refreshVisibleSections();
  }

  document.querySelectorAll('[data-view]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const targetView = el.dataset.view;
      if (!targetView) return;
      if (el.tagName === 'A') {
        e.preventDefault();
      }
      setActiveView(targetView);
    });
  });

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // =========================================================
  // 2. BOTTOM-RIGHT BUTTON TO SCROLL TO HEADER
  // =========================================================
  const scrollTopBtn = document.getElementById('scroll-top-btn');
  const headerEl = document.getElementById('site-header');

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      if (headerEl) {
        headerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // =========================================================
  // 3. SECTION ENTRANCE EFFECTS (INTERSECTION OBSERVER)
  // =========================================================
  const revealSections = document.querySelectorAll('.reveal-section');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inview');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  revealSections.forEach((section) => observer.observe(section));

  function refreshVisibleSections() {
    revealSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92) {
        section.classList.add('is-inview');
      }
    });
  }

  // =========================================================
  // 4. SERVICES FILTER & FAVORITES ON CARD IMAGE
  // =========================================================
  const filterButtons = document.querySelectorAll('.filter-btn');
  const serviceCards = document.querySelectorAll('.service-card');

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      filterButtons.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      serviceCards.forEach((card) => {
        const matches = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-hidden', !matches);
      });
    });
  });

  function loadFavorites() {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveFavorites(list) {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Ignore storage quota / privacy mode issues
    }
  }

  let favorites = loadFavorites();
  const favButtons = document.querySelectorAll('.fav-btn');
  const favCounter = document.getElementById('fav-counter');

  function syncFavoriteUI() {
    favButtons.forEach((btn) => {
      const id = btn.dataset.favId;
      const active = favorites.includes(id);
      btn.classList.toggle('is-favorite', active);
      btn.setAttribute('aria-pressed', String(active));

      const labelEl = btn.querySelector('.fav-label');
      if (labelEl) {
        labelEl.textContent = active ? 'შენახულია' : 'ფავორიტი';
      }
    });

    if (favCounter) {
      favCounter.textContent = `ფავორიტები: ${favorites.length}`;
    }
  }

  favButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.favId;
      if (!id) return;

      if (favorites.includes(id)) {
        favorites = favorites.filter((item) => item !== id);
      } else {
        favorites.push(id);
      }

      saveFavorites(favorites);
      syncFavoriteUI();
    });
  });

  syncFavoriteUI();

  // =========================================================
  // 5. READINESS CHECKER (SECTION 3)
  // =========================================================
  const teamRange = document.getElementById('team-size');
  const teamSizeValue = document.getElementById('team-size-value');
  const chkMfa = document.getElementById('chk-mfa');
  const chkBackup = document.getElementById('chk-backup');
  const chkLeast = document.getElementById('chk-least');
  const chkPatch = document.getElementById('chk-patch');

  const scoreEl = document.getElementById('readiness-score');
  const statusEl = document.getElementById('readiness-status');
  const adviceEl = document.getElementById('readiness-advice');

  function updateReadiness() {
    if (!teamRange || !scoreEl || !statusEl || !adviceEl) return;

    const teamSize = Number(teamRange.value);
    if (teamSizeValue) {
      teamSizeValue.textContent = String(teamSize);
    }

    let score = 20;
    if (chkMfa && chkMfa.checked) score += 25;
    if (chkBackup && chkBackup.checked) score += 20;
    if (chkLeast && chkLeast.checked) score += 20;
    if (chkPatch && chkPatch.checked) score += 15;

    if (teamSize >= 100 && (!chkMfa || !chkMfa.checked)) {
      score -= 10;
    }

    score = Math.max(10, Math.min(100, score));
    scoreEl.textContent = `${score}%`;

    if (score >= 80) {
      statusEl.textContent = 'გამართული საბაზისო დონე';
      adviceEl.textContent = 'ძირითადი კონტროლები ჩართულია. შემდეგი ნაბიჯია აპლიკაციის და API-ს პერიოდული ტესტირება.';
    } else if (score >= 55) {
      statusEl.textContent = 'საშუალო მზაობა — საჭიროა დაზუსტება';
      adviceEl.textContent = 'გადაამოწმეთ მინიმალური პრივილეგიების წესი და სერვერების განახლების გეგმა.';
    } else {
      statusEl.textContent = 'მაღალი რისკი — სწრაფი მოქმედებაა საჭირო';
      adviceEl.textContent = 'პირველ რიგში ჩართეთ 2FA/MFA, გადაამოწმეთ სარეზერვო ასლები და დაგეგმეთ აუდიტი.';
    }
  }

  [teamRange, chkMfa, chkBackup, chkLeast, chkPatch].forEach((input) => {
    if (input) {
      input.addEventListener('input', updateReadiness);
      input.addEventListener('change', updateReadiness);
    }
  });

  updateReadiness();

  // =========================================================
  // 6. CONTACT & LOGIN / REGISTER FORMS
  // =========================================================
  const contactForm = document.getElementById('contact-form');
  const contactFeedback = document.getElementById('contact-feedback');

  if (contactForm && contactFeedback) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      contactFeedback.textContent = 'მოთხოვნა მიღებულია. დეტალების დასაზუსტებლად მალე დაგიკავშირდებით.';
      contactForm.reset();
    });
  }

  const authTabs = document.querySelectorAll('.auth-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const authFeedback = document.getElementById('auth-feedback');

  authTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.authMode;
      authTabs.forEach((t) => t.classList.toggle('is-active', t === tab));

      if (loginForm) loginForm.classList.toggle('is-active', mode === 'login');
      if (registerForm) registerForm.classList.toggle('is-active', mode === 'register');
      if (authFeedback) authFeedback.textContent = '';
    });
  });

  if (loginForm && authFeedback) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email')?.value || '';
      authFeedback.textContent = `შესვლა დადასტურდა ანგარიშისთვის: ${email}`;
      loginForm.reset();
    });
  }

  if (registerForm && authFeedback) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name')?.value || '';
      authFeedback.textContent = `ანგარიში შეიქმნა (${name}). შეგიძლიათ გააგრძელოთ მუშაობა.`;
      registerForm.reset();
    });
  }
});