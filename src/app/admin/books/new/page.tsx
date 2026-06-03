"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useCategories } from '@/hooks/useCategories'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { Camera, X, Tag } from 'lucide-react'
import Link from 'next/link'
import imageCompression from 'browser-image-compression'

const bookSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    author: z.string().min(1, 'Autor é obrigatório'),
    category: z.array(z.string()).min(1, 'Selecione no mínimo 1 categoria'),
    description: z.string().optional(),
})

type BookFormValues = z.infer<typeof bookSchema>

export default function NewBookPage() {
    const { user, role, isLoading: authLoading } = useAuth()
    const router = useRouter()
    const queryClient = useQueryClient()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const { data: categoriesData } = useCategories()

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<BookFormValues>({
        resolver: zodResolver(bookSchema),
        defaultValues: {
            category: [],
            description: '',
        }
    })

    const watchCategories = watch('category') || []
    
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

        let cover_url = null

        if (coverFile) {
            try {
                // Compress image
                const options = {
                    maxSizeMB: 0.5, // 500KB limit for better memory handling
                    maxWidthOrHeight: 1024,
                    useWebWorker: false // Disabled: WebWorkers often trigger OOM crashes on mobile browsers
                }
                const compressedFile = await imageCompression(coverFile, options)
                
                // Upload to Supabase Storage
                const fileExt = compressedFile.name.split('.').pop() || 'jpeg'
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
                
                const { error: uploadError } = await supabase.storage
                    .from('book-covers')
                    .upload(fileName, compressedFile)

                if (uploadError) {
                    throw uploadError
                }

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('book-covers')
                    .getPublicUrl(fileName)
                
                cover_url = publicUrl
            } catch (err) {
                console.error("Error uploading image: ", err)
                setError('Erro ao processar ou enviar a imagem da capa. Tente novamente.')
                setIsSubmitting(false)
                return
            }
        }

        const { error: insertError } = await supabase
            .from('books')
            .insert({
                title: data.title,
                author: data.author,
                category: data.category,
                description: data.description || null,
                status: 'disponivel',
                cover_url: cover_url
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

                <div className="flex flex-col items-center gap-4 mb-4">
                    {coverPreview ? (
                        <div className="relative w-32 h-44 rounded-xl overflow-hidden border-2 border-saf-100 shadow-sm">
                            <Image src={coverPreview} alt="Capa" fill className="object-cover" />
                            <button
                                type="button"
                                onClick={() => {
                                    setCoverFile(null)
                                    setCoverPreview(null)
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full text-red-500 hover:text-white hover:bg-red-500 transition-colors shadow-sm"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-saf-200 rounded-xl cursor-pointer bg-saf-50/50 hover:bg-saf-50 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <div className="bg-saf-100 p-3 rounded-full mb-2">
                                        <Camera className="w-6 h-6 text-saf-500" />
                                    </div>
                                    <p className="text-sm text-saf-700 font-semibold">Câmera ou Galeria</p>
                                    <p className="text-xs text-saf-400 mt-0.5">Automático: Compressão Leve</p>
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
                                                ? 'bg-saf-500 text-white border-saf-500 shadow-sm' 
                                                : 'bg-white text-saf-600 border-saf-100 hover:border-saf-300 hover:bg-saf-50 active:scale-95'}`}
                                    >
                                        {cat.name}
                                    </button>
                                )
                            })}
                        </div>
                        <Link href="/admin/categories" className="text-xs text-saf-500 hover:text-saf-700 font-medium mt-1 ml-1 flex items-center gap-1 transition-colors">
                            <Tag className="w-3 h-3" />
                            Gerenciar Categorias
                        </Link>
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
