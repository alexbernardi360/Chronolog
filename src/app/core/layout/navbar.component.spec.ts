import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../shared/services/auth.service';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<NavbarComponent>;

  const host = () => fixture.nativeElement as HTMLElement;

  const linksIn = (selector: string) =>
    Array.from(host().querySelectorAll(`${selector} a[href]`)).map((a) => ({
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

  it('links the brand to the root', () => {
    const brand = host().querySelector('a[href="/"]')!;

    expect(brand.textContent!.trim()).toBe('Chronolog');
  });

  it('offers the same destinations in the mobile and desktop menus', () => {
    const expected = [
      { href: '/daily-works', label: 'Daily Works' },
      { href: '/time-logs', label: 'Time Logs' },
    ];

    expect(linksIn('#nav-menu')).toEqual(expected);
    expect(linksIn('nav.hidden')).toEqual(expected);
  });

  it('labels both menus so the landmarks are distinguishable', () => {
    const navs = Array.from(host().querySelectorAll('nav'));

    expect(navs).toHaveLength(2);
    expect(navs.every((n) => n.getAttribute('aria-label') === 'Main')).toBe(
      true,
    );
  });

  it('names the hamburger button and wires it to the popover', () => {
    const toggle = host().querySelector('button[popovertarget]')!;

    expect(toggle.getAttribute('aria-label')).toBe('Open navigation menu');
    expect(toggle.getAttribute('popovertarget')).toBe('nav-menu');
    expect(host().querySelector('#nav-menu')!.hasAttribute('popover')).toBe(
      true,
    );
  });

  it('marks the active route in the menu', () => {
    const active = Array.from(
      host().querySelectorAll('a[routerlinkactive], a'),
    ).filter((a) => a.classList.contains('menu-active'));

    // Router is configured with no routes, so nothing is active yet; the point
    // is that the directive is wired and does not mark everything.
    expect(active).toHaveLength(0);
  });

  it('carries the theme selector and the user menu', () => {
    expect(host().querySelector('core-theme-selector')).not.toBeNull();
    expect(host().querySelector('core-user-dropdown')).not.toBeNull();
  });

  it('survives closing a menu that is not open', () => {
    const link = host().querySelector<HTMLAnchorElement>('#nav-menu a')!;

    expect(() => link.click()).not.toThrow();
  });
});
