import {
  Component, inject, signal, computed, effect,
  ChangeDetectionStrategy, OnInit,
} from '@angular/core';
import { Router }           from '@angular/router';
import { MatTableModule }   from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort }           from '@angular/material/sort';
import { MatInputModule }   from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule }  from '@angular/material/button';
import { MatIconModule }    from '@angular/material/icon';
import { MatMenuModule }    from '@angular/material/menu';
import { MatChipsModule }   from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar }      from '@angular/material/snack-bar';
import { MatDialog }        from '@angular/material/dialog';
import { MatSelectModule }  from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule }      from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductService } from '../../../core/services/product/product.service';
import { Produto, ProdutoFiltros, getStatusEstoque, StatusEstoque } from '../../../core/models/products.model';
import { ConfirmDeletionComponent } from '../../../shared/components/confirm-deletion/confirm-deletion/confirm-deletion.component';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-products',
  imports: [
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatInputModule, MatFormFieldModule, MatButtonModule,
    MatIconModule, MatMenuModule, MatChipsModule,
    MatTooltipModule, MatSelectModule, MatProgressBarModule,
    FormsModule, MatDividerModule,
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent {
  private produtoService = inject(ProductService);
private router         = inject(Router);
  private snackBar       = inject(MatSnackBar);
  private dialog         = inject(MatDialog);
 

  readonly produtos   = this.produtoService.produtos;
  readonly total      = this.produtoService.total;
  readonly carregando = this.produtoService.carregando;
 

  readonly busca        = signal('');
  readonly pagina       = signal(0);
  readonly tamanhoPagina = signal(10);
  readonly ordenacao    = signal('nome');
  readonly direcao      = signal<'asc' | 'desc'>('asc');
  readonly filtroStatus = signal<string>('');
 
  readonly filtrosAtivos = computed(() => ({
    busca:         this.busca(),
    page:          this.pagina(),
    size:          this.tamanhoPagina(),
    sort:          this.ordenacao(),
    direction:     this.direcao(),
    statusEstoque: this.filtroStatus() as any || undefined,
  } as ProdutoFiltros));
 
  // Colunas da tabela
  readonly colunas = [
    'imagem', 'nome', 'sku', 'categoria',
    'quantidade', 'preco', 'status', 'acoes',
  ];
 

  private buscaSubject = new Subject<string>();
 
  constructor() {
    this.buscaSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe(valor => {
      this.busca.set(valor);
      this.pagina.set(0);
      this.carregarProdutos();
    });
 
    effect(() => {
      this.filtroStatus();
      this.carregarProdutos();
    });
  }
 
  ngOnInit(): void {
    this.carregarProdutos();
  }
 
  carregarProdutos(): void {
    this.produtoService.listar(this.filtrosAtivos()).subscribe();
  }
 
  onBusca(valor: string): void {
    this.buscaSubject.next(valor);
  }
 
  onPagina(evento: PageEvent): void {
    this.pagina.set(evento.pageIndex);
    this.tamanhoPagina.set(evento.pageSize);
    this.carregarProdutos();
  }
 
  onOrdenacao(sort: Sort): void {
    this.ordenacao.set(sort.active || 'nome');
    this.direcao.set((sort.direction as 'asc' | 'desc') || 'asc');
    this.carregarProdutos();
  }
 
  novoProduto(): void {
    this.router.navigate(['/produtos/novo']);
  }
 
  editar(produto: Produto): void {
    this.router.navigate(['/produtos', produto.id, 'editar']);
  }
 
  verDetalhe(produto: Produto): void {
    this.router.navigate(['/produtos', produto.id]);
  }
 
  alternarStatus(produto: Produto): void {
    this.produtoService.alternarStatus(produto.id).subscribe({
      next: () => {
        this.snackBar.open(
          `Produto ${produto.ativo ? 'desativado' : 'ativado'} com sucesso.`,
          'Fechar',
          { duration: 3000, panelClass: 'snack-success' }
        );
      },
    });
  }
 
  confirmarExclusao(produto: Produto): void {
    const ref = this.dialog.open(ConfirmDeletionComponent, {
      width: '400px',
      data: {
        title:   'Excluir produto',
        message: `Deseja excluir "${produto.nome}"? Esta ação não pode ser desfeita.`,
      },
    });
 
    ref.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;
 
      this.produtoService.excluir(produto.id).subscribe({
        next: () => {
          this.snackBar.open('Produto excluído.', 'Fechar', {
            duration: 3000,
            panelClass: 'snack-success',
          });
        },
        error: () => {
          this.snackBar.open('Erro ao excluir produto.', 'Fechar', {
            duration: 4000,
            panelClass: 'snack-error',
          });
        },
      });
    });
  }
 
  getStatus(produto: Produto): StatusEstoque {
    return getStatusEstoque(produto);
  }
 
  getLabelStatus(status: StatusEstoque): string {
    const labels: Record<StatusEstoque, string> = {
      ok:      'Normal',
      baixo:   'Baixo',
      zero:    'Esgotado',
      excesso: 'Excesso',
    };
    return labels[status];
  }
 
  formatarPreco(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      style:    'currency',
      currency: 'BRL',
    });
  }
}