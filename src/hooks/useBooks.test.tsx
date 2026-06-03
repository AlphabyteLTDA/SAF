import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useBooks } from './useBooks'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    }
}))

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
    })
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client= { queryClient } >
        { children }
        </QueryClientProvider>
  )
}

describe('useBooks Hook (Real Data)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('fetches books from supabase books table', async () => {
        // Mock Supabase chain: supabase.from('books').select('*').order('created_at', { ascending: false })
        const mockOrder = vi.fn().mockResolvedValue({
            data: [{ id: '1', title: 'Livro Teste', author: 'Autor Teste' }],
            error: null
        })
        const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
        vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

        const { result } = renderHook(() => useBooks(), { wrapper: createWrapper() })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(supabase.from).toHaveBeenCalledWith('books')
        expect(mockSelect).toHaveBeenCalledWith('*')
        expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
        expect(result.current.data).toEqual([{ id: '1', title: 'Livro Teste', author: 'Autor Teste', category: [] }])
    })

    it('handles supabase fetch errors', async () => {
        const mockOrder = vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
        })
        const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
        vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

        const { result } = renderHook(() => useBooks(), { wrapper: createWrapper() })

        await waitFor(() => {
            expect(result.current.isError).toBe(true)
        })

        expect(result.current.error?.message).toBe('Database error')
    })
})
