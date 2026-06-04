import { useQuery } from '@tanstack/react-query'
import { estoque as estoqueApi } from '../services/api'
import { useAuth } from './useAuth'

export function useEstoqueAlertas() {
  const { isDono } = useAuth()

  const { data = [] } = useQuery({
    queryKey: ['estoque-alertas'],
    queryFn: () => estoqueApi.getEstoque({}),
    enabled: isDono(),
    refetchInterval: 5 * 60 * 1000,
  })

  const criticos = data.filter((item) => item.situacao === 'CRITICO')
  const baixos = data.filter((item) => item.situacao === 'BAIXO')
  const alertas = [...criticos, ...baixos]

  return { alertas, criticos, baixos, total: alertas.length }
}
