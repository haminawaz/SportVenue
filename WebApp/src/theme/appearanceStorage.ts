export type Appearance = 'system' | 'light' | 'dark';

export const APPEARANCE_KEY = 'sportvenue.appearance';

export function isAppearance(v: unknown): v is Appearance {
  return v === 'system' || v === 'light' || v === 'dark';
}

/**
 * Remembers the owner's light/dark choice in this browser. A convenience only:
 * if storage is unavailable the app simply follows the system setting.
 */
export const appearanceStorage = {
  get(): Appearance | null {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(APPEARANCE_KEY) : null;
      return isAppearance(raw) ? raw : null;
    } catch {
      return null;
    }
  },
  set(value: Appearance) {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(APPEARANCE_KEY, value);
    } catch {
      // Storage blocked: the choice lasts for this session only.
    }
  },
};

/**
 * Runs before React hydrates (inlined in the root layout) so the first paint
 * already uses the saved or system scheme instead of flashing light mode.
 */
export const themeBootScript = `(function(){try{var a=localStorage.getItem('${APPEARANCE_KEY}');var d=a==='dark'||((a===null||a==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`;
