import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Search,
  Check,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { produtos as produtosApi, vendas as vendasApi, caixa as caixaApi } from '../../services/api'
import type { Produto, VariacaoProduto } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'

// ─── Types ────────────────────────────────────────────────────────────────────

type Pagamento = { forma: string; valor: number }

// ─── Constants ────────────────────────────────────────────────────────────────

const FORMAS = ['DINHEIRO', 'PIX', 'DEBITO', 'CREDITO', 'VALE'] as const

const FORMA_LABELS: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'PIX',
  DEBITO: 'Débito',
  CREDITO: 'Crédito',
  VALE: 'Vale',
}

const BADGE_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
]

// ─── Utils ────────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// ─── VariacaoDialog ───────────────────────────────────────────────────────────

interface VariacaoDialogProps {
  produto: Produto
  onSelect: (variacao: VariacaoProduto) => void
  onClose: () => void
}

function VariacaoDialog({ produto, onSelect, onClose }: VariacaoDialogProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{produto.nome}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">Selecione uma variação:</p>

        <div className="space-y-2">
          {produto.variacoes.map((v, idx) => (
            <button
              key={v.id}
              onClick={() => onSelect(v)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left group"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700">
                  {v.descricao}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Estoque:{' '}
                  <span
                    className={
                      v.estoqueAtual === 0
                        ? 'text-red-500 font-medium'
                        : v.estoqueAtual <= v.estoqueMinimo
                        ? 'text-orange-500 font-medium'
                        : 'text-gray-600'
                    }
                  >
                    {v.estoqueAtual}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    BADGE_COLORS[idx % BADGE_COLORS.length]
                  }`}
                >
                  {v.descricao}
                </span>
                <span className="text-sm font-semibold text-blue-600">
                  {fmt(v.precoVenda)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── PagamentoDialog ──────────────────────────────────────────────────────────

interface PagamentoDialogProps {
  totalLiquido: number
  pagamentos: Pagamento[]
  isLoading: boolean
  caixaFechado: boolean
  onTogglePagamento: (forma: string) => void
  onUpdateValor: (forma: string, valor: number) => void
  onConfirmar: () => void
  onClose: () => void
}

function PagamentoDialog({
  totalLiquido,
  pagamentos,
  isLoading,
  caixaFechado,
  onTogglePagamento,
  onUpdateValor,
  onConfirmar,
  onClose,
}: PagamentoDialogProps) {
  const totalPago = pagamentos.reduce((sum, p) => sum + p.valor, 0)
  const remaining = totalLiquido - totalPago
  const isBalanced = Math.abs(remaining) < 0.01

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={() => { if (!isLoading) onClose() }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Forma de Pagamento</h2>
          <button
            onClick={() => { if (!isLoading) onClose() }}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total highlight */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Total a pagar
          </p>
          <p className="text-3xl font-bold text-gray-900">{fmt(totalLiquido)}</p>
        </div>

        {/* Payment method toggles */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {FORMAS.map((forma) => {
            const active = pagamentos.some((p) => p.forma === forma)
            return (
              <button
                key={forma}
                onClick={() => onTogglePagamento(forma)}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  active
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                {FORMA_LABELS[forma]}
              </button>
            )
          })}
        </div>

        {/* Amount inputs for selected methods */}
        {pagamentos.length > 0 && (
          <div className="space-y-2 mb-5">
            {pagamentos.map((p) => (
              <div key={p.forma} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 w-16 shrink-0">
                  {FORMA_LABELS[p.forma]}
                </span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                    R$
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={p.valor}
                    onChange={(e) =>
                      onUpdateValor(p.forma, Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Remaining indicator */}
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-xl mb-6 text-sm font-medium ${
            isBalanced
              ? 'bg-green-50 text-green-700'
              : remaining > 0
              ? 'bg-red-50 text-red-600'
              : 'bg-orange-50 text-orange-600'
          }`}
        >
          {isBalanced ? (
            <>
              <span>Pagamento OK</span>
              <Check className="w-4 h-4" />
            </>
          ) : remaining > 0 ? (
            <>
              <span>Falta</span>
              <span className="font-bold">{fmt(remaining)}</span>
            </>
          ) : (
            <>
              <span>Excesso</span>
              <span className="font-bold">{fmt(Math.abs(remaining))}</span>
            </>
          )}
        </div>

        {/* Confirm */}
        {caixaFechado && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            Caixa fechado. Vendas bloqueadas.
          </div>
        )}
        <button
          onClick={onConfirmar}
          disabled={!isBalanced || isLoading || caixaFechado}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-100 disabled:text-gray-400 text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processando...
            </>
          ) : (
            'Confirmar Venda'
          )}
        </button>
      </div>
    </div>
  )
}

// ─── PDVPage ──────────────────────────────────────────────────────────────────

export default function PDVPage() {
  const { getUser, isDono } = useAuth()
  const user = getUser()!

  const adegaId = localStorage.getItem('selected_adega') ?? user.adegaId ?? null

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: produtosList = [], isLoading: loadingProdutos } = useQuery({
    queryKey: ['produtos', { ativo: true }],
    queryFn: () => produtosApi.getProdutos({ ativo: true }),
  })

  const { data: caixaStatus } = useQuery({
    queryKey: ['caixa-status', adegaId],
    queryFn: () => caixaApi.getCaixaAberto(adegaId!),
    enabled: !!adegaId,
    refetchInterval: 60_000,
  })

  const caixaFechado = !!(caixaStatus?.id) && !caixaStatus?.reaberto

  const { mutate: submitVenda, isPending: isCreatingVenda } = useMutation({
    mutationFn: vendasApi.createVenda,
    onSuccess: () => {
      clearCart()
      setPagamentos([])
      setShowPagamentoDialog(false)
      toast.success('Venda realizada com sucesso!')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Erro ao registrar venda'
      toast.error(msg)
    },
  })

  // ── Local state ────────────────────────────────────────────────────────────
  const { cart, addToCart, updateQuantidade, updateDesconto, removeItem, clearCart, totalBruto, totalDesconto, totalLiquido } = useCart()
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showVariacaoDialog, setShowVariacaoDialog] = useState(false)
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  const [showPagamentoDialog, setShowPagamentoDialog] = useState(false)
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])

  // ── Derived data ───────────────────────────────────────────────────────────
  const categoriaNames = useMemo(() => {
    const set = new Set(produtosList.map((p) => p.categoriaNome))
    return Array.from(set).sort()
  }, [produtosList])

  const filteredProdutos = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return produtosList.filter((p) => {
      const matchSearch = p.nome.toLowerCase().includes(term)
      const matchCat =
        selectedCategoria === 'all' || p.categoriaNome === selectedCategoria
      return matchSearch && matchCat
    })
  }, [produtosList, searchTerm, selectedCategoria])

  // ── Catalog interaction ────────────────────────────────────────────────────
  function handleProdutoClick(produto: Produto) {
    if (produto.variacoes.length === 0) return
    if (produto.variacoes.length === 1) {
      addToCart(produto.variacoes[0], produto.nome)
    } else {
      setSelectedProduto(produto)
      setShowVariacaoDialog(true)
    }
  }

  function handleVariacaoSelect(variacao: VariacaoProduto) {
    if (selectedProduto) addToCart(variacao, selectedProduto.nome)
    setShowVariacaoDialog(false)
    setSelectedProduto(null)
  }

  // ── Payment helpers ────────────────────────────────────────────────────────
  function handleTogglePagamento(forma: string) {
    setPagamentos((prev) => {
      const exists = prev.find((p) => p.forma === forma)
      if (exists) return prev.filter((p) => p.forma !== forma)
      const paid = prev.reduce((s, p) => s + p.valor, 0)
      const remaining = Number(Math.max(0, totalLiquido - paid).toFixed(2))
      return [...prev, { forma, valor: remaining }]
    })
  }

  function handleUpdateValor(forma: string, valor: number) {
    setPagamentos((prev) =>
      prev.map((p) => (p.forma === forma ? { ...p, valor } : p)),
    )
  }

  function handleFinalizarVenda() {
    setPagamentos([])
    setShowPagamentoDialog(true)
  }

  function handleConfirmarVenda() {
    if (caixaFechado) {
      toast.error('Caixa fechado. Vendas bloqueadas.')
      return
    }
    const vendaAdegaId = adegaId ?? ''
    if (!vendaAdegaId) {
      toast.error('Selecione uma adega no topo da tela antes de registrar a venda')
      return
    }
    submitVenda({
      adegaId: vendaAdegaId,
      canal: 'PRESENCIAL',
      itens: cart.map((i) => ({
        variacaoId: i.variacaoId,
        quantidade: i.quantidade,
        descontoValor: i.descontoValor,
      })),
      pagamentos,
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {caixaFechado && (
        <div className="flex items-center gap-3 bg-red-50 border-b border-red-200 px-4 py-2.5 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">
            Caixa fechado. Novas vendas bloqueadas. Solicite ao responsável para reabrir o caixa.
          </span>
          {isDono() && (
            <Link to="/caixa" className="text-xs font-semibold underline hover:text-red-900 shrink-0">
              → Ir para Fechamento de Caixa
            </Link>
          )}
        </div>
      )}
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

        {/* ── LEFT: Catalog ── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-gray-50">

          {/* Search + category filters */}
          <div className="bg-white border-b px-4 pt-4 pb-3 space-y-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {(['all', ...categoriaNames] as string[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoria(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                    selectedCategoria === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'all' ? 'Todas' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadingProdutos ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : filteredProdutos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">Nenhum produto encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProdutos.map((produto) => {
                  const first = produto.variacoes[0]
                  return (
                    <button
                      key={produto.id}
                      onClick={() => handleProdutoClick(produto)}
                      className="bg-white rounded-xl border border-gray-200 p-3 text-left hover:border-blue-400 hover:shadow-md transition-all active:scale-[0.98] flex flex-col"
                    >
                      <p className="font-medium text-gray-900 text-sm leading-snug mb-1 line-clamp-2">
                        {produto.nome}
                      </p>
                      {first && (
                        <p className="text-xs text-gray-500 mb-2">{fmt(first.precoVenda)}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {produto.variacoes.map((v, i) => (
                          <span
                            key={v.id}
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              BADGE_COLORS[i % BADGE_COLORS.length]
                            }`}
                          >
                            {v.descricao}
                          </span>
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Cart ── */}
        <div className="w-80 shrink-0 bg-white border-l flex flex-col overflow-hidden">

          {/* Cart header */}
          <div className="px-4 py-3 border-b flex items-center gap-2 shrink-0">
            <ShoppingCart className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-gray-900 text-sm">Carrinho</span>
            {cart.length > 0 && (
              <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                <ShoppingCart className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">Nenhum item adicionado</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.variacaoId} className="bg-gray-50 rounded-xl p-3 relative">
                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.variacaoId)}
                    className="absolute top-2 right-2 p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Name */}
                  <p className="text-xs font-semibold text-gray-900 pr-5 leading-tight">
                    {item.produtoNome}
                  </p>
                  <p className="text-[11px] text-gray-500 mb-2">{item.variacaoDescricao}</p>

                  {/* Qty controls + line total */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantidade(item.variacaoId, -1)}
                        disabled={item.quantidade <= 1}
                        className="w-6 h-6 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                      >
                        <Minus className="w-3 h-3 text-gray-600" />
                      </button>
                      <span className="w-7 text-center text-sm font-bold text-gray-900">
                        {item.quantidade}
                      </span>
                      <button
                        onClick={() => updateQuantidade(item.variacaoId, 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-3 h-3 text-gray-600" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {fmt(item.precoUnitario * item.quantidade)}
                    </span>
                  </div>

                  {/* Discount input */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] text-gray-500 shrink-0">Desconto:</span>
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 pointer-events-none">
                        R$
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.descontoValor || ''}
                        onChange={(e) =>
                          updateDesconto(
                            item.variacaoId,
                            Math.max(0, parseFloat(e.target.value) || 0),
                          )
                        }
                        placeholder="0,00"
                        className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart footer */}
          <div className="border-t p-4 space-y-2 shrink-0">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{fmt(totalBruto)}</span>
            </div>

            {totalDesconto > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-red-500">Desconto</span>
                <span className="text-red-500">− {fmt(totalDesconto)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>{fmt(totalLiquido)}</span>
            </div>

            <button
              onClick={handleFinalizarVenda}
              disabled={cart.length === 0 || caixaFechado}
              className="w-full mt-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-100 disabled:text-gray-400 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              Finalizar Venda
            </button>

            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="w-full border border-gray-200 hover:bg-gray-50 disabled:opacity-30 text-gray-600 py-2 rounded-xl text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* ── Dialogs ── */}
      {showVariacaoDialog && selectedProduto && (
        <VariacaoDialog
          produto={selectedProduto}
          onSelect={handleVariacaoSelect}
          onClose={() => {
            setShowVariacaoDialog(false)
            setSelectedProduto(null)
          }}
        />
      )}

      {showPagamentoDialog && (
        <PagamentoDialog
          totalLiquido={totalLiquido}
          pagamentos={pagamentos}
          isLoading={isCreatingVenda}
          caixaFechado={caixaFechado}
          onTogglePagamento={handleTogglePagamento}
          onUpdateValor={handleUpdateValor}
          onConfirmar={handleConfirmarVenda}
          onClose={() => {
            if (!isCreatingVenda) setShowPagamentoDialog(false)
          }}
        />
      )}
    </>
  )
}
