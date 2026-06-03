import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import NewBookPage from './page'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/hooks/useAuth')
vi.mock('browser-image-compression', () => ({
    default: vi.fn().mockImplementation((file) => Promise.resolve(file))
}))
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        storage: {
            from: vi.fn()
        }
    }
}))
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}))
vi.mock('@/hooks/useCategories', () => ({
    useCategories: vi.fn().mockReturnValue({
        data: [
            { id: '1', name: 'Teologia Cristã', created_at: '' },
            { id: '2', name: 'Vida Cristã', created_at: '' },
            { id: '3', name: 'Biografia', created_at: '' },
        ],
        isLoading: false,
    })
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
        global.URL.createObjectURL = vi.fn()
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
        
        // Categoria now uses a button instead of a select
        const catButton = screen.getByRole('button', { name: 'Teologia Cristã' })
        const submitBtn = screen.getByRole('button', { name: /salvar livro/i })

        expect(titleInput).toBeInTheDocument()
        expect(authorInput).toBeInTheDocument()
        expect(catButton).toBeInTheDocument()
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
        
        // Click the button instead of changing input
        fireEvent.click(screen.getByRole('button', { name: 'Vida Cristã' }))

        fireEvent.click(screen.getByRole('button', { name: /salvar livro/i }))

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('books')
            expect(mockInsert).toHaveBeenCalledWith({
                title: 'Novo Teste',
                author: 'Autor Novo',
                category: ['Vida Cristã'],
                description: null,
                status: 'disponivel',
                cover_url: null
            })
            expect(mockPush).toHaveBeenCalledWith('/')
        })
    })
})
