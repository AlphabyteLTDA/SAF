"use client"

import { useState } from 'react'
import { useBooks } from '@/hooks/useBooks'
import { useCategories } from '@/hooks/useCategories'
import { Search, BookOpen, Filter, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function BookList() {
    const { data: books, isLoading, error } = useBooks()
    const { data: categoriesData } = useCategories()
    const { user } = useAuth()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('Todos')
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const router = useRouter()

    const categoryNames = ['Todos', ...(categoriesData?.map(c => c.name) || [])]

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

    const filteredBooks = books?.filter(book => {
        const matchesSearch =
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.author.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory =
            selectedCategory === 'Todos' || book.category.includes(selectedCategory)
        return matchesSearch && matchesCategory
    }) || []

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

            {/* Category Filter Pills - Horizontal Scroll */}
            <div className="flex items-center gap-2 -mx-4 px-4 overflow-x-auto scrollbar-hide pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                {categoryNames.map(cat => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 min-h-[36px] border-2 shrink-0 focus:outline-none focus:ring-2 focus:ring-saf-500/30 focus:ring-offset-1
                            ${selectedCategory === cat
                                ? 'bg-saf-600 text-white border-saf-600 shadow-sm'
                                : 'bg-white text-saf-600 border-saf-100 hover:border-saf-300 hover:bg-saf-50 active:scale-95'
                            }`}
                    >
                        {cat === 'Todos' && <Filter className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />}
                        {cat}
                    </button>
                ))}
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
                            <div 
                                key={book.id} 
                                onClick={() => router.push(`/books/${book.id}`)}
                                className={`bg-white rounded-2xl p-5 shadow-sm border flex flex-col gap-3 transition-all duration-300 cursor-pointer hover:shadow-md hover:border-saf-300 group
                                ${!isAvailable && !isMyLoan ? 'opacity-60 bg-saf-50/30 border-saf-100 grayscale-[0.2]' : 'border-saf-100 active:scale-[0.98]'}`}
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex gap-4">
                                        <div 
                                            className="w-16 h-24 shrink-0 bg-saf-100 rounded-lg shadow-sm border border-saf-200 flex items-center justify-center text-saf-400 relative overflow-hidden transition-transform duration-300 group-hover:scale-105 active:scale-95"
                                            onClick={(e) => {
                                                if (book.cover_url) {
                                                    e.stopPropagation()
                                                    setPreviewImage(book.cover_url)
                                                }
                                            }}
                                        >
                                            {book.cover_url ? (
                                                <Image 
                                                    src={book.cover_url} 
                                                    alt={`Capa de ${book.title}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <BookOpen className="w-6 h-6" />
                                            )}
                                            {book.cover_url && (
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                    <Search className="text-white opacity-0 group-hover:opacity-100 w-5 h-5 transition-opacity" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col flex-1 mt-1 outline-none">
                                            <h3 className="font-bold text-saf-900 text-lg leading-tight line-clamp-2 group-hover:text-saf-600 transition-colors">{book.title}</h3>
                                            <p className="text-saf-500 mt-1 line-clamp-1">{book.author}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border whitespace-nowrap
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
                                    <div className="flex flex-wrap gap-1.5">
                                        {book.category.map((cat, idx) => (
                                            <span key={idx} className="text-xs font-medium text-saf-500 bg-saf-50 px-2.5 py-1 rounded-lg border border-saf-100/50">
                                                {cat}
                                            </span>
                                        ))}
                                    </div>

                                    <div onClick={(e) => e.stopPropagation()}>
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
                            </div>
                        )
                    })
                )}
            </div>

            {/* Cover Preview Overlay */}
            {previewImage && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setPreviewImage(null)}
                >
                    <button 
                        className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                        onClick={() => setPreviewImage(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="relative w-full max-w-sm aspect-[2/3] animate-in zoom-in-95 duration-300">
                        <Image 
                            src={previewImage} 
                            alt="Book cover preview" 
                            fill 
                            className="object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
