import { useState, useRef, useEffect } from 'react'
import { Bell, CheckCheck, X, Clock, Package, ShoppingBag, UserPlus, Settings, DoorOpen } from 'lucide-react'
import { useNotificacoes } from '../hooks/useNotificacoes'
import type { Notificacao } from '../types'

const TIPO_ICONS: Record<string, React.ReactNode> = {
  SOLICITACAO_REABERTURA_CAIXA: <DoorOpen size={14} className="text-amber-500" />,
  ESTOQUE_CRITICO: <Package size={14} className="text-red-500" />,
  ESTOQUE_BAIXO: <Package size={14} className="text-amber-500" />,
  VENDA_CANCELADA: <ShoppingBag size={14} className="text-red-500" />,
  NOVO_USUARIO: <UserPlus size={14} className="text-blue-500" />,
  SISTEMA: <Settings size={14} className="text-gray-500" />,
}

function fmtRelativo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  return `${Math.floor(hours / 24)}d atrás`
}

export default function NotificacaoBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { lista, naoLidas, marcarLida, marcarTodas } = useNotificacoes()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
      >
        <Bell size={20} />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {naoLidas > 99 ? '99+' : naoLidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 flex flex-col max-h-[480px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <span className="text-sm font-semibold text-gray-900">Notificações</span>
            <div className="flex items-center gap-2">
              {naoLidas > 0 && (
                <button
                  onClick={marcarTodas}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <CheckCheck size={12} />
                  Marcar todas
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {lista.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-sm">
                <Bell size={24} className="mb-2 opacity-40" />
                Nenhuma notificação
              </div>
            ) : (
              lista.map((n) => (
                <NotificacaoItem key={n.id} notificacao={n} onMarcarLida={() => marcarLida(n.id)} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificacaoItem({
  notificacao: n,
  onMarcarLida,
}: {
  notificacao: Notificacao
  onMarcarLida: () => void
}) {
  return (
    <div
      className={`flex gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
        n.lida ? 'opacity-60' : ''
      }`}
      onClick={() => {
        if (!n.lida) onMarcarLida()
      }}
    >
      <div className="flex-shrink-0 mt-0.5">
        {TIPO_ICONS[n.tipo] ?? <Bell size={14} className="text-gray-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs leading-tight text-gray-900 ${!n.lida ? 'font-semibold' : 'font-medium'}`}>
          {n.titulo}
        </p>
        <p className="text-xs text-gray-600 mt-0.5 leading-snug">{n.mensagem}</p>
        <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
          <Clock size={9} />
          {fmtRelativo(n.createdAt)}
        </div>
      </div>
      {!n.lida && <div className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-blue-500" />}
    </div>
  )
}
