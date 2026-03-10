"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { BookList } from "@/components/BookList"
import { useAuth } from "@/hooks/useAuth"

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Enquanto verifica a sessão (pode ser super rápido)
  if (isLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen pb-20">
        <div className="w-8 h-8 border-4 border-saf-200 border-t-saf-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen pb-20 pt-6 px-4 bg-saf-50/50 flex flex-col items-center">
      <div className="w-full max-w-md mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-1 px-1">
          <h1 className="text-2xl font-bold text-saf-900">Catálogo SAF</h1>
          <p className="text-saf-500 text-sm">Descubra e solicite livros para sua edificação.</p>
        </div>

        <BookList />
      </div>
    </main>
  );
}
