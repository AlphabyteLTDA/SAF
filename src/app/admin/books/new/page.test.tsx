import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import NewBookPage from './page'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/hooks/useAuth')
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    }
}))
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}))

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    })
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}

describe('NewBookPage (Admin CRUD)', () => {
    const mockPush = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any)
    })

    it('redirects non-admin users to home', () => {
        vi.mocked(useAuth).mockReturnValue({ user: { id: '1' }, role: 'leitora', isLoading: false } as any)

        render(<NewBookPage />, { wrapper: createWrapper() })

        expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('renders form elements with 44px touch targets for admins', () => {
        vi.mocked(useAuth).mockReturnValue({ user: { id: '1' }, role: 'admin', isLoading: false } as any)

        render(<NewBookPage />, { wrapper: createWrapper() })

        expect(screen.getByRole('heading', { name: /adicionar novo livro/i })).toBeInTheDocument()

        const titleInput = screen.getByLabelText(/título/i)
        const authorInput = screen.getByLabelText(/autor/i)
        const catSelect = screen.getByLabelText(/categoria/i)
        const submitBtn = screen.getByRole('button', { name: /salvar livro/i })

        expect(titleInput).toBeInTheDocument()
        expect(authorInput).toBeInTheDocument()
        expect(catSelect).toBeInTheDocument()
        expect(submitBtn).toBeInTheDocument()

        expect(titleInput).toHaveClass('min-h-[44px]')
        expect(submitBtn).toHaveClass('min-h-[44px]')
    })

    it('displays zod validation errors when submitting empty form', async () => {
        vi.mocked(useAuth).mockReturnValue({ user: { id: '1' }, role: 'admin', isLoading: false } as any)

        render(<NewBookPage />, { wrapper: createWrapper() })

        fireEvent.click(screen.getByRole('button', { name: /salvar livro/i }))

        await waitFor(() => {
            expect(screen.getByText(/título é obrigatório/i)).toBeInTheDocument()
            expect(screen.getByText(/autor é obrigatório/i)).toBeInTheDocument()
        })

        expect(supabase.from).not.toHaveBeenCalled()
    })

    it('calls supabase insert on valid submission and redirects', async () => {
        vi.mocked(useAuth).mockReturnValue({ user: { id: '1' }, role: 'admin', isLoading: false } as any)

        const mockInsert = vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [], error: null }) })
        vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any)

        render(<NewBookPage />, { wrapper: createWrapper() })

        fireEvent.change(screen.getByLabelText(/título/i), { target: { value: 'Novo Teste' } })
        fireEvent.change(screen.getByLabelText(/autor/i), { target: { value: 'Autor Novo' } })
        fireEvent.change(screen.getByLabelText(/categoria/i), { target: { value: 'Ficção' } })

        fireEvent.click(screen.getByRole('button', { name: /salvar livro/i }))

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('books')
            expect(mockInsert).toHaveBeenCalledWith({
                title: 'Novo Teste',
                author: 'Autor Novo',
                category: 'Ficção',
                status: 'disponivel'
            })
            expect(mockPush).toHaveBeenCalledWith('/')
        })
    })
})
