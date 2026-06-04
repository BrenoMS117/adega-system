import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  ShoppingCart,
  Tag,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { dashboard as dashboardApi } from '../../services/api'
import type { DashboardData } from '../../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const FORMA_CONFIG: Record<string, { label: string; bar: string; bg: string; text: string }> = {
  DINHEIRO: { label: 'Dinheiro', bar: 'bg-emerald-500', bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  PIX:      { label: 'Pix',      bar: 'bg-sky-500',     bg: 'bg-sky-50',      text: 'text-sky-700'     },
  DEBITO:   { label: 'Débito',   bar: 'bg-violet-500',  bg: 'bg-violet-50',   text: 'text-violet-700'  },
  CREDITO:  { label: 'Crédito',  bar: 'bg-orange-500',  bg: 'bg-orange-50',   text: 'text-orange-700'  },
  VALE:     { label: 'Vale',     bar: 'bg-pink-500',    bg: 'bg-pink-50',     text: 'text-pink-700'    },
}

// ─── Utils ────────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtAbbr = (v: number) =>
  v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${v.toFixed(0)}`

const today = () => new Date().toISOString().split('T')[0]

const truncate = (s: string, n: number) =>
  s.length > n ? s.slice(0, n - 1) + '…' : s

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 animate-pulse ${className}`}>
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
    </div>
  )
}

function SkeletonChart({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 animate-pulse ${className}`}>
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
      <div className="h-48 bg-gray-100 rounded-xl" />
    </div>
  )
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string
  value: string
  subtitle: string
  icon: React.ReactNode
  valueClass?: string
}

function MetricCard({ label, value, subtitle, icon, valueClass = 'text-gray-900' }: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className="p-2 bg-gray-50 rounded-xl text-gray-400">{icon}</div>
      </div>
      <p className={`text-2xl font-bold leading-none ${valueClass}`}>{value}</p>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  )
}

// ─── Custom Tooltips ─────────────────────────────────────────────────────────

function TopProdutosTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-900 mb-1">{d.fullNome}</p>
      <p className="text-gray-500 text-xs mb-2">{d.fullVariacao}</p>
      <p className="text-gray-700">Quantidade: <span className="font-semibold">{d.quantidade}</span></p>
      <p className="text-gray-700">Total: <span className="font-semibold text-blue-600">{fmt(d.totalValor)}</span></p>
    </div>
  )
}

function VendasHoraTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-700">{d.hora}h</p>
      <p className="text-emerald-600 font-bold">{fmt(d.valor)}</p>
    </div>
  )
}

// ─── DashboardPage ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [selectedAdega, setSelectedAdega] = useState<string | null>(
    localStorage.getItem('selected_adega'),
  )
  const [selectedDate, setSelectedDate] = useState<string>(today())

  // React to adega changes from the Layout pill selector
  useEffect(() => {
    function handler(e: Event) {
      const id = (e as CustomEvent<string | null>).detail
      setSelectedAdega(id)
    }
    window.addEventListener('adegaChanged', handler)
    return () => window.removeEventListener('adegaChanged', handler)
  }, [])

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<DashboardData>({
    queryKey: ['dashboard', selectedAdega, selectedDate],
    queryFn: () =>
      dashboardApi.getDashboard({
        adegaId: selectedAdega ?? undefined,
        data: selectedDate,
      }),
    enabled: !!selectedAdega,
    staleTime: 60_000,
  })

  // ── Derived data ────────────────────────────────────────────────────────────
  const topProdutosData = (data?.topProdutos ?? []).map((p) => ({
    name: truncate(`${p.nome} — ${p.variacao}`, 22),
    quantidade: p.quantidade,
    totalValor: p.totalValor,
    fullNome: p.nome,
    fullVariacao: p.variacao,
  }))

  const vendasPorHoraData = Object.entries(data?.vendasPorHora ?? {})
    .map(([hora, valor]) => ({ hora: parseInt(hora), valor: valor as number }))
    .sort((a, b) => a.hora - b.hora)

  const pagamentosEntries = Object.entries(data?.pagamentosPorForma ?? {})
  const maxPagamento = Math.max(...pagamentosEntries.map(([, v]) => v as number), 1)

  const totalDescontoVendas = (data?.descontosPorFuncionario ?? []).reduce(
    (s, d) => s + d.qtdVendas,
    0,
  )

  // ── No adega selected ───────────────────────────────────────────────────────
  if (!selectedAdega) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <BarChart className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">Selecione uma adega no topo da tela para ver o dashboard</p>
        </div>
      </div>
    )
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="p-6">
        <PageHeader selectedDate={selectedDate} onDateChange={setSelectedDate} />
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
          <AlertTriangle className="w-12 h-12 text-red-400" />
          <p className="text-sm text-gray-500">Erro ao carregar dashboard</p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  // ── Loading state ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader selectedDate={selectedDate} onDateChange={setSelectedDate} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <SkeletonChart className="col-span-2" />
          <SkeletonChart />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <SkeletonChart />
      </div>
    )
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (data && data.totalVendas === 0) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader selectedDate={selectedDate} onDateChange={setSelectedDate} />
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-2">
          <ShoppingCart className="w-12 h-12 opacity-20" />
          <p className="text-sm">Nenhuma venda registrada hoje</p>
        </div>
      </div>
    )
  }

  // ── Full render ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      <PageHeader selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {/* ── Metrics row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Faturamento"
          value={fmt(data!.totalFaturamento)}
          subtitle="faturamento líquido"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <MetricCard
          label="Vendas"
          value={String(data!.totalVendas)}
          subtitle="transações no dia"
          icon={<ShoppingCart className="w-4 h-4" />}
        />
        <MetricCard
          label="Ticket Médio"
          value={fmt(data!.ticketMedio)}
          subtitle="valor médio por venda"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <MetricCard
          label="Descontos"
          value={fmt(data!.totalDescontos)}
          subtitle={`em ${totalDescontoVendas} venda${totalDescontoVendas !== 1 ? 's' : ''}`}
          icon={<Tag className="w-4 h-4" />}
          valueClass="text-red-500"
        />
      </div>

      {/* ── Charts row 1: top produtos + pagamentos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top produtos — horizontal bar */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Produtos mais vendidos</h2>
          {topProdutosData.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
              Sem dados
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                layout="vertical"
                data={topProdutosData}
                margin={{ left: 8, right: 32, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={155}
                  tick={{ fontSize: 11, fill: '#374151' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<TopProdutosTooltip />} />
                <Bar dataKey="quantidade" fill="#378ADD" radius={[0, 4, 4, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pagamentos recebidos */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Pagamentos recebidos</h2>
          {pagamentosEntries.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">Sem pagamentos</p>
          ) : (
            <div className="space-y-4">
              {pagamentosEntries.map(([forma, valorRaw]) => {
                const valor = valorRaw as number
                const cfg = FORMA_CONFIG[forma] ?? {
                  label: forma,
                  bar: 'bg-gray-500',
                  bg: 'bg-gray-50',
                  text: 'text-gray-700',
                }
                const pct = Math.round((valor / maxPagamento) * 100)
                return (
                  <div key={forma}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">{fmt(valor)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Charts row 2: descontos + estoque crítico ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Descontos por funcionário */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Descontos por funcionário</h2>
          {data!.descontosPorFuncionario.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">Nenhum desconto aplicado hoje</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Funcionário
                  </th>
                  <th className="text-right py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Desconto
                  </th>
                  <th className="text-right py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Vendas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data!.descontosPorFuncionario.map((d) => (
                  <tr key={d.nome} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 text-gray-700 font-medium">{d.nome}</td>
                    <td className="py-2.5 text-right text-red-500 font-semibold">{fmt(d.totalDesconto)}</td>
                    <td className="py-2.5 text-right text-gray-500">{d.qtdVendas}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 font-semibold">
                  <td className="pt-3 text-gray-700">Total</td>
                  <td className="pt-3 text-right text-red-500">
                    {fmt(data!.descontosPorFuncionario.reduce((s, d) => s + d.totalDesconto, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Estoque crítico */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Estoque crítico</h2>
            {data!.estoqueCritico.length > 6 && (
              <Link
                to="/estoque"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver todos →
              </Link>
            )}
          </div>

          {data!.estoqueCritico.length === 0 ? (
            <div className="flex items-center gap-2 py-4 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Estoque sob controle ✓</span>
            </div>
          ) : (
            <div className="space-y-2">
              {data!.estoqueCritico.slice(0, 6).map((item) => (
                <div
                  key={item.variacaoId}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="min-w-0 mr-3">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.produtoNome}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{item.variacaoDescricao}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-gray-900">{item.estoqueAtual}</span>
                    {item.situacao === 'CRITICO' ? (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                        Crítico
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600">
                        Baixo
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Full width: vendas por hora ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Vendas por hora</h2>
        {vendasPorHoraData.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
            Sem dados
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={vendasPorHoraData}
              margin={{ left: 8, right: 8, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="hora"
                tickFormatter={(v) => `${v}h`}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmtAbbr}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip content={<VendasHoraTooltip />} />
              <Bar dataKey="valor" fill="#1D9E75" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

// ─── PageHeader (extracted to avoid repetition in loading/error states) ───────

function PageHeader({
  selectedDate,
  onDateChange,
}: {
  selectedDate: string
  onDateChange: (d: string) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <input
        type="date"
        value={selectedDate}
        max={today()}
        onChange={(e) => onDateChange(e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
    </div>
  )
}
