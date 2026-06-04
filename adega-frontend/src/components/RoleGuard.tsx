import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface Props {
  requiredRole: 'DONO'
  children: React.ReactNode
}

export default function RoleGuard({ requiredRole, children }: Props) {
  const { getUser } = useAuth()
  const user = getUser()

  if (user?.perfil !== requiredRole) {
    return <Navigate to="/pdv" replace />
  }

  return <>{children}</>
}
