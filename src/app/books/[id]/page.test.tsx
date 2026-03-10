import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
// @ts-ignore - Vitest / bundler resolves this relative path correctly
import BookPage from './page'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    }
}))

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
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

describe('Book Details Page (/books/[id]) - Borrowing Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-123' }, role: 'leitora', isLoading: false } as any)
    })

    const mockAvailableBook = {
        id: 'book-1', title: 'Livro Teste', author: 'Autor Teste', category: 'Ficção', status: 'disponivel', cover_url: null
    }

    const setupMockForBookFetch = () => {
        const mockSingle = vi.fn().mockResolvedValue({ data: mockAvailableBook, error: null })
        const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

        // Default return for queries (which might be overriden individually inside the test for mutations)
        vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)
    }

    it('handles clicking the borrow button, calls insert on loans and update on books', async () => {
        setupMockForBookFetch()

        // Setup mocks for the mutation
        const mockInsert = vi.fn().mockResolvedValue({ error: null })
        const mockEqForUpdate = vi.fn().mockResolvedValue({ error: null })
        const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqForUpdate })

        vi.mocked(supabase.from).mockImplementation((table: string) => {
            if (table === 'loans') {
                return { insert: mockInsert } as any
            }
            if (table === 'books') {
                return {
                    update: mockUpdate,
                    // Need to include select for the initial fetch
                    select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: mockAvailableBook, error: null }) }) })
                } as any
            }
            return {} as any
        })

        render(<BookPage params={{ id: 'book-1' }} />, { wrapper: createWrapper() })

        // Wait for the book to load
        const requestBtn = await screen.findByRole('button', { name: /solicitar reserva/i })

        // Ensure button is ready to click
        fireEvent.click(requestBtn)

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('loans')
            expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
                book_id: 'book-1',
                user_id: 'user-123',
                status: 'pendente'
            }))

            expect(supabase.from).toHaveBeenCalledWith('books')
            expect(mockUpdate).toHaveBeenCalledWith({ status: 'reservado' })
            expect(mockEqForUpdate).toHaveBeenCalledWith('id', 'book-1')
        })
    })

    it('handles direct borrow bypass for admin users', async () => {
        vi.mocked(useAuth).mockReturnValue({ user: { id: 'admin-123' }, role: 'admin', isLoading: false } as any)

        const mockInsert = vi.fn().mockResolvedValue({ error: null })
        const mockEqForUpdate = vi.fn().mockResolvedValue({ error: null })
        const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqForUpdate })

        vi.mocked(supabase.from).mockImplementation((table: string) => {
            if (table === 'loans') {
                return { insert: mockInsert } as any
            }
            if (table === 'books') {
                return {
                    update: mockUpdate,
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'book-1', title: 'Livro Teste', author: 'Autor Teste', category: 'Ficção', status: 'disponivel', cover_url: null
                                }, error: null
                            })
                        })
                    })
                } as any
            }
            return {} as any
        })

        const { render } = await import('@testing-library/react')
        render(<BookPage params={{ id: 'book-1' }} />, { wrapper: createWrapper() })

        const bypassBtn = await screen.findByRole('button', { name: /Pegar Emprestado/i })
        fireEvent.click(bypassBtn)

        await waitFor(() => {
            expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
                book_id: 'book-1',
                user_id: 'admin-123',
                status: 'ativo'
            }))
            expect(mockUpdate).toHaveBeenCalledWith({ status: 'emprestado' })
        })
    })
})
