import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { EntryType } from '../../domain/time-log.interface';
import { EntryTypeBadgeComponent } from './entry-type-badge.component';

describe('EntryTypeBadgeComponent', () => {
  let fixture: ComponentFixture<EntryTypeBadgeComponent>;

  const badge = () =>
    fixture.nativeElement.querySelector('div') as HTMLDivElement;

  function setType(type: EntryType) {
    fixture.componentRef.setInput('type', type);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EntryTypeBadgeComponent] });
    fixture = TestBed.createComponent(EntryTypeBadgeComponent);
  });

  it('renders an entry as a success badge', () => {
    setType('entry');

    expect(badge().textContent!.trim()).toBe('entry');
    expect(badge().classList.contains('badge-success')).toBe(true);
    expect(badge().classList.contains('badge-error')).toBe(false);
  });

  it('renders an exit as an error badge', () => {
    setType('exit');

    expect(badge().textContent!.trim()).toBe('exit');
    expect(badge().classList.contains('badge-error')).toBe(true);
    expect(badge().classList.contains('badge-success')).toBe(false);
  });

  it('swaps the colour when the type changes', () => {
    setType('entry');
    setType('exit');

    expect(badge().classList.contains('badge-success')).toBe(false);
    expect(badge().classList.contains('badge-error')).toBe(true);
  });
});
