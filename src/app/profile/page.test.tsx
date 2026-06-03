import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
// @ts-ignore
import ProfilePage from './page'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            signOut: vi.fn(),
        },
    },
}))

vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: vi.fn(),
}))

vi.mock('@/components/BottomNavBar', () => ({
    BottomNavBar: () => <div data-testid="bottom-nav-bar" />,
}))

describe('Profile Page (/profile)', () => {
    const mockPush = vi.fn()
    const mockClear = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any)
        vi.mocked(useQueryClient).mockReturnValue({ clear: mockClear } as any)
    })

    it('renders a loading spinner while checking auth', () => {
        vi.mocked(useAuth).mockReturnValue({ isLoading: true, user: null, role: null } as any)
        render(<ProfilePage />)
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('redirects to login if user is not authenticated after loading', () => {
        vi.mocked(useAuth).mockReturnValue({ isLoading: false, user: null, role: null } as any)
        render(<ProfilePage />)
        expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('renders user details and "Leitor(a)" role, hiding admin area', () => {
        vi.mocked(useAuth).mockReturnValue({
            isLoading: false,
            user: { email: 'leitora@saf.com', user_metadata: { full_name: 'Maria Joaquina' } },
            role: 'leitora',
        } as any)

        render(<ProfilePage />)

        expect(screen.getByText('Maria Joaquina')).toBeInTheDocument()
        expect(screen.getByText('leitora@saf.com')).toBeInTheDocument()
        expect(screen.getByText('Leitor(a)')).toBeInTheDocument()

        // Gestão de acervo shouldn't be there
        expect(screen.queryByText('Administração')).not.toBeInTheDocument()
        expect(screen.queryByRole('link', { name: /Cadastrar Novo Livro/i })).not.toBeInTheDocument()
        expect(screen.queryByRole('link', { name: /Gestão de Solicitações/i })).not.toBeInTheDocument()
    })

    it('renders admin section area for "admin" role', () => {
        vi.mocked(useAuth).mockReturnValue({
            isLoading: false,
            user: { email: 'admin@saf.com', user_metadata: { full_name: 'Admin SAF' } },
            role: 'admin',
        } as any)

        render(<ProfilePage />)

        expect(screen.getByText('Admin SAF')).toBeInTheDocument()
        expect(screen.getByText('Administrador(a)')).toBeInTheDocument()

        // Gestão de acervo should be there
        expect(screen.getByText('Administração')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /Cadastrar Novo Livro/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /Gestão de Solicitações/i })).toBeInTheDocument()
    })

    it('performs logout flow correctly', async () => {
        vi.mocked(useAuth).mockReturnValue({
            isLoading: false,
            user: { email: 'leitora@saf.com', user_metadata: { full_name: 'Maria Joaquina' } },
            role: 'leitora',
        } as any)

        vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })

        render(<ProfilePage />)

        const logoutButton = screen.getByRole('button', { name: /Sair do Sistema/i })
        fireEvent.click(logoutButton)

        await waitFor(() => {
            expect(supabase.auth.signOut).toHaveBeenCalledTimes(1)
            expect(mockClear).toHaveBeenCalledTimes(1)
            expect(mockPush).toHaveBeenCalledWith('/login')
        })
    })
})
