import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuth } from './useAuth'

// Mock the Supabase client
const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()

vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: () => mockGetSession(),
            onAuthStateChange: (cb: any) => mockOnAuthStateChange(cb),
        }
    }
}))

// Mock React Query behavior
vi.mock('@tanstack/react-query', () => {
    return {
        useQuery: vi.fn((options) => {
            // Emulate the useQuery logic: if no user is passed (enabled: false)
            if (!options.enabled) return { data: undefined }

            // For testing purposes, act like it fetched successfully if user id is 123
            if (options.queryKey[1] === 'user-123') return { data: 'admin' }
            return { data: 'leitora' }
        }),
        useQueryClient: vi.fn(),
    }
})

describe('useAuth Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('initially returns loading true and null user', async () => {
        // We delay the getSession resolution so the initial state can be asserted
        mockGetSession.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ data: { session: null }, error: null }), 100)))
        mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })

        const { result } = renderHook(() => useAuth())

        expect(result.current.isLoading).toBe(true)
        expect(result.current.user).toBeNull()
        expect(result.current.role).toBeNull()
    })

    it('returns user and resolves role via React Query non-blocking cache', async () => {
        mockGetSession.mockResolvedValue({
            data: {
                session: {
                    user: { id: 'user-123', email: 'admin@saf.com' }
                }
            },
            error: null
        })
        mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })

        const { result } = renderHook(() => useAuth())

        // wait for loading to finish
        await vi.waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.user?.id).toBe('user-123')
        expect(result.current.role).toBe('admin') // Picked up from React Query mock
    })

    it('defaults to leitora if user is known but db returns nothing/leitora', async () => {
        mockGetSession.mockResolvedValue({
            data: {
                session: {
                    user: { id: 'user-789', email: 'leitura@saf.com' }
                }
            },
            error: null
        })
        mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })

        const { result } = renderHook(() => useAuth())

        await vi.waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.role).toBe('leitora')
    })
})
