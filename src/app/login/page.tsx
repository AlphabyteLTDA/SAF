"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
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
        <div className="min-h-screen bg-saf-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-sm border border-saf-100 flex flex-col items-center">
                <div className="w-16 h-16 bg-saf-100 text-saf-500 rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8" />
                </div>
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
                    <div>
                        <input
                            type="password"
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-saf-100 rounded-xl focus:border-saf-500 focus:ring-4 focus:ring-saf-500/20 outline-none transition-all placeholder-saf-300 min-h-[44px] text-saf-900"
                            required
                        />
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
        </div>
    )
}
