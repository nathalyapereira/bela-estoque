import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Não adicionar token em requisições para o Supabase auth
    if (request.url.includes('/auth/v1/')) {
      return next.handle(request);
    }

    return from(this.addTokenToRequest(request)).pipe(
      switchMap(tokenizedRequest => {
        return next.handle(tokenizedRequest).pipe(
          catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
              // Token expirado ou inválido
              this.handleUnauthorized();
            }
            return throwError(() => error);
          })
        );
      })
    );
  }

  private async addTokenToRequest(
    request: HttpRequest<unknown>
  ): Promise<HttpRequest<unknown>> {
    const token = await this.authService.token();

    if (token) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return request;
  }

  private handleUnauthorized(): void {
    // Fazer logout e redirecionar para login
    this.authService.logout().subscribe();
  }
}
