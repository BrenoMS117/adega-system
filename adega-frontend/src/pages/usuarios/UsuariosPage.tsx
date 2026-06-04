import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Search, Pencil, UserCheck, UserX, X } from 'lucide-react'
import { usuarios as usuariosApi, adegas as adegasApi } from '../../services/api'
import type { Usuario } from '../../types'

// ——— Schemas ———

const baseFields = {
  nome: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  perfil: z.enum(['DONO', 'FUNCIONARIO']),
  adegaId: z.string().optional(),
}

const refineAdega = (d: { perfil: string; adegaId?: string }) =>
  d.perfil === 'DONO' || (!!d.adegaId && d.adegaId !== '')

const createSchema = z
  .object({ ...baseFields, senha: z.string().min(6, 'Senha deve ter ao menos 6 caracteres') })
  .refine(refineAdega, { message: 'Selecione a adega', path: ['adegaId'] })

const editSchema = z
  .object({ ...baseFields, senha: z.string().optional() })
  .refine(refineAdega, { message: 'Selecione a adega', path: ['adegaId'] })

type CreateFormData = z.infer<typeof createSchema>
type EditFormData = z.infer<typeof editSchema>
type FormData = CreateFormData | EditFormData

// ——— Helpers ———

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return (parts[0][0] ?? '?').toUpperCase()
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

const PERFIL_CONFIG: Record<
  string,
  { label: string; avatarClass: string; badgeClass: string }
> = {
  DONO: {
    label: 'Dono',
    avatarClass: 'bg-blue-100 text-blue-700',
    badgeClass: 'bg-purple-100 text-purple-700',
  },
  FUNCIONARIO: {
    label: 'Funcionário',
    avatarClass: 'bg-green-100 text-green-700',
    badgeClass: 'bg-green-100 text-green-700',
  },
}

// ——— Dialog ———

interface UsuarioDialogProps {
  editingUsuario: Usuario | null
  adegas: { id: string; nome: string }[]
  onClose: () => void
  onSuccess: () => void
}

function UsuarioDialog({
  editingUsuario,
  adegas,
  onClose,
  onSuccess,
}: UsuarioDialogProps) {
  const isEdit = !!editingUsuario
  const queryClient = useQueryClient()

  const defaultAdegaId = isEdit
    ? (adegas.find((a) => a.nome === editingUsuario.adegaNome)?.id ?? '')
    : ''

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(isEdit ? (editSchema as any) : (createSchema as any)),
    defaultValues: {
      nome: editingUsuario?.nome ?? '',
      email: editingUsuario?.email ?? '',
      senha: '',
      perfil: (editingUsuario?.perfil as 'DONO' | 'FUNCIONARIO') ?? 'FUNCIONARIO',
      adegaId: defaultAdegaId,
    },
  })

  const perfil = useWatch({ control, name: 'perfil' })

  useEffect(() => {
    if (perfil === 'DONO') setValue('adegaId', '')
  }, [perfil, setValue])

  const createMutation = useMutation({
    mutationFn: (data: CreateFormData) =>
      usuariosApi.createUsuario({
        nome: data.nome,
        email: data.email,
        senha: data.senha,
        perfil: data.perfil,
        adegaId: data.adegaId || undefined,
      }),
    onSuccess: () => {
      toast.success('Usuário criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      onSuccess()
    },
    onError: () => toast.error('Erro ao criar usuário.'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: EditFormData) =>
      usuariosApi.updateUsuario(editingUsuario!.id, {
        nome: data.nome,
        email: data.email,
        senha: data.senha ?? '',
        perfil: data.perfil,
        adegaId: data.adegaId || undefined,
      }),
    onSuccess: () => {
      toast.success('Usuário atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      onSuccess()
    },
    onError: () => toast.error('Erro ao atualizar usuário.'),
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  function onSubmit(data: FormData) {
    if (isEdit) {
      updateMutation.mutate(data as EditFormData)
    } else {
      createMutation.mutate(data as CreateFormData)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nome *</label>
            <input
              {...register('nome')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.nome && (
              <p className="text-xs text-red-600 mt-1">{errors.nome.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email *</label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Senha {isEdit ? '(deixe em branco para manter)' : '*'}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              {...register('senha')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.senha && (
              <p className="text-xs text-red-600 mt-1">
                {(errors.senha as { message?: string }).message}
              </p>
            )}
          </div>

          {/* Perfil */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Perfil *</label>
            <select
              {...register('perfil')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="FUNCIONARIO">Funcionário</option>
              <option value="DONO">Dono</option>
            </select>
          </div>

          {/* Adega — FUNCIONARIO only */}
          {perfil === 'FUNCIONARIO' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Adega *</label>
              <select
                {...register('adegaId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                {adegas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
              {errors.adegaId && (
                <p className="text-xs text-red-600 mt-1">
                  {(errors.adegaId as { message?: string }).message}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ——— Main Page ———

export default function UsuariosPage() {
  const queryClient = useQueryClient()
  const [showDialog, setShowDialog] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: usuariosList, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => usuariosApi.getUsuarios(),
  })

  const { data: adegasList = [] } = useQuery({
    queryKey: ['adegas'],
    queryFn: adegasApi.getAdegas,
    retry: false,
  })

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => usuariosApi.toggleUsuarioStatus(id),
    onSuccess: () => {
      toast.success('Status atualizado!')
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    },
    onError: () => toast.error('Erro ao atualizar status.'),
  })

  const filtered = (usuariosList ?? []).filter(
    (u) =>
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  function handleEdit(u: Usuario) {
    setEditingUsuario(u)
    setShowDialog(true)
  }

  function handleNew() {
    setEditingUsuario(null)
    setShowDialog(true)
  }

  function handleDialogClose() {
    setShowDialog(false)
    setEditingUsuario(null)
  }

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus size={16} />
            Novo Usuário
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              Nenhum usuário encontrado.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Nome', 'Perfil', 'Adega', 'Status', ''].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide ${
                        h === '' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h || 'Ações'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => {
                  const cfg = PERFIL_CONFIG[u.perfil] ?? PERFIL_CONFIG.FUNCIONARIO
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      {/* Nome + email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${cfg.avatarClass}`}
                          >
                            {getInitials(u.nome)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{u.nome}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Perfil badge */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.badgeClass}`}
                        >
                          {cfg.label}
                        </span>
                      </td>

                      {/* Adega */}
                      <td className="px-4 py-3 text-gray-700">
                        {u.adegaNome ?? (
                          <span className="text-gray-400 italic">Ambas</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {u.ativo ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            Inativo
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(u)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Pencil size={13} />
                            Editar
                          </button>
                          <button
                            onClick={() => toggleStatusMutation.mutate(u.id)}
                            disabled={toggleStatusMutation.isPending}
                            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                              u.ativo
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {u.ativo ? (
                              <>
                                <UserX size={13} />
                                Desativar
                              </>
                            ) : (
                              <>
                                <UserCheck size={13} />
                                Ativar
                              </>
                            )}
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

      {showDialog && (
        <UsuarioDialog
          editingUsuario={editingUsuario}
          adegas={adegasList}
          onClose={handleDialogClose}
          onSuccess={handleDialogClose}
        />
      )}
    </>
  )
}
