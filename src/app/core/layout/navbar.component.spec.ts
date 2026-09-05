import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../shared/services/auth.service';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<NavbarComponent>;

  const links = () =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('a[href]'),
    ).map((a) => ({
      href: a.getAttribute('href'),
      label: a.textContent!.trim(),
    }));

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            getSession: vi.fn().mockResolvedValue({
              data: { session: { user: { email: 'a@example.com' } } },
            }),
            signOut: vi.fn(),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('links the brand and both sections', () => {
    expect(links()).toEqual([
      { href: '/', label: 'Chronolog' },
      { href: '/daily-works', label: 'Daily Works' },
      { href: '/time-logs', label: 'Time Logs' },
    ]);
  });

  it('carries the theme selector and the user menu', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('core-theme-selector')).not.toBeNull();
    expect(host.querySelector('core-user-dropdown')).not.toBeNull();
  });
});
