import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Store, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
import * as api from '../../services/api'

const schema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email obrigatório'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    try {
      await api.auth.requestPasswordReset(data.email)
      setSuccess(true)
    } catch {
      toast.error('Erro ao enviar o link. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Store className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Esqueci minha senha</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Digite seu email e enviaremos um link para redefinir sua senha
          </p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <p className="text-sm text-green-700 bg-green-50 rounded-lg p-4 mb-6">
              Se o email estiver cadastrado, você receberá as instruções em breve.
            </p>
            <Link
              to="/login"
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
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
                    Enviando...
                  </>
                ) : (
                  'Enviar link de redefinição'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
