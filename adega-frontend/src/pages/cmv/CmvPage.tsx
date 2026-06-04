import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Lightbulb, TrendingUp, TrendingDown, AlertTriangle, BarChart3, FileSpreadsheet, FileText } from 'lucide-react'
import { cmv as cmvApi } from '../../services/api'
import type { CmvData, CmvItem } from '../../types'
import { exportCmvCSV, exportCmvPDF } from '../../utils/exportUtils'

// ─── Utils ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const pct = (v: number) => `${v.toFixed(1)}%`

const pad = (n: number) => String(n).padStart(2, '0')
const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const fmtDate = (ymd: string) => new Date(`${ymd}T12:00:00`).toLocaleDateString('pt-BR')

const firstDayOfMonth = () => {
  const d = new Date()
  return toYMD(new Date(d.getFullYear(), d.getMonth(), 1))
}

const lastMonday = () => {
  const d = new Date()
  const day = d.getDay() // 0 = Sun, 1 = Mon
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  return toYMD(d)
}

// ─── Color helpers ────────────────────────────────────────────────────────────

// CMV%: green < 40, amber 40–60, red > 60
const cmvBadge = (v: number) =>
  v < 40 ? 'bg-green-100 text-green-700' : v <= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'

const cmvText = (v: number) =>
  v < 40 ? 'text-green-600' : v <= 60 ? 'text-amber-600' : 'text-red-600'

// Margem%: green > 40, amber 20–40, red < 20
const margemText = (v: number) =>
  v > 40 ? 'text-green-600' : v >= 20 ? 'text-amber-600' : 'text-red-600'

const valorText = (v: number) => (v >= 0 ? 'text-green-600' : 'text-red-600')

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESETS: { key: string; label: string }[] = [
  { key: 'hoje', label: 'Hoje' },
  { key: 'semana', label: 'Esta semana' },
  { key: 'mes_atual', label: 'Mês atual' },
  { key: 'mes_anterior', label: 'Mês anterior' },
  { key: 'personalizado', label: 'Personalizado' },
]

// ─── CmvPage ──────────────────────────────────────────────────────────────────

export default function CmvPage() {
  const [selectedAdega, setSelectedAdega] = useState<string | null>(
    localStorage.getItem('selected_adega'),
  )
  const [dataInicio, setDataInicio] = useState(firstDayOfMonth())
  const [dataFim, setDataFim] = useState(toYMD(new Date()))
  const [periodoPreset, setPeriodoPreset] = useState('mes_atual')
  const [selectedCategoria, setSelectedCategoria] = useState('all')

  useEffect(() => {
    const handler = (e: Event) => {
      setSelectedAdega((e as CustomEvent<string | null>).detail)
    }
    window.addEventListener('adegaChanged', handler)
    return () => window.removeEventListener('adegaChanged', handler)
  }, [])

  const { data, isLoading, refetch } = useQuery<CmvData>({
    queryKey: ['cmv', selectedAdega, dataInicio, dataFim],
    queryFn: () =>
      cmvApi.getCmv({
        adegaId: selectedAdega || undefined,
        dataInicio,
        dataFim,
      }),
  })

  // ── Period presets ──────────────────────────────────────────────────────────
  function applyPreset(preset: string) {
    setPeriodoPreset(preset)
    const today = new Date()
    if (preset === 'hoje') {
      setDataInicio(toYMD(today))
      setDataFim(toYMD(today))
    } else if (preset === 'semana') {
      setDataInicio(lastMonday())
      setDataFim(toYMD(today))
    } else if (preset === 'mes_atual') {
      setDataInicio(firstDayOfMonth())
      setDataFim(toYMD(today))
    } else if (preset === 'mes_anterior') {
      const firstPrev = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastPrev = new Date(today.getFullYear(), today.getMonth(), 0)
      setDataInicio(toYMD(firstPrev))
      setDataFim(toYMD(lastPrev))
    }
    // 'personalizado' keeps the current dates and lets the user edit them
  }

  const itens = data?.itens ?? []

  const categorias = useMemo(
    () => Array.from(new Set(itens.map((i) => i.categoriaNome))).sort(),
    [itens],
  )

  const filtered = useMemo(
    () => (selectedCategoria === 'all' ? itens : itens.filter((i) => i.categoriaNome === selectedCategoria)),
    [itens, selectedCategoria],
  )

  const qtdTotal = useMemo(() => itens.reduce((acc, i) => acc + i.quantidadeVendida, 0), [itens])

  // ── Insights ──────────────────────────────────────────────────────────────
  const insights = useMemo(() => {
    if (itens.length < 2 || !data) return null
    const maiorCusto = itens[0] // API returns ordered by custoTotal DESC
    const melhorMargem = itens.reduce((a, b) => (b.percentualMargem > a.percentualMargem ? b : a))
    const piorMargem = itens.reduce((a, b) => (b.percentualMargem < a.percentualMargem ? b : a))
    const pctDoCusto = data.totalCusto > 0 ? (maiorCusto.custoTotal / data.totalCusto) * 100 : 0
    return { maiorCusto, melhorMargem, piorMargem, pctDoCusto }
  }, [itens, data])

  const nome = (i: CmvItem) => `${i.produtoNome} ${i.variacaoDescricao}`

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório CMV</h1>
          <p className="text-sm text-gray-500 mt-1">
            Custo de Mercadoria Vendida · {fmtDate(dataInicio)} até {fmtDate(dataFim)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => data && exportCmvCSV(data)}
            disabled={!data || itens.length === 0}
            className="flex items-center gap-2 px-3 py-2 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => data && exportCmvPDF(data)}
            disabled={!data || itens.length === 0}
            className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-700 rounded-xl text-sm font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
        {/* Row 1 — preset pills */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                periodoPreset === p.key
                  ? 'bg-blue-600 text-white border-transparent'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Row 2 — custom dates */}
        {periodoPreset === 'personalizado' && (
          <div className="flex flex-wrap items-end gap-3">
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
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Search className="w-4 h-4" />
              Buscar
            </button>
          </div>
        )}

        {/* Row 3 — categoria */}
        <div>
          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Faturamento</p>
          <p className="text-xl font-bold text-blue-600">{fmt(data?.totalFaturamento ?? 0)}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Custo Total</p>
          <p className="text-xl font-bold text-red-600">{fmt(data?.totalCusto ?? 0)}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Margem Bruta</p>
          <p className={`text-xl font-bold ${valorText(data?.totalMargemBruta ?? 0)}`}>
            {fmt(data?.totalMargemBruta ?? 0)}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide">CMV %</p>
          <p className={`text-xl font-bold ${cmvText(data?.percentualCmvGeral ?? 0)}`}>
            {pct(data?.percentualCmvGeral ?? 0)}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Margem %</p>
          <p className={`text-xl font-bold ${margemText(data?.percentualMargemGeral ?? 0)}`}>
            {pct(data?.percentualMargemGeral ?? 0)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Produto</th>
                <th className="text-left px-4 py-3">Variação</th>
                <th className="text-left px-4 py-3">Categoria</th>
                <th className="text-right px-4 py-3">Qtd</th>
                <th className="text-right px-4 py-3">Custo Unit.</th>
                <th className="text-right px-4 py-3">Custo Total</th>
                <th className="text-right px-4 py-3">Faturamento</th>
                <th className="text-right px-4 py-3">Margem R$</th>
                <th className="text-center px-4 py-3">CMV%</th>
                <th className="text-right px-4 py-3">Margem%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : itens.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400 text-sm">
                    <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Nenhuma venda encontrada para o período
                  </td>
                </tr>
              ) : (
                filtered.map((i, idx) => (
                  <tr key={`${i.produtoNome}-${i.variacaoDescricao}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{i.produtoNome}</td>
                    <td className="px-4 py-3 text-gray-600">{i.variacaoDescricao}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {i.categoriaNome}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{i.quantidadeVendida}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmt(i.custoUnitario)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(i.custoTotal)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(i.faturamentoTotal)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${valorText(i.margemBruta)}`}>
                      {fmt(i.margemBruta)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cmvBadge(i.percentualCmv)}`}>
                        {pct(i.percentualCmv)}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${margemText(i.percentualMargem)}`}>
                      {pct(i.percentualMargem)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!isLoading && itens.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-100 font-semibold text-gray-900">
                  <td className="px-4 py-3">TOTAL</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right">{qtdTotal}</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right">{fmt(data?.totalCusto ?? 0)}</td>
                  <td className="px-4 py-3 text-right">{fmt(data?.totalFaturamento ?? 0)}</td>
                  <td className={`px-4 py-3 text-right ${valorText(data?.totalMargemBruta ?? 0)}`}>
                    {fmt(data?.totalMargemBruta ?? 0)}
                  </td>
                  <td className={`px-4 py-3 text-center ${cmvText(data?.percentualCmvGeral ?? 0)}`}>
                    {pct(data?.percentualCmvGeral ?? 0)}
                  </td>
                  <td className={`px-4 py-3 text-right ${margemText(data?.percentualMargemGeral ?? 0)}`}>
                    {pct(data?.percentualMargemGeral ?? 0)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Insights */}
      {insights && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-semibold text-gray-900">Destaques do período</h2>
          </div>
          <div className="space-y-3 text-sm">
            {/* a) Maior custo */}
            <div className="flex items-start gap-3">
              <TrendingDown className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-gray-700">
                <span className="font-semibold">Maior custo:</span> {nome(insights.maiorCusto)} representou{' '}
                {insights.pctDoCusto.toFixed(1)}% do custo total
              </p>
            </div>
            {/* b) Melhor margem */}
            <div className="flex items-start gap-3">
              <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <p className="text-gray-700">
                <span className="font-semibold">Melhor margem:</span> {nome(insights.melhorMargem)}:{' '}
                {insights.melhorMargem.percentualMargem.toFixed(1)}% de margem
              </p>
            </div>
            {/* c) Atenção */}
            <div className="flex items-start gap-3">
              {insights.piorMargem.percentualMargem < 20 ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-gray-700">
                    <span className="font-semibold">Atenção:</span> {nome(insights.piorMargem)}: margem de apenas{' '}
                    {insights.piorMargem.percentualMargem.toFixed(1)}%
                  </p>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-green-600 font-medium">
                    Todas as variações com margem acima de 20% ✓
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
