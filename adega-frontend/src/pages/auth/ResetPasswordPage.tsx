import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Store, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import * as api from '../../services/api'

const schema = z
  .object({
    newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [success, setSuccess] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
  })

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Link inválido</h2>
          <p className="text-sm text-gray-500 mb-6">
            Link inválido. Solicite um novo link de redefinição.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            Solicitar novo link
          </Link>
        </div>
      </div>
    )
  }

  async function onSubmit(data: FormData) {
    setApiError(null)
    try {
      await api.auth.resetPassword(token!, data.newPassword)
      setSuccess(true)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao redefinir a senha. Tente novamente.'
      setApiError(message)
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Store className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Redefinir senha</h1>
        </div>

        {success ? (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-sm text-green-700 bg-green-50 rounded-lg p-4 mb-6">
              Senha redefinida com sucesso!
            </p>
            <Link
              to="/login"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Ir para o login
            </Link>
          </div>
        ) : (
          <>
            {apiError && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-red-700">{apiError}</p>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-red-600 underline mt-1 inline-block"
                  >
                    Solicitar novo link
                  </Link>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nova senha
                </label>
                <input
                  {...register('newPassword')}
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.newPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmar nova senha
                </label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  'Redefinir senha'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
