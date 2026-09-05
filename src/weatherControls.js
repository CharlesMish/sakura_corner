const WEATHER_CHOICES = [
  ['rain', 'Rain'],
  ['wet', 'After rain'],
  ['clear', 'Clear'],
  ['snow', 'Snow'],
];

// The URL owns weather preferences so bookmarks and browser history agree.
export function createWeatherControls({ weather }) {
  const transition = document.querySelector('#scene-transition');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = new AbortController();
  const { signal } = listeners;
  let navigating = false;
  let navigationTimer;
  let revealed = false;

  const controls = document.createElement('aside');
  controls.className = 'weather-controls';
  controls.setAttribute('aria-label', 'Scene weather');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'weather-toggle';
  toggle.setAttribute('aria-label', 'Change weather');
  toggle.setAttribute('aria-controls', 'weather-panel');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-haspopup', 'dialog');
  toggle.title = 'Change weather';
  toggle.innerHTML = '<span class="weather-dot" aria-hidden="true"></span>';

  const panel = document.createElement('div');
  panel.id = 'weather-panel';
  panel.className = 'weather-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'weather-heading');
  panel.innerHTML = '<h2 id="weather-heading">Weather</h2>';

  const choices = document.createElement('div');
  choices.className = 'weather-choices';
  for (const [value, label] of WEATHER_CHOICES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset.weatherChoice = value;
    button.setAttribute('aria-pressed', String(weather === value));
    button.addEventListener('click', () => {
      if (navigating) return;
      if (weather === value) {
        closePanel();
        return;
      }
      const destination = new URL(window.location.href);
      destination.searchParams.set('weather', value);
      navigate(destination);
    }, { signal });
    choices.append(button);
  }
  panel.append(choices);

  if (weather === 'wet') {
    const label = document.createElement('label');
    label.className = 'weather-firefly';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'firefly';
    checkbox.checked = new URLSearchParams(window.location.search).get('firefly') === '1';
    checkbox.addEventListener('change', () => {
      if (navigating) return;
      const destination = new URL(window.location.href);
      if (checkbox.checked) destination.searchParams.set('firefly', '1');
      else destination.searchParams.delete('firefly');
      navigate(destination);
    }, { signal });
    label.append(checkbox, document.createTextNode('Firefly'));
    panel.append(label);
  }

  controls.append(panel, toggle);
  document.body.append(controls);

  function closePanel({ returnFocus = true } = {}) {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) toggle.focus({ preventScroll: true });
  }

  function navigate(destination) {
    if (navigating) return;
    navigating = true;
    closePanel();
    controls.inert = true;
    document.querySelector('#app').inert = true;
    transition.dataset.state = 'leaving';
    document.documentElement.dataset.sceneReady = 'false';
    navigationTimer = window.setTimeout(() => {
      window.location.assign(destination.href);
    }, motionPreference.matches ? 0 : 180);
  }

  toggle.addEventListener('click', () => {
    if (navigating) return;
    if (!panel.hidden) {
      closePanel();
      return;
    }
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    choices.querySelector('[aria-pressed="true"]').focus({ preventScroll: true });
  }, { signal });

  // Consume the dismissing press before the canvas can release petals.
  document.addEventListener('pointerdown', (event) => {
    if (panel.hidden || controls.contains(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closePanel();
  }, { capture: true, signal });

  controls.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || panel.hidden) return;
    event.preventDefault();
    event.stopPropagation();
    closePanel();
  }, { signal });

  controls.addEventListener('focusout', (event) => {
    if (controls.contains(event.relatedTarget)) return;
    closePanel({ returnFocus: false });
  }, { signal });

  // pagehide disposes the scene interaction, including when entering bfcache.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) window.location.reload();
  }, { signal });

  return {
    // Invoke after all bundled textures have loaded and a scene frame rendered.
    reveal() {
      if (revealed || navigating) return;
      revealed = true;
      transition.dataset.state = 'ready';
      document.documentElement.dataset.sceneReady = 'true';
    },
    dispose() {
      listeners.abort();
      window.clearTimeout(navigationTimer);
      controls.remove();
    },
  };
}
