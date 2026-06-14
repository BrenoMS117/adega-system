import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificacoes as notificacoesApi } from '../services/api'
import type { SolicitacaoReaberturaRequest } from '../types'

export function useNotificacoes() {
  const queryClient = useQueryClient()

  const { data: lista = [], isLoading } = useQuery({
    queryKey: ['notificacoes'],
    queryFn: notificacoesApi.listar,
    refetchInterval: 30_000,
  })

  const { data: countData } = useQuery({
    queryKey: ['notificacoes-count'],
    queryFn: notificacoesApi.contarNaoLidas,
    refetchInterval: 30_000,
  })

  const marcarLidaMutation = useMutation({
    mutationFn: (id: string) => notificacoesApi.marcarComoLida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
      queryClient.invalidateQueries({ queryKey: ['notificacoes-count'] })
    },
  })

  const marcarTodasMutation = useMutation({
    mutationFn: notificacoesApi.marcarTodasComoLidas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
      queryClient.invalidateQueries({ queryKey: ['notificacoes-count'] })
    },
  })

  const solicitarReaberturaMutation = useMutation({
    mutationFn: (data: SolicitacaoReaberturaRequest) =>
      notificacoesApi.solicitarReabertura(data),
  })

  return {
    lista,
    isLoading,
    naoLidas: countData?.count ?? 0,
    marcarLida: (id: string) => marcarLidaMutation.mutate(id),
    marcarTodas: () => marcarTodasMutation.mutate(),
    solicitarReabertura: solicitarReaberturaMutation,
  }
}
