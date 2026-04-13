import { Routes } from '@angular/router';
import { ProductsComponent } from './products.component';

export const PRODUTOS_ROUTES: Routes = [
  {
    path: '',
    component: ProductsComponent,
    title: 'Produtos'
  },
  {
    path: 'novo',
    loadComponent: () =>
      import('../form/product-form/product-form.component')
        .then(m => m.ProductFormComponent),
    title: 'Novo produto',
  },
  // {
  //   path: ':id',
  //   loadComponent: () =>
  //     import('./detalhe/produto-detalhe.component')
  //       .then(m => m.ProdutoDetalheComponent),
  //   title: 'Produto',
  // },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('../form/product-form/product-form.component')
        .then(m => m.ProductFormComponent),
    title: 'Editar produto',
  },
];