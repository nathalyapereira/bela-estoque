import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from, of, throwError } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { createClient, SupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { User, AuthState, LoginCredentials, RegisterCredentials, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private router = inject(Router);
  
  // Signals para estado reativo
  private readonly _user = signal<User | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  
  // Computed signals
  public readonly isAuthenticated = computed(() => !!this._user());
  public readonly user = computed(() => this._user());
  public readonly isLoading = computed(() => this._isLoading());
  public readonly error = computed(() => this._error());
  
  // BehaviorSubject para compatibilidade com observables
  private authState$ = new BehaviorSubject<AuthState>({
    user: null,
    isLoading: false,
    error: null,
    isAuthenticated: false
  });

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
    
    this.initializeAuth();
  }

  private initializeAuth(): void {
    // Verificar sessão atual
    this.checkCurrentSession();
    
    // Escutar mudanças na autenticação
    this.supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      this.handleAuthStateChange(event, session);
    });
  }

  private async checkCurrentSession(): Promise<void> {
    this._isLoading.set(true);
    
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      if (session?.user) {
        await this.loadUserProfile(session.user.id);
      }
    } catch (error) {
      this._error.set('Erro ao verificar sessão atual');
      console.error('Error checking current session:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  private handleAuthStateChange(event: AuthChangeEvent, session: Session | null): void {
    if (event === 'SIGNED_IN' && session?.user) {
      this.loadUserProfile(session.user.id);
    } else if (event === 'SIGNED_OUT') {
      this.clearAuthState();
    }
  }

  private async loadUserProfile(userId: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);
    
    try {
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }
      
      let userData: User;
      
      if (profile) {
        // Usar perfil existente
        userData = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role || 'user',
          created_at: profile.created_at,
          updated_at: profile.updated_at
        };
      } else {
        // Criar perfil básico a partir do auth user
        const { data: authUser } = await this.supabase.auth.getUser();
        userData = {
          id: userId,
          email: authUser.user?.email || '',
          name: authUser.user?.user_metadata?.['name'],
          role: 'user',
          created_at: new Date().toISOString()
        };
        
        // Criar perfil na tabela profiles
        await this.createProfile(userData);
      }
      
      this._user.set(userData);
      this.updateAuthState();
      
    } catch (error) {
      this._error.set('Erro ao carregar perfil do usuário');
      console.error('Error loading user profile:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  private async createProfile(userData: User): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .insert([userData]);
    
    if (error) {
      console.error('Error creating profile:', error);
    }
  }

  private clearAuthState(): void {
    this._user.set(null);
    this._error.set(null);
    this.updateAuthState();
  }

  private updateAuthState(): void {
    const state: AuthState = {
      user: this._user(),
      isLoading: this._isLoading(),
      error: this._error(),
      isAuthenticated: this.isAuthenticated()
    };
    
    this.authState$.next(state);
  }

  // Métodos públicos
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    this._isLoading.set(true);
    this._error.set(null);
    
    return from(
      this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        
        if (!data.user || !data.session) {
          throw new Error('Falha no login');
        }
        
        return {
          user: {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.['name'],
            role: (data.user.user_metadata?.['role'] as 'admin' | 'user') || 'user',
            created_at: data.user.created_at || new Date().toISOString()
          },
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at || 0
          }
        };
      }),
      tap((response) => {
        this._user.set(response.user);
        this.updateAuthState();
      }),
      catchError((error) => {
        this._error.set(this.getErrorMessage(error));
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  register(credentials: RegisterCredentials): Observable<AuthResponse> {
    this._isLoading.set(true);
    this._error.set(null);
    
    return from(
      this.supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            ['name']: credentials.name,
            ['role']: 'user'
          }
        }
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        
        if (!data.user) {
          throw new Error('Falha no registro');
        }
        
        return {
          user: {
            id: data.user.id,
            email: data.user.email || '',
            name: credentials.name,
            role: 'user' as const,
            created_at: data.user.created_at || new Date().toISOString()
          },
          session: data.session ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at || 0
          } : {
            access_token: '',
            refresh_token: '',
            expires_at: 0
          }
        };
      }),
      tap((response) => {
        if (response.session.access_token) {
          this._user.set(response.user);
          this.updateAuthState();
        }
      }),
      catchError((error) => {
        this._error.set(this.getErrorMessage(error));
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<void> {
    return from(this.supabase.auth.signOut()).pipe(
      map(({ error }) => {
        if (error) {
          throw error;
        }
        // Logout bem sucedido
      }),
      tap(() => {
        this.clearAuthState();
        this.router.navigate(['/login']);
      }),
      catchError((error) => {
        console.error('Logout error:', error);
        this.clearAuthState();
        this.router.navigate(['/login']);
        return of(void 0);
      })
    );
  }

  updateProfile(updates: Partial<User>): Observable<User> {
    if (!this._user()) {
      return throwError(() => new Error('Usuário não autenticado'));
    }
    
    this._isLoading.set(true);
    this._error.set(null);
    
    return from(
      this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', this._user()!.id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        
        const updatedUser = { ...this._user()!, ...data };
        this._user.set(updatedUser);
        this.updateAuthState();
        
        return updatedUser;
      }),
      catchError((error) => {
        this._error.set('Erro ao atualizar perfil');
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  resetPassword(email: string): Observable<void> {
    return from(
      this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
    ).pipe(
      map(() => {
        // Email enviado com sucesso
      }),
      catchError((error) => {
        this._error.set('Erro ao enviar email de recuperação');
        return throwError(() => error);
      })
    );
  }

  // Getters para compatibilidade
  get authState(): Observable<AuthState> {
    return this.authState$.asObservable();
  }

  get currentUser(): User | null {
    return this._user();
  }

  async token(): Promise<string | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  private getErrorMessage(error: any): string {
    if (error?.message) {
      return error.message;
    }
    
    switch (error?.status) {
      case 400:
        return 'Email ou senha inválidos';
      case 401:
        return 'Não autorizado';
      case 403:
        return 'Acesso negado';
      case 429:
        return 'Muitas tentativas. Tente novamente mais tarde';
      default:
        return 'Erro na autenticação. Tente novamente.';
    }
  }
}
