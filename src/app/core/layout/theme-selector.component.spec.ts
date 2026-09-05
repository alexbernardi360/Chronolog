import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import {
  MockInstance,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { ThemeSelectorComponent } from './theme-selector.component';

describe('ThemeSelectorComponent', () => {
  let updateTag: MockInstance<Meta['updateTag']>;
  let fixture: ComponentFixture<ThemeSelectorComponent>;
  let selector: ThemeSelectorComponent;

  const checkbox = () =>
    (fixture.nativeElement as HTMLElement).querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;

  const appliedTheme = () =>
    document.documentElement.getAttribute('data-theme');

  /** Creates the component, which reads the persisted theme eagerly. */
  function render() {
    fixture = TestBed.createComponent(ThemeSelectorComponent);
    selector = fixture.componentInstance;
    updateTag = vi.spyOn(TestBed.inject(Meta), 'updateTag');
    fixture.detectChanges(); // runs ngOnInit
  }

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({ imports: [ThemeSelectorComponent] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.removeAttribute('data-theme');
  });

  it('starts from the light theme when nothing is stored', () => {
    render();

    expect(selector.theme).toBe('light');
    expect(appliedTheme()).toBe('light');
    expect(checkbox().checked).toBe(true);
  });

  it('restores the persisted theme on init', () => {
    localStorage.setItem('theme', 'dark');

    render();

    expect(selector.theme).toBe('dark');
    expect(appliedTheme()).toBe('dark');
    expect(checkbox().checked).toBe(false);
  });

  it('mirrors the theme into the theme-color meta tag', () => {
    render();

    expect(updateTag).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'theme-color' }),
    );
  });

  it('flips light to dark and back', () => {
    render();

    selector.toggleTheme();
    expect(selector.theme).toBe('dark');
    expect(appliedTheme()).toBe('dark');

    selector.toggleTheme();
    expect(selector.theme).toBe('light');
    expect(appliedTheme()).toBe('light');
  });

  it('persists the theme so the next visit keeps it', () => {
    render();

    selector.toggleTheme();

    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('refreshes the meta tag on every toggle', () => {
    render();
    updateTag.mockClear();

    selector.toggleTheme();

    expect(updateTag).toHaveBeenCalledTimes(1);
  });

  it('toggles from the checkbox', () => {
    render();

    checkbox().click();
    fixture.detectChanges();

    expect(selector.theme).toBe('dark');
    expect(checkbox().checked).toBe(false);
  });
});
