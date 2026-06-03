"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { BookOpen, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

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
                    Autentique-se para acessar o acervo da SAF.
                </p>

                {error && (
                    <div className="w-full bg-red-50 text-red-600 font-medium text-sm p-3 rounded-xl mb-4 text-center">
                        {error}
                    </div>
                )}

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
                        disabled={isLoading}
                        className="w-full bg-saf-500 hover:bg-saf-600 active:bg-saf-700 text-white font-bold py-3 px-4 rounded-xl min-h-[44px] transition-colors mt-2 disabled:opacity-70 flex justify-center items-center"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            'Entrar'
                        )}
                    </button>
                    <div className="mt-4 text-center">
                        <Link
                            href="/register"
                            className="text-saf-500 hover:text-saf-600 font-medium text-sm flex items-center justify-center min-h-[44px]"
                        >
                            Ainda não tem conta? Cadastre-se aqui
                        </Link>
                    </div>
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
