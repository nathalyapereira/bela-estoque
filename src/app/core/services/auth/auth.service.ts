import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../supabase/supabase.service';
import { Observable, of } from 'rxjs';

export interface User {
  id: string;
  email: string;
  role?: 'admin' | 'user';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  private authState = signal<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  readonly user = computed(() => this.authState().user);
  readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
  readonly loading = computed(() => this.authState().loading);

  async signIn(email: string, password: string): Promise<{ error?: string }> {
    // try {
    //   const { data, error } = await this.supabase.signIn(email, password);

    //   if (error) {
    //     this.authState.set({
    //       user: null,
    //       isAuthenticated: false,
    //       loading: false,
    //     });
    //     return { error: error.message };
    //   }

    //   if (data.user) {
        this.authState.set({
           user: {
            id: '1',
            email: 'admin@example.com',
            role: 'admin',
          },
          // user: {
          //   id: data.user.id,
          //   email: data.user.email!,
          //   role: 'admin',
          // },
          isAuthenticated: true,
          loading: false,
        });
        this.router.navigate(['/produtos']);
      // }

      return {};
      // } catch (e) {
      //   return { error: 'Falha na autenticação' };
      // }
  }

  async signOut(): Promise<void> {
    await this.supabase.signOut();
    this.authState.set({
      user: null,
      isAuthenticated: false,
      loading: false,
    });
    this.router.navigate(['/login']);
  }


}
