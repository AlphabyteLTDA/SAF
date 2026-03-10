"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Book } from '@/hooks/useBooks'
import { BookOpen, ArrowLeft, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast, { Toaster } from 'react-hot-toast'

export default function BookPage({ params }: { params: { id: string } }) {
    const { user, role } = useAuth()
    const queryClient = useQueryClient()
    const [isClient, setIsClient] = useState(false)
    const isAdmin = Boolean(role && String(role).toLowerCase().includes('admin'))

    useEffect(() => {
        setIsClient(true)
    }, [])

    // 1. Fetch Book
    const { data: book, isLoading, error } = useQuery({
        queryKey: ['book', params.id],
        queryFn: async (): Promise<Book> => {
            const { data, error } = await supabase
                .from('books')
                .select('*')
                .eq('id', params.id)
                .single()

            if (error || !data) {
                throw new Error('Não foi possível encontrar este livro.')
            }
            return data as Book
        }
    })

    // 1.5 Fetch Active/Pending Loan for timers
    const { data: currentLoan } = useQuery({
        queryKey: ['book-loan', params.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('loans')
                .select('*')
                .eq('book_id', params.id)
                .in('status', ['pendente', 'ativo'])
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (error) console.error("Error fetching loan:", error)
            return data || null
        },
        enabled: !!book && (book.status === 'reservado' || book.status === 'emprestado' || String(book.status) === 'borrowed')
    })

    const getRemainingTimeText = useCallback(() => {
        if (!currentLoan || !currentLoan.due_date) return null;
        const now = new Date();
        const due = new Date(currentLoan.due_date);
        const diffMs = due.getTime() - now.getTime();

        if (diffMs <= 0) return "Prazo esgotado";

        if (book?.status === 'reservado') {
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            return `Você tem ${diffHours} horas para retirar este livro na igreja.`;
        } else if (book?.status === 'emprestado' || String(book?.status) === 'borrowed') {
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            return `Devolver em ${diffDays} dias`;
        }
        return null;
    }, [currentLoan, book?.status])

    // 2. Reservation Mutation (Leitora)
    const requestReservationMutation = useMutation({
        mutationFn: async () => {
            if (!user || !book) throw new Error("Usuário ou livro não encontrados.")

            const reservationDueDate = new Date()
            reservationDueDate.setDate(reservationDueDate.getDate() + 2) // 48 horas para retirar o livro

            // Insert into loans table
            const { error: loanError } = await supabase.from('loans').insert({
                book_id: book.id,
                user_id: user.id,
                status: 'pendente',
                due_date: reservationDueDate.toISOString()
            })

            if (loanError) throw loanError

            // Update books table status to reservado. select() forces RLS to return the updated row.
            const { data: updatedBook, error: bookError } = await supabase
                .from('books')
                .update({ status: 'reservado' })
                .eq('id', book.id)
                .select()

            if (bookError) throw bookError
            if (!updatedBook || updatedBook.length === 0) {
                // Se caiu aqui, a RLS do banco de dados bloqueou o Leitor de dar UPDATE na tabela books!
                throw new Error("Erro de permissão no Banco: O Leitor não tem autorização (RLS) para alterar o status do livro.")
            }
        },
        onMutate: () => {
            toast.loading('Processando reserva...', { id: 'reserve-toast' })
        },
        onSuccess: () => {
            toast.success('Reserva realizada! Retire o livro na igreja em até 48h.', { id: 'reserve-toast' })
            queryClient.invalidateQueries({ queryKey: ['books'] })
            queryClient.invalidateQueries({ queryKey: ['book', params.id] })
            queryClient.invalidateQueries({ queryKey: ['book-loan', params.id] })
            queryClient.invalidateQueries({ queryKey: ['my-loans'] })
            queryClient.invalidateQueries({ queryKey: ['my-loans-ids'] })
        },
        onError: (err) => {
            console.error('Erro na reserva:', err)
            toast.error('Erro ao solicitar reserva.', { id: 'reserve-toast' })
        }
    })

    // 2.5 Admin Bypass: Pegar Emprestado (Retirada Imediata)
    const adminDirectBorrowMutation = useMutation({
        mutationFn: async () => {
            if (!user || !book || !isAdmin) throw new Error("Não autorizado.")

            const dueDate = new Date()
            dueDate.setDate(dueDate.getDate() + 30) // 30 dias

            const { error: loanError } = await supabase.from('loans').insert({
                book_id: book.id,
                user_id: user.id,
                status: 'ativo',
                due_date: dueDate.toISOString()
            })

            if (loanError) throw loanError

            const { error: bookError } = await supabase
                .from('books')
                .update({ status: 'emprestado' })
                .eq('id', book.id)

            if (bookError) throw bookError
        },
        onMutate: () => toast.loading('Processando empréstimo...', { id: 'admin-action' }),
        onSuccess: () => {
            toast.success('Empréstimo realizado com sucesso! (30 dias)', { id: 'admin-action' })
            queryClient.invalidateQueries({ queryKey: ['books'] })
            queryClient.invalidateQueries({ queryKey: ['book', params.id] })
            queryClient.invalidateQueries({ queryKey: ['book-loan', params.id] })
        },
        onError: (err) => {
            console.error('Erro no empréstimo direto:', err)
            toast.error('Erro ao processar empréstimo.', { id: 'admin-action' })
        }
    })

    // 3. Admin: Confirm Delivery Mutation
    const adminConfirmDeliveryMutation = useMutation({
        mutationFn: async () => {
            if (!book || !isAdmin) throw new Error("Não autorizado.")

            const dueDate = new Date()
            dueDate.setDate(dueDate.getDate() + 30) // 30 days from confirming the delivery

            const { error: loanError } = await supabase
                .from('loans')
                .update({ status: 'ativo', due_date: dueDate.toISOString() })
                .eq('book_id', book.id)
                .eq('status', 'pendente')

            if (loanError) throw loanError

            const { error: bookError } = await supabase
                .from('books')
                .update({ status: 'emprestado' })
                .eq('id', book.id)

            if (bookError) throw bookError
        },
        onMutate: () => toast.loading('Confirmando entrega...', { id: 'admin-action' }),
        onSuccess: () => {
            toast.success('Entrega confirmada!', { id: 'admin-action' })
            queryClient.invalidateQueries({ queryKey: ['books'] })
            queryClient.invalidateQueries({ queryKey: ['book', params.id] })
            queryClient.invalidateQueries({ queryKey: ['book-loan', params.id] })
        },
        onError: (err) => {
            console.error('Erro ao entregar:', err)
            toast.error('Erro ao registrar entrega.', { id: 'admin-action' })
        }
    })

    // 4. Admin: Cancel Reservation
    const adminCancelReservationMutation = useMutation({
        mutationFn: async () => {
            if (!book || !isAdmin) throw new Error("Não autorizado.")

            const { error: loanError } = await supabase
                .from('loans')
                .update({ status: 'cancelado' })
                .eq('book_id', book.id)
                .eq('status', 'pendente')

            if (loanError) throw loanError

            const { error: bookError } = await supabase
                .from('books')
                .update({ status: 'disponivel' })
                .eq('id', book.id)

            if (bookError) throw bookError
        },
        onMutate: () => toast.loading('Cancelando reserva...', { id: 'admin-action' }),
        onSuccess: () => {
            toast.success('Reserva cancelada (No-show).', { id: 'admin-action' })
            queryClient.invalidateQueries({ queryKey: ['books'] })
            queryClient.invalidateQueries({ queryKey: ['book', params.id] })
            queryClient.invalidateQueries({ queryKey: ['book-loan', params.id] })
        },
        onError: (err) => {
            console.error('Erro ao cancelar reserva:', err)
            toast.error('Erro ao cancelar reserva.', { id: 'admin-action' })
        }
    })

    // 5. Admin: Confirm Return Mutation
    const adminConfirmReturnMutation = useMutation({
        mutationFn: async () => {
            if (!book || !isAdmin) throw new Error("Não autorizado.")

            const { error: loanError } = await supabase
                .from('loans')
                .update({ status: 'finalizado' })
                .eq('book_id', book.id)
                .eq('status', 'ativo')

            if (loanError) throw loanError

            const { error: bookError } = await supabase
                .from('books')
                .update({ status: 'disponivel' })
                .eq('id', book.id)

            if (bookError) throw bookError
        },
        onMutate: () => toast.loading('Registrando devolução...', { id: 'admin-action' }),
        onSuccess: () => {
            toast.success('Livro devolvido com sucesso!', { id: 'admin-action' })
            queryClient.invalidateQueries({ queryKey: ['books'] })
            queryClient.invalidateQueries({ queryKey: ['book', params.id] })
            queryClient.invalidateQueries({ queryKey: ['book-loan', params.id] })
        },
        onError: (err) => {
            console.error('Erro ao devolver:', err)
            toast.error('Erro ao registrar devolução.', { id: 'admin-action' })
        }
    })


    // Extracted Event Handlers using useCallback for stable references & explicit logs
    const handleReserve = useCallback(() => {
        console.log('Action: Request Reservation for book', book?.id)
        requestReservationMutation.mutate()
    }, [book?.id, requestReservationMutation])

    const handleAdminDirectBorrow = useCallback(() => {
        console.log('Admin Action: Direct Borrow for book', book?.id)
        adminDirectBorrowMutation.mutate()
    }, [book?.id, adminDirectBorrowMutation])

    const handleConfirmDelivery = useCallback(() => {
        console.log('Admin Action: Confirm Delivery for book', book?.id)
        adminConfirmDeliveryMutation.mutate()
    }, [book?.id, adminConfirmDeliveryMutation])

    const handleCancelReservation = useCallback(() => {
        console.log('Admin Action: Cancel Reservation for book', book?.id)
        adminCancelReservationMutation.mutate()
    }, [book?.id, adminCancelReservationMutation])

    const handleConfirmReturn = useCallback(() => {
        console.log('Admin Action: Confirm Return for book', book?.id)
        adminConfirmReturnMutation.mutate()
    }, [book?.id, adminConfirmReturnMutation])


    if (!isClient || isLoading) {
        return (
            <div className="flex justify-center items-center py-20" data-testid="loading-spinner">
                <div className="w-8 h-8 border-4 border-saf-200 border-t-saf-500 rounded-full animate-spin"></div>
            </div>
        )
    }

    if (error || !book) {
        return (
            <div className="p-4 flex flex-col items-center justify-center gap-4 text-center mt-12">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8" />
                </div>
                <p className="text-saf-900 font-bold">{error?.message || 'Livro não encontrado'}</p>
                <Link href="/" className="text-saf-500 font-semibold min-h-[44px] flex items-center justify-center">
                    Voltar ao Acervo
                </Link>
            </div>
        )
    }

    const isAvailable = book.status === 'disponivel' || String(book.status) === 'available'

    return (
        <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-6 pb-24">
            <Toaster position="top-center" />
            <Link href="/" className="flex items-center gap-2 text-saf-500 hover:text-saf-600 font-medium min-h-[44px] w-fit -ml-2 px-2 relative z-10">
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar</span>
            </Link>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-saf-100 flex flex-col items-center text-center">
                <div className="w-24 h-32 bg-saf-100 rounded-xl mb-6 shadow-inner flex items-center justify-center text-saf-400">
                    <BookOpen className="w-10 h-10" />
                </div>

                <h1 className="text-2xl font-bold text-saf-900 leading-tight mb-2">{book.title}</h1>
                <p className="text-saf-500 text-lg mb-4">{book.author}</p>

                <div className="flex gap-2 mb-6 cursor-default">
                    <span className="text-sm font-medium text-saf-600 bg-saf-50 px-3 py-1.5 rounded-lg border border-saf-100">
                        {book.category}
                    </span>
                    <span className={`text-sm px-3 py-1.5 rounded-lg font-bold tracking-wide border
            ${isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : book.status === 'reservado'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-neutral-50 text-neutral-500 border-neutral-200'}`}>
                        {isAvailable ? 'Disponível' : book.status === 'reservado' ? 'Reservado' : 'Emprestado'}
                    </span>
                </div>

                {isAvailable ? (
                    isAdmin ? (
                        <button
                            type="button"
                            onClick={handleAdminDirectBorrow}
                            disabled={adminDirectBorrowMutation.isPending || adminDirectBorrowMutation.isSuccess}
                            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-70 text-white font-bold text-lg py-4 px-4 rounded-2xl min-h-[56px] transition-colors mt-2 shadow-sm flex items-center justify-center gap-2 relative z-10"
                        >
                            {adminDirectBorrowMutation.isPending || adminDirectBorrowMutation.isSuccess ? (
                                <>
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span className="ml-2">Processando...</span>
                                </>
                            ) : (
                                <>
                                    <BookOpen className="w-5 h-5" />
                                    Pegar Emprestado (Retirada Imediata)
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleReserve}
                            disabled={requestReservationMutation.isPending || requestReservationMutation.isSuccess}
                            className="w-full bg-saf-500 hover:bg-saf-600 active:bg-saf-700 disabled:opacity-70 text-white font-bold text-lg py-4 px-4 rounded-2xl min-h-[56px] transition-colors mt-2 shadow-sm flex items-center justify-center gap-2 relative z-10"
                        >
                            {requestReservationMutation.isPending || requestReservationMutation.isSuccess ? (
                                <>
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span className="ml-2">Processando...</span>
                                </>
                            ) : (
                                <>
                                    <BookOpen className="w-5 h-5" />
                                    Solicitar Reserva
                                </>
                            )}
                        </button>
                    )
                ) : (
                    <div className={`w-full font-medium py-4 px-4 rounded-2xl border mt-2
                        ${currentLoan?.user_id === user?.id ? 'bg-saf-50 text-saf-700 border-saf-200' : 'bg-neutral-50 text-neutral-500 border-neutral-200'}`}>
                        {currentLoan?.user_id === user?.id ? (
                            book.status === 'reservado'
                                ? '✨ Você solicitou a reserva deste livro! Guardamos ele para você.'
                                : '📖 Você está lendo este material no momento.'
                        ) : (
                            book.status === 'reservado'
                                ? 'Este livro já foi reservado por outro leitor.'
                                : 'Este livro já está emprestado no momento.'
                        )}

                        {currentLoan && getRemainingTimeText() && (
                            <div className="mt-3 text-sm font-bold text-saf-800 bg-white py-3 px-2 rounded-xl border border-saf-200 shadow-sm flex items-center justify-center gap-2">
                                ⏳ {getRemainingTimeText()}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Admin Action Panel (3-Stage Approach) */}
            {isAdmin && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-saf-200 flex flex-col gap-4 relative z-10">
                    <div className="flex items-center gap-2 text-saf-900 font-bold border-b border-saf-50 pb-3">
                        <Settings2 className="w-5 h-5 text-saf-500" />
                        <h2>Gestão de Retirada (Admin)</h2>
                    </div>

                    {book.status === 'reservado' && (
                        <>
                            <p className="text-sm text-saf-500 mb-2">
                                A leitora solicitou uma reserva. Confirme a entrega física (inicia o prazo de 30 dias) ou cancele em caso de desistência.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={handleConfirmDelivery}
                                    disabled={adminConfirmDeliveryMutation.isPending}
                                    className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold py-3 px-4 rounded-xl min-h-[44px] transition-colors disabled:opacity-50 relative z-10"
                                >
                                    Confirmar Entrega
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancelReservation}
                                    disabled={adminCancelReservationMutation.isPending}
                                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-4 rounded-xl min-h-[44px] transition-colors disabled:opacity-50 relative z-10"
                                >
                                    Cancelar Reserva (No-Show)
                                </button>
                            </div>
                        </>
                    )}

                    {(book.status === 'emprestado' || String(book.status) === 'borrowed') && (
                        <>
                            <p className="text-sm text-saf-500 mb-2">
                                A leitora está com o material físico no momento. Confirme aqui o recebimento caso ela o devolva à Estante.
                            </p>
                            <button
                                type="button"
                                onClick={handleConfirmReturn}
                                disabled={adminConfirmReturnMutation.isPending}
                                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3 px-4 rounded-xl min-h-[44px] transition-colors disabled:opacity-50 relative z-10"
                            >
                                Confirmar Devolução
                            </button>
                        </>
                    )}

                    {isAvailable && (
                        <p className="text-sm text-saf-400 italic text-center py-2">
                            Ação automatizada: Você pode pegar este livro emprestado instantaneamente usando o botão azul acima.
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}
