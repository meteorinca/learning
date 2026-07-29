(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const header = $('[data-header]');
  const menuButton = $('[data-menu-button]');
  const mobileMenu = $('[data-mobile-menu]');

  const setHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);
  setHeader();
  window.addEventListener('scroll', setHeader, { passive: true });

  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    mobileMenu.hidden = open;
  });

  $$('.mobile-menu a').forEach(link => link.addEventListener('click', () => {
    mobileMenu.hidden = true;
    menuButton?.setAttribute('aria-expanded', 'false');
  }));

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(element => revealObserver.observe(element));

  const tips = {
    perseverance: '“Show me the last step that still made sense.”',
    curiosity: '“What exact part changed from clear to confusing?”',
    ingenuity: '“Can we draw it, build it, or try smaller numbers?”'
  };
  const toast = $('[data-tip-toast]');
  let toastTimer;
  $$('[data-tip]').forEach(button => button.addEventListener('click', () => {
    if (!toast) return;
    toast.textContent = tips[button.dataset.tip] || '';
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3600);
  }));

  const storageKey = name => `learning-ritual-${name}`;
  const safeStorage = {
    get(key) {
      try { return window.localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); } catch { /* Persistence is optional. */ }
    }
  };

  function setupChecklist(name) {
    const root = document.querySelector(`[data-checklist="${name}"]`);
    if (!root) return;
    const inputs = $$('input[type="checkbox"]', root);
    let saved = [];
    try { saved = JSON.parse(safeStorage.get(storageKey(name)) || '[]'); } catch { saved = []; }
    inputs.forEach((input, index) => { input.checked = Boolean(saved[index]); });

    const update = () => {
      const states = inputs.map(input => input.checked);
      safeStorage.set(storageKey(name), JSON.stringify(states));
      const completed = states.filter(Boolean).length;
      const percent = Math.round((completed / states.length) * 100);

      if (name === 'ritual') {
        const ring = $('[data-ring]');
        const progress = $('.ring-progress', ring);
        const text = $('[data-ring-text]', ring);
        const circumference = 113.1;
        if (progress) progress.style.strokeDashoffset = String(circumference * (1 - percent / 100));
        if (text) text.textContent = `${percent}%`;
        ring?.setAttribute('aria-label', `Ritual completion: ${percent} percent`);
      }

      if (name === 'zoom') {
        const badge = $('[data-ready-badge]');
        const ready = completed === states.length;
        if (badge) {
          badge.textContent = ready ? 'Ready to learn' : `${completed}/${states.length} ready`;
          badge.classList.toggle('ready', ready);
        }
      }
    };

    inputs.forEach(input => input.addEventListener('change', update));
    document.querySelector(`[data-reset="${name}"]`)?.addEventListener('click', () => {
      inputs.forEach(input => { input.checked = false; });
      update();
    });
    update();
  }

  setupChecklist('ritual');
  setupChecklist('zoom');

  const kelvin = $('[data-kelvin]');
  const kelvinOutput = $('[data-kelvin-output]');
  const bulb = $('[data-bulb]');
  const bulbGlow = bulb ? $('.bulb-glow', bulb) : null;
  const lightVerdict = $('[data-light-verdict]');

  function kelvinToRgb(kelvinValue) {
    let temp = kelvinValue / 100;
    let red;
    let green;
    let blue;

    if (temp <= 66) {
      red = 255;
      green = 99.4708025861 * Math.log(temp) - 161.1195681661;
      blue = temp <= 19 ? 0 : 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
    } else {
      red = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
      green = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
      blue = 255;
    }

    const clamp = value => Math.max(0, Math.min(255, Math.round(value)));
    return `rgb(${clamp(red)}, ${clamp(green)}, ${clamp(blue)})`;
  }

  function updateLight() {
    if (!kelvin) return;
    const value = Number(kelvin.value);
    if (kelvinOutput) kelvinOutput.textContent = `${value} K`;
    if (bulbGlow) bulbGlow.style.background = kelvinToRgb(value);

    let title = 'Comfortable study light';
    let detail = 'Good for a normal daytime session.';
    if (value < 3500) {
      title = 'Calm evening light';
      detail = 'Comfortable near bedtime, but less alerting for demanding daytime work.';
    } else if (value >= 5500) {
      title = 'Alert daytime light';
      detail = 'Useful for focused daytime work. Reduce bright, cool light late at night.';
    }
    if (lightVerdict) lightVerdict.innerHTML = `<strong>${title}</strong><span>${detail}</span>`;
  }
  kelvin?.addEventListener('input', updateLight);
  updateLight();

  const loopContent = {
    1: ['Step 1: Recall', 'Close the notes and retrieve.', 'Write everything remembered, answer a question, sketch the system, or explain yesterday\'s idea before reopening the material.'],
    2: ['Step 2: Attempt', 'Try before receiving the path.', 'A real attempt exposes the missing fact or connection. Even a wrong start gives the teacher useful evidence.'],
    3: ['Step 3: Feedback', 'Correct the exact error.', 'Do not merely copy the right answer. Compare the attempt with the solution and name where the reasoning changed.'],
    4: ['Step 4: Explain', 'Make the idea simple enough to teach.', 'Use words, a diagram, an analogy, or an example. Explanation reveals whether separate steps have become one connected idea.'],
    5: ['Step 5: Return', 'Come back after some forgetting.', 'Revisit the idea tomorrow, later this week, and again next week. Spacing makes retrieval difficult enough to strengthen memory.']
  };
  const loopExplanation = $('[data-loop-explanation]');
  $$('[data-loop]').forEach(button => button.addEventListener('click', () => {
    $$('[data-loop]').forEach(item => item.classList.toggle('active', item === button));
    const [label, title, body] = loopContent[button.dataset.loop];
    if (loopExplanation) {
      loopExplanation.animate([{ opacity: .35, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 250 });
      loopExplanation.innerHTML = `<p class="card-label">${label}</p><h3>${title}</h3><p>${body}</p>`;
    }
  }));

  $$('[data-role]').forEach(button => button.addEventListener('click', () => {
    const role = button.dataset.role;
    $$('[data-role]').forEach(tab => {
      const active = tab === button;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    $$('[data-role-panel]').forEach(panel => { panel.hidden = panel.dataset.rolePanel !== role; });
  }));

  $$('[data-print]').forEach(button => button.addEventListener('click', () => window.print()));

  const timeDisplay = $('[data-time]');
  const timerState = $('[data-timer-state]');
  const timerButton = $('[data-timer-button]');
  const timerReset = $('[data-timer-reset]');
  const timerProgress = $('.timer-progress', $('[data-timer]'));
  const missionInput = $('[data-mission]');
  const modal = $('[data-modal]');
  const modalMission = $('[data-modal-mission]');

  let selectedMinutes = 15;
  let totalSeconds = selectedMinutes * 60;
  let remainingSeconds = totalSeconds;
  let timerId = null;
  let endTime = null;

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function renderTimer() {
    if (timeDisplay) timeDisplay.textContent = formatTime(remainingSeconds);
    const circumference = 603.2;
    const fraction = totalSeconds ? 1 - remainingSeconds / totalSeconds : 0;
    if (timerProgress) timerProgress.style.strokeDashoffset = String(circumference * fraction);
    document.title = timerId ? `${formatTime(remainingSeconds)} | Study Sprint` : 'The Learning Ritual | A STEM Study Guide';
  }

  function stopTimer() {
    window.clearInterval(timerId);
    timerId = null;
    endTime = null;
  }

  function resetTimer() {
    stopTimer();
    totalSeconds = selectedMinutes * 60;
    remainingSeconds = totalSeconds;
    if (timerState) timerState.textContent = 'Ready';
    if (timerButton) timerButton.textContent = 'Begin';
    renderTimer();
  }

  function completeTimer() {
    stopTimer();
    remainingSeconds = 0;
    renderTimer();
    if (timerState) timerState.textContent = 'Complete';
    if (timerButton) timerButton.textContent = 'Again';
    const mission = missionInput?.value.trim();
    if (modalMission) modalMission.textContent = mission
      ? `Mission: “${mission}” Now, without looking, write the most important thing learned.`
      : 'Without looking, write the most important thing learned during this sprint.';
    if (modal) {
      modal.hidden = false;
      document.body.classList.add('modal-open');
      $('[data-modal-close]', modal)?.focus();
    }
  }

  function tick() {
    if (!endTime) return;
    remainingSeconds = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    renderTimer();
    if (remainingSeconds <= 0) completeTimer();
  }

  timerButton?.addEventListener('click', () => {
    if (remainingSeconds === 0) resetTimer();
    if (timerId) {
      stopTimer();
      if (timerState) timerState.textContent = 'Paused';
      timerButton.textContent = 'Continue';
      return;
    }
    endTime = Date.now() + remainingSeconds * 1000;
    timerId = window.setInterval(tick, 250);
    if (timerState) timerState.textContent = 'Focus';
    timerButton.textContent = 'Pause';
    tick();
  });

  timerReset?.addEventListener('click', resetTimer);
  $$('[data-minutes]').forEach(button => button.addEventListener('click', () => {
    selectedMinutes = Number(button.dataset.minutes);
    $$('[data-minutes]').forEach(item => item.classList.toggle('active', item === button));
    resetTimer();
  }));

  $$('[data-modal-close]').forEach(button => button.addEventListener('click', () => {
    if (modal) modal.hidden = true;
    document.body.classList.remove('modal-open');
  }));
  modal?.addEventListener('click', event => {
    if (event.target === modal) {
      modal.hidden = true;
      document.body.classList.remove('modal-open');
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal && !modal.hidden) {
      modal.hidden = true;
      document.body.classList.remove('modal-open');
    }
  });

  renderTimer();
})();
