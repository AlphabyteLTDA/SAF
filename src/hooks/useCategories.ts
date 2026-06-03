"use client"

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Category {
    id: string
    name: string
    created_at: string
}

export function useCategories() {
    return useQuery<Category[]>({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name', { ascending: true })

            if (error) throw error
            return data as Category[]
        },
    })
}
