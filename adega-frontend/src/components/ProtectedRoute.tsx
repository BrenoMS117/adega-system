import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Layout from './Layout'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return <Layout>{children}</Layout>
}
