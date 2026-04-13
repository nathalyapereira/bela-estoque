import {
  Component, inject, signal, computed,
  ChangeDetectionStrategy, OnInit,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MatFormFieldModule }  from '@angular/material/form-field';
import { MatInputModule }      from '@angular/material/input';
import { MatButtonModule }     from '@angular/material/button';
import { MatIconModule }       from '@angular/material/icon';
import { MatSelectModule }     from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule }    from '@angular/material/divider';
import { MatSnackBar }         from '@angular/material/snack-bar';
import { toSignal }            from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ProductService } from '../../../../core/services/product/product.service';
import { ProdutoForm, UNIDADES } from '../../../../core/models/products.model';

@Component({
  selector: 'app-product-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSelectModule, MatSlideToggleModule,
    MatProgressSpinnerModule, MatDividerModule,
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
})
export class ProductFormComponent {
private fb             = inject(FormBuilder);
  private produtoService = inject(ProductService);
  private router         = inject(Router);
  private route          = inject(ActivatedRoute);
  private snackBar       = inject(MatSnackBar);

  readonly salvando  = signal(false);
  readonly carregando = signal(false);
 
  // ID da rota — se existir, é edição; senão, é criação
  readonly produtoId = toSignal(
    this.route.paramMap.pipe(map(p => p.get('id') ? Number(p.get('id')) : null)),
    { initialValue: null }
  );
 
  readonly isEdicao = computed(() => !!this.produtoId());
  readonly titulo   = computed(() => this.isEdicao() ? 'Editar produto' : 'Novo produto');
 
  readonly unidades = UNIDADES;
 
  // -------------------------------------------------------------------------
  // Formulário
  // -------------------------------------------------------------------------
  readonly form = this.fb.group({
    nome:             ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    descricao:        ['', [Validators.maxLength(500)]],
    sku:              ['', [Validators.required, Validators.maxLength(50)]],
    codigoBarras:     ['', [Validators.maxLength(50)]],
    categoriaId:      [null as number | null, [Validators.required]],
    fornecedorId:     [null as number | null, [Validators.required]],
    preco:            [0, [Validators.required, Validators.min(0)]],
    custo:            [0, [Validators.required, Validators.min(0)]],
    quantidadeAtual:  [0, [Validators.required, Validators.min(0)]],
    quantidadeMinima: [0, [Validators.required, Validators.min(0)]],
    quantidadeMaxima: [0, [Validators.required, Validators.min(0)]],
    unidade:          ['UN', [Validators.required]],
    ativo:            [true],
  });
 
  // Helpers de acesso rápido aos campos
  get f() { return this.form.controls; }
 
  ngOnInit(): void {
    if (this.isEdicao()) {
      this.carregarProduto();
    }
  }
 
  // -------------------------------------------------------------------------
  // Ações
  // -------------------------------------------------------------------------
  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
 
    this.salvando.set(true);
    const payload = this.form.value as ProdutoForm;
 
    const operacao = this.isEdicao()
      ? this.produtoService.atualizar(this.produtoId()!, payload)
      : this.produtoService.criar(payload);
 
    operacao.subscribe({
      next: () => {
        this.salvando.set(false);
        this.snackBar.open(
          this.isEdicao() ? 'Produto atualizado!' : 'Produto criado!',
          'Fechar',
          { duration: 3000, panelClass: 'snack-success' }
        );
        this.router.navigate(['/produtos']);
      },
      error: () => {
        this.salvando.set(false);
        this.snackBar.open('Erro ao salvar produto.', 'Fechar', {
          duration: 4000,
          panelClass: 'snack-error',
        });
      },
    });
  }
 
  cancelar(): void {
    this.router.navigate(['/produtos']);
  }
 
  // -------------------------------------------------------------------------
  // Helpers de validação para o template
  // -------------------------------------------------------------------------
  temErro(campo: string): boolean {
    const ctrl = this.form.get(campo);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
 
  mensagemErro(campo: string): string {
    const ctrl = this.form.get(campo);
    if (!ctrl?.errors) return '';
 
    if (ctrl.errors['required'])  return 'Campo obrigatório.';
    if (ctrl.errors['minlength']) return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres.`;
    if (ctrl.errors['maxlength']) return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres.`;
    if (ctrl.errors['min'])       return `Valor mínimo: ${ctrl.errors['min'].min}.`;
 
    return 'Campo inválido.';
  }
 
  // -------------------------------------------------------------------------
  // Carregar dados para edição
  // -------------------------------------------------------------------------
  private carregarProduto(): void {
    this.carregando.set(true);
 
    this.produtoService.buscarPorId(this.produtoId()!).subscribe({
      next: produto => {
        this.form.patchValue({
          nome:             produto.nome,
          descricao:        produto.descricao,
          sku:              produto.sku,
          codigoBarras:     produto.codigoBarras,
          categoriaId:      produto.categoriaId,
          fornecedorId:     produto.fornecedorId,
          preco:            produto.preco,
          custo:            produto.custo,
          quantidadeAtual:  produto.quantidadeAtual,
          quantidadeMinima: produto.quantidadeMinima,
          quantidadeMaxima: produto.quantidadeMaxima,
          unidade:          produto.unidade,
          ativo:            produto.ativo,
        });
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.snackBar.open('Erro ao carregar produto.', 'Fechar', {
          duration: 4000, panelClass: 'snack-error',
        });
        this.router.navigate(['/produtos']);
      },
    });
  }
}