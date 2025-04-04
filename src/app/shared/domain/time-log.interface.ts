export type EntryType = 'entry' | 'exit';

export interface TimeLog {
  id?: string;
  created_at?: string,
  updated_at?: string,
  timestamp: string;
  type: EntryType;
  note: (string | null);
}
