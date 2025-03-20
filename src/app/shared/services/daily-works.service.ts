import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { catchError, from, map, of } from 'rxjs';
import { WorkSummary as DailyWork } from '../domain/daily-work.interface';

@Injectable({
  providedIn: 'root',
})
export class DailyWorksService {
  private readonly supabase = createClient(
    import.meta.env.NG_APP_SUPABASE_URL,
    import.meta.env.NG_APP_SUPABASE_KEY,
  );

  getDailyWorks(pageSize: number, currentPage: number) {
    const offset = (currentPage - 1) * pageSize;

    const request = this.supabase
      .from('daily_works')
      .select('day,total_hours,is_valid')
      .order('day', { ascending: false })
      .range(offset, offset + pageSize - 1);

    return from(request).pipe(
      map((result) => {
        if (result.error) throw result.error;

        return result.data as DailyWork[];
      }),
      catchError((error) => {
        console.error('Error fetching daily works:', error);
        return of([] as DailyWork[]);
      }),
    );
  }

  getDailyWorksCount() {
    const request = this.supabase
      .from('daily_works')
      .select('*', { count: 'exact', head: true });

    return from(request).pipe(
      map((result) => {
        if (result.error) throw result.error;

        return result.count;
      }),
      catchError((error) => {
        console.error('Error fetching daily works:', error);
        return of(null);
      }),
    );
  }
}
