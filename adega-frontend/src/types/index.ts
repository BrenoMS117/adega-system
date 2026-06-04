export interface LoginRequest {
  email: string
  senha: string
}

export interface LoginResponse {
  token: string
  nome: string
  perfil: string
  adegaId: string | null
  usuarioId: string
}

export interface AuthUser {
  token: string
  nome: string
  perfil: string
  adegaId: string | null
  usuarioId: string
}

export interface Categoria {
  id: string
  nome: string
}

export interface CategoriaResponse {
  id: string
  nome: string
  totalProdutos: number
}

export interface AdegaResponse {
  id: string
  nome: string
  endereco?: string
  cnpj?: string
  totalUsuarios: number
}

export interface AdegaRequest {
  nome: string
  endereco?: string
  cnpj?: string
}

export interface VariacaoProduto {
  id: string
  descricao: string
  precoVenda: number
  custoAquisicao?: number
  estoqueAtual: number
  estoqueMinimo: number
  situacao: string
}

export interface Produto {
  id: string
  nome: string
  descricao?: string
  categoriaNome: string
  ativo: boolean
  variacoes: VariacaoProduto[]
}

export interface ProdutoRequest {
  nome: string
  categoriaId: string
  descricao?: string
  ativo: boolean
  variacoes: VariacaoProdutoRequest[]
}

export interface VariacaoProdutoRequest {
  descricao: string
  precoVenda: number
  custoAquisicao?: number
  estoqueAtual: number
  estoqueMinimo: number
}

export interface ItemVendaRequest {
  variacaoId: string
  quantidade: number
  descontoValor: number
}

export interface PagamentoRequest {
  forma: string
  valor: number
}

export interface VendaRequest {
  adegaId: string
  canal: string
  itens: ItemVendaRequest[]
  pagamentos: PagamentoRequest[]
}

export interface ItemVendaResponse {
  id: string
  produtoNome: string
  variacaoDescricao: string
  quantidade: number
  precoUnitario: number
  descontoValor: number
  subtotal: number
}

export interface PagamentoResponse {
  id: string
  forma: string
  valor: number
}

export interface Venda {
  id: string
  usuarioNome: string
  adegaNome: string
  dataHora: string
  status: string
  canal: string
  totalBruto: number
  totalDesconto: number
  totalLiquido: number
  itens: ItemVendaResponse[]
  pagamentos: PagamentoResponse[]
}

export interface EstoqueItem {
  variacaoId: string
  produtoNome: string
  variacaoDescricao: string
  estoqueAtual: number
  estoqueMinimo: number
  situacao: string
  custoAquisicao?: number
  categoriaNome: string
  adegaNome?: string
}

export interface MovimentoEstoque {
  id: string
  tipo: string
  quantidade: number
  dataHora: string
  observacao?: string
  usuarioNome: string
  vendaId?: string
}

export interface EntradaEstoqueRequest {
  variacaoId: string
  quantidade: number
  custoAquisicao?: number
  observacao?: string
}

export interface AjusteEstoqueRequest {
  variacaoId: string
  novaQuantidade: number
  observacao?: string
}

export interface FechamentoCaixa {
  id: string
  data: string
  adegaNome: string
  usuarioNome: string
  totalVendas: number
  totalFaturamento: number
  totalDinheiro: number
  totalPix: number
  totalCartao: number
  totalBeneficio: number
  totalDescontos: number
  dinheiroSistema: number
  dinheiroContado: number
  diferenca: number
  observacao?: string
}

export interface FechamentoCaixaRequest {
  adegaId: string
  dinheiroContado: number
  observacao?: string
}

export interface Usuario {
  id: string
  nome: string
  email: string
  perfil: string
  adegaNome?: string
  ativo: boolean
}

export interface UsuarioRequest {
  nome: string
  email: string
  senha: string
  perfil: string
  adegaId?: string
}

export interface TopProdutoItem {
  nome: string
  variacao: string
  quantidade: number
  totalValor: number
}

export interface DescontoFuncionarioItem {
  nome: string
  totalDesconto: number
  qtdVendas: number
}

export interface CmvItem {
  produtoNome: string
  variacaoDescricao: string
  categoriaNome: string
  quantidadeVendida: number
  custoUnitario: number
  custoTotal: number
  faturamentoTotal: number
  margemBruta: number
  percentualCmv: number
  percentualMargem: number
}

export interface CmvData {
  dataInicio: string
  dataFim: string
  adegaNome: string | null
  itens: CmvItem[]
  totalFaturamento: number
  totalCusto: number
  totalMargemBruta: number
  percentualCmvGeral: number
  percentualMargemGeral: number
}

export interface DashboardData {
  totalFaturamento: number
  totalVendas: number
  ticketMedio: number
  totalDescontos: number
  topProdutos: TopProdutoItem[]
  pagamentosPorForma: Record<string, number>
  descontosPorFuncionario: DescontoFuncionarioItem[]
  estoqueCritico: EstoqueItem[]
  vendasPorHora: Record<string, number>
}
