export const TZ = 'America/Sao_Paulo'

export function fmtDateTime(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('pt-BR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fmtDate(dateStr: string): string {
  if (!dateStr) return '—'
  // Date-only strings (YYYY-MM-DD): parse as local date to avoid UTC shift
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR')
  }
  return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: TZ })
}

export function fmtTime(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleTimeString('pt-BR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  })
}
