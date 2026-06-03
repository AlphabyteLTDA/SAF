"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

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

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true)
        setError(null)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) {
            setError('Erro ao conectar com o Google. Tente novamente.')
            setIsGoogleLoading(false)
        }
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setError('Credenciais inválidas')
            setIsLoading(false)
        } else {
            router.push('/')
        }
    }

    return (
        <div className="min-h-[calc(100vh-100px)] md:min-h-[calc(100vh-64px)] bg-saf-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-sm border border-saf-100 flex flex-col items-center">
                <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden border-[3px] border-saf-100 shadow-sm flex items-center justify-center bg-white">
                    <Image src="/saflogobranco.png" alt="SAF Logo" fill className="object-cover" />
                </div>
                <h2 className="text-xl font-bold text-saf-800 mb-1 text-center tracking-tight">Biblioteca Missionária</h2>
                <h1 className="text-2xl font-bold text-saf-900 mb-2 text-center">Entrar</h1>
                <p className="text-saf-500 text-center text-sm mb-6 pb-2 border-b border-saf-50 w-full text-balance">
                    Entre com sua conta Google para acessar o acervo.
                </p>

                {error && (
                    <div className="w-full bg-red-50 text-red-600 font-medium text-sm p-3 rounded-xl mb-4 text-center">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading || isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl min-h-[44px] border-2 border-gray-200 transition-all disabled:opacity-70 shadow-sm mb-4"
                >
                    {isGoogleLoading ? (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    ) : (
                        <GoogleIcon />
                    )}
                    Entrar com Google
                </button>

                <div className="w-full flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-saf-100" />
                    <span className="text-saf-400 text-xs font-medium">ou entre com e-mail</span>
                    <div className="flex-1 h-px bg-saf-100" />
                </div>

                <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
                    <div>
                        <input
                            type="email"
                            placeholder="E-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-saf-100 rounded-xl focus:border-saf-500 focus:ring-4 focus:ring-saf-500/20 outline-none transition-all placeholder-saf-300 min-h-[44px] text-saf-900"
                            required
                        />
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-saf-100 rounded-xl focus:border-saf-500 focus:ring-4 focus:ring-saf-500/20 outline-none transition-all placeholder-saf-300 min-h-[44px] text-saf-900 pr-12"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-saf-400 hover:text-saf-600 focus:outline-none transition-colors"
                            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || isGoogleLoading}
                        className="w-full bg-saf-500 hover:bg-saf-600 active:bg-saf-700 text-white font-bold py-3 px-4 rounded-xl min-h-[44px] transition-colors mt-2 disabled:opacity-70 flex justify-center items-center"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            'Entrar'
                        )}
                    </button>
                </form>
            </div>
            <div className="mt-4 mb-2 w-72 md:w-80 relative h-24 md:h-32 opacity-90 transition-opacity hover:opacity-100 flex items-center justify-center">
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
