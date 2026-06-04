import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/Login'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import PDVPage from './pages/pdv/PDVPage'
import VendasPage from './pages/vendas/VendasPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import CmvPage from './pages/cmv/CmvPage'
import EstoquePage from './pages/estoque/EstoquePage'
import ProdutosPage from './pages/produtos/ProdutosPage'
import CaixaPage from './pages/caixa/CaixaPage'
import UsuariosPage from './pages/usuarios/UsuariosPage'
import ConfiguracoesPage from './pages/configuracoes/ConfiguracoesPage'
import ProtectedRoute from './components/ProtectedRoute'
import RoleGuard from './components/RoleGuard'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
      <Route path="/" element={<Navigate to="/pdv" replace />} />

      <Route
        path="/pdv"
        element={
          <ProtectedRoute>
            <PDVPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vendas"
        element={
          <ProtectedRoute>
            <VendasPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleGuard requiredRole="DONO">
              <DashboardPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/cmv"
        element={
          <ProtectedRoute>
            <RoleGuard requiredRole="DONO">
              <CmvPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/estoque"
        element={
          <ProtectedRoute>
            <EstoquePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/produtos"
        element={
          <ProtectedRoute>
            <RoleGuard requiredRole="DONO">
              <ProdutosPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/caixa"
        element={
          <ProtectedRoute>
            <CaixaPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuarios"
        element={
          <ProtectedRoute>
            <RoleGuard requiredRole="DONO">
              <UsuariosPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute>
            <RoleGuard requiredRole="DONO">
              <ConfiguracoesPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
