import axios from 'axios'
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  Produto,
  ProdutoRequest,
  VariacaoProduto,
  VariacaoProdutoRequest,
  Venda,
  VendaRequest,
  EstoqueItem,
  MovimentoEstoque,
  EntradaEstoqueRequest,
  FechamentoCaixa,
  FechamentoCaixaRequest,
  DashboardData,
  CmvData,
  Usuario,
  UsuarioRequest,
  CategoriaResponse,
  AdegaResponse,
  AdegaRequest,
} from '../types'

const AUTH_KEY = 'adega_user'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem(AUTH_KEY)
  if (raw) {
    const user: AuthUser = JSON.parse(raw)
    config.headers.Authorization = `Bearer ${user.token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_KEY)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// Auth
export const auth = {
  login: (data: LoginRequest): Promise<LoginResponse> =>
    api.post<LoginResponse>('/auth/login', data).then((r) => r.data),
}

// Produtos
export const produtos = {
  getProdutos: (params?: { categoriaId?: string; ativo?: boolean }): Promise<Produto[]> =>
    api.get<Produto[]>('/produtos', { params }).then((r) => r.data),

  createProduto: (data: ProdutoRequest): Promise<Produto> =>
    api.post<Produto>('/produtos', data).then((r) => r.data),

  updateProduto: (id: string, data: ProdutoRequest): Promise<Produto> =>
    api.put<Produto>(`/produtos/${id}`, data).then((r) => r.data),

  toggleProdutoStatus: (id: string): Promise<Produto> =>
    api.patch<Produto>(`/produtos/${id}/status`).then((r) => r.data),

  addVariacao: (produtoId: string, data: VariacaoProdutoRequest): Promise<Produto> =>
    api.post<Produto>(`/produtos/${produtoId}/variacoes`, data).then((r) => r.data),

  updateVariacao: (id: string, data: VariacaoProdutoRequest): Promise<VariacaoProduto> =>
    api.put<VariacaoProduto>(`/produtos/variacoes/${id}`, data).then((r) => r.data),
}

// Vendas
export const vendas = {
  createVenda: (data: VendaRequest): Promise<Venda> =>
    api.post<Venda>('/vendas', data).then((r) => r.data),

  getVendas: (params?: {
    adegaId?: string
    dataInicio?: string
    dataFim?: string
    status?: string
    canal?: string
    usuarioId?: string
  }): Promise<Venda[]> =>
    api.get<Venda[]>('/vendas', { params }).then((r) => r.data),

  getVenda: (id: string): Promise<Venda> =>
    api.get<Venda>(`/vendas/${id}`).then((r) => r.data),

  cancelarVenda: (id: string): Promise<Venda> =>
    api.patch<Venda>(`/vendas/${id}/cancelar`).then((r) => r.data),
}

// Estoque
export const estoque = {
  getEstoque: (params?: {
    adegaId?: string
    categoriaId?: string
    situacao?: string
  }): Promise<EstoqueItem[]> =>
    api.get<EstoqueItem[]>('/estoque', { params }).then((r) => r.data),

  registrarEntrada: (data: EntradaEstoqueRequest): Promise<MovimentoEstoque> =>
    api.post<MovimentoEstoque>('/estoque/entrada', data).then((r) => r.data),

  ajusteEstoque: (data: {
    variacaoId: string
    novaQuantidade: number
    observacao?: string
  }): Promise<MovimentoEstoque> =>
    api.post<MovimentoEstoque>('/estoque/ajuste', data).then((r) => r.data),

  getHistorico: (variacaoId: string): Promise<MovimentoEstoque[]> =>
    api.get<MovimentoEstoque[]>(`/estoque/${variacaoId}/historico`).then((r) => r.data),
}

// Caixa
export const caixa = {
  fecharCaixa: (data: FechamentoCaixaRequest): Promise<FechamentoCaixa> =>
    api.post<FechamentoCaixa>('/caixa/fechar', data).then((r) => r.data),

  getCaixaAberto: (adegaId: string): Promise<FechamentoCaixa> =>
    api.get<FechamentoCaixa>('/caixa/aberto', { params: { adegaId } }).then((r) => r.data),

  getHistoricoCaixa: (adegaId: string): Promise<FechamentoCaixa[]> =>
    api.get<FechamentoCaixa[]>('/caixa/historico', { params: { adegaId } }).then((r) => r.data),
}

// Dashboard
export const dashboard = {
  getDashboard: (params?: { adegaId?: string; data?: string }): Promise<DashboardData> =>
    api.get<DashboardData>('/dashboard', { params }).then((r) => r.data),
}

// CMV
export const cmv = {
  getCmv: (params?: {
    adegaId?: string
    dataInicio?: string
    dataFim?: string
  }): Promise<CmvData> =>
    api.get<CmvData>('/cmv', { params }).then((r) => r.data),
}

// Usuarios
export const usuarios = {
  getUsuarios: (params?: { adegaId?: string }): Promise<Usuario[]> =>
    api.get<Usuario[]>('/usuarios', { params }).then((r) => r.data),

  createUsuario: (data: UsuarioRequest): Promise<Usuario> =>
    api.post<Usuario>('/usuarios', data).then((r) => r.data),

  updateUsuario: (id: string, data: UsuarioRequest): Promise<Usuario> =>
    api.put<Usuario>(`/usuarios/${id}`, data).then((r) => r.data),

  toggleUsuarioStatus: (id: string): Promise<Usuario> =>
    api.patch<Usuario>(`/usuarios/${id}/status`).then((r) => r.data),
}

// Categorias
export const categorias = {
  getCategorias: (): Promise<CategoriaResponse[]> =>
    api.get<CategoriaResponse[]>('/categorias').then((r) => r.data),

  createCategoria: (data: { nome: string }): Promise<CategoriaResponse> =>
    api.post<CategoriaResponse>('/categorias', data).then((r) => r.data),

  updateCategoria: (id: string, data: { nome: string }): Promise<CategoriaResponse> =>
    api.put<CategoriaResponse>(`/categorias/${id}`, data).then((r) => r.data),

  deleteCategoria: (id: string): Promise<void> =>
    api.delete(`/categorias/${id}`).then(() => undefined),
}

// Adegas (adega selector in Layout + Configurações page)
export const adegas = {
  getAdegas: (): Promise<AdegaResponse[]> =>
    api.get<AdegaResponse[]>('/adegas').then((r) => r.data),

  createAdega: (data: AdegaRequest): Promise<AdegaResponse> =>
    api.post<AdegaResponse>('/adegas', data).then((r) => r.data),

  updateAdega: (id: string, data: AdegaRequest): Promise<AdegaResponse> =>
    api.put<AdegaResponse>(`/adegas/${id}`, data).then((r) => r.data),
}

export { api as apiClient }
