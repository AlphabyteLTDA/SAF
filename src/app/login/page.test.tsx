import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
// @ts-ignore - Vitest / bundler resolves this relative path correctly
import LoginPage from './page'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            signInWithPassword: vi.fn(),
        }
    }
}))

vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}))

describe('LoginPage Component', () => {
    const mockPush = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any)
    })

    it('renders login form correctly with email and password inputs', () => {
        render(<LoginPage />)

        expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/e-mail/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/senha/i)).toBeInTheDocument()

        const submitButton = screen.getByRole('button', { name: /entrar/i })
        expect(submitButton).toBeInTheDocument()
        // Test for touch targets min 44px
        expect(submitButton).toHaveClass('min-h-[44px]')

        expect(screen.getByRole('link', { name: /Ainda não tem conta\? Cadastre-se aqui/i })).toBeInTheDocument()
    })

    it('shows error when submission fails', async () => {
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
            data: { user: null, session: null },
            error: { message: 'Credenciais inválidas', name: 'AuthError', status: 400 } as any
        })

        render(<LoginPage />)

        fireEvent.change(screen.getByPlaceholderText(/e-mail/i), { target: { value: 'test@test.com' } })
        fireEvent.change(screen.getByPlaceholderText(/senha/i), { target: { value: 'wrongpass' } })
        fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

        await waitFor(() => {
            expect(screen.getByText(/Credenciais inválidas/i)).toBeInTheDocument()
        })

        expect(mockPush).not.toHaveBeenCalled()
    })

    it('calls Supabase auth and redirects on success', async () => {
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
            data: { user: { id: '123' }, session: { access_token: 'token' } } as any,
            error: null
        })

        render(<LoginPage />)

        fireEvent.change(screen.getByPlaceholderText(/e-mail/i), { target: { value: 'test@saf.com' } })
        fireEvent.change(screen.getByPlaceholderText(/senha/i), { target: { value: 'correctpass' } })
        fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

        await waitFor(() => {
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@saf.com',
                password: 'correctpass'
            })
            expect(mockPush).toHaveBeenCalledWith('/')
        })
    })
})
