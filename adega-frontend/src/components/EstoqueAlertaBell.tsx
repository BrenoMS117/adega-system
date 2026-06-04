import { useRef, useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEstoqueAlertas } from '../hooks/useEstoqueAlertas'
import type { EstoqueItem } from '../types'

export default function EstoqueAlertaBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { criticos, baixos, total } = useEstoqueAlertas()

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [])

  const hasCritico = criticos.length > 0
  const badgeClass = hasCritico ? 'bg-red-500' : 'bg-amber-500'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Alertas de estoque"
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
      >
        <Bell className={`w-5 h-5 ${total > 0 ? 'text-gray-700' : 'text-gray-400'}`} />
        {total > 0 && (
          <span
            className={`absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full ${badgeClass} text-white text-[10px] font-bold flex items-center justify-center leading-none`}
          >
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-800">Alertas de estoque</span>
            {total > 0 && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  hasCritico ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {total}
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {total === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-green-600 font-medium">
                Estoque sob controle ✓
              </p>
            ) : (
              <div className="py-2">
                {criticos.length > 0 && (
                  <div className="mb-1">
                    <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-500">
                      Estoque zerado
                    </p>
                    {criticos.map((item) => (
                      <AlertaRow key={item.variacaoId} item={item} color="red" />
                    ))}
                  </div>
                )}
                {baixos.length > 0 && (
                  <div>
                    <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-500">
                      Abaixo do mínimo
                    </p>
                    {baixos.map((item) => (
                      <AlertaRow key={item.variacaoId} item={item} color="amber" />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rodapé */}
          <div className="px-4 py-2.5 border-t border-gray-100">
            <button
              onClick={() => {
                navigate('/estoque')
                setOpen(false)
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Ver estoque completo →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AlertaRow({ item, color }: { item: EstoqueItem; color: 'red' | 'amber' }) {
  const dotClass = color === 'red' ? 'bg-red-500' : 'bg-amber-500'
  const subtitle =
    color === 'red'
      ? `${item.adegaNome ? item.adegaNome + ' · ' : ''}0 unidades`
      : `${item.adegaNome ? item.adegaNome + ' · ' : ''}${item.estoqueAtual} un. (mín. ${item.estoqueMinimo})`

  return (
    <div className="flex items-start gap-2.5 px-4 py-2 hover:bg-gray-50">
      <span className={`mt-1.5 w-2 h-2 rounded-full ${dotClass} shrink-0`} />
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-gray-800 truncate">
          {item.produtoNome} · {item.variacaoDescricao}
        </p>
        <p className="text-[11px] text-gray-500 truncate">{subtitle}</p>
      </div>
    </div>
  )
}
