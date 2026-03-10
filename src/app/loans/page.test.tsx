import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
// @ts-ignore - Vitest / bundler resolves this relative path correctly
import LoansPage from './page'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    }
}))

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}))

vi.mock('@/components/BottomNavBar', () => {
    return {
        BottomNavBar: () => <nav data-testid="bottom-nav">Bottom Nav</nav>
    }
})

describe('My Loans Page (/loans)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-123' }, role: 'leitora', isLoading: false } as any)
    })

    // Date generators
    const today = new Date()
    const tmr = new Date()
    tmr.setDate(today.getDate() + 1)

    const past = new Date()
    past.setDate(today.getDate() - 1)

    const setupMockForLoans = (data: any[]) => {
        const mockOrder = vi.fn().mockResolvedValue({ data, error: null })
        const mockIn = vi.fn().mockReturnValue({ order: mockOrder })
        const mockEq1 = vi.fn().mockReturnValue({ in: mockIn })
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })
        vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)
    }

    it('renders loading state initially', () => {
        const mockOrder = vi.fn(() => new Promise(() => { }))
        const mockIn = vi.fn().mockReturnValue({ order: mockOrder })
        const mockEq1 = vi.fn().mockReturnValue({ in: mockIn })
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })
        vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

        render(<LoansPage />)
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('renders empty state if user has no loans', async () => {
        setupMockForLoans([])

        render(<LoansPage />)

        expect(await screen.findByText('Nenhum empréstimo ativo no momento')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /explorar catálogo/i })).toBeInTheDocument()
    })

    it('renders loans with correct badges for due and overdue status', async () => {
        setupMockForLoans([
            {
                id: 'loan-1',
                due_date: tmr.toISOString(),
                status: 'ativo',
                books: { title: 'Livro Em Dia', author: 'Autor 1', cover_url: null }
            },
            {
                id: 'loan-2',
                due_date: past.toISOString(),
                status: 'ativo',
                books: { title: 'Livro Atrasado', author: 'Autor 2', cover_url: null }
            },
            {
                id: 'loan-3',
                due_date: tmr.toISOString(),
                status: 'pendente',
                books: { title: 'Livro Aguardando', author: 'Autor 3', cover_url: null }
            }
        ])

        render(<LoansPage />)

        expect(await screen.findByText('Livro Em Dia')).toBeInTheDocument()
        expect(screen.getByText('Livro Atrasado')).toBeInTheDocument()
        expect(screen.getByText('Livro Aguardando')).toBeInTheDocument()

        // Check badges
        expect(screen.getByText('Emprestado')).toBeInTheDocument()
        expect(screen.getByText('Atrasado')).toBeInTheDocument()
        expect(screen.getByText('Aguardando Retirada')).toBeInTheDocument()
    })
})
