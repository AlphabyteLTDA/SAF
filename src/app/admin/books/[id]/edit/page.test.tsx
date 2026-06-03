import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import EditBookPage from './page'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Mocks
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}))

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}))
vi.mock('@/hooks/useCategories', () => ({
    useCategories: vi.fn().mockReturnValue({
        data: [
            { id: '1', name: 'Teologia Cristã', created_at: '' },
            { id: '2', name: 'Vida Cristã', created_at: '' },
            { id: '3', name: 'Ficção', created_at: '' },
        ],
        isLoading: false,
    })
}))

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'book-1',
                            title: 'O Velho e o Mar',
                            author: 'Ernest',
                            category: ['Ficção'],
                            cover_url: null,
                        },
                        error: null,
                    }),
                })),
            })),
            update: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({ error: null }),
            })),
        })),
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn().mockResolvedValue({ error: null }),
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://fake.url' } })),
                remove: vi.fn().mockResolvedValue({ error: null })
            })),
        },
    },
}))

// Mocks
vi.mock('react-hot-toast', () => {
    return {
        default: {
            success: vi.fn(),
            error: vi.fn(),
            loading: vi.fn(),
        },
        Toaster: () => null
    }
})

// Mock Next Image since it misbehaves in Vitest/JSDom without full mock
vi.mock('next/image', () => ({
    default: (props: any) => <img {...props} priority="true" />
}))

describe('EditBookPage', () => {
    let queryClient: QueryClient
    const mockPush = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false, gcTime: 0 },
            },
        })
        vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any)
    })

    const renderComponent = () =>
        render(
            <QueryClientProvider client={queryClient}>
                <EditBookPage params={{ id: 'book-1' }} />
            </QueryClientProvider>
        )

    it('blocks non-admin users', () => {
        vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-1' }, role: 'membro', isLoading: false } as any)
        renderComponent()
        expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('loads the existing book and populates the form', async () => {
        vi.mocked(useAuth).mockReturnValue({ user: { id: 'admin-1' }, role: 'admin', isLoading: false } as any)
        renderComponent()

        // Wait to fetch
        await waitFor(() => {
            expect(screen.getByDisplayValue('O Velho e o Mar')).toBeInTheDocument()
        })
        expect(screen.getByDisplayValue('Ernest')).toBeInTheDocument()
        
        // Assert the active category button is present
        expect(screen.getByRole('button', { name: 'Ficção' })).toBeInTheDocument()
        expect(supabase.from).toHaveBeenCalledWith('books')
    })

    it('submits updated text correctly', async () => {
        vi.mocked(useAuth).mockReturnValue({ user: { id: 'admin-1' }, role: 'admin', isLoading: false } as any)
        renderComponent()

        await waitFor(() => {
            expect(screen.getByDisplayValue('O Velho e o Mar')).toBeInTheDocument()
        })

        // Modify Title
        const titleInput = screen.getByLabelText('Título')
        fireEvent.change(titleInput, { target: { value: 'O Velho Editado' } })

        // Save
        const saveButton = screen.getByRole('button', { name: /Salvar Alterações/i })
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('books')
            // Push back to detail page gracefully
            expect(mockPush).toHaveBeenCalledWith('/books/book-1')
        })
    })
})
