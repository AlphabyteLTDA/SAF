"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut, ShieldAlert, User as UserIcon, PlusCircle } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
    const { user, role, isLoading } = useAuth()
    const router = useRouter()
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login')
        }
    }, [user, isLoading, router])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        queryClient.clear()
        router.push('/login')
    }

    if (isLoading || !user) {
        return (
            <div className="flex justify-center items-center py-20 pb-24" data-testid="loading-spinner">
                <div className="w-8 h-8 border-4 border-saf-200 border-t-saf-500 rounded-full animate-spin"></div>
            </div>
        )
    }

    const name = user.user_metadata?.full_name || 'Usuário(a) SAF'
    const email = user.email || ''

    return (
        <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-8 pb-28 pt-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-saf-900">Meu Perfil</h1>
                <p className="text-saf-500 text-sm">Gerencie sua conta e visualize suas permissões.</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-saf-100 flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-saf-100 rounded-full flex items-center justify-center text-saf-400 flex-shrink-0">
                        <UserIcon className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-saf-900">{name}</h2>
                        <p className="text-saf-500 text-sm">{email}</p>
                    </div>
                </div>

                <div className="border-t border-saf-100 pt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-saf-600">Nível de Acesso</span>
                    {role === 'admin' ? (
                        <span className="bg-saf-50 text-saf-700 border border-saf-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            Administrador(a)
                        </span>
                    ) : (
                        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full border border-gray-200">
                            Leitor(a)
                        </span>
                    )}
                </div>
            </div>

            {role === 'admin' && (
                <div className="flex flex-col gap-4">
                    <h3 className="font-bold text-saf-900 px-1 hover:text-saf-800 transition-colors">Administração</h3>

                    <Link
                        href="/admin/requests"
                        className="bg-white rounded-2xl p-4 shadow-sm border border-saf-100 flex items-center gap-4 hover:border-saf-300 transition-colors group"
                    >
                        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 group-hover:bg-amber-100 transition-colors">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-saf-900">Gestão de Solicitações</span>
                            <span className="text-xs text-saf-500">Aprovar reservas e devoluções</span>
                        </div>
                    </Link>

                    <Link
                        href="/admin/books/new"
                        className="bg-white rounded-2xl p-4 shadow-sm border border-saf-100 flex items-center gap-4 hover:border-saf-300 transition-colors group"
                    >
                        <div className="w-12 h-12 bg-saf-50 rounded-full flex items-center justify-center text-saf-500 group-hover:bg-saf-100 transition-colors">
                            <PlusCircle className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-saf-900">Cadastrar Novo Livro</span>
                            <span className="text-xs text-saf-500">Adicionar novos títulos à biblioteca</span>
                        </div>
                    </Link>
                </div>
            )}

            <button
                onClick={handleLogout}
                className="mt-4 w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold py-3 px-4 rounded-xl min-h-[44px] transition-colors flex justify-center items-center gap-2 shadow-sm"
            >
                <LogOut className="w-5 h-5" />
                Sair do Sistema
            </button>
        </div>
    )
}
