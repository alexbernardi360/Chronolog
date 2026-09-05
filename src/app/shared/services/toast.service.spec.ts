import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  const messages = () => service.toasts().map((t) => t.message);

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts empty', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('queues toasts in the order they arrive', () => {
    service.success('Saved');
    service.error('Failed');

    expect(messages()).toEqual(['Saved', 'Failed']);
  });

  it('tags each toast with the type of its helper', () => {
    service.success('a');
    service.error('b');
    service.info('c');
    service.warning('d');

    expect(service.toasts().map((t) => t.type)).toEqual([
      'success',
      'error',
      'info',
      'warning',
    ]);
  });

  it('gives every toast a distinct id, even for the same message', () => {
    service.success('Saved');
    service.success('Saved');

    const ids = service.toasts().map((t) => t.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('dismisses itself after the default delay', () => {
    service.success('Saved');

    vi.advanceTimersByTime(3999);
    expect(messages()).toEqual(['Saved']);

    vi.advanceTimersByTime(1);
    expect(messages()).toEqual([]);
  });

  it('honours a custom duration', () => {
    service.info('Slow', 10_000);

    vi.advanceTimersByTime(4000);
    expect(messages()).toEqual(['Slow']);

    vi.advanceTimersByTime(6000);
    expect(messages()).toEqual([]);
  });

  it('keeps a zero-duration toast up indefinitely', () => {
    service.error('Sticky', 0);

    vi.advanceTimersByTime(60_000);

    expect(messages()).toEqual(['Sticky']);
  });

  it('removes only the dismissed toast', () => {
    const first = service.success('a');
    service.success('b');

    service.dismiss(first);

    expect(messages()).toEqual(['b']);
  });

  it('ignores a dismissal of an unknown id', () => {
    service.success('a');

    service.dismiss(999);

    expect(messages()).toEqual(['a']);
  });

  it('cancels the timer of a manually dismissed toast', () => {
    const id = service.success('a');
    service.dismiss(id);
    service.success('b', 0);

    // Would wipe 'b' too if the first timer were still pending and the queue
    // were replaced wholesale rather than filtered.
    vi.advanceTimersByTime(10_000);

    expect(messages()).toEqual(['b']);
  });

  it('drops everything on clear', () => {
    service.success('a');
    service.error('b');

    service.clear();

    expect(messages()).toEqual([]);
    vi.advanceTimersByTime(10_000);
    expect(messages()).toEqual([]);
  });
});
