import { inject } from '@angular/core';
import { CanActivateFn, Router, CanMatchFn, UrlSegment } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.authState.pipe(
    take(1),
    map(authState => {
      return true;
      if (authState.isAuthenticated) {
        return true;
      }

      // Redirecionar para login com URL de retorno
      router.navigate(['/login'], { 
        queryParams: { returnUrl: state.url } 
      });
      
      return false;
    })
  );
};

export const authMatchGuard: CanMatchFn = (route, segments, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.authState.pipe(
    take(1),
    map(authState => {
      if (authState.isAuthenticated) {
        return true;
      }

      router.navigate(['/login']);
      return false;
    })
  );
};

// Guard para roles específicas
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.authState.pipe(
      take(1),
      map(authState => {
        if (!authState.isAuthenticated) {
          router.navigate(['/login'], { 
            queryParams: { returnUrl: state.url } 
          });
          return false;
        }

        const userRole = authState.user?.role;
        
        if (!userRole || !allowedRoles.includes(userRole)) {
          router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      })
    );
  };
};

// Guard para admin
export const adminGuard: CanActivateFn = roleGuard(['admin']);

// Guard para usuários autenticados (qualquer role)
export const userGuard: CanActivateFn = roleGuard(['admin', 'user']);
