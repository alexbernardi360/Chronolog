export interface TimeLog {
  id?: string;
  created_at?: string,
  updated_at?: string,
  timestamp: string;
  type: 'entry' | 'exit';
  note: string;
}
