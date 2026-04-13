import { PaginaResponse, FiltrosBase } from './common.models';

export interface Produto {
  id:           number;
  nome:         string;
  descricao:    string;
  preco:        number;
  custo:        number;
  sku:          string;
  codigoBarras: string;
  categoriaId:  number;
  categoriaNome?: string;
  fornecedorId: number;
  fornecedorNome?: string;
  quantidadeAtual:  number;
  quantidadeMinima: number;
  quantidadeMaxima: number;
  unidade:      string;
  ativo:        boolean;
  imagemUrl?:   string;
  criadoEm:     string;
  atualizadoEm: string;
  dataValidade?: Date;
}

export interface ProdutoForm {
  nome:             string;
  descricao:        string;
  preco:            number;
  custo:            number;
  sku:              string;
  codigoBarras:     string;
  categoriaId:      number;
  fornecedorId:     number;
  quantidadeAtual:  number;
  quantidadeMinima: number;
  quantidadeMaxima: number;
  unidade:          string;
  ativo:            boolean;
  dataValidade?:    Date;
}

export interface ProdutoFiltros extends FiltrosBase {
  busca?:       string;
  categoriaId?: number;
  ativo?:       boolean;
  statusEstoque?: 'ok' | 'baixo' | 'zero' | 'excesso';
}

export type StatusEstoque = 'ok' | 'baixo' | 'zero' | 'excesso';

export function getStatusEstoque(produto: Produto): StatusEstoque {
  if (produto.quantidadeAtual <= 0)                          return 'zero';
  if (produto.quantidadeAtual < produto.quantidadeMinima)    return 'baixo';
  if (produto.quantidadeAtual > produto.quantidadeMaxima)    return 'excesso';
  return 'ok';
}

export const UNIDADES = [
  { value: 'UN',  label: 'Unidade' },
  { value: 'CX',  label: 'Caixa' },
  { value: 'KG',  label: 'Quilograma' },
  { value: 'G',   label: 'Grama' },
  { value: 'L',   label: 'Litro' },
  { value: 'ML',  label: 'Mililitro' },
  { value: 'PCT', label: 'Pacote' },
];