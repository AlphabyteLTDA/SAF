"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useCategories } from '@/hooks/useCategories'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2, Tag, AlertTriangle, X } from 'lucide-react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

export default function CategoriesPage() {
    const { user, role, isLoading: authLoading } = useAuth()
    const router = useRouter()
    const queryClient = useQueryClient()
    const { data: categories, isLoading: catsLoading } = useCategories()

    const [newCategoryName, setNewCategoryName] = useState('')
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

    const isAdmin = Boolean(role && String(role).toLowerCase().includes('admin'))

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/')
        }
    }, [isAdmin, authLoading, router])

    // Add Category
    const addCategoryMutation = useMutation({
        mutationFn: async (name: string) => {
            const trimmed = name.trim()
            if (!trimmed) throw new Error('Nome vazio')

            const { error } = await supabase
                .from('categories')
                .insert({ name: trimmed })

            if (error) {
                if (error.code === '23505') throw new Error('Categoria já existe.')
                throw error
            }
        },
        onMutate: () => toast.loading('Adicionando...', { id: 'cat-action' }),
        onSuccess: () => {
            toast.success('Categoria criada!', { id: 'cat-action' })
            setNewCategoryName('')
            queryClient.invalidateQueries({ queryKey: ['categories'] })
        },
        onError: (err: any) => {
            toast.error(err.message || 'Erro ao criar categoria.', { id: 'cat-action' })
        }
    })

    // Delete Category
    const deleteCategoryMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id)

            if (error) throw error
        },
        onMutate: () => toast.loading('Removendo...', { id: 'cat-action' }),
        onSuccess: () => {
            toast.success('Categoria removida!', { id: 'cat-action' })
            setDeleteTarget(null)
            queryClient.invalidateQueries({ queryKey: ['categories'] })
        },
        onError: (err: any) => {
            toast.error(err.message || 'Erro ao remover categoria.', { id: 'cat-action' })
        }
    })

    const handleAdd = useCallback(() => {
        if (newCategoryName.trim()) {
            addCategoryMutation.mutate(newCategoryName)
        }
    }, [newCategoryName, addCategoryMutation])

    const confirmDelete = useCallback(() => {
        if (deleteTarget) {
            deleteCategoryMutation.mutate(deleteTarget.id)
        }
    }, [deleteTarget, deleteCategoryMutation])

    if (authLoading || catsLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-4 border-saf-200 border-t-saf-500 rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-saf-50 pb-20">
            <Toaster position="top-center" />

            {/* Header */}
            <div className="bg-saf-500 text-white p-4 shadow-sm sticky top-0 z-10 safe-top">
                <div className="flex items-center gap-3">
                    <Link href="/" className="p-2 -ml-2 hover:bg-saf-600 rounded-full transition-colors active:scale-95">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-lg font-bold">Gerenciar Categorias</h1>
                </div>
            </div>

            <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-6 mt-2">

                {/* Add Category Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-saf-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-saf-900 font-bold mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-saf-500" />
                        Nova Categoria
                    </h2>
                    <div className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            placeholder="Ex: Devocional"
                            className="flex-1 min-w-0 px-4 py-3 border-2 border-saf-100 rounded-xl focus:border-saf-500 focus:ring-4 focus:ring-saf-500/20 outline-none transition-all placeholder-saf-300 min-h-[44px] text-saf-900"
                        />
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={addCategoryMutation.isPending || !newCategoryName.trim()}
                            className="w-11 h-11 bg-saf-600 hover:bg-saf-700 active:bg-saf-800 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-saf-500 focus:ring-offset-2 shrink-0"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Existing Categories */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-saf-100 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                    <h2 className="text-saf-900 font-bold mb-4 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-saf-500" />
                        Categorias Atuais ({categories?.length || 0})
                    </h2>

                    {(!categories || categories.length === 0) ? (
                        <p className="text-saf-400 text-sm text-center py-6">Nenhuma categoria cadastrada.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {categories.map(cat => (
                                <div
                                    key={cat.id}
                                    className="flex items-center justify-between bg-saf-50/80 rounded-xl px-4 py-3 border border-saf-100 group hover:border-saf-200 transition-colors"
                                >
                                    <span className="text-saf-800 font-medium">{cat.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })}
                                        className="p-2 text-saf-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                                        title="Remover categoria"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-saf-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-saf-100 animate-in zoom-in-95 duration-200"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="p-6 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-saf-900 mb-2">Remover categoria?</h3>
                            <p className="text-saf-600 text-sm mb-6 leading-relaxed">
                                Você está prestes a remover a categoria <strong>"{deleteTarget.name}"</strong>. Livros que já possuem esta categoria não serão apagados, mas a categoria não aparecerá mais nas opções.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={() => setDeleteTarget(null)}
                                    className="flex-1 bg-saf-100 hover:bg-saf-200 text-saf-700 font-bold py-3.5 px-4 rounded-xl transition-colors min-h-[48px] focus:outline-none focus:ring-2 focus:ring-saf-400 focus:ring-offset-1"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-sm transition-colors min-h-[48px] flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Remover
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
