import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BottomNavBar } from './BottomNavBar'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
}))

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}))

describe('BottomNavBar Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(usePathname).mockReturnValue('/')
        vi.mocked(useAuth).mockReturnValue({ user: { id: '1' }, isLoading: false } as any)
    })

    it('renders nothing if user is not authenticated', () => {
        vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false } as any)
        const { container } = render(<BottomNavBar />)
        expect(container).toBeEmptyDOMElement()
    })

    it('renders nothing if route is /login', () => {
        vi.mocked(usePathname).mockReturnValue('/login')
        const { container } = render(<BottomNavBar />)
        expect(container).toBeEmptyDOMElement()
    })

    it('renders all three navigation items when authenticated', () => {
        render(<BottomNavBar />)
        expect(screen.getByText('Catálogo')).toBeInTheDocument()
        expect(screen.getByText('Meus Livros')).toBeInTheDocument()
        expect(screen.getByText('Perfil')).toBeInTheDocument()
    })

    it('highlights the active route correctly', () => {
        const { rerender } = render(<BottomNavBar />)

        const catalogoLink = screen.getByRole('link', { name: /catálogo/i })
        expect(catalogoLink).toHaveClass('text-saf-500')
        expect(catalogoLink).not.toHaveClass('text-saf-400')

        vi.mocked(usePathname).mockReturnValue('/loans')
        rerender(<BottomNavBar />)

        const meusLivrosLink = screen.getByRole('link', { name: /meus livros/i })
        expect(meusLivrosLink).toHaveClass('text-saf-500')
        const inactiveCatalogoLink = screen.getByRole('link', { name: /catálogo/i })
        expect(inactiveCatalogoLink).toHaveClass('text-saf-400')
    })

    it('ensures touch targets are at least 44x44px for accessibility', () => {
        render(<BottomNavBar />)
        const links = screen.getAllByRole('link')
        expect(links).toHaveLength(3)

        links.forEach(link => {
            expect(link).toHaveClass('min-h-[44px]')
            expect(link).toHaveClass('min-w-[44px]')
        })
    })
})
