import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { catchError, from, map, of } from 'rxjs';
import { TimeLog } from '../domain/time_log.interface';

@Injectable({
  providedIn: 'root',
})
export class TimeLogsService {
  private readonly supabase = createClient(
    import.meta.env.NG_APP_SUPABASE_URL,
    import.meta.env.NG_APP_SUPABASE_KEY,
  );

  getTimeLogs(pageSize: number, currentPage: number) {
    const offset = (currentPage - 1) * pageSize;

    const request = this.supabase
      .from('time_records')
      .select('id,created_at,updated_at,timestamp,type,note')
      .order('timestamp', { ascending: false })
      .range(offset, offset + pageSize - 1);

    return from(request).pipe(
      map((result) => {
        if (result.error) throw result.error;

        return result.data as TimeLog[];
      }),
      catchError((error) => {
        console.error('Error fetching time records:', error);
        return of([] as TimeLog[]);
      }),
    );
  }

  getTimeLogsCount() {
    const request = this.supabase
      .from('time_records')
      .select('*', { count: 'exact', head: true });

    return from(request).pipe(
      map((result) => {
        if (result.error) throw result.error;

        return result.count;
      }),
      catchError((error) => {
        console.error('Error fetching time records:', error);
        return of(null);
      }),
    );
  }

  getTimeLog(id: string) {
    const request = this.supabase
      .from('time_records')
      .select('id,created_at,updated_at,timestamp,type,note')
      .eq('id', id.toLowerCase());

    return from(request).pipe(
      map((result) => {
        if (result.error) throw result.error;

        return (
          result.data.length > 0 ? result.data[0] : null
        ) as TimeLog | null;
      }),
      catchError((error) => {
        console.error('Error fetching time records', error);
        return of(null);
      }),
    );
  }

  createNewTimeLog(timeLog: TimeLog) {
    return this.createNewTimeLogs([timeLog]);
  }

  createNewTimeLogs(timeLogs: TimeLog[]) {
    const request = this.supabase.from('time_records').insert(timeLogs);

    return from(request).pipe(
      map((result) => {
        if (result.error) throw result.error;
      }),
      catchError((error) => {
        console.error('Error creating time records:', error);
        return of();
      }),
    );
  }

  updateNewTimeLog(timeLog: TimeLog) {
    const request = this.supabase
      .from('time_records')
      .update(timeLog)
      .eq('id', timeLog.id);

    return from(request).pipe(
      map((result) => {
        if (result.error) throw result.error;
      }),
      catchError((error) => {
        console.error('Error updating time record:', error);
        return of();
      }),
    );
  }

  deleteTimeLog(id: string) {
    const request = this.supabase.from('time_records').delete().eq('id', id);

    return from(request).pipe(
      map((result) => {
        if (result.error) throw result.error;
      }),
      catchError((error) => {
        console.error('Error deleting time record:', error);
        return of();
      }),
    );
  }
}
