import { Link, useLocation } from 'react-router-dom'
import { ShoppingCart, Receipt, BarChart3, TrendingDown, Package, Box, CreditCard, Users, Settings, LogOut, Store } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { adegas as adegasApi } from '../services/api'
import EstoqueAlertaBell from './EstoqueAlertaBell'

const SELECTED_ADEGA_KEY = 'selected_adega'

const NAV_ITEMS = [
  { path: '/pdv',       label: 'PDV',        icon: ShoppingCart, donoOnly: false },
  { path: '/vendas',    label: 'Vendas',     icon: Receipt,      donoOnly: false },
  { path: '/dashboard', label: 'Dashboard',  icon: BarChart3,    donoOnly: true  },
  { path: '/cmv',       label: 'CMV',        icon: TrendingDown, donoOnly: true  },
  { path: '/estoque',   label: 'Estoque',    icon: Package,      donoOnly: false },
  { path: '/produtos',  label: 'Produtos',   icon: Box,          donoOnly: true  },
  { path: '/caixa',     label: 'Fechamento', icon: CreditCard,   donoOnly: false },
  { path: '/usuarios',  label: 'Usuários',   icon: Users,        donoOnly: true  },
  { path: '/configuracoes', label: 'Configurações', icon: Settings, donoOnly: true },
]

interface Props {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  const location = useLocation()
  const { getUser, isDono, logout } = useAuth()
  const user = getUser()!

  const [selectedAdega, setSelectedAdega] = useState<string | null>(
    localStorage.getItem(SELECTED_ADEGA_KEY),
  )

  const { data: adegaList = [] } = useQuery({
    queryKey: ['adegas'],
    queryFn: adegasApi.getAdegas,
    enabled: isDono(),
    retry: false,
  })

  function handleSelectAdega(id: string | null) {
    if (id === null) {
      localStorage.removeItem(SELECTED_ADEGA_KEY)
    } else {
      localStorage.setItem(SELECTED_ADEGA_KEY, id)
    }
    setSelectedAdega(id)
    window.dispatchEvent(new CustomEvent('adegaChanged', { detail: id }))
  }

  const visibleNav = NAV_ITEMS.filter((item) => !item.donoOnly || isDono())

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sidebar (desktop) ── */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white hidden md:flex flex-col z-30">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-gray-700 shrink-0">
          <Store className="w-5 h-5 mr-2 text-blue-400 shrink-0" />
          <span className="font-bold text-base tracking-tight">Adega System</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {visibleNav.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-gray-700 shrink-0">
          <p className="text-sm font-medium text-white truncate">{user.nome}</p>
          <p className="text-xs text-gray-400 mb-3">{user.perfil}</p>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Topbar ── */}
      <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center gap-4 px-4">
        {/* Mobile brand */}
        <div className="flex items-center gap-1.5 md:hidden">
          <Store className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-gray-800">Adega System</span>
        </div>

        {/* Adega selector pills – DONO only */}
        {isDono() && (
          <div className="flex items-center gap-2 flex-1 justify-center overflow-x-auto">
            <button
              onClick={() => handleSelectAdega(null)}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedAdega === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {adegaList.map((adega) => (
              <button
                key={adega.id}
                onClick={() => handleSelectAdega(adega.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedAdega === adega.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {adega.nome}
              </button>
            ))}
          </div>
        )}

        {/* Spacer for FUNCIONARIO */}
        {!isDono() && <div className="flex-1" />}

        {/* Alerta de estoque – DONO only */}
        {isDono() && <EstoqueAlertaBell />}

        {/* User + logout */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-gray-600 hidden sm:block truncate max-w-32">
            {user.nome}
          </span>
          <button
            onClick={logout}
            title="Sair"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Sair</span>
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="md:pl-64 pt-16 pb-16 md:pb-0">
        {children}
      </main>

      {/* ── Bottom navigation (mobile only) ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40 flex">
        {visibleNav.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors ${
                active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="leading-none">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
