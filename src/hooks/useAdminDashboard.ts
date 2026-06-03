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
            const [loansResult, profilesResult] = await Promise.all([
                supabase.from('loans').select('*, books(*)').eq('status', 'pendente').order('created_at', { ascending: true }),
                supabase.from('profiles').select('id, full_name, email')
            ])

            if (loansResult.error) throw loansResult.error
            if (!loansResult.data || loansResult.data.length === 0) return []

            const profiles = profilesResult.data ?? []
            return loansResult.data.map(loan => ({
                ...loan,
                profiles: profiles.find(p => p.id === loan.user_id) ?? { id: loan.user_id, full_name: 'Leitor(a)', email: '' }
            })) as AdminLoanWithDetails[]
        }
    })

    // Busca empréstimos ativos (Alertas de devolução)
    const { data: activeLoans, isLoading: isLoadingActive, refetch: refetchActive } = useQuery({
        queryKey: ['admin-active-loans'],
        queryFn: async (): Promise<AdminLoanWithDetails[]> => {
            const [loansResult, profilesResult] = await Promise.all([
                supabase.from('loans').select('*, books(*)').eq('status', 'ativo').order('due_date', { ascending: true }),
                supabase.from('profiles').select('id, full_name, email')
            ])

            if (loansResult.error) throw loansResult.error
            if (!loansResult.data || loansResult.data.length === 0) return []

            const profiles = profilesResult.data ?? []
            return loansResult.data.map(loan => ({
                ...loan,
                profiles: profiles.find(p => p.id === loan.user_id) ?? { id: loan.user_id, full_name: 'Leitor(a)', email: '' }
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
