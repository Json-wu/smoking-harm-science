/** 用户手动主题偏好；未设置时跟随 prefers-color-scheme。 */
export const THEME_STORAGE_KEY = 'site-theme';

export type ThemePreference = 'light' | 'dark';

export function getStoredTheme(): ThemePreference | null {
  if (typeof localStorage === 'undefined') return null;
  const value = localStorage.getItem(THEME_STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : null;
}

export function getSystemTheme(): ThemePreference {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getEffectiveTheme(): ThemePreference {
  return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(preference: ThemePreference | null) {
  const root = document.documentElement;
  if (preference) {
    root.setAttribute('data-theme', preference);
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } else {
    root.removeAttribute('data-theme');
    localStorage.removeItem(THEME_STORAGE_KEY);
  }
  updateThemeColorMeta(preference ?? getSystemTheme());
}

function updateThemeColorMeta(theme: ThemePreference) {
  const meta = document.getElementById('meta-theme-color');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#f0fdf9');
}

export function toggleTheme() {
  const next: ThemePreference = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

export function resetThemeToSystem() {
  applyTheme(null);
}
