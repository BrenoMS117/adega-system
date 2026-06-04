import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Eye, X, Loader2, AlertTriangle, Receipt, FileSpreadsheet, FileText } from 'lucide-react'
import { vendas as vendasApi } from '../../services/api'
import type { Venda } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import { exportVendasCSV, exportVendasPDF } from '../../utils/exportUtils'
import { fmtDateTime } from '../../utils/dateUtils'

// ─── Utils ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const todayStr = () => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  ABERTA: { label: 'Aberta', badge: 'bg-amber-100 text-amber-700' },
  CONCLUIDA: { label: 'Concluída', badge: 'bg-green-100 text-green-700' },
  CANCELADA: { label: 'Cancelada', badge: 'bg-red-100 text-red-700' },
}

const CANAL_CONFIG: Record<string, { label: string; badge: string }> = {
  PRESENCIAL: { label: 'Presencial', badge: 'bg-blue-100 text-blue-700' },
  IFOOD: { label: 'iFood', badge: 'bg-orange-100 text-orange-700' },
}

const FORMA_LABEL: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'Pix',
  DEBITO: 'Débito',
  CREDITO: 'Crédito',
  VALE: 'Vale',
}

const statusBadge = (status: string) => STATUS_CONFIG[status] ?? { label: status, badge: 'bg-gray-100 text-gray-600' }
const canalBadge = (canal: string) => CANAL_CONFIG[canal] ?? { label: canal, badge: 'bg-gray-100 text-gray-600' }

// ─── DetalheDialog ──────────────────────────────────────────────────────────

interface DetalheDialogProps {
  venda: Venda
  isDono: boolean
  onClose: () => void
  onCancelar: () => void
}

function DetalheDialog({ venda, isDono, onClose, onCancelar }: DetalheDialogProps) {
  const st = statusBadge(venda.status)
  const cn = canalBadge(venda.canal)
  const podeCancelar = venda.status === 'CONCLUIDA' && isDono
  const qtdTotal = venda.itens.reduce((acc, i) => acc + i.quantidade, 0)

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Venda #{venda.id.slice(0, 8)}
            </h2>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.badge}`}>
              {st.label}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Data/Hora</p>
              <p className="text-gray-900 font-medium">{fmtDateTime(venda.dataHora)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Atendente</p>
              <p className="text-gray-900 font-medium">{venda.usuarioNome}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Adega</p>
              <p className="text-gray-900 font-medium">{venda.adegaNome}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Canal</p>
              <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${cn.badge}`}>
                {cn.label}
              </span>
            </div>
          </div>

          {/* Itens */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Itens</h3>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-3 py-2">Produto</th>
                    <th className="text-left px-3 py-2">Variação</th>
                    <th className="text-right px-3 py-2">Qtd</th>
                    <th className="text-right px-3 py-2">Preço Unit.</th>
                    <th className="text-right px-3 py-2">Desconto</th>
                    <th className="text-right px-3 py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {venda.itens.map((i) => (
                    <tr key={i.id}>
                      <td className="px-3 py-2 font-medium text-gray-900">{i.produtoNome}</td>
                      <td className="px-3 py-2 text-gray-600">{i.variacaoDescricao}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{i.quantidade}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{fmt(i.precoUnitario)}</td>
                      <td className={`px-3 py-2 text-right ${i.descontoValor > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {i.descontoValor > 0 ? `- ${fmt(i.descontoValor)}` : fmt(0)}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">{fmt(i.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-100 text-sm font-semibold text-gray-900">
                    <td className="px-3 py-2" colSpan={2}>Totais</td>
                    <td className="px-3 py-2 text-right">{qtdTotal}</td>
                    <td className="px-3 py-2"></td>
                    <td className="px-3 py-2 text-right text-red-600">
                      {venda.totalDesconto > 0 ? `- ${fmt(venda.totalDesconto)}` : fmt(0)}
                    </td>
                    <td className="px-3 py-2 text-right">{fmt(venda.totalLiquido)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Pagamentos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Pagamentos</h3>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-3 py-2">Forma</th>
                    <th className="text-right px-3 py-2">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {venda.pagamentos.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2 text-gray-700">{FORMA_LABEL[p.forma] ?? p.forma}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">{fmt(p.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totais */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Totais</h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Subtotal bruto</span>
                <span className="text-gray-900 font-medium">{fmt(venda.totalBruto)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Desconto total</span>
                <span className="text-red-600 font-medium">
                  {venda.totalDesconto > 0 ? `- ${fmt(venda.totalDesconto)}` : fmt(0)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-700 font-semibold">Total líquido</span>
                <span className="text-xl font-bold text-gray-900">{fmt(venda.totalLiquido)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-5 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
          {podeCancelar && (
            <button
              onClick={onCancelar}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Cancelar Venda
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── CancelarDialog ───────────────────────────────────────────────────────────

interface CancelarDialogProps {
  venda: Venda
  isLoading: boolean
  onClose: () => void
  onConfirm: () => void
}

function CancelarDialog({ venda, isLoading, onClose, onConfirm }: CancelarDialogProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Cancelar Venda</h2>
        </div>

        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
          Esta ação irá estornar os itens ao estoque. Não pode ser desfeita.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-5">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Venda</span>
            <span className="text-gray-900 font-medium">#{venda.id.slice(0, 8)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Total</span>
            <span className="text-gray-900 font-medium">{fmt(venda.totalLiquido)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Atendente</span>
            <span className="text-gray-900 font-medium">{venda.usuarioNome}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Confirmar Cancelamento
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── VendasPage ─────────────────────────────────────────────────────────────

export default function VendasPage() {
  const queryClient = useQueryClient()
  const { getUser, isDono } = useAuth()
  const user = getUser()

  const getSelectedAdega = (): string | null => {
    if (isDono()) return localStorage.getItem('selected_adega')
    return user?.adegaId || null
  }

  const [selectedAdega, setSelectedAdega] = useState<string | null>(getSelectedAdega)
  const [dataInicio, setDataInicio] = useState(todayStr())
  const [dataFim, setDataFim] = useState(todayStr())
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCanal, setFilterCanal] = useState('all')
  const [selectedVenda, setSelectedVenda] = useState<Venda | null>(null)
  const [showDetalheDialog, setShowDetalheDialog] = useState(false)
  const [showCancelarDialog, setShowCancelarDialog] = useState(false)

  useEffect(() => {
    if (!isDono()) return
    const handler = () => setSelectedAdega(localStorage.getItem('selected_adega'))
    window.addEventListener('adegaChanged', handler)
    return () => window.removeEventListener('adegaChanged', handler)
  }, [])

  const { data: vendaList = [], isLoading, refetch } = useQuery<Venda[]>({
    queryKey: ['vendas', selectedAdega, dataInicio, dataFim, filterStatus, filterCanal],
    queryFn: () =>
      vendasApi.getVendas({
        adegaId: selectedAdega ?? undefined,
        dataInicio,
        dataFim,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        canal: filterCanal !== 'all' ? filterCanal : undefined,
      }),
  })

  const { mutate: cancelarVenda, isPending: isCancelando } = useMutation({
    mutationFn: (id: string) => vendasApi.cancelarVenda(id),
    onSuccess: () => {
      toast.success('Venda cancelada. Estoque estornado.')
      queryClient.invalidateQueries({ queryKey: ['vendas'] })
      setShowCancelarDialog(false)
      setShowDetalheDialog(false)
      setSelectedVenda(null)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao cancelar venda')
    },
  })

  // ── Derived summary ───────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const faturamento = vendaList
      .filter((v) => v.status === 'CONCLUIDA')
      .reduce((acc, v) => acc + v.totalLiquido, 0)
    const canceladas = vendaList.filter((v) => v.status === 'CANCELADA').length
    return { total: vendaList.length, faturamento, canceladas }
  }, [vendaList])

  const colCount = isDono() ? 9 : 8

  function openDetalhe(venda: Venda) {
    setSelectedVenda(venda)
    setShowDetalheDialog(true)
  }

  function openCancelar(venda: Venda) {
    setSelectedVenda(venda)
    setShowCancelarDialog(true)
  }

  return (
    <>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Vendas</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportVendasCSV(vendaList, dataInicio, dataFim)}
              disabled={vendaList.length === 0}
              className="flex items-center gap-2 px-3 py-2 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => exportVendasPDF(vendaList, dataInicio, dataFim)}
              disabled={vendaList.length === 0}
              className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-700 rounded-xl text-sm font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-end gap-3 bg-white border border-gray-100 rounded-2xl p-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Data início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Data fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="CONCLUIDA">Concluída</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Canal</label>
            <select
              value={filterCanal}
              onChange={(e) => setFilterCanal(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="PRESENCIAL">Presencial</option>
              <option value="IFOOD">iFood</option>
            </select>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Search className="w-4 h-4" />
            Buscar
          </button>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total vendas</p>
            <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Faturamento</p>
            <p className="text-2xl font-bold text-gray-900">{fmt(summary.faturamento)}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Canceladas</p>
            <p className={`text-2xl font-bold ${summary.canceladas > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {summary.canceladas}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Data/Hora</th>
                  <th className="text-left px-4 py-3">Atendente</th>
                  {isDono() && <th className="text-left px-4 py-3">Adega</th>}
                  <th className="text-center px-4 py-3">Canal</th>
                  <th className="text-right px-4 py-3">Itens</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-right px-4 py-3">Desconto</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-center px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: colCount }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : vendaList.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="text-center py-12 text-gray-400 text-sm">
                      <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      Nenhuma venda encontrada para o período selecionado
                    </td>
                  </tr>
                ) : (
                  vendaList.map((v) => {
                    const st = statusBadge(v.status)
                    const cn = canalBadge(v.canal)
                    const podeCancelar = v.status === 'CONCLUIDA' && isDono()
                    return (
                      <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtDateTime(v.dataHora)}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{v.usuarioNome}</td>
                        {isDono() && <td className="px-4 py-3 text-gray-500">{v.adegaNome}</td>}
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cn.badge}`}>
                            {cn.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{v.itens.length}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(v.totalLiquido)}</td>
                        <td className={`px-4 py-3 text-right ${v.totalDesconto > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {v.totalDesconto > 0 ? `- ${fmt(v.totalDesconto)}` : fmt(0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.badge}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openDetalhe(v)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver
                            </button>
                            {podeCancelar && (
                              <button
                                onClick={() => openCancelar(v)}
                                className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                Cancelar
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
      {showDetalheDialog && selectedVenda && (
        <DetalheDialog
          venda={selectedVenda}
          isDono={isDono()}
          onClose={() => {
            setShowDetalheDialog(false)
            setSelectedVenda(null)
          }}
          onCancelar={() => setShowCancelarDialog(true)}
        />
      )}

      {showCancelarDialog && selectedVenda && (
        <CancelarDialog
          venda={selectedVenda}
          isLoading={isCancelando}
          onClose={() => setShowCancelarDialog(false)}
          onConfirm={() => cancelarVenda(selectedVenda.id)}
        />
      )}
    </>
  )
}
