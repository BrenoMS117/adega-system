import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { categorias as categoriasApi, adegas as adegasApi } from '../../services/api'
import type { CategoriaResponse, AdegaResponse } from '../../types'

// ——— Helpers ———

function serverMessage(error: unknown, fallback: string): string {
  const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
  return msg && msg.trim() !== '' ? msg : fallback
}

// ——— Schemas ———

const categoriaSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
})
type CategoriaFormData = z.infer<typeof categoriaSchema>

const adegaSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  endereco: z.string().optional(),
  cnpj: z.string().optional(),
})
type AdegaFormData = z.infer<typeof adegaSchema>

// ——— Categoria Dialog ———

interface CategoriaDialogProps {
  editingCategoria: CategoriaResponse | null
  onClose: () => void
}

function CategoriaDialog({ editingCategoria, onClose }: CategoriaDialogProps) {
  const isEdit = !!editingCategoria
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: { nome: editingCategoria?.nome ?? '' },
  })

  const mutation = useMutation({
    mutationFn: (data: CategoriaFormData) =>
      isEdit
        ? categoriasApi.updateCategoria(editingCategoria!.id, { nome: data.nome })
        : categoriasApi.createCategoria({ nome: data.nome }),
    onSuccess: () => {
      toast.success('Categoria salva com sucesso')
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      onClose()
    },
    onError: (error) => toast.error(serverMessage(error, 'Erro ao salvar categoria.')),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nome *</label>
            <input
              autoFocus
              {...register('nome')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.nome && (
              <p className="text-xs text-red-600 mt-1">{errors.nome.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ——— Adega Dialog ———

interface AdegaDialogProps {
  editingAdega: AdegaResponse | null
  onClose: () => void
}

function AdegaDialog({ editingAdega, onClose }: AdegaDialogProps) {
  const isEdit = !!editingAdega
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdegaFormData>({
    resolver: zodResolver(adegaSchema),
    defaultValues: {
      nome: editingAdega?.nome ?? '',
      endereco: editingAdega?.endereco ?? '',
      cnpj: editingAdega?.cnpj ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: AdegaFormData) => {
      const payload = {
        nome: data.nome,
        endereco: data.endereco ?? '',
        cnpj: data.cnpj ?? '',
      }
      return isEdit
        ? adegasApi.updateAdega(editingAdega!.id, payload)
        : adegasApi.createAdega(payload)
    },
    onSuccess: () => {
      toast.success('Adega salva com sucesso')
      queryClient.invalidateQueries({ queryKey: ['adegas'] })
      onClose()
    },
    onError: (error) => toast.error(serverMessage(error, 'Erro ao salvar adega.')),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Editar Adega' : 'Nova Adega'}
          </h2>
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nome *</label>
            <input
              autoFocus
              {...register('nome')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.nome && (
              <p className="text-xs text-red-600 mt-1">{errors.nome.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Endereço</label>
            <input
              {...register('endereco')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">CNPJ</label>
            <input
              {...register('cnpj')}
              placeholder="00.000.000/0001-00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ——— Delete Confirm Dialog ———

interface DeleteCategoriaDialogProps {
  categoria: CategoriaResponse
  onClose: () => void
}

function DeleteCategoriaDialog({ categoria, onClose }: DeleteCategoriaDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => categoriasApi.deleteCategoria(categoria.id),
    onSuccess: () => {
      toast.success('Categoria excluída')
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      onClose()
    },
    onError: (error) => toast.error(serverMessage(error, 'Erro ao excluir categoria.')),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Excluir Categoria</h2>
        <p className="text-sm text-gray-600">
          Tem certeza que deseja excluir a categoria <strong>{categoria.nome}</strong>?
          Esta ação não pode ser desfeita.
        </p>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 py-2 bg-red-600 rounded-lg text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ——— Main Page ———

type Tab = 'categorias' | 'adegas'

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('categorias')

  const [showCategoriaDialog, setShowCategoriaDialog] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<CategoriaResponse | null>(null)

  const [showAdegaDialog, setShowAdegaDialog] = useState(false)
  const [editingAdega, setEditingAdega] = useState<AdegaResponse | null>(null)

  const [deletingCategoria, setDeletingCategoria] = useState<CategoriaResponse | null>(null)

  const { data: categoriasList, isLoading: loadingCategorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: categoriasApi.getCategorias,
  })

  const { data: adegasList, isLoading: loadingAdegas } = useQuery({
    queryKey: ['adegas'],
    queryFn: adegasApi.getAdegas,
    retry: false,
  })

  function openNewCategoria() {
    setEditingCategoria(null)
    setShowCategoriaDialog(true)
  }

  function openEditCategoria(c: CategoriaResponse) {
    setEditingCategoria(c)
    setShowCategoriaDialog(true)
  }

  function closeCategoriaDialog() {
    setShowCategoriaDialog(false)
    setEditingCategoria(null)
  }

  function openNewAdega() {
    setEditingAdega(null)
    setShowAdegaDialog(true)
  }

  function openEditAdega(a: AdegaResponse) {
    setEditingAdega(a)
    setShowAdegaDialog(true)
  }

  function closeAdegaDialog() {
    setShowAdegaDialog(false)
    setEditingAdega(null)
  }

  const tabClass = (tab: Tab) =>
    `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
      activeTab === tab
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Page header */}
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

        {/* Tab bar */}
        <div className="flex gap-2 border-b border-gray-200">
          <button onClick={() => setActiveTab('categorias')} className={tabClass('categorias')}>
            Categorias
          </button>
          <button onClick={() => setActiveTab('adegas')} className={tabClass('adegas')}>
            Adegas
          </button>
        </div>

        {/* ── TAB: CATEGORIAS ── */}
        {activeTab === 'categorias' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Categorias</h2>
              <button
                onClick={openNewCategoria}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Plus size={16} />
                Nova Categoria
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {loadingCategorias ? (
                <div className="p-6 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (categoriasList ?? []).length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  Nenhuma categoria cadastrada
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Produtos vinculados
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(categoriasList ?? []).map((c) => {
                      const hasProdutos = c.totalProdutos > 0
                      return (
                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{c.nome}</td>
                          <td className="px-4 py-3">
                            {hasProdutos ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                {c.totalProdutos}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                Nenhum
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditCategoria(c)}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Pencil size={13} />
                                Editar
                              </button>
                              <button
                                onClick={() => setDeletingCategoria(c)}
                                disabled={hasProdutos}
                                title={
                                  hasProdutos
                                    ? 'Remova os produtos desta categoria antes de excluir'
                                    : undefined
                                }
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors text-red-600 hover:bg-red-50 disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                              >
                                <Trash2 size={13} />
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: ADEGAS ── */}
        {activeTab === 'adegas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Adegas</h2>
              <button
                onClick={openNewAdega}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Plus size={16} />
                Nova Adega
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {loadingAdegas ? (
                <div className="p-6 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (adegasList ?? []).length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  Nenhuma adega cadastrada
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Nome', 'Endereço', 'CNPJ', 'Usuários'].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(adegasList ?? []).map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{a.nome}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {a.endereco && a.endereco.trim() !== '' ? a.endereco : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {a.cnpj && a.cnpj.trim() !== '' ? a.cnpj : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {a.totalUsuarios}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditAdega(a)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Pencil size={13} />
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {showCategoriaDialog && (
        <CategoriaDialog
          editingCategoria={editingCategoria}
          onClose={closeCategoriaDialog}
        />
      )}

      {showAdegaDialog && (
        <AdegaDialog editingAdega={editingAdega} onClose={closeAdegaDialog} />
      )}

      {deletingCategoria && (
        <DeleteCategoriaDialog
          categoria={deletingCategoria}
          onClose={() => setDeletingCategoria(null)}
        />
      )}
    </>
  )
}
