import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
// @ts-ignore
// @ts-ignore - Vitest / bundler resolves this relative path correctly
import RegisterPage from './page'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            signUp: vi.fn(),
        },
    },
}))

vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
    __esModule: true,
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}))

describe('Register Page (/register)', () => {
    const mockPush = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any)
    })

    it('renders registration form correctly', () => {
        render(<RegisterPage />)
        expect(screen.getByPlaceholderText(/Nome Completo/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/E-mail/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/^Senha$/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/Confirmar Senha/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Criar Conta/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /Já tem uma conta\? Faça login aqui/i })).toBeInTheDocument()
    })

    it('displays validation errors if passwords do not match', async () => {
        render(<RegisterPage />)

        fireEvent.change(screen.getByPlaceholderText(/Nome Completo/i), { target: { value: 'Test User' } })
        fireEvent.change(screen.getByPlaceholderText(/E-mail/i), { target: { value: 'test@example.com' } })
        fireEvent.change(screen.getByPlaceholderText(/^Senha$/i), { target: { value: 'senha123' } })
        fireEvent.change(screen.getByPlaceholderText(/Confirmar Senha/i), { target: { value: 'diferente123' } })

        fireEvent.click(screen.getByRole('button', { name: /Criar Conta/i }))

        expect(await screen.findByText(/As senhas não coincidem/i)).toBeInTheDocument()
        expect(supabase.auth.signUp).not.toHaveBeenCalled()
    })

    it('submits form with correct data to Supabase and handles success', async () => {
        vi.mocked(supabase.auth.signUp).mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
        } as any)

        render(<RegisterPage />)

        fireEvent.change(screen.getByPlaceholderText(/Nome Completo/i), { target: { value: 'Ana Souza' } })
        fireEvent.change(screen.getByPlaceholderText(/E-mail/i), { target: { value: 'ana@example.com' } })
        fireEvent.change(screen.getByPlaceholderText(/^Senha$/i), { target: { value: 'saf123456' } })
        fireEvent.change(screen.getByPlaceholderText(/Confirmar Senha/i), { target: { value: 'saf123456' } })

        fireEvent.click(screen.getByRole('button', { name: /Criar Conta/i }))

        await waitFor(() => {
            // Vital: Check if fullName was passed in options.data.full_name
            expect(supabase.auth.signUp).toHaveBeenCalledWith({
                email: 'ana@example.com',
                password: 'saf123456',
                options: {
                    data: {
                        full_name: 'Ana Souza',
                    },
                    emailRedirectTo: 'http://localhost:3000/login',
                },
            })

            expect(toast.success).toHaveBeenCalledWith(
                expect.stringMatching(/Boas-vindas/i),
                { duration: 5000 }
            )
            expect(screen.getByText(/Verifique seu E-mail/i)).toBeInTheDocument()
        })
    })

    it('handles Supabase error on registration', async () => {
        vi.mocked(supabase.auth.signUp).mockResolvedValue({
            data: { user: null },
            error: { message: 'User already registered' },
        } as any)

        render(<RegisterPage />)

        fireEvent.change(screen.getByPlaceholderText(/Nome Completo/i), { target: { value: 'Ana Souza' } })
        fireEvent.change(screen.getByPlaceholderText(/E-mail/i), { target: { value: 'ana@example.com' } })
        fireEvent.change(screen.getByPlaceholderText(/^Senha$/i), { target: { value: 'saf123456' } })
        fireEvent.change(screen.getByPlaceholderText(/Confirmar Senha/i), { target: { value: 'saf123456' } })

        fireEvent.click(screen.getByRole('button', { name: /Criar Conta/i }))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('User already registered')
            expect(mockPush).not.toHaveBeenCalled()
        })
    })
})
