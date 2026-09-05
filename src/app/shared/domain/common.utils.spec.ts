import { beforeEach, describe, expect, it } from 'vitest';
import { getTheme, setTheme } from './common.utils';

describe('common.utils', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to the light theme when nothing was stored', () => {
    expect(getTheme()).toBe('light');
  });

  it('round-trips the stored theme', () => {
    setTheme('dark');
    expect(getTheme()).toBe('dark');

    setTheme('light');
    expect(getTheme()).toBe('light');
  });

  it('persists under the "theme" key', () => {
    setTheme('dark');

    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('falls back to light for a value it does not recognise', () => {
    localStorage.setItem('theme', 'cupcake');

    expect(getTheme()).toBe('light');
  });
});
