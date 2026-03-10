"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { BottomNavBar } from '@/components/BottomNavBar'
import { BookOpen, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import { Book } from '@/hooks/useBooks'

type LoanWithBook = {
    id: string
    book_id: string
    user_id: string
    borrow_date: string
    due_date: string
    status: 'pendente' | 'ativo' | 'finalizado' | 'cancelado'
    books: Book
}

export default function LoansPage() {
    const { user, isLoading: authLoading } = useAuth()
    const [loans, setLoans] = useState<LoanWithBook[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchLoans() {
            if (!user) return

            setIsLoading(true)
            const { data, error } = await supabase
                .from('loans')
                .select(`
          *,
          books (*)
        `)
                .eq('user_id', user.id)
                .in('status', ['ativo', 'pendente'])
                .order('due_date', { ascending: true })

            if (!error && data) {
                setLoans(data as LoanWithBook[])
            }
            setIsLoading(false)
        }

        if (!authLoading) {
            fetchLoans()
        }
    }, [user, authLoading])

    if (authLoading || isLoading) {
        return (
            <div className="flex justify-center items-center py-20 pb-24" data-testid="loading-spinner">
                <div className="w-8 h-8 border-4 border-saf-200 border-t-saf-500 rounded-full animate-spin"></div>
                <BottomNavBar />
            </div>
        )
    }

    return (
        <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-6 pb-28">
            <div className="flex flex-col gap-1 mt-4">
                <h1 className="text-2xl font-bold text-saf-900">Meus Livros</h1>
                <p className="text-saf-500 text-sm">Acompanhe seus empréstimos ativos</p>
            </div>

            {loans.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-saf-100 flex flex-col items-center text-center mt-4">
                    <div className="w-20 h-20 bg-saf-50 rounded-full flex items-center justify-center text-saf-300 mb-4">
                        <BookOpen className="w-10 h-10" />
                    </div>
                    <h2 className="text-xl font-bold text-saf-900 mb-2">Nenhum empréstimo ativo no momento</h2>
                    <p className="text-saf-500 text-sm mb-6 leading-relaxed">
                        Você ainda não solicitou nenhum livro. Que tal explorar nosso acervo maravilhoso?
                    </p>
                    <Link
                        href="/"
                        className="w-full bg-saf-500 hover:bg-saf-600 active:bg-saf-700 text-white font-bold py-3 px-4 rounded-xl min-h-[44px] transition-colors flex justify-center items-center"
                    >
                        Explorar Catálogo
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {loans.map((loan) => {
                        const isOverdue = new Date(loan.due_date) < new Date()
                        const isPending = loan.status === 'pendente'

                        const diffMs = new Date(loan.due_date).getTime() - new Date().getTime()
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

                        return (
                            <div key={loan.id} className="bg-white rounded-2xl p-4 shadow-sm border border-saf-100 flex flex-col gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-20 bg-saf-100 rounded-lg flex-shrink-0 flex items-center justify-center text-saf-300">
                                        <BookOpen className="w-8 h-8" />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <h3 className="font-bold text-saf-900 line-clamp-2 leading-tight mb-1">{loan.books.title}</h3>
                                        <p className="text-sm text-saf-500 mb-2">{loan.books.author}</p>

                                        <div className="flex flex-wrap gap-2 mt-auto">
                                            {isPending ? (
                                                <span className="text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 border bg-amber-50 text-amber-700 border-amber-200">
                                                    <Clock className="w-3 h-3" />
                                                    Aguardando Retirada
                                                </span>
                                            ) : (
                                                <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 border
                        ${isOverdue
                                                        ? 'bg-red-50 text-red-700 border-red-100'
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                                    <Clock className="w-3 h-3" />
                                                    {isOverdue ? 'Atrasado' : 'Emprestado'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-saf-100 flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-xs text-saf-500 font-medium">
                                        <Calendar className="w-4 h-4 text-saf-400" />
                                        <span>Prazo: {new Date(loan.due_date).toLocaleDateString('pt-BR')}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs font-medium">
                                        <span className="text-saf-400">
                                            {isPending ? 'Para buscar na igreja' : 'Para devolução'}
                                        </span>
                                        <div className={`font-bold ${isOverdue ? 'text-red-600' : (isPending ? 'text-amber-600' : 'text-saf-600')}`}>
                                            {isOverdue
                                                ? (isPending ? 'Prazo de 48h Esgotado' : `Atrasado há ${Math.abs(diffDays)} dias`)
                                                : (isPending ? `Restam ${diffHours} horas` : `Devolver em ${diffDays} dias`)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <BottomNavBar />
        </div>
    )
}
