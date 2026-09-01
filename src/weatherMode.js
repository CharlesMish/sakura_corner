const WEATHER_MODES = new Set(['clear', 'wet', 'rain']);
const RAIN_STYLES = new Set(['dash', 'pixel', 'dense']);

let resolvedMode;
let resolvedRainStyle;

export function getWeatherMode() {
  if (resolvedMode) return resolvedMode;
  resolvedMode = parseWeatherMode();
  return resolvedMode;
}

export function getRainStyle() {
  if (resolvedRainStyle) return resolvedRainStyle;
  resolvedRainStyle = parseRainStyle();
  return resolvedRainStyle;
}

export function weatherIsWet(mode = getWeatherMode()) {
  return mode === 'wet' || mode === 'rain';
}

function parseWeatherMode() {
  if (typeof window === 'undefined') return 'clear';
  const value = new URLSearchParams(window.location.search).get('weather');
  if (WEATHER_MODES.has(value)) return value;
  return 'rain';
}

function parseRainStyle() {
  if (typeof window === 'undefined') return 'dense';
  const value = new URLSearchParams(window.location.search).get('rain');
  return RAIN_STYLES.has(value) ? value : 'dense';
}
