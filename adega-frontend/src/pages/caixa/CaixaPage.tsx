import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ShoppingBag,
  Tag,
  DollarSign,
  X,
  FileSpreadsheet,
  FileText,
} from 'lucide-react'
import { caixa as caixaApi, dashboard as dashboardApi } from '../../services/api'
import type { FechamentoCaixa } from '../../types'
import { exportFechamentoCSV, exportFechamentoPDF } from '../../utils/exportUtils'
import { useAuth } from '../../hooks/useAuth'
import { fmtDate, TZ } from '../../utils/dateUtils'

const SELECTED_ADEGA_KEY = 'selected_adega'
const todayISO = new Date().toISOString().split('T')[0]
const todayDisplay = new Date().toLocaleDateString('pt-BR', { timeZone: TZ })

const fmt = (v: number) =>
  (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const FORMA_LABELS: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'PIX',
  DEBITO: 'Débito',
  CREDITO: 'Crédito',
  VALE: 'Vale',
  CARTAO: 'Cartão',
}

// ——— Confirm Dialog ———

interface ConfirmDialogProps {
  caixaAberto: FechamentoCaixa | undefined
  diferenca: number
  dinheiroContado: number
  observacao: string
  isLoading: boolean
  onConfirm: () => void
  onClose: () => void
}

function ConfirmDialog({
  caixaAberto,
  diferenca,
  dinheiroContado,
  observacao,
  isLoading,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const liquido = (caixaAberto?.totalFaturamento ?? 0) - (caixaAberto?.totalDescontos ?? 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Confirmar Fechamento</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="text-sm divide-y divide-gray-100">
          {(
            [
              ['Total de Vendas', `${caixaAberto?.totalVendas ?? 0} vendas`, ''],
              ['Faturamento Bruto', fmt(caixaAberto?.totalFaturamento ?? 0), ''],
              ['Descontos', `- ${fmt(caixaAberto?.totalDescontos ?? 0)}`, 'text-red-600'],
              ['Faturamento Líquido', fmt(liquido), 'text-green-600'],
              ['Dinheiro (sistema)', fmt(caixaAberto?.totalDinheiro ?? 0), ''],
              ['Dinheiro (contado)', fmt(dinheiroContado), ''],
            ] as [string, string, string][]
          ).map(([label, value, cls]) => (
            <div key={label} className="flex justify-between py-2">
              <span className="text-gray-500">{label}</span>
              <span className={`font-medium ${cls}`}>{value}</span>
            </div>
          ))}
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Diferença</span>
            <span
              className={`font-semibold ${diferenca === 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {diferenca === 0 ? 'Sem diferença' : fmt(diferenca)}
            </span>
          </div>
        </div>

        {diferenca !== 0 && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <span>
              Diferença de <strong>{fmt(diferenca)}</strong> será registrada no fechamento.
            </span>
          </div>
        )}

        {observacao && (
          <p className="text-sm text-gray-500 italic">Obs: {observacao}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2 bg-red-600 rounded-lg text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Fechando...' : 'Confirmar Fechamento'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ——— Main Page ———

export default function CaixaPage() {
  const queryClient = useQueryClient()
  const { getUser, isDono } = useAuth()
  const user = getUser()

  const getSelectedAdega = (): string | null => {
    if (isDono()) return localStorage.getItem(SELECTED_ADEGA_KEY)
    return user?.adegaId || null
  }

  const [selectedAdega, setSelectedAdega] = useState<string | null>(getSelectedAdega)
  const [dinheiroContado, setDinheiroContado] = useState(0)
  const [observacao, setObservacao] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  useEffect(() => {
    if (!isDono()) return
    const handler = () => setSelectedAdega(localStorage.getItem(SELECTED_ADEGA_KEY))
    window.addEventListener('adegaChanged', handler)
    return () => window.removeEventListener('adegaChanged', handler)
  }, [])

  const { data: caixaAberto, isLoading: loadingCaixa } = useQuery({
    queryKey: ['caixaAberto', selectedAdega],
    queryFn: () => caixaApi.getCaixaAberto(selectedAdega!),
    enabled: !!selectedAdega,
    retry: false,
  })

  const { data: historico, isLoading: loadingHistorico } = useQuery({
    queryKey: ['historicoCaixa', selectedAdega],
    queryFn: () => caixaApi.getHistoricoCaixa(selectedAdega!),
    enabled: !!selectedAdega,
    retry: false,
  })

  const { data: dashData } = useQuery({
    queryKey: ['dashboard', selectedAdega, todayISO],
    queryFn: () => dashboardApi.getDashboard({ adegaId: selectedAdega!, data: todayISO }),
    enabled: !!selectedAdega,
    retry: false,
  })

  const fecharMutation = useMutation({
    mutationFn: caixaApi.fecharCaixa,
    onSuccess: () => {
      toast.success('Caixa fechado com sucesso!')
      setShowConfirmDialog(false)
      queryClient.invalidateQueries({ queryKey: ['caixaAberto', selectedAdega] })
      queryClient.invalidateQueries({ queryKey: ['historicoCaixa', selectedAdega] })
    },
    onError: () => {
      toast.error('Erro ao fechar o caixa.')
    },
  })

  // Backend returns id=null when caixa is not yet closed for today
  const isClosed = !!(caixaAberto as any)?.id

  const diferenca = dinheiroContado - (caixaAberto?.totalDinheiro ?? 0)

  const pagamentosDisplay: { forma: string; valor: number }[] = dashData?.pagamentosPorForma
    ? Object.entries(dashData.pagamentosPorForma)
        .filter(([, v]) => v > 0)
        .map(([forma, valor]) => ({ forma, valor }))
    : caixaAberto
    ? [
        { forma: 'DINHEIRO', valor: caixaAberto.totalDinheiro },
        { forma: 'PIX', valor: caixaAberto.totalPix },
        { forma: 'CARTAO', valor: caixaAberto.totalCartao },
        { forma: 'VALE', valor: caixaAberto.totalBeneficio },
      ].filter((p) => p.valor > 0)
    : []

  const totalPagamentos = pagamentosDisplay.reduce((s, p) => s + p.valor, 0)

  function handleFechar() {
    if (!selectedAdega) return
    fecharMutation.mutate({ adegaId: selectedAdega, dinheiroContado, observacao })
  }

  if (!selectedAdega && isDono()) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Fechamento de Caixa</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center text-blue-700">
          Selecione uma adega no topo para ver o fechamento.
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fechamento de Caixa</h1>
          <p className="text-sm text-gray-500 mt-1">{todayDisplay}</p>
        </div>

        {/* Closed banner */}
        {isClosed && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 text-green-800">
            <CheckCircle size={20} className="flex-shrink-0" />
            <span>
              Caixa fechado em{' '}
              <strong>{caixaAberto?.data ? fmtDate(caixaAberto.data) : todayDisplay}</strong> por{' '}
              <strong>{caixaAberto?.usuarioNome ?? '—'}</strong>.
            </span>
          </div>
        )}

        {/* Metrics */}
        {loadingCaixa ? (
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-5 h-24 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <ShoppingBag size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Vendas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {caixaAberto?.totalVendas ?? 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <TrendingUp size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Faturamento Bruto</p>
                  <p className="text-xl font-bold text-gray-900">
                    {fmt(caixaAberto?.totalFaturamento ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <Tag size={20} className="text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Descontos</p>
                  <p className="text-xl font-bold text-red-500">
                    - {fmt(caixaAberto?.totalDescontos ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <DollarSign size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Faturamento Líquido</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {fmt(
                      (caixaAberto?.totalFaturamento ?? 0) -
                        (caixaAberto?.totalDescontos ?? 0),
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Two-column row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Payment summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Resumo por Forma de Pagamento
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="text-left pb-2 font-medium">Forma</th>
                  <th className="text-right pb-2 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {pagamentosDisplay.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-6 text-center text-gray-400">
                      Sem pagamentos hoje
                    </td>
                  </tr>
                ) : (
                  pagamentosDisplay.map(({ forma, valor }) => (
                    <tr key={forma} className="border-b border-gray-50">
                      <td className="py-2 text-gray-700">
                        {FORMA_LABELS[forma] ?? forma}
                      </td>
                      <td className="py-2 text-right font-medium text-gray-900">
                        {fmt(valor)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {pagamentosDisplay.length > 0 && (
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td className="pt-2 font-semibold text-gray-900">Total</td>
                    <td className="pt-2 text-right font-bold text-gray-900">
                      {fmt(totalPagamentos)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Top 5 products */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Top 5 Produtos do Dia
            </h2>
            {dashData?.topProdutos && dashData.topProdutos.length > 0 ? (
              <ol className="space-y-3">
                {dashData.topProdutos.slice(0, 5).map((p, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.nome}</p>
                      <p className="text-xs text-gray-500">{p.variacao}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">{p.quantidade}×</p>
                      <p className="text-xs text-gray-500">{fmt(p.totalValor)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-center text-gray-400 text-sm py-6">Sem vendas hoje</p>
            )}
          </div>
        </div>

        {/* Conferência */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Conferência do Caixa</h2>

          <div className="grid grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Sistema aponta (dinheiro)
              </label>
              <input
                readOnly
                value={fmt(caixaAberto?.totalDinheiro ?? 0)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 cursor-default"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sua contagem</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={dinheiroContado}
                onChange={(e) => setDinheiroContado(Number(e.target.value))}
                disabled={isClosed}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div className="pb-2">
              {diferenca === 0 ? (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle size={16} />
                  Sem diferença ✓
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                  <AlertTriangle size={16} />
                  Diferença: {fmt(diferenca)}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Observação</label>
            <textarea
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              disabled={isClosed}
              placeholder="Observações sobre o fechamento..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowConfirmDialog(true)}
              disabled={isClosed || (caixaAberto?.totalVendas ?? 0) === 0 || loadingCaixa}
              className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Fechar Caixa do Dia
            </button>
          </div>
        </div>

        {/* Histórico */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Histórico de Fechamentos
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportFechamentoCSV(historico ?? [])}
                disabled={(historico ?? []).length === 0}
                className="flex items-center gap-2 px-3 py-1.5 border border-green-200 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet size={16} />
                CSV
              </button>
              <button
                onClick={() => exportFechamentoPDF(historico ?? [])}
                disabled={(historico ?? []).length === 0}
                className="flex items-center gap-2 px-3 py-1.5 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={16} />
                PDF
              </button>
            </div>
          </div>
          {loadingHistorico ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (historico ?? []).length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">
              Nenhum fechamento registrado.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="text-left pb-2 font-medium">Data</th>
                  <th className="text-right pb-2 font-medium">Faturamento</th>
                  <th className="text-right pb-2 font-medium">Vendas</th>
                  <th className="text-right pb-2 font-medium">Descontos</th>
                  <th className="text-right pb-2 font-medium">Diferença</th>
                  <th className="text-left pb-2 font-medium">Fechado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(historico ?? []).map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="py-2 text-gray-700">{fmtDate(h.data)}</td>
                    <td className="py-2 text-right font-medium text-gray-900">
                      {fmt(h.totalFaturamento)}
                    </td>
                    <td className="py-2 text-right text-gray-700">{h.totalVendas}</td>
                    <td className="py-2 text-right text-red-500">- {fmt(h.totalDescontos)}</td>
                    <td className="py-2 text-right">
                      {h.diferenca === 0 ? (
                        <span className="text-green-600 text-xs font-medium">Ok</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          {fmt(h.diferenca)}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-gray-700">{h.usuarioNome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showConfirmDialog && (
        <ConfirmDialog
          caixaAberto={caixaAberto}
          diferenca={diferenca}
          dinheiroContado={dinheiroContado}
          observacao={observacao}
          isLoading={fecharMutation.isPending}
          onConfirm={handleFechar}
          onClose={() => {
            if (!fecharMutation.isPending) setShowConfirmDialog(false)
          }}
        />
      )}
    </>
  )
}
