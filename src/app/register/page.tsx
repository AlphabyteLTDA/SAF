"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

function GoogleIcon() {
    return (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    )
}

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
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const router = useRouter()

    const handleGoogleRegister = async () => {
        setIsGoogleLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) {
            toast.error('Erro ao conectar com o Google. Tente novamente.')
            setIsGoogleLoading(false)
        }
    }

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
                },
                emailRedirectTo: `${window.location.origin}/login`
            }
        })

        setIsLoading(false)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Boas-vindas! Verifique sua caixa de entrada.', { duration: 5000 })
            setIsSubmitted(true)
        }
    }

    if (isSubmitted) {
        return (
            <div className="min-h-[calc(100vh-100px)] md:min-h-[calc(100vh-64px)] bg-saf-50 flex flex-col justify-center items-center p-4">
                <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-sm border border-saf-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm border-2 border-emerald-100">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-saf-900 mb-3">Verifique seu E-mail</h1>
                    <p className="text-saf-600 mb-2 leading-relaxed">
                        Falta muito pouco! Enviamos uma mensagem para <strong>{register('email').name === 'email' /* workaround merely for visuals, we don't have the explicit value preserved outside react-hook-form unless watched, but let's keep it generic */ ? 'você' : 'você'}</strong> com um botão seguro de confirmação.
                    </p>
                    <p className="text-saf-600 mb-6 leading-relaxed">
                        Por segurança, <strong>precisamos que você clique no botão que está no e-mail</strong> para ativar sua conta no Acervo.
                    </p>
                    <p className="text-xs text-saf-400 mt-2 mb-8 bg-saf-50 p-3 rounded-lg border border-saf-100">
                        Não recebeu? Verifique se o e-mail não caiu de paraquedas na pasta de Spam ou Lixo Eletrônico.
                    </p>
                    <Link
                        href="/login"
                        className="w-full bg-saf-600 hover:bg-saf-700 active:bg-saf-800 text-white font-bold py-3.5 px-4 rounded-xl transition-colors min-h-[48px] flex justify-center items-center shadow-sm"
                    >
                        Ir para a tela de Login
                    </Link>
                </div>
                <div className="mt-4 mb-2 w-72 md:w-80 relative h-24 md:h-32 opacity-90 transition-opacity hover:opacity-100 flex items-center justify-center shrink-0">
                    <Image 
                        src="/presbeteriana_logo.png" 
                        alt="Igreja Presbiteriana do Brasil" 
                        fill 
                        className="object-contain" 
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-100px)] md:min-h-[calc(100vh-64px)] bg-saf-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-sm border border-saf-100 flex flex-col items-center">
                <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden border-[3px] border-saf-100 shadow-sm flex items-center justify-center bg-white">
                    <Image src="/saflogobranco.png" alt="SAF Logo" fill className="object-cover" />
                </div>
                <h1 className="text-2xl font-bold text-saf-900 mb-2 text-center">Criar Conta</h1>
                <p className="text-saf-500 text-center text-sm mb-6 pb-2 border-b border-saf-50 w-full text-balance">
                    Cadastre-se para solicitar empréstimos de livros.
                </p>

                <button
                    type="button"
                    onClick={handleGoogleRegister}
                    disabled={isGoogleLoading || isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl min-h-[44px] border-2 border-gray-200 transition-all disabled:opacity-70 shadow-sm mb-4"
                >
                    {isGoogleLoading ? (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    ) : (
                        <GoogleIcon />
                    )}
                    Criar conta com Google
                </button>

                <div className="w-full flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-saf-100" />
                    <span className="text-saf-400 text-xs font-medium">ou crie com e-mail</span>
                    <div className="flex-1 h-px bg-saf-100" />
                </div>

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

                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Senha"
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:border-saf-500 focus:ring-4 focus:ring-saf-500/20 outline-none transition-all placeholder-saf-300 min-h-[44px] text-saf-900 pr-12 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-saf-100'
                                }`}
                            {...register('password')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-[-1px] bottom-0 p-2 text-saf-400 hover:text-saf-600 focus:outline-none transition-colors h-fit my-auto"
                            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        {errors.password && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.password.message}</p>}
                    </div>

                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirmar Senha"
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:border-saf-500 focus:ring-4 focus:ring-saf-500/20 outline-none transition-all placeholder-saf-300 min-h-[44px] text-saf-900 pr-12 ${errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-saf-100'
                                }`}
                            {...register('confirmPassword')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-[-1px] bottom-0 p-2 text-saf-400 hover:text-saf-600 focus:outline-none transition-colors h-fit my-auto"
                            aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
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
            <div className="mt-4 mb-2 w-72 md:w-80 relative h-24 md:h-32 opacity-90 transition-opacity hover:opacity-100 flex items-center justify-center shrink-0">
                <Image 
                    src="/presbeteriana_logo.png" 
                    alt="Igreja Presbiteriana do Brasil" 
                    fill 
                    className="object-contain" 
                />
            </div>
        </div>
    )
}
