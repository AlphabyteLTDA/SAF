import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type Book = {
    id: string
    title: string
    author: string
    category: string
    status: 'disponivel' | 'emprestado' | 'reservado' | string
    cover_url: string | null
    created_at: string
}

export function useBooks() {
    return useQuery({
        queryKey: ['books'],
        queryFn: async (): Promise<Book[]> => {
            const { data, error } = await supabase
                .from('books')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                throw new Error(error.message)
            }

            return data as Book[]
        }
    })
}
