import { auth } from '../services/api'
import type { AuthUser, LoginRequest } from '../types'

const AUTH_KEY = 'adega_user'

export function useAuth() {
  function getUser(): AuthUser | null {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  }

  function isAuthenticated(): boolean {
    return getUser() !== null
  }

  function isDono(): boolean {
    return getUser()?.perfil === 'DONO'
  }

  async function login(data: LoginRequest): Promise<AuthUser> {
    const response = await auth.login(data)
    const user: AuthUser = {
      token: response.token,
      nome: response.nome,
      perfil: response.perfil,
      adegaId: response.adegaId,
      usuarioId: response.usuarioId,
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify(user))
    return user
  }

  function logout(): void {
    localStorage.removeItem(AUTH_KEY)
    window.location.href = '/login'
  }

  return { login, logout, getUser, isAuthenticated, isDono }
}
