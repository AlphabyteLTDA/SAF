"use client"

import { useState } from 'react'
import { useBooks } from '@/hooks/useBooks'
import { Search } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function BookList() {
    const { data: books, isLoading, error } = useBooks()
    const { user } = useAuth()
    const [searchTerm, setSearchTerm] = useState('')

    // Fetch user's active/pending loans to mark books in the catalog
    const { data: myLoans } = useQuery({
        queryKey: ['my-loans-ids', user?.id],
        queryFn: async () => {
            if (!user) return []
            const { data, error } = await supabase
                .from('loans')
                .select('book_id')
                .eq('user_id', user.id)
                .in('status', ['ativo', 'pendente'])

            if (error) return []
            return data?.map(d => d.book_id) || []
        },
        enabled: !!user
    })

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12" data-testid="loading-spinner">
                <div className="w-8 h-8 border-4 border-saf-200 border-t-saf-500 rounded-full animate-spin"></div>
            </div>
        )
    }

    if (error) {
        return <div className="text-red-500 text-center py-4">Erro ao carregar os livros.</div>
    }

    const filteredBooks = books?.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    return (
        <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-4">
            {/* Search Input - Mobile First (min-h-[44px]) */}
            <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-saf-400" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar título ou autor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 border-2 border-transparent bg-white shadow-sm rounded-2xl leading-5 text-saf-900 placeholder-saf-400 focus:outline-none focus:border-saf-500 focus:ring-4 focus:ring-saf-500/20 transition-all min-h-[44px]"
                />
            </div>

            {/* Book List Cards */}
            <div className="flex flex-col gap-4 pb-20"> {/* pb-20 prevents bottom-nav overlap */}
                {filteredBooks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl shadow-sm border border-saf-100">
                        <span className="text-saf-400 mb-2">
                            <Search className="h-8 w-8 opacity-50" />
                        </span>
                        <p className="text-saf-600 font-medium">Nenhum livro encontrado.</p>
                        <p className="text-saf-400 text-sm mt-1">Tente buscar por outro título ou autor.</p>
                    </div>
                ) : (
                    filteredBooks.map(book => {
                        const isAvailable = book.status === 'disponivel' || String(book.status) === 'available'
                        const isMyLoan = myLoans?.includes(book.id)

                        return (
                            <div key={book.id} className={`bg-white rounded-2xl p-5 shadow-sm border flex flex-col gap-3 transition-transform 
                                ${!isAvailable && !isMyLoan ? 'opacity-60 bg-saf-50/30 border-saf-100 grayscale-[0.2]' : 'border-saf-100 active:scale-[0.98]'}`}>
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-saf-900 text-lg leading-tight">{book.title}</h3>
                                        <p className="text-saf-500 mt-1">{book.author}</p>
                                    </div>
                                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wide border
                                        ${isAvailable
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            : isMyLoan
                                                ? 'bg-saf-50 text-saf-700 border-saf-200'
                                                : book.status === 'reservado'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : 'bg-neutral-50 text-neutral-500 border-neutral-200'}`}>
                                        {isAvailable
                                            ? 'Disponível'
                                            : isMyLoan
                                                ? (book.status === 'reservado' ? 'Sua Reserva' : 'Com Você')
                                                : book.status === 'reservado'
                                                    ? 'Reservado'
                                                    : 'Emprestado'}
                                    </span>
                                </div>

                                <div className="pt-3 mt-1 border-t border-saf-50 flex items-center justify-between">
                                    <span className="text-sm font-medium text-saf-400 bg-saf-50 px-2.5 py-1 rounded-lg">
                                        {book.category}
                                    </span>

                                    {isAvailable ? (
                                        <Link
                                            href={`/books/${book.id}`}
                                            className="text-saf-600 font-semibold text-sm hover:text-saf-800 min-h-[44px] min-w-[44px] px-2 flex items-center justify-center"
                                        >
                                            Solicitar
                                        </Link>
                                    ) : (
                                        <Link
                                            href={`/books/${book.id}`}
                                            className="text-saf-400 font-medium text-sm hover:text-saf-600 min-h-[44px] min-w-[44px] px-2 flex items-center justify-center"
                                        >
                                            Ver Detalhes
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
