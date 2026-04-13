import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'estoque', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent),
  },
  // {
  //   path: 'estoque',
  //   canActivate: [authGuard],
  //   loadChildren: () => import('./features/estoque/estoque.routes')
  //     .then(m => m.ESTOQUE_ROUTES),
  // },
  {
    path: 'produtos',
    canActivate: [authGuard],
    loadChildren: () => import('./features/products/products/products.routes')
      .then(m => m.PRODUTOS_ROUTES),
  },
  // {
  //   path: 'categories',
  //   loadChildren: () =>
  //     import('@shared/categories/categories.routes').then((r) => r.CATEGORIES_ROUTES),
  //   canActivate: [AuthGuard]
  // }
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found/not-found.component')
      .then(m => m.NotFoundComponent),
  },
];
