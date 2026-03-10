import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
// @ts-ignore - Vitest / bundler resolves this relative path correctly
import { BookList } from './BookList'
import { useBooks } from '@/hooks/useBooks'

import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'

vi.mock('@/hooks/useBooks')
vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn()
}))
vi.mock('@tanstack/react-query', () => ({
    useQuery: vi.fn()
}))

const mockBooks = [
    { id: '1', title: 'A Mulher Sábia', author: 'Martha Peace', category: 'Vida Cristã', status: 'disponivel', cover_url: null, created_at: '2023-01-01T00:00:00Z' },
    { id: '2', title: 'O Peregrino', author: 'John Bunyan', category: 'Ficção', status: 'emprestado', cover_url: null, created_at: '2023-01-01T00:00:00Z' },
]

describe('BookList Component', () => {
    beforeEach(() => {
        vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-123' }, role: 'leitora', isLoading: false } as any)
        vi.mocked(useQuery).mockReturnValue({ data: [] } as any)
    })
    it('renders loading state initially', () => {
        vi.mocked(useBooks).mockReturnValue({
            data: undefined,
            isLoading: true,
            error: null,
        } as any)

        render(<BookList />)
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('renders a list of books as cards', () => {
        vi.mocked(useBooks).mockReturnValue({
            data: mockBooks,
            isLoading: false,
            error: null,
        } as any)

        render(<BookList />)
        expect(screen.getByText('A Mulher Sábia')).toBeInTheDocument()
        expect(screen.getByText('Martha Peace')).toBeInTheDocument()
        expect(screen.getByText('O Peregrino')).toBeInTheDocument()
        expect(screen.getByText('John Bunyan')).toBeInTheDocument()
    })

    it('filters books by title when searching', () => {
        vi.mocked(useBooks).mockReturnValue({
            data: mockBooks,
            isLoading: false,
            error: null,
        } as any)

        render(<BookList />)
        const searchInput = screen.getByPlaceholderText(/buscar/i)
        fireEvent.change(searchInput, { target: { value: 'Peregrino' } })

        expect(screen.queryByText('A Mulher Sábia')).not.toBeInTheDocument()
        expect(screen.getByText('O Peregrino')).toBeInTheDocument()
    })

    it('filters books by author when searching', () => {
        vi.mocked(useBooks).mockReturnValue({
            data: mockBooks,
            isLoading: false,
            error: null,
        } as any)

        render(<BookList />)
        const searchInput = screen.getByPlaceholderText(/buscar/i)
        fireEvent.change(searchInput, { target: { value: 'Martha' } })

        expect(screen.getByText('A Mulher Sábia')).toBeInTheDocument()
        expect(screen.queryByText('O Peregrino')).not.toBeInTheDocument()
    })

    it('renders empty state if no books match', () => {
        vi.mocked(useBooks).mockReturnValue({
            data: mockBooks,
            isLoading: false,
            error: null,
        } as any)

        render(<BookList />)
        const searchInput = screen.getByPlaceholderText(/buscar/i)
        fireEvent.change(searchInput, { target: { value: 'Livro Inexistente' } })

        expect(screen.getByText(/Nenhum livro encontrado/i)).toBeInTheDocument()
        expect(screen.queryByText('A Mulher Sábia')).not.toBeInTheDocument()
    })

    it('ensures search input has a minimum height of 44px for touch targets', () => {
        vi.mocked(useBooks).mockReturnValue({
            data: mockBooks,
            isLoading: false,
            error: null,
        } as any)

        render(<BookList />)
        const searchInput = screen.getByPlaceholderText(/buscar/i)

        // We check if the class applied ensures 44px minimum touch target.
        // In tailwind, min-h-[44px] or h-11 provides 44px. Let's look for min-h-[44px].
        expect(searchInput).toHaveClass('min-h-[44px]')
    })
})
