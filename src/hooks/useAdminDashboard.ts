import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Book } from './useBooks'

export type AdminLoanWithDetails = {
    id: string
    book_id: string
    user_id: string
    status: 'pendente' | 'ativo' | 'finalizado' | 'cancelado'
    due_date: string
    created_at: string
    books: Book
    profiles: {
        id: string
        full_name: string
        email: string
    }
}

export function useAdminDashboard() {
    // Busca solicitações pendentes (48h para retirar)
    const { data: pendingRequests, isLoading: isLoadingPending, refetch: refetchPending } = useQuery({
        queryKey: ['admin-pending-requests'],
        queryFn: async (): Promise<AdminLoanWithDetails[]> => {
            const { data: loans, error } = await supabase
                .from('loans')
                .select(`
                    *,
                    books (*)
                `)
                .eq('status', 'pendente')
                .order('created_at', { ascending: true })

            if (error) throw error
            if (!loans || loans.length === 0) return []

            const userIds = Array.from(new Set(loans.map(l => l.user_id)))
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds)

            return loans.map(loan => ({
                ...loan,
                profiles: profiles?.find(p => p.id === loan.user_id) || { id: loan.user_id, full_name: 'Leitor(a)', email: '' }
            })) as AdminLoanWithDetails[]
        }
    })

    // Busca empréstimos ativos (Alertas de devolução)
    const { data: activeLoans, isLoading: isLoadingActive, refetch: refetchActive } = useQuery({
        queryKey: ['admin-active-loans'],
        queryFn: async (): Promise<AdminLoanWithDetails[]> => {
            const { data: loans, error } = await supabase
                .from('loans')
                .select(`
                    *,
                    books (*)
                `)
                .eq('status', 'ativo')
                .order('due_date', { ascending: true })

            if (error) throw error
            if (!loans || loans.length === 0) return []

            const userIds = Array.from(new Set(loans.map(l => l.user_id)))
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds)

            return loans.map(loan => ({
                ...loan,
                profiles: profiles?.find(p => p.id === loan.user_id) || { id: loan.user_id, full_name: 'Leitor(a)', email: '' }
            })) as AdminLoanWithDetails[]
        }
    })

    return {
        pendingRequests,
        isLoadingPending,
        activeLoans,
        isLoadingActive,
        refetchAll: () => {
            refetchPending()
            refetchActive()
        }
    }
}
