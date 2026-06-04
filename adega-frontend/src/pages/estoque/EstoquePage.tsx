import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Search, Plus, History, Loader2, X, PackageOpen, SlidersHorizontal } from 'lucide-react'
import { estoque as estoqueApi } from '../../services/api'
import type { EstoqueItem, MovimentoEstoque } from '../../types'
import { useAuth } from '../../hooks/useAuth'

// ─── Utils ────────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDate = (iso: string) => {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('pt-BR') +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  )
}

const optPosNum = z.preprocess(
  (v) =>
    v === '' || v === null || v === undefined || Number.isNaN(v as number)
      ? undefined
      : Number(v),
  z.number().positive().optional(),
)

// ─── Constants ────────────────────────────────────────────────────────────────

const SITUACAO_CONFIG: Record<string, { label: string; badge: string; text: string; dot: string }> = {
  CRITICO: {
    label: 'Crítico',
    badge: 'bg-red-100 text-red-700',
    text: 'text-red-600',
    dot: 'bg-red-500',
  },
  BAIXO: {
    label: 'Baixo',
    badge: 'bg-amber-100 text-amber-700',
    text: 'text-amber-600',
    dot: 'bg-amber-500',
  },
  OK: {
    label: 'Ok',
    badge: 'bg-green-100 text-green-700',
    text: 'text-green-600',
    dot: 'bg-green-500',
  },
}

const TIPO_CONFIG: Record<string, { label: string; badge: string; sign: string }> = {
  COMPRA: { label: 'Compra', badge: 'bg-green-100 text-green-700', sign: '+' },
  VENDA:  { label: 'Venda',  badge: 'bg-blue-100 text-blue-700',   sign: '−' },
  AJUSTE: { label: 'Ajuste', badge: 'bg-amber-100 text-amber-700', sign: '±' },
  PERDA:  { label: 'Perda',  badge: 'bg-red-100 text-red-700',     sign: '−' },
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const entradaSchema = z.object({
  variacaoId: z.string().min(1, 'Selecione uma variação'),
  quantidade: z.coerce.number().int().min(1, 'Mínimo 1'),
  custoAquisicao: optPosNum,
  observacao: z.string().optional(),
})

type EntradaForm = z.infer<typeof entradaSchema>

// ─── EntradaDialog ────────────────────────────────────────────────────────────

interface EntradaDialogProps {
  estoqueList: EstoqueItem[]
  preSelected: EstoqueItem | null
  isDono: boolean
  onClose: () => void
  onSubmit: (data: EntradaForm) => void
  isLoading: boolean
}

function EntradaDialog({
  estoqueList,
  preSelected,
  isDono,
  onClose,
  onSubmit,
  isLoading,
}: EntradaDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EntradaForm>({
    resolver: zodResolver(entradaSchema) as any,
    defaultValues: {
      variacaoId: preSelected?.variacaoId ?? '',
      quantidade: 1,
      observacao: '',
    },
  })

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Registrar Entrada</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Variacao select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Variação</label>
            <select
              {...register('variacaoId')}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma variação</option>
              {estoqueList.map((item) => (
                <option key={item.variacaoId} value={item.variacaoId}>
                  {item.produtoNome} — {item.variacaoDescricao}
                </option>
              ))}
            </select>
            {errors.variacaoId && (
              <p className="text-red-500 text-xs mt-1">{errors.variacaoId.message}</p>
            )}
          </div>

          {/* Quantidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
            <input
              type="number"
              min={1}
              {...register('quantidade', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.quantidade && (
              <p className="text-red-500 text-xs mt-1">{errors.quantidade.message}</p>
            )}
          </div>

          {/* Custo unitário (DONO only) */}
          {isDono && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custo unitário (opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('custoAquisicao', { valueAsNumber: true })}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                />
              </div>
              {errors.custoAquisicao && (
                <p className="text-red-500 text-xs mt-1">{errors.custoAquisicao.message}</p>
              )}
            </div>
          )}

          {/* Observacao */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observação (opcional)
            </label>
            <textarea
              {...register('observacao')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Ex: Compra fornecedor X"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── HistoricoDialog ──────────────────────────────────────────────────────────

interface HistoricoDialogProps {
  item: EstoqueItem
  onClose: () => void
}

function HistoricoDialog({ item, onClose }: HistoricoDialogProps) {
  const { data: historico = [], isLoading } = useQuery<MovimentoEstoque[]>({
    queryKey: ['historico', item.variacaoId],
    queryFn: () => estoqueApi.getHistorico(item.variacaoId),
  })

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Histórico</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {item.produtoNome} · {item.variacaoDescricao}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))
          ) : historico.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <PackageOpen className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Nenhuma movimentação registrada</p>
            </div>
          ) : (
            historico.map((m) => {
              const cfg = TIPO_CONFIG[m.tipo] ?? {
                label: m.tipo,
                badge: 'bg-gray-100 text-gray-600',
                sign: '',
              }
              return (
                <div
                  key={m.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50"
                >
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${cfg.badge}`}
                  >
                    {cfg.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">
                        {cfg.sign} {m.quantidade}
                      </span>
                      <span className="text-xs text-gray-400">{fmtDate(m.dataHora)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{m.usuarioNome}</p>
                    {m.observacao && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{m.observacao}</p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ─── AjusteDialog ─────────────────────────────────────────────────────────────

const ajusteSchema = z.object({
  novaQuantidade: z.coerce.number().int().min(0, 'Informe um valor válido'),
  observacao: z.string().optional(),
})

type AjusteForm = z.infer<typeof ajusteSchema>

interface AjusteDialogProps {
  item: EstoqueItem
  onClose: () => void
  onSubmit: (data: AjusteForm) => void
  isLoading: boolean
}

function AjusteDialog({ item, onClose, onSubmit, isLoading }: AjusteDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AjusteForm>({
    resolver: zodResolver(ajusteSchema) as any,
    defaultValues: {
      novaQuantidade: item.estoqueAtual,
      observacao: '',
    },
  })

  const cfg = SITUACAO_CONFIG[item.situacao]
  const nova = watch('novaQuantidade')
  const novaNum = typeof nova === 'number' && !Number.isNaN(nova) ? nova : undefined
  const diff = novaNum !== undefined ? novaNum - item.estoqueAtual : 0
  const isReducao = novaNum !== undefined && diff < 0

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-gray-900">Ajuste de Estoque</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          {item.produtoNome} · {item.variacaoDescricao}
        </p>

        {/* Info box (read-only) */}
        <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-4">
          <span className="text-sm text-gray-600">
            Estoque atual:{' '}
            <span className="font-semibold text-gray-900">{item.estoqueAtual}</span> unidades
          </span>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg?.badge ?? 'bg-gray-100 text-gray-500'}`}
          >
            {cfg?.label ?? item.situacao}
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nova quantidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova quantidade
            </label>
            <input
              type="number"
              min={0}
              {...register('novaQuantidade', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Informe a quantidade real contada no estoque físico
            </p>
            {errors.novaQuantidade && (
              <p className="text-red-500 text-xs mt-1">{errors.novaQuantidade.message}</p>
            )}
            {/* Difference preview */}
            {novaNum !== undefined && (
              <p
                className={`text-xs font-semibold mt-1.5 ${
                  diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500'
                }`}
              >
                {diff > 0
                  ? `+ ${diff} unidades (entrada)`
                  : diff < 0
                    ? `- ${Math.abs(diff)} unidades (saída)`
                    : 'Sem alteração'}
              </p>
            )}
          </div>

          {/* Observacao */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo do ajuste
            </label>
            <textarea
              {...register('observacao')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Ex: Contagem física, produto vencido, quebra..."
            />
          </div>

          {/* Warning (saída) */}
          {isReducao && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-amber-700">
                Atenção: reduzir o estoque criará um movimento de saída no histórico.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Confirmar Ajuste
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── EstoquePage ──────────────────────────────────────────────────────────────

export default function EstoquePage() {
  const queryClient = useQueryClient()
  const { isDono } = useAuth()

  const [selectedAdega, setSelectedAdega] = useState<string | null>(
    localStorage.getItem('selected_adega'),
  )
  const [filterSituacao, setFilterSituacao] = useState('all')
  const [filterCategoria, setFilterCategoria] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showEntradaDialog, setShowEntradaDialog] = useState(false)
  const [selectedVariacao, setSelectedVariacao] = useState<EstoqueItem | null>(null)
  const [showHistoricoDialog, setShowHistoricoDialog] = useState(false)
  const [historicoItem, setHistoricoItem] = useState<EstoqueItem | null>(null)
  const [showAjusteDialog, setShowAjusteDialog] = useState(false)
  const [ajusteItem, setAjusteItem] = useState<EstoqueItem | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      setSelectedAdega((e as CustomEvent<string | null>).detail)
    }
    window.addEventListener('adegaChanged', handler)
    return () => window.removeEventListener('adegaChanged', handler)
  }, [])

  const { data: estoqueList = [], isLoading } = useQuery<EstoqueItem[]>({
    queryKey: ['estoque', selectedAdega],
    queryFn: () => estoqueApi.getEstoque({ adegaId: selectedAdega ?? undefined }),
  })

  const { mutate: registrarEntrada, isPending: isRegistrando } = useMutation({
    mutationFn: estoqueApi.registrarEntrada,
    onSuccess: () => {
      toast.success('Entrada registrada com sucesso!')
      setShowEntradaDialog(false)
      setSelectedVariacao(null)
      queryClient.invalidateQueries({ queryKey: ['estoque'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao registrar entrada')
    },
  })

  const { mutate: ajustarEstoque, isPending: isAjustando } = useMutation({
    mutationFn: estoqueApi.ajusteEstoque,
    onSuccess: () => {
      toast.success('Estoque ajustado com sucesso')
      setShowAjusteDialog(false)
      setAjusteItem(null)
      queryClient.invalidateQueries({ queryKey: ['estoque'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao ajustar estoque')
    },
  })

  // ── Derived data ────────────────────────────────────────────────────────────
  const counts = useMemo(
    () => ({
      CRITICO: estoqueList.filter((i) => i.situacao === 'CRITICO').length,
      BAIXO: estoqueList.filter((i) => i.situacao === 'BAIXO').length,
      OK: estoqueList.filter((i) => i.situacao === 'OK').length,
    }),
    [estoqueList],
  )

  const categoriaNames = useMemo(
    () => Array.from(new Set(estoqueList.map((i) => i.categoriaNome))).sort(),
    [estoqueList],
  )

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return estoqueList.filter((item) => {
      const matchSearch =
        item.produtoNome.toLowerCase().includes(term) ||
        item.variacaoDescricao.toLowerCase().includes(term)
      const matchCat =
        filterCategoria === 'all' || item.categoriaNome === filterCategoria
      const matchSit = filterSituacao === 'all' || item.situacao === filterSituacao
      return matchSearch && matchCat && matchSit
    })
  }, [estoqueList, searchTerm, filterCategoria, filterSituacao])

  function openEntrada(item?: EstoqueItem) {
    setSelectedVariacao(item ?? null)
    setShowEntradaDialog(true)
  }

  function openHistorico(item: EstoqueItem) {
    setHistoricoItem(item)
    setShowHistoricoDialog(true)
  }

  function openAjuste(item: EstoqueItem) {
    setAjusteItem(item)
    setShowAjusteDialog(true)
  }

  return (
    <>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Estoque</h1>
          <button
            onClick={() => openEntrada()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Registrar Entrada
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar produto ou variação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas categorias</option>
            {categoriaNames.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={filterSituacao}
            onChange={(e) => setFilterSituacao(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos</option>
            <option value="CRITICO">Crítico</option>
            <option value="BAIXO">Baixo</option>
            <option value="OK">Ok</option>
          </select>
        </div>

        {/* Summary pills */}
        <div className="flex gap-3 flex-wrap">
          {Object.entries(SITUACAO_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilterSituacao(filterSituacao === key ? 'all' : key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filterSituacao === key
                  ? cfg.badge + ' border-transparent'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {cfg.label}: {counts[key as keyof typeof counts]}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Produto
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Variação
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Categoria
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Estoque
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Mínimo
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Situação
                  </th>
                  {isDono() && (
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Custo Unit.
                    </th>
                  )}
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: isDono() ? 8 : 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isDono() ? 8 : 7}
                      className="text-center py-12 text-gray-400 text-sm"
                    >
                      Nenhum item encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const cfg = SITUACAO_CONFIG[item.situacao]
                    return (
                      <tr
                        key={item.variacaoId}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {item.produtoNome}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{item.variacaoDescricao}</td>
                        <td className="px-4 py-3 text-gray-500">{item.categoriaNome}</td>
                        <td className={`px-4 py-3 text-right font-bold ${cfg?.text ?? ''}`}>
                          {item.estoqueAtual}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {item.estoqueMinimo}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg?.badge ?? 'bg-gray-100 text-gray-500'}`}
                          >
                            {cfg?.label ?? item.situacao}
                          </span>
                        </td>
                        {isDono() && (
                          <td className="px-4 py-3 text-right text-gray-600">
                            {item.custoAquisicao != null ? fmt(item.custoAquisicao) : '—'}
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEntrada(item)}
                              className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              Entrada
                            </button>
                            <button
                              onClick={() => openHistorico(item)}
                              title="Ver histórico"
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            {isDono() && (
                              <button
                                onClick={() => openAjuste(item)}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                Ajuste
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {showEntradaDialog && (
        <EntradaDialog
          estoqueList={estoqueList}
          preSelected={selectedVariacao}
          isDono={isDono()}
          onClose={() => {
            setShowEntradaDialog(false)
            setSelectedVariacao(null)
          }}
          onSubmit={(data) => {
            registrarEntrada({
              variacaoId: data.variacaoId,
              quantidade: data.quantidade,
              custoAquisicao:
                data.custoAquisicao && !Number.isNaN(data.custoAquisicao)
                  ? data.custoAquisicao
                  : undefined,
              observacao: data.observacao || undefined,
            })
          }}
          isLoading={isRegistrando}
        />
      )}

      {showHistoricoDialog && historicoItem && (
        <HistoricoDialog
          item={historicoItem}
          onClose={() => {
            setShowHistoricoDialog(false)
            setHistoricoItem(null)
          }}
        />
      )}

      {showAjusteDialog && ajusteItem && (
        <AjusteDialog
          item={ajusteItem}
          onClose={() => {
            setShowAjusteDialog(false)
            setAjusteItem(null)
          }}
          onSubmit={(data) => {
            ajustarEstoque({
              variacaoId: ajusteItem.variacaoId,
              novaQuantidade: data.novaQuantidade,
              observacao: data.observacao || undefined,
            })
          }}
          isLoading={isAjustando}
        />
      )}
    </>
  )
}
