import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseKey,
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
