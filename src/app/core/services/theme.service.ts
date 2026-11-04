import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme_mode';

/**
 * Light / dark appearance. "System" follows the device setting; the choice
 * is remembered on this device only.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly mode = signal<ThemeMode>(this.read());

  constructor() {
    effect(() => {
      const root = this.document.documentElement;
      root.classList.toggle('theme-light', this.mode() === 'light');
      root.classList.toggle('theme-dark', this.mode() === 'dark');
    });
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Storage unavailable: the choice lasts for this session only.
    }
  }

  private read(): ThemeMode {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'light' || saved === 'dark' ? saved : 'system';
    } catch {
      return 'system';
    }
  }
}
