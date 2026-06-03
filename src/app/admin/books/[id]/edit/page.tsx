"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useCategories } from '@/hooks/useCategories'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { Camera, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import imageCompression from 'browser-image-compression'
import toast, { Toaster } from 'react-hot-toast'
import { parseCategories } from '@/lib/bookUtils'

const bookSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    author: z.string().min(1, 'Autor é obrigatório'),
    category: z.array(z.string()).min(1, 'Selecione no mínimo 1 categoria'),
    description: z.string().optional(),
})

type BookFormValues = z.infer<typeof bookSchema>

export default function EditBookPage({ params }: { params: { id: string } }) {
    const { user, role, isLoading: authLoading } = useAuth()
    const router = useRouter()
    const queryClient = useQueryClient()
    
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const { data: categoriesData } = useCategories()
    
    // Auth Guard
    useEffect(() => {
        if (!authLoading && role !== 'admin') {
            router.push('/')
        }
    }, [role, authLoading, router])

    // Load initial Book Data
    const { data: book, isLoading: isBookLoading } = useQuery({
        queryKey: ['book', params.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('books')
                .select('*')
                .eq('id', params.id)
                .single()

            if (error) throw error
            return data
        },
        enabled: !!params.id && role === 'admin'
    })

    const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<BookFormValues>({
        resolver: zodResolver(bookSchema),
    })

    const watchCategories = watch('category') || []

    // Populate form and cover when book loads
    useEffect(() => {
        if (book) {
            const initialCategories = parseCategories(book.category);

            reset({
                title: book.title,
                author: book.author,
                category: initialCategories.length > 0 ? initialCategories : [],
                description: book.description || '',
            })
            if (book.cover_url) {
                setCoverPreview(book.cover_url)
            }
        }
    }, [book, reset])

    const updateBookMutation = useMutation({
        mutationFn: async (data: BookFormValues) => {
            let cover_url = book?.cover_url || null

            // If user attached a NEW file, compress + swap it
            if (coverFile) {
                // Compress image
                const options = {
                    maxSizeMB: 0.5,
                    maxWidthOrHeight: 1024,
                    useWebWorker: false 
                }
                const compressedFile = await imageCompression(coverFile, options)
                
                // 1. Delete Old Photo if it existed
                if (book?.cover_url) {
                    const oldFileName = book.cover_url.split('/').pop()
                    if (oldFileName) {
                        const { error: deleteError } = await supabase.storage
                            .from('book-covers')
                            .remove([oldFileName])
                        
                        if (deleteError) {
                            console.error('Failed to purge old cover in bucket: ', deleteError)
                        }
                    }
                }

                // 2. Upload New Photo
                const fileExt = compressedFile.name.split('.').pop() || 'jpeg'
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
                
                const { error: uploadError } = await supabase.storage
                    .from('book-covers')
                    .upload(fileName, compressedFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('book-covers')
                    .getPublicUrl(fileName)
                
                cover_url = publicUrl
            }

            // Update Database Row
            const { error: updateError } = await supabase
                .from('books')
                .update({
                    title: data.title,
                    author: data.author,
                    category: data.category,
                    description: data.description || null,
                    cover_url: cover_url
                })
                .eq('id', params.id)

            if (updateError) throw updateError
        },
        onMutate: () => toast.loading('Salvando alterações...', { id: 'edit-book' }),
        onSuccess: () => {
            toast.success('Livro editado com sucesso!', { id: 'edit-book' })
            queryClient.invalidateQueries({ queryKey: ['book', params.id] })
            queryClient.invalidateQueries({ queryKey: ['books'] })
            router.push(`/books/${params.id}`)
        },
        onError: (err: any) => {
            console.error('Erro ao editar livro:', err)
            toast.error(
                err?.message?.includes('column') 
                    ? 'Erro: a migração do banco de dados ainda não foi executada. Contacte o administrador.' 
                    : 'Erro ao editar livro. Tente novamente.', 
                { id: 'edit-book' }
            )
        }
    })

    const onSubmit = (data: BookFormValues) => {
        updateBookMutation.mutate(data)
    }

    if (authLoading || isBookLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-saf-200 border-t-saf-500 rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!book) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <p className="text-saf-600 mb-4">Livro não encontrado.</p>
                <Link href="/" className="text-saf-500 font-medium">Voltar ao Catálogo</Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-saf-50 pb-20">
            <Toaster position="top-center" />
            
            {/* Header / Navbar */}
            <div className="bg-saf-500 text-white p-4 shadow-sm sticky top-0 z-10 safe-top">
                <div className="flex items-center gap-3">
                    <Link href={`/books/${params.id}`} className="p-2 -ml-2 hover:bg-saf-600 rounded-full transition-colors active:scale-95">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-lg font-bold">Editar Livro</h1>
                </div>
            </div>

            <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-6 mt-2">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-saf-100 flex flex-col pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    <div className="flex flex-col items-center gap-4 mb-4">
                        {coverPreview ? (
                            <div className="relative w-32 h-44 rounded-xl overflow-hidden border-2 border-saf-100 shadow-sm transition-transform hover:scale-105 duration-300">
                                <Image src={coverPreview} alt="Capa" fill className="object-cover" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCoverFile(null)
                                        setCoverPreview(null)
                                    }}
                                    className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full text-red-500 hover:text-white hover:bg-red-500 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="w-full">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-saf-200 rounded-xl cursor-pointer bg-saf-50/50 hover:bg-saf-50 transition-colors focus-within:ring-2 focus-within:ring-saf-500 focus-within:border-saf-500">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <div className="bg-saf-100 p-3 rounded-full mb-2">
                                            <Camera className="w-6 h-6 text-saf-500" />
                                        </div>
                                        <p className="text-sm text-saf-700 font-semibold">Tirar ou Escolher Foto</p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                setCoverFile(file)
                                                setCoverPreview(URL.createObjectURL(file))
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        )}
                    </div>

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
                            <label htmlFor="description" className="text-sm font-semibold text-saf-700 ml-1">Descrição (opcional)</label>
                            <textarea
                                id="description"
                                {...register('description')}
                                placeholder="Ex: Um guia prático sobre como ser uma esposa..."
                                rows={3}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-saf-500/20 outline-none transition-all placeholder-saf-300 min-h-[44px] text-saf-900 ${errors.description ? 'border-red-300 focus:border-red-500' : 'border-saf-100 focus:border-saf-500'}`}
                            />
                            {errors.description && <span className="text-red-500 text-xs mt-1 ml-1">{errors.description.message}</span>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-saf-700 ml-1">Categorias</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {categoriesData?.map(cat => {
                                    const isSelected = watchCategories.includes(cat.name)
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setValue('category', watchCategories.filter(c => c !== cat.name), { shouldValidate: true })
                                                } else {
                                                    setValue('category', [...watchCategories, cat.name], { shouldValidate: true })
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border-2
                                                ${isSelected 
                                                    ? 'bg-saf-600 text-white border-saf-600 shadow-sm' 
                                                    : 'bg-white text-saf-600 border-saf-100 hover:border-saf-300 hover:bg-saf-50 active:scale-95'}`}
                                        >
                                            {cat.name}
                                        </button>
                                    )
                                })}
                            </div>
                            {errors.category && <span className="text-red-500 text-xs mt-1 ml-1">{errors.category.message}</span>}
                        </div>

                        <button
                            type="submit"
                            disabled={updateBookMutation.isPending}
                            className="w-full bg-saf-600 hover:bg-saf-700 active:bg-saf-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-sm min-h-[48px] transition-colors mt-6 disabled:opacity-70 flex justify-center items-center focus:outline-none focus:ring-2 focus:ring-saf-500 focus:ring-offset-2"
                        >
                            {updateBookMutation.isPending ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                'Salvar Alterações'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
