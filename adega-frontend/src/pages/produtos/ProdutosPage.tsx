import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, X, Loader2, Package } from 'lucide-react'
import {
  produtos as produtosApi,
  categorias as categoriasApi,
} from '../../services/api'
import type { Produto } from '../../types'

// ─── Utils ────────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const optNum = z.preprocess(
  (v) =>
    v === '' || v === null || v === undefined || Number.isNaN(v as number)
      ? undefined
      : Number(v),
  z.number().min(0).optional(),
)

// ─── Schemas ──────────────────────────────────────────────────────────────────

const variacaoItemSchema = z.object({
  descricao: z.string().min(1, 'Obrigatório'),
  precoVenda: z.coerce.number().min(0.01, 'Deve ser > 0'),
  custoAquisicao: optNum,
  estoqueAtual: z.coerce.number().int().min(0).default(0),
  estoqueMinimo: z.coerce.number().int().min(0).default(0),
})

const produtoSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  categoriaId: z.string().min(1, 'Categoria obrigatória'),
  descricao: z.string().optional(),
  ativo: z.boolean().default(true),
  variacoes: z.array(variacaoItemSchema),
})

const variacaoAddSchema = variacaoItemSchema

type ProdutoFormData = z.infer<typeof produtoSchema>
type VariacaoAddData = z.infer<typeof variacaoAddSchema>

// ─── ProdutoDialog ────────────────────────────────────────────────────────────

interface ProdutoDialogProps {
  editingProduto: Produto | null
  categorias: { id: string; nome: string }[]
  onClose: () => void
  onSubmit: (data: ProdutoFormData) => void
  isLoading: boolean
}

function ProdutoDialog({
  editingProduto,
  categorias,
  onClose,
  onSubmit,
  isLoading,
}: ProdutoDialogProps) {
  const isEdit = !!editingProduto

  const categoriaId = isEdit
    ? categorias.find((c) => c.nome === editingProduto.categoriaNome)?.id ?? ''
    : ''

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema) as any,
    defaultValues: isEdit
      ? {
          nome: editingProduto.nome,
          categoriaId,
          descricao: editingProduto.descricao ?? '',
          ativo: editingProduto.ativo,
          variacoes: [],
        }
      : {
          nome: '',
          categoriaId: '',
          descricao: '',
          ativo: true,
          variacoes: [
            { descricao: '', precoVenda: 0, custoAquisicao: undefined, estoqueAtual: 0, estoqueMinimo: 0 },
          ],
        },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'variacoes' })

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              {...register('nome')}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Heineken"
            />
            {errors.nome && (
              <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>
            )}
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
            <select
              {...register('categoriaId')}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            {errors.categoriaId && (
              <p className="text-red-500 text-xs mt-1">{errors.categoriaId.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              {...register('descricao')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Detalhes do produto..."
            />
          </div>

          {/* Status toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-sm font-medium text-gray-700">Ativo</span>
            <Controller
              name="ativo"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    field.value ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      field.value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              )}
            />
          </div>

          {/* Variacoes (create only) */}
          {!isEdit && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Variações *</label>
                <button
                  type="button"
                  onClick={() =>
                    append({
                      descricao: '',
                      precoVenda: 0,
                      custoAquisicao: undefined,
                      estoqueAtual: 0,
                      estoqueMinimo: 0,
                    })
                  }
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Variação
                </button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border border-gray-200 rounded-xl p-4 space-y-3 relative"
                  >
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                      className="absolute top-3 right-3 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Variação {index + 1}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Descrição */}
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">Descrição *</label>
                        <input
                          {...register(`variacoes.${index}.descricao`)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Ex: Unidade, Caixa 12un..."
                        />
                        {errors.variacoes?.[index]?.descricao && (
                          <p className="text-red-500 text-xs mt-0.5">
                            {errors.variacoes[index].descricao?.message}
                          </p>
                        )}
                      </div>

                      {/* Preço de venda */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Preço de Venda *</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register(`variacoes.${index}.precoVenda`, { valueAsNumber: true })}
                            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0,00"
                          />
                        </div>
                        {errors.variacoes?.[index]?.precoVenda && (
                          <p className="text-red-500 text-xs mt-0.5">
                            {errors.variacoes[index].precoVenda?.message}
                          </p>
                        )}
                      </div>

                      {/* Custo */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Custo Aquisição
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register(`variacoes.${index}.custoAquisicao`, {
                              valueAsNumber: true,
                            })}
                            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0,00"
                          />
                        </div>
                      </div>

                      {/* Estoque inicial */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Estoque Inicial
                        </label>
                        <input
                          type="number"
                          min="0"
                          {...register(`variacoes.${index}.estoqueAtual`, { valueAsNumber: true })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>

                      {/* Estoque mínimo */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Estoque Mínimo
                        </label>
                        <input
                          type="number"
                          min="0"
                          {...register(`variacoes.${index}.estoqueMinimo`, {
                            valueAsNumber: true,
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {errors.variacoes && !Array.isArray(errors.variacoes) && (
                <p className="text-red-500 text-xs mt-1">
                  {(errors.variacoes as any).message}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Salvar' : 'Criar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── VariacaoDialog ───────────────────────────────────────────────────────────

interface VariacaoDialogProps {
  produtoNome: string
  onClose: () => void
  onSubmit: (data: VariacaoAddData) => void
  isLoading: boolean
}

function VariacaoDialog({
  produtoNome,
  onClose,
  onSubmit,
  isLoading,
}: VariacaoDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VariacaoAddData>({
    resolver: zodResolver(variacaoAddSchema) as any,
    defaultValues: { descricao: '', precoVenda: 0, estoqueAtual: 0, estoqueMinimo: 0 },
  })

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Nova Variação</h2>
            <p className="text-xs text-gray-500 mt-0.5">{produtoNome}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
            <input
              {...register('descricao')}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Garrafa 600ml"
            />
            {errors.descricao && (
              <p className="text-red-500 text-xs mt-1">{errors.descricao.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Venda *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('precoVenda', { valueAsNumber: true })}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                />
              </div>
              {errors.precoVenda && (
                <p className="text-red-500 text-xs mt-1">{errors.precoVenda.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custo Aquisição</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('custoAquisicao', { valueAsNumber: true })}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Inicial</label>
              <input
                type="number"
                min="0"
                {...register('estoqueAtual', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo</label>
              <input
                type="number"
                min="0"
                {...register('estoqueMinimo', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── ProdutosPage ─────────────────────────────────────────────────────────────

const VARIACAO_COLORS = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-orange-50 text-orange-700 border-orange-200',
  'bg-pink-50 text-pink-700 border-pink-200',
]

export default function ProdutosPage() {
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterAtivo, setFilterAtivo] = useState<boolean | null>(null)
  const [showProdutoDialog, setShowProdutoDialog] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [showVariacaoDialog, setShowVariacaoDialog] = useState(false)
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)

  const { data: produtosList = [], isLoading } = useQuery<Produto[]>({
    queryKey: ['produtos'],
    queryFn: () => produtosApi.getProdutos(),
  })

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: categoriasApi.getCategorias,
  })

  const invalidateProdutos = () =>
    queryClient.invalidateQueries({ queryKey: ['produtos'] })

  const { mutate: createProduto, isPending: isCreating } = useMutation({
    mutationFn: produtosApi.createProduto,
    onSuccess: () => {
      toast.success('Produto criado com sucesso!')
      setShowProdutoDialog(false)
      invalidateProdutos()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao criar produto')
    },
  })

  const { mutate: updateProduto, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProdutoFormData }) =>
      produtosApi.updateProduto(id, { ...data, variacoes: [] }),
    onSuccess: () => {
      toast.success('Produto atualizado!')
      setShowProdutoDialog(false)
      setEditingProduto(null)
      invalidateProdutos()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao atualizar produto')
    },
  })

  const { mutate: toggleStatus } = useMutation({
    mutationFn: produtosApi.toggleProdutoStatus,
    onSuccess: (data) => {
      toast.success(`Produto ${data.ativo ? 'ativado' : 'desativado'}!`)
      invalidateProdutos()
    },
    onError: () => toast.error('Erro ao alterar status'),
  })

  const { mutate: addVariacao, isPending: isAddingVariacao } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: VariacaoAddData }) =>
      produtosApi.addVariacao(id, {
        descricao: data.descricao,
        precoVenda: data.precoVenda,
        custoAquisicao:
          data.custoAquisicao && !Number.isNaN(data.custoAquisicao)
            ? data.custoAquisicao
            : undefined,
        estoqueAtual: data.estoqueAtual ?? 0,
        estoqueMinimo: data.estoqueMinimo ?? 0,
      }),
    onSuccess: () => {
      toast.success('Variação adicionada!')
      setShowVariacaoDialog(false)
      setSelectedProduto(null)
      invalidateProdutos()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao adicionar variação')
    },
  })

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filtered = produtosList.filter((p) => {
    const matchSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase())
    const matchAtivo = filterAtivo === null || p.ativo === filterAtivo
    return matchSearch && matchAtivo
  })

  function handleProdutoSubmit(data: ProdutoFormData) {
    if (editingProduto) {
      updateProduto({ id: editingProduto.id, data })
    } else {
      const variacoes = data.variacoes.map((v) => ({
        descricao: v.descricao,
        precoVenda: v.precoVenda,
        custoAquisicao:
          v.custoAquisicao && !Number.isNaN(v.custoAquisicao) ? v.custoAquisicao : undefined,
        estoqueAtual: v.estoqueAtual ?? 0,
        estoqueMinimo: v.estoqueMinimo ?? 0,
      }))
      createProduto({
        nome: data.nome,
        categoriaId: data.categoriaId,
        descricao: data.descricao || undefined,
        ativo: data.ativo,
        variacoes,
      })
    }
  }

  return (
    <>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <button
            onClick={() => {
              setEditingProduto(null)
              setShowProdutoDialog(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterAtivo === null ? 'all' : String(filterAtivo)}
            onChange={(e) =>
              setFilterAtivo(
                e.target.value === 'all' ? null : e.target.value === 'true',
              )
            }
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Nome
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Categoria
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Variações
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                      Nenhum produto encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((produto) => (
                    <tr key={produto.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{produto.nome}</td>
                      <td className="px-4 py-3 text-gray-500">{produto.categoriaNome}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {produto.variacoes.map((v, idx) => (
                            <span
                              key={v.id}
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                                VARIACAO_COLORS[idx % VARIACAO_COLORS.length]
                              }`}
                            >
                              {v.descricao} · {fmt(v.precoVenda)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            produto.ativo
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {produto.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingProduto(produto)
                              setShowProdutoDialog(true)
                            }}
                            title="Editar"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduto(produto)
                              setShowVariacaoDialog(true)
                            }}
                            title="Adicionar variação"
                            className="px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            Var.
                          </button>
                          <button
                            onClick={() => toggleStatus(produto.id)}
                            className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                              produto.ativo
                                ? 'text-red-500 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {produto.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {showProdutoDialog && (
        <ProdutoDialog
          editingProduto={editingProduto}
          categorias={categorias}
          onClose={() => {
            setShowProdutoDialog(false)
            setEditingProduto(null)
          }}
          onSubmit={handleProdutoSubmit}
          isLoading={isCreating || isUpdating}
        />
      )}

      {showVariacaoDialog && selectedProduto && (
        <VariacaoDialog
          produtoNome={selectedProduto.nome}
          onClose={() => {
            setShowVariacaoDialog(false)
            setSelectedProduto(null)
          }}
          onSubmit={(data) => addVariacao({ id: selectedProduto.id, data })}
          isLoading={isAddingVariacao}
        />
      )}
    </>
  )
}
