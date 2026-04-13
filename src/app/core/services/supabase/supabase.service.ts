import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  async signIn(email: string, password: string) {
    return await this.client.auth.signInWithPassword({
      email,
      password,
    });
  }

  async signOut() {
    await this.client.auth.signOut();
  }

  async signUp(email: string, password: string) {
    return await this.client.auth.signUp({
      email,
      password,
    });
  }

  getSession() {
    return this.client.auth.getSession();
  }

  getUser(): Promise<User | null> {
    return this.client.auth.getUser().then(({ data }) => data.user);
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.client.auth.onAuthStateChange(callback);
  }
}
