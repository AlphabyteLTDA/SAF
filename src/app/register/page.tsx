"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

const registerSchema = z.object({
    fullName: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema)
    })

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true)

        const { error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    full_name: data.fullName
                }
            }
        })

        setIsLoading(false)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Conta criada com sucesso! Redirecionando...')
            router.push('/')
        }
    }

    return (
        <div className="min-h-screen bg-saf-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-sm border border-saf-100 flex flex-col items-center">
                <div className="w-16 h-16 bg-saf-100 text-saf-500 rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-saf-900 mb-2 text-center">Criar Conta</h1>
                <p className="text-saf-500 text-center text-sm mb-6 pb-2 border-b border-saf-50 w-full text-balance">
                    Cadastre-se para solicitar empréstimos de livros.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Nome Completo"
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:border-saf-500 focus:ring-4 focus:ring-saf-500/20 outline-none transition-all placeholder-saf-300 min-h-[44px] text-saf-900 ${errors.fullName ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-saf-100'
                                }`}
                            {...register('fullName')}
                        />
                        {errors.fullName && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.fullName.message}</p>}
                    </div>

                    <div>
                        <input
                            type="email"
                            placeholder="E-mail"
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:border-saf-500 focus:ring-4 focus:ring-saf-500/20 outline-none transition-all placeholder-saf-300 min-h-[44px] text-saf-900 ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-saf-100'
                                }`}
                            {...register('email')}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.email.message}</p>}
                    </div>

                    <div>
                        <input
                            type="password"
                            placeholder="Senha"
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:border-saf-500 focus:ring-4 focus:ring-saf-500/20 outline-none transition-all placeholder-saf-300 min-h-[44px] text-saf-900 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-saf-100'
                                }`}
                            {...register('password')}
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.password.message}</p>}
                    </div>

                    <div>
                        <input
                            type="password"
                            placeholder="Confirmar Senha"
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:border-saf-500 focus:ring-4 focus:ring-saf-500/20 outline-none transition-all placeholder-saf-300 min-h-[44px] text-saf-900 ${errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-saf-100'
                                }`}
                            {...register('confirmPassword')}
                        />
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-saf-500 hover:bg-saf-600 active:bg-saf-700 text-white font-bold py-3 px-4 rounded-xl min-h-[44px] transition-colors mt-2 disabled:opacity-70 flex justify-center items-center"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            'Criar Conta'
                        )}
                    </button>

                    <div className="mt-4 text-center">
                        <Link
                            href="/login"
                            className="text-saf-500 hover:text-saf-600 font-medium text-sm flex items-center justify-center min-h-[44px]"
                        >
                            Já tem uma conta? Faça login aqui
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
