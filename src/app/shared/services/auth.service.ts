// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase = createClient(
    import.meta.env.NG_APP_SUPABASE_URL,
    import.meta.env.NG_APP_SUPABASE_KEY
  );

  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  signOut() {
    return this.supabase.auth.signOut();
  }

  async getSession() {
    return await this.supabase.auth.getSession();
  }

  async isAuthenticated() {
    const {
      data: { session },
    } = await this.getSession();

    return session != null;
  }
}
