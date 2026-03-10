"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

const bookSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    author: z.string().min(1, 'Autor é obrigatório'),
    category: z.string().min(1, 'Categoria é obrigatória'),
})

type BookFormValues = z.infer<typeof bookSchema>

export default function NewBookPage() {
    const { user, role, isLoading: authLoading } = useAuth()
    const router = useRouter()
    const queryClient = useQueryClient()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { register, handleSubmit, formState: { errors } } = useForm<BookFormValues>({
        resolver: zodResolver(bookSchema),
        defaultValues: {
            category: 'Vida Cristã',
        }
    })

    // Role Protection
    useEffect(() => {
        if (!authLoading && role !== 'admin') {
            router.push('/')
        }
    }, [role, authLoading, router])

    if (authLoading || role !== 'admin') {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-saf-200 border-t-saf-500 rounded-full animate-spin"></div>
            </div>
        )
    }

    const onSubmit = async (data: BookFormValues) => {
        setIsSubmitting(true)
        setError(null)

        const { error: insertError } = await supabase
            .from('books')
            .insert({
                title: data.title,
                author: data.author,
                category: data.category || null,
                status: 'disponivel'
            })
            .select()

        if (insertError) {
            setError('Erro ao salvar o livro. Tente novamente.')
            setIsSubmitting(false)
        } else {
            // Invalidate the cache to refresh BookList
            queryClient.invalidateQueries({ queryKey: ['books'] })
            router.push('/')
        }
    }

    return (
        <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-saf-100 flex flex-col pt-8">
                <h1 className="text-2xl font-bold text-saf-900 mb-6 text-center">Adicionar Novo Livro</h1>

                {error && (
                    <div className="w-full bg-red-50 text-red-600 font-medium text-sm p-3 rounded-xl mb-4 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="title" className="text-sm font-semibold text-saf-700 ml-1">Título</label>
                        <input
                            id="title"
                            {...register('title')}
                            placeholder="Ex: A Mulher Sábia"
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-saf-500/20 outline-none transition-all placeholder-saf-300 min-h-[44px] text-saf-900 ${errors.title ? 'border-red-300 focus:border-red-500' : 'border-saf-100 focus:border-saf-500'}`}
                        />
                        {errors.title && <span className="text-red-500 text-xs mt-1 ml-1">{errors.title.message}</span>}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="author" className="text-sm font-semibold text-saf-700 ml-1">Autor</label>
                        <input
                            id="author"
                            {...register('author')}
                            placeholder="Ex: Martha Peace"
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-saf-500/20 outline-none transition-all placeholder-saf-300 min-h-[44px] text-saf-900 ${errors.author ? 'border-red-300 focus:border-red-500' : 'border-saf-100 focus:border-saf-500'}`}
                        />
                        {errors.author && <span className="text-red-500 text-xs mt-1 ml-1">{errors.author.message}</span>}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="category" className="text-sm font-semibold text-saf-700 ml-1">Categoria</label>
                        <select
                            id="category"
                            {...register('category')}
                            className="w-full px-4 py-3 border-2 border-saf-100 rounded-xl focus:border-saf-500 focus:ring-4 focus:ring-saf-500/20 outline-none transition-all min-h-[44px] text-saf-900 bg-white"
                        >
                            <option value="Vida Cristã">Vida Cristã</option>
                            <option value="Ficção">Ficção</option>
                            <option value="Teologia">Teologia</option>
                            <option value="Biografia">Biografia</option>
                            <option value="Infantil">Infantil</option>
                        </select>
                        {errors.category && <span className="text-red-500 text-xs mt-1 ml-1">{errors.category.message}</span>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-saf-500 hover:bg-saf-600 active:bg-saf-700 text-white font-bold py-3 px-4 rounded-xl min-h-[44px] transition-colors mt-6 disabled:opacity-70 flex justify-center items-center"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            'Salvar Livro'
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
