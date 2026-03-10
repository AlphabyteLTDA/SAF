"use client"

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAdminDashboard, AdminLoanWithDetails } from '@/hooks/useAdminDashboard'
import { ArrowLeft, BookOpen, Clock, AlertTriangle, CheckCircle, XCircle, User as UserIcon } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast, { Toaster } from 'react-hot-toast'

export default function AdminRequestsPage() {
    const { user, role, isLoading: authLoading } = useAuth()
    const router = useRouter()
    const queryClient = useQueryClient()
    const { pendingRequests, isLoadingPending, activeLoans, isLoadingActive } = useAdminDashboard()
    const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending')

    useEffect(() => {
        if (!authLoading && (!user || role !== 'admin')) {
            router.push('/')
        }
    }, [user, role, authLoading, router])

    // Admin: Confirm Delivery Mutation
    const confirmDeliveryMutation = useMutation({
        mutationFn: async ({ loan_id, book_id }: { loan_id: string, book_id: string }) => {
            const dueDate = new Date()
            dueDate.setDate(dueDate.getDate() + 30) // 30 days

            const { error: loanError } = await supabase
                .from('loans')
                .update({ status: 'ativo', due_date: dueDate.toISOString() })
                .eq('id', loan_id)

            if (loanError) throw loanError

            const { error: bookError } = await supabase
                .from('books')
                .update({ status: 'emprestado' })
                .eq('id', book_id)

            if (bookError) throw bookError
        },
        onMutate: () => toast.loading('Confirmando entrega...', { id: 'admin-dash-action' }),
        onSuccess: () => {
            toast.success('Entrega confirmada!', { id: 'admin-dash-action' })
            queryClient.invalidateQueries({ queryKey: ['admin-pending-requests'] })
            queryClient.invalidateQueries({ queryKey: ['admin-active-loans'] })
            queryClient.invalidateQueries({ queryKey: ['books'] })
        },
        onError: (err) => {
            console.error('Erro ao entregar:', err)
            toast.error('Erro ao registrar entrega.', { id: 'admin-dash-action' })
        }
    })

    // Admin: Cancel Reservation Mutation
    const cancelReservationMutation = useMutation({
        mutationFn: async ({ loan_id, book_id }: { loan_id: string, book_id: string }) => {
            const { error: loanError } = await supabase
                .from('loans')
                .update({ status: 'cancelado' })
                .eq('id', loan_id)

            if (loanError) throw loanError

            const { error: bookError } = await supabase
                .from('books')
                .update({ status: 'disponivel' })
                .eq('id', book_id)

            if (bookError) throw bookError
        },
        onMutate: () => toast.loading('Cancelando reserva...', { id: 'admin-dash-action' }),
        onSuccess: () => {
            toast.success('Reserva cancelada!', { id: 'admin-dash-action' })
            queryClient.invalidateQueries({ queryKey: ['admin-pending-requests'] })
            queryClient.invalidateQueries({ queryKey: ['books'] })
        },
        onError: (err) => {
            console.error('Erro ao cancelar:', err)
            toast.error('Erro ao cancelar reserva.', { id: 'admin-dash-action' })
        }
    })

    // Admin: Confirm Return Mutation
    const confirmReturnMutation = useMutation({
        mutationFn: async ({ loan_id, book_id }: { loan_id: string, book_id: string }) => {
            const { error: loanError } = await supabase
                .from('loans')
                .update({ status: 'finalizado' })
                .eq('id', loan_id)

            if (loanError) throw loanError

            const { error: bookError } = await supabase
                .from('books')
                .update({ status: 'disponivel' })
                .eq('id', book_id)

            if (bookError) throw bookError
        },
        onMutate: () => toast.loading('Registrando devolução...', { id: 'admin-dash-action' }),
        onSuccess: () => {
            toast.success('Livro devolvido!', { id: 'admin-dash-action' })
            queryClient.invalidateQueries({ queryKey: ['admin-active-loans'] })
            queryClient.invalidateQueries({ queryKey: ['books'] })
        },
        onError: (err) => {
            console.error('Erro ao devolver:', err)
            toast.error('Erro ao registrar devolução.', { id: 'admin-dash-action' })
        }
    })

    if (authLoading || isLoadingPending || isLoadingActive) {
        return (
            <div className="flex justify-center items-center py-20" data-testid="loading-spinner">
                <div className="w-8 h-8 border-4 border-saf-200 border-t-saf-500 rounded-full animate-spin"></div>
            </div>
        )
    }

    const renderPendingRequests = () => {
        if (!pendingRequests || pendingRequests.length === 0) {
            return (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-saf-100 flex flex-col items-center text-center mt-4">
                    <CheckCircle className="w-12 h-12 text-emerald-300 mb-4" />
                    <p className="text-saf-600 font-medium">Não há solicitações de reserva pendentes.</p>
                </div>
            )
        }

        return (
            <div className="flex flex-col gap-4 mt-4">
                {pendingRequests.map(loan => {
                    const diffMs = new Date(loan.due_date).getTime() - new Date().getTime()
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                    const isExpired = diffMs <= 0

                    return (
                        <div key={loan.id} className="bg-white rounded-2xl p-5 shadow-sm border border-saf-200 flex flex-col gap-4 relative overflow-hidden">
                            {isExpired && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                    Reserva Expirada
                                </div>
                            )}
                            <div className="flex items-start gap-3 mt-2">
                                <div className="w-12 h-16 bg-saf-100 rounded flex-shrink-0 flex items-center justify-center text-saf-400">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="font-bold text-saf-900 leading-tight">{loan.books.title}</h3>
                                    <p className="text-xs text-saf-500 flex items-center gap-1 mt-1">
                                        <UserIcon className="w-3 h-3" />
                                        {loan.profiles?.full_name || 'Leitor(a)'}
                                    </p>
                                    <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                                        <Clock className="w-3 h-3" />
                                        {isExpired ? 'Prazos de 48h esgotado' : `Restam ${diffHours} horas para retirada`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-3 border-t border-saf-50">
                                <button
                                    onClick={() => confirmDeliveryMutation.mutate({ loan_id: loan.id, book_id: loan.book_id })}
                                    disabled={confirmDeliveryMutation.isPending}
                                    className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold py-2 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Aprovar
                                </button>
                                <button
                                    onClick={() => cancelReservationMutation.mutate({ loan_id: loan.id, book_id: loan.book_id })}
                                    disabled={cancelReservationMutation.isPending}
                                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    const renderActiveLoans = () => {
        if (!activeLoans || activeLoans.length === 0) {
            return (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-saf-100 flex flex-col items-center text-center mt-4">
                    <CheckCircle className="w-12 h-12 text-emerald-300 mb-4" />
                    <p className="text-saf-600 font-medium">Não há empréstimos ativos no momento.</p>
                </div>
            )
        }

        return (
            <div className="flex flex-col gap-4 mt-4">
                {activeLoans.map(loan => {
                    const diffMs = new Date(loan.due_date).getTime() - new Date().getTime()
                    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                    const isOverdue = diffMs <= 0
                    const isExpiringSoon = !isOverdue && diffDays <= 7

                    return (
                        <div key={loan.id} className={`bg-white rounded-2xl p-5 shadow-sm border flex flex-col gap-4 ${isOverdue ? 'border-red-300 bg-red-50/30' : 'border-saf-200'}`}>
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-16 bg-saf-100 rounded flex-shrink-0 flex items-center justify-center text-saf-400">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <h3 className="font-bold text-saf-900 leading-tight">{loan.books.title}</h3>
                                    <p className="text-xs text-saf-500 flex items-center gap-1 mt-1">
                                        <UserIcon className="w-3 h-3" />
                                        {loan.profiles?.full_name || 'Leitor(a)'}
                                    </p>

                                    <div className="mt-2 text-xs font-bold flex items-center gap-1">
                                        {isOverdue ? (
                                            <span className="text-red-600 bg-red-100 px-2 py-1 rounded inline-flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                Atrasado ({Math.abs(diffDays)} dias)
                                            </span>
                                        ) : isExpiringSoon ? (
                                            <span className="text-amber-600 bg-amber-100 px-2 py-1 rounded inline-flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Vence em {diffDays} dias
                                            </span>
                                        ) : (
                                            <span className="text-saf-500">
                                                No prazo (Vence em {diffDays} dias)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="pt-3 border-t border-saf-50">
                                <button
                                    onClick={() => confirmReturnMutation.mutate({ loan_id: loan.id, book_id: loan.book_id })}
                                    disabled={confirmReturnMutation.isPending}
                                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Confirmar Devolução
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="w-full max-w-md mx-auto p-4 flex flex-col pb-24">
            <Toaster position="top-center" />
            <Link href="/profile" className="flex items-center gap-2 text-saf-500 hover:text-saf-600 font-medium min-h-[44px] w-fit -ml-2 px-2 relative z-10">
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar</span>
            </Link>

            <div className="flex flex-col gap-1 mt-2 mb-6">
                <h1 className="text-2xl font-bold text-saf-900">Gestão de Solicitações</h1>
                <p className="text-saf-500 text-sm">Aprove reservas e monitore devoluções.</p>
            </div>

            {/* Sticky Tabs */}
            <div className="flex bg-saf-50 p-1 rounded-xl mb-4 sticky top-4 z-20 shadow-sm border border-saf-100">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'pending' ? 'bg-white text-saf-900 shadow-sm border border-saf-200' : 'text-saf-500 hover:bg-saf-100'}`}
                >
                    Pendentes ({pendingRequests?.length || 0})
                </button>
                <button
                    onClick={() => setActiveTab('active')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'active' ? 'bg-white text-saf-900 shadow-sm border border-saf-200' : 'text-saf-500 hover:bg-saf-100'}`}
                >
                    Emprestados ({activeLoans?.length || 0})
                </button>
            </div>

            {activeTab === 'pending' ? renderPendingRequests() : renderActiveLoans()}

        </div>
    )
}
