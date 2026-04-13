import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal, computed } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Produto, ProdutoFiltros, ProdutoForm } from '../../models/products.model';
import { PaginaResponse } from '../../models/common.models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
    private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/produtos`;
 
  // -------------------------------------------------------------------------
  // Estado global da lista (compartilhado entre componentes)
  // -------------------------------------------------------------------------
  private _produtos      = signal<Produto[]>([]);
  private _total         = signal(0);
  private _carregando    = signal(false);
  private _erro          = signal<string | null>(null);
 
  readonly produtos   = this._produtos.asReadonly();
  readonly total      = this._total.asReadonly();
  readonly carregando = this._carregando.asReadonly();
  readonly erro       = this._erro.asReadonly();
  readonly temErro    = computed(() => !!this._erro());
 
  // -------------------------------------------------------------------------
  // LISTAR — com filtros, paginação e ordenação
  // -------------------------------------------------------------------------
  listar(filtros: ProdutoFiltros): Observable<PaginaResponse<Produto>> {
    this._carregando.set(true);
    this._erro.set(null);
 
    const params = this.buildParams(filtros);
 
    return this.http
      .get<PaginaResponse<Produto>>(this.baseUrl, { params })
      .pipe(
        tap(res => {
          this._produtos.set(res.content);
          this._total.set(res.totalElements);
          this._carregando.set(false);
        }),
        catchError(err => {
          this._erro.set('Erro ao carregar produtos.');
          this._carregando.set(false);
          return throwError(() => err);
        })
      );
  }
 
  // -------------------------------------------------------------------------
  // BUSCAR POR ID
  // -------------------------------------------------------------------------
  buscarPorId(id: number): Observable<Produto> {
    return this.http
      .get<Produto>(`${this.baseUrl}/${id}`)
      .pipe(
        catchError(err => {
          this._erro.set('Produto não encontrado.');
          return throwError(() => err);
        })
      );
  }
 
  // -------------------------------------------------------------------------
  // CRIAR
  // -------------------------------------------------------------------------
  criar(form: ProdutoForm): Observable<Produto> {
    this._carregando.set(true);
 
    return this.http
      .post<Produto>(this.baseUrl, form)
      .pipe(
        tap(novo => {
          // Adiciona na lista local sem refetch
          this._produtos.update(lista => [novo, ...lista]);
          this._total.update(t => t + 1);
          this._carregando.set(false);
        }),
        catchError(err => {
          this._erro.set('Erro ao criar produto.');
          this._carregando.set(false);
          return throwError(() => err);
        })
      );
  }
 
  // -------------------------------------------------------------------------
  // ATUALIZAR
  // -------------------------------------------------------------------------
  atualizar(id: number, form: ProdutoForm): Observable<Produto> {
    this._carregando.set(true);
 
    return this.http
      .put<Produto>(`${this.baseUrl}/${id}`, form)
      .pipe(
        tap(atualizado => {
          // Atualiza o item na lista local
          this._produtos.update(lista =>
            lista.map(p => p.id === id ? atualizado : p)
          );
          this._carregando.set(false);
        }),
        catchError(err => {
          this._erro.set('Erro ao atualizar produto.');
          this._carregando.set(false);
          return throwError(() => err);
        })
      );
  }
 
  // -------------------------------------------------------------------------
  // EXCLUIR
  // -------------------------------------------------------------------------
  excluir(id: number): Observable<void> {
    this._carregando.set(true);
 
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(
        tap(() => {
          // Remove da lista local sem refetch
          this._produtos.update(lista => lista.filter(p => p.id !== id));
          this._total.update(t => t - 1);
          this._carregando.set(false);
        }),
        catchError(err => {
          this._erro.set('Erro ao excluir produto.');
          this._carregando.set(false);
          return throwError(() => err);
        })
      );
  }
 
  // -------------------------------------------------------------------------
  // ALTERNAR STATUS (ativo/inativo)
  // -------------------------------------------------------------------------
  alternarStatus(id: number): Observable<Produto> {
    return this.http
      .patch<Produto>(`${this.baseUrl}/${id}/status`, {})
      .pipe(
        tap(atualizado => {
          this._produtos.update(lista =>
            lista.map(p => p.id === id ? atualizado : p)
          );
        }),
        catchError(err => throwError(() => err))
      );
  }
 
  // -------------------------------------------------------------------------
  // Limpar erro manualmente
  // -------------------------------------------------------------------------
  limparErro(): void {
    this._erro.set(null);
  }
 
  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  private buildParams(filtros: ProdutoFiltros): HttpParams {
    let params = new HttpParams()
      .set('page',      filtros.page.toString())
      .set('size',      filtros.size.toString())
      .set('sort',      `${filtros.sort},${filtros.direction}`);
 
    if (filtros.busca)        params = params.set('busca',       filtros.busca);
    if (filtros.categoriaId)  params = params.set('categoriaId', filtros.categoriaId.toString());
    if (filtros.ativo !== undefined) params = params.set('ativo', filtros.ativo.toString());
    if (filtros.statusEstoque) params = params.set('statusEstoque', filtros.statusEstoque);
 
    return params;
  }
}
