import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Venda, CmvData, FechamentoCaixa } from '../types'

// ─── Formatting helpers ─────────────────────────────────────────────────────

export function fmtCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Parses a backend date string. Date-only values (YYYY-MM-DD) are anchored at
 * noon to avoid the timezone-driven day shift (the app runs in UTC-3) — same
 * convention used by CaixaPage.
 */
function parseDate(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(`${dateStr}T12:00:00`)
  }
  return new Date(dateStr)
}

export function fmtDate(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString('pt-BR') // dd/MM/yyyy
}

export function fmtDateTime(dateStr: string): string {
  const d = parseDate(dateStr)
  return (
    d.toLocaleDateString('pt-BR') +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  )
}

export function fmtPct(value: number): string {
  return value.toFixed(1) + '%'
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── CSV helper ─────────────────────────────────────────────────────────────

function escapeCSV(value: string | number): string {
  const s = String(value ?? '')
  // Semicolon-delimited (Brazilian Excel default): quote on ; " , or newlines.
  if (/[";,\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export function toCSV(headers: string[], rows: (string | number)[][]): string {
  const lines = [
    headers.map(escapeCSV).join(';'),
    ...rows.map((row) => row.map(escapeCSV).join(';')),
  ]
  // UTF-8 BOM so Excel renders accents correctly; CRLF line endings.
  return '﻿' + lines.join('\r\n')
}

function downloadCSV(headers: string[], rows: (string | number)[][], filename: string): void {
  const csv = toCSV(headers, rows)
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename)
}

// ─── PDF helper ─────────────────────────────────────────────────────────────

export function createPDF(title: string, subtitle: string): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39) // gray-900
  doc.text(title, 14, 18)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128) // gray-500
  doc.text(subtitle, 14, 25)

  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175) // gray-400
  doc.text(`Gerado em ${fmtDateTime(new Date().toISOString())}`, pageWidth - 14, 18, {
    align: 'right',
  })

  doc.setTextColor(0, 0, 0)
  return doc
}

// Shared autoTable styling (matches the app's blue/gray palette).
const baseTable = {
  startY: 30,
  styles: { fontSize: 8, cellPadding: 2 },
  headStyles: {
    fillColor: [37, 99, 235] as [number, number, number], // blue-600
    textColor: 255,
    fontStyle: 'bold' as const,
  },
  footStyles: {
    fillColor: [243, 244, 246] as [number, number, number], // gray-100
    textColor: [17, 24, 39] as [number, number, number], // gray-900
    fontStyle: 'bold' as const,
  },
  alternateRowStyles: { fillColor: [249, 250, 251] as [number, number, number] }, // gray-50
  margin: { left: 14, right: 14 },
}

const todayISO = () => new Date().toISOString().slice(0, 10)

// ─── 1. Vendas CSV ──────────────────────────────────────────────────────────

export function exportVendasCSV(vendas: Venda[], dataInicio: string, dataFim: string): void {
  const headers = [
    'Data/Hora',
    'Atendente',
    'Adega',
    'Canal',
    'Itens',
    'Total',
    'Desconto',
    'Status',
  ]
  const rows = vendas.map((v) => [
    fmtDateTime(v.dataHora),
    v.usuarioNome,
    v.adegaNome,
    v.canal,
    v.itens.length,
    fmtCurrency(v.totalLiquido),
    fmtCurrency(v.totalDesconto),
    v.status,
  ])
  downloadCSV(headers, rows, `vendas_${dataInicio}_${dataFim}.csv`)
}

// ─── 2. Vendas PDF ──────────────────────────────────────────────────────────

export function exportVendasPDF(vendas: Venda[], dataInicio: string, dataFim: string): void {
  const totalLiquido = vendas.reduce((s, v) => s + v.totalLiquido, 0)
  const totalDesconto = vendas.reduce((s, v) => s + v.totalDesconto, 0)
  const totalItens = vendas.reduce((s, v) => s + v.itens.length, 0)

  const doc = createPDF(
    'Histórico de Vendas',
    `${fmtDate(dataInicio)} até ${fmtDate(dataFim)} · ${vendas.length} vendas · Total: ${fmtCurrency(totalLiquido)}`,
  )

  autoTable(doc, {
    ...baseTable,
    head: [['Data/Hora', 'Atendente', 'Canal', 'Itens', 'Total', 'Desconto', 'Status']],
    body: vendas.map((v) => [
      fmtDateTime(v.dataHora),
      v.usuarioNome,
      v.canal,
      String(v.itens.length),
      fmtCurrency(v.totalLiquido),
      fmtCurrency(v.totalDesconto),
      v.status,
    ]),
    foot: [
      ['', '', 'Total', String(totalItens), fmtCurrency(totalLiquido), fmtCurrency(totalDesconto), ''],
    ],
  })

  doc.save(`vendas_${dataInicio}_${dataFim}.pdf`)
}

// ─── 3. CMV CSV ─────────────────────────────────────────────────────────────

export function exportCmvCSV(cmv: CmvData): void {
  const headers = [
    'Produto',
    'Variação',
    'Categoria',
    'Qtd Vendida',
    'Custo Unit.',
    'Custo Total',
    'Faturamento',
    'Margem Bruta',
    'CMV %',
    'Margem %',
  ]
  const rows = cmv.itens.map((i) => [
    i.produtoNome,
    i.variacaoDescricao,
    i.categoriaNome,
    i.quantidadeVendida,
    fmtCurrency(i.custoUnitario),
    fmtCurrency(i.custoTotal),
    fmtCurrency(i.faturamentoTotal),
    fmtCurrency(i.margemBruta),
    fmtPct(i.percentualCmv),
    fmtPct(i.percentualMargem),
  ])
  downloadCSV(headers, rows, `cmv_${cmv.dataInicio}_${cmv.dataFim}.csv`)
}

// ─── 4. CMV PDF ─────────────────────────────────────────────────────────────

export function exportCmvPDF(cmv: CmvData): void {
  const periodo = `${fmtDate(cmv.dataInicio)} até ${fmtDate(cmv.dataFim)}`
  const adega = cmv.adegaNome ?? 'Todas as adegas'
  const doc = createPDF(
    'Relatório CMV',
    `${periodo} · ${adega} · CMV ${fmtPct(cmv.percentualCmvGeral)} · Margem ${fmtPct(cmv.percentualMargemGeral)}`,
  )

  autoTable(doc, {
    ...baseTable,
    head: [
      [
        'Produto',
        'Variação',
        'Categoria',
        'Qtd',
        'Custo Un.',
        'Custo Tot.',
        'Faturamento',
        'Margem',
        'CMV %',
        'Margem %',
      ],
    ],
    body: cmv.itens.map((i) => [
      i.produtoNome,
      i.variacaoDescricao,
      i.categoriaNome,
      String(i.quantidadeVendida),
      fmtCurrency(i.custoUnitario),
      fmtCurrency(i.custoTotal),
      fmtCurrency(i.faturamentoTotal),
      fmtCurrency(i.margemBruta),
      fmtPct(i.percentualCmv),
      fmtPct(i.percentualMargem),
    ]),
    foot: [
      [
        'Total',
        '',
        '',
        '',
        '',
        fmtCurrency(cmv.totalCusto),
        fmtCurrency(cmv.totalFaturamento),
        fmtCurrency(cmv.totalMargemBruta),
        fmtPct(cmv.percentualCmvGeral),
        fmtPct(cmv.percentualMargemGeral),
      ],
    ],
  })

  doc.save(`cmv_${cmv.dataInicio}_${cmv.dataFim}.pdf`)
}

// ─── 5. Fechamento CSV ──────────────────────────────────────────────────────

export function exportFechamentoCSV(lista: FechamentoCaixa[]): void {
  const headers = [
    'Data',
    'Adega',
    'Atendente',
    'Vendas',
    'Faturamento',
    'Dinheiro',
    'Pix',
    'Cartão',
    'Benefício',
    'Desc.',
    'Diferença',
  ]
  const rows = lista.map((f) => [
    fmtDate(f.data),
    f.adegaNome,
    f.usuarioNome,
    f.totalVendas,
    fmtCurrency(f.totalFaturamento),
    fmtCurrency(f.totalDinheiro),
    fmtCurrency(f.totalPix),
    fmtCurrency(f.totalCartao),
    fmtCurrency(f.totalBeneficio),
    fmtCurrency(f.totalDescontos),
    fmtCurrency(f.diferenca),
  ])
  downloadCSV(headers, rows, `fechamentos_caixa_${todayISO()}.csv`)
}

// ─── 6. Fechamento PDF ──────────────────────────────────────────────────────

export function exportFechamentoPDF(lista: FechamentoCaixa[]): void {
  const totalFaturamento = lista.reduce((s, f) => s + f.totalFaturamento, 0)
  const totalVendas = lista.reduce((s, f) => s + f.totalVendas, 0)
  const totalDinheiro = lista.reduce((s, f) => s + f.totalDinheiro, 0)
  const totalPix = lista.reduce((s, f) => s + f.totalPix, 0)
  const totalCartao = lista.reduce((s, f) => s + f.totalCartao, 0)
  const totalBeneficio = lista.reduce((s, f) => s + f.totalBeneficio, 0)
  const totalDescontos = lista.reduce((s, f) => s + f.totalDescontos, 0)
  const totalDiferenca = lista.reduce((s, f) => s + f.diferenca, 0)

  const doc = createPDF(
    'Histórico de Fechamentos de Caixa',
    `${lista.length} fechamentos · Faturamento total: ${fmtCurrency(totalFaturamento)}`,
  )

  autoTable(doc, {
    ...baseTable,
    head: [
      [
        'Data',
        'Adega',
        'Atendente',
        'Vendas',
        'Faturamento',
        'Dinheiro',
        'Pix',
        'Cartão',
        'Benefício',
        'Desc.',
        'Diferença',
      ],
    ],
    body: lista.map((f) => [
      fmtDate(f.data),
      f.adegaNome,
      f.usuarioNome,
      String(f.totalVendas),
      fmtCurrency(f.totalFaturamento),
      fmtCurrency(f.totalDinheiro),
      fmtCurrency(f.totalPix),
      fmtCurrency(f.totalCartao),
      fmtCurrency(f.totalBeneficio),
      fmtCurrency(f.totalDescontos),
      fmtCurrency(f.diferenca),
    ]),
    foot: [
      [
        'Total',
        '',
        '',
        String(totalVendas),
        fmtCurrency(totalFaturamento),
        fmtCurrency(totalDinheiro),
        fmtCurrency(totalPix),
        fmtCurrency(totalCartao),
        fmtCurrency(totalBeneficio),
        fmtCurrency(totalDescontos),
        fmtCurrency(totalDiferenca),
      ],
    ],
  })

  doc.save(`fechamentos_caixa_${todayISO()}.pdf`)
}
