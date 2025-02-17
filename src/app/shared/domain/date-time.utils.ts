export function getTodayAtTime(hours: number, minutes: number): Date {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
  );
}

export function toLocalDateOnlyString(date: Date): string {
  return (
    date.getFullYear().toString() +
    '-' +
    ('0' + (date.getMonth() + 1)).slice(-2) +
    '-' +
    ('0' + date.getDate()).slice(-2)
  );
}

export function toLocalTimeString(date: Date): string {
  return (
    ('0' + date.getHours()).slice(-2) +
    ':' +
    ('0' + date.getMinutes()).slice(-2)
  );
}

export function toLocalDateString(date: Date): string {
  return toLocalDateOnlyString(date) + 'T' + toLocalTimeString(date);
}
