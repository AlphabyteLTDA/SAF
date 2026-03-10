import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TopNavBar } from './TopNavBar'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
}))

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}))

describe('TopNavBar Component', () => {
    it('does not render if user is not authenticated', () => {
        vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, role: null } as any)
        vi.mocked(usePathname).mockReturnValue('/')

        const { container } = render(<TopNavBar />)
        expect(container).toBeEmptyDOMElement()
    })

    it('does not render on /login or /register page', () => {
        vi.mocked(useAuth).mockReturnValue({ user: { id: '123' }, isLoading: false, role: 'leitora' } as any)
        vi.mocked(usePathname).mockReturnValue('/login')

        const { container, rerender } = render(<TopNavBar />)
        expect(container).toBeEmptyDOMElement()

        vi.mocked(usePathname).mockReturnValue('/register')
        rerender(<TopNavBar />)
        expect(container).toBeEmptyDOMElement()
    })

    it('renders correctly for authenticated users', () => {
        vi.mocked(useAuth).mockReturnValue({ user: { id: '123' }, isLoading: false, role: 'leitora' } as any)
        vi.mocked(usePathname).mockReturnValue('/')

        render(<TopNavBar />)

        expect(screen.getByText('SAF')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /Catálogo/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /Meus Livros/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /Perfil/i })).toBeInTheDocument()
    })
})
