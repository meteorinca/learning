(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const header = $('[data-header]');
  const menuButton = $('[data-menu-button]');
  const mobileMenu = $('[data-mobile-menu]');

  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  menuButton?.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    mobileMenu.hidden = isOpen;
  });

  $$('.mobile-menu a').forEach(link => link.addEventListener('click', () => {
    mobileMenu.hidden = true;
    menuButton?.setAttribute('aria-expanded', 'false');
  }));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    $$('.reveal').forEach(element => observer.observe(element));
  } else {
    $$('.reveal').forEach(element => element.classList.add('visible'));
  }

  const signalCopy = {
    belief: {
      title: 'Begin with belief and capability.',
      detail: 'Replace the identity claim with a location: find the last step that made sense.',
      target: 'card-belief'
    },
    structure: {
      title: 'Begin with mathematical structure.',
      detail: 'Use pictures, smaller numbers, patterns, and physical meaning before adding more rules.',
      target: 'card-structure'
    },
    evidence: {
      title: 'Begin with the Influence Landscape.',
      detail: 'Compare research categories, question familiar myths, and inspect what may help or harm.',
      target: 'card-evidence'
    },
    ritual: {
      title: 'Begin with the Learning Ritual.',
      detail: 'Fix the desk, the opening routine, the practice loop, and the plan to return.',
      target: 'card-ritual'
    }
  };

  const signalResult = $('[data-signal-result]');
  $$('[data-signal]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.signal;
    const choice = signalCopy[key];
    if (!choice) return;

    $$('[data-signal]').forEach(item => item.classList.toggle('active', item === button));
    $$('[data-resource-card]').forEach(card => card.classList.toggle('recommended', card.dataset.resourceCard === key));

    if (signalResult) {
      signalResult.innerHTML = `<span class="result-dot"></span><p><strong>${choice.title}</strong><br>${choice.detail}</p>`;
    }

    window.setTimeout(() => {
      document.getElementById(choice.target)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 260);
  }));

  $$('[data-role]').forEach(button => button.addEventListener('click', () => {
    const role = button.dataset.role;
    $$('[data-role]').forEach(tab => {
      const active = tab === button;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    $$('[data-role-panel]').forEach(panel => {
      panel.hidden = panel.dataset.rolePanel !== role;
    });
  }));

  const dotTooltip = $('[data-dot-tooltip]');
  $$('.dot[data-dot-label]').forEach(dot => {
    const showLabel = () => {
      if (dotTooltip) dotTooltip.textContent = dot.dataset.dotLabel || '';
    };
    dot.addEventListener('click', showLabel);
    dot.addEventListener('mouseenter', showLabel);
    dot.addEventListener('focus', showLabel);
  });

  const checklist = $('[data-checklist]');
  const checklistInputs = checklist ? $$('input[type="checkbox"]', checklist) : [];
  const progress = $('[data-reset-progress]');
  const storageKey = 'moementum-learning-reset';

  const safeStorage = {
    get() {
      try { return window.localStorage.getItem(storageKey); } catch { return null; }
    },
    set(value) {
      try { window.localStorage.setItem(storageKey, value); } catch { /* Saving is optional. */ }
    }
  };

  const renderChecklist = () => {
    const states = checklistInputs.map(input => input.checked);
    const completed = states.filter(Boolean).length;
    if (progress) progress.textContent = `${completed} of ${states.length}`;
    safeStorage.set(JSON.stringify(states));
  };

  try {
    const saved = JSON.parse(safeStorage.get() || '[]');
    checklistInputs.forEach((input, index) => { input.checked = Boolean(saved[index]); });
  } catch {
    checklistInputs.forEach(input => { input.checked = false; });
  }

  checklistInputs.forEach(input => input.addEventListener('change', renderChecklist));
  $('[data-reset-list]')?.addEventListener('click', () => {
    checklistInputs.forEach(input => { input.checked = false; });
    renderChecklist();
  });
  renderChecklist();
})();
