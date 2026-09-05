import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { IconComponent, IconName } from './icon.component';

describe('IconComponent', () => {
  let fixture: ComponentFixture<IconComponent>;

  const svg = () =>
    (fixture.nativeElement as HTMLElement).querySelector('svg')!;

  function render(name: IconName) {
    fixture.componentRef.setInput('name', name);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [IconComponent] });
    fixture = TestBed.createComponent(IconComponent);
  });

  it('draws the shapes in the SVG namespace', () => {
    render('edit');

    // Guards the @switch-inside-<svg> template: an HTML-namespaced <path>
    // renders nothing at all.
    const path = svg().querySelector('path')!;
    expect(svg().namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(path.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(path.getAttribute('d')).toMatch(/^M3 17\.25V21/);
  });

  it('hides itself from assistive technology', () => {
    render('delete');

    expect(svg().getAttribute('aria-hidden')).toBe('true');
    expect(svg().getAttribute('focusable')).toBe('false');
  });

  it('fills the icons that are drawn as solid shapes', () => {
    render('delete');

    expect(svg().getAttribute('fill')).toBe('currentColor');
    expect(svg().getAttribute('stroke')).toBeNull();
  });

  it('strokes every other icon', () => {
    render('menu');

    expect(svg().getAttribute('fill')).toBe('none');
    expect(svg().getAttribute('stroke')).toBe('currentColor');
    expect(svg().getAttribute('stroke-width')).toBe('2');
  });

  it('swaps the shape when the name changes', () => {
    render('menu');
    const menu = svg().querySelector('path')!.getAttribute('d');

    render('plus');

    expect(svg().querySelector('path')!.getAttribute('d')).not.toBe(menu);
    expect(svg().querySelector('path')!.getAttribute('d')).toBe(
      'M12 4v16m8-8H4',
    );
  });

  it('renders the multi-shape icons whole', () => {
    render('mail');

    expect(svg().querySelector('rect')).not.toBeNull();
    expect(svg().querySelector('path')).not.toBeNull();
  });
});
