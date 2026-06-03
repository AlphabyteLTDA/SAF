'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
    const router = useRouter()

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN') {
                subscription.unsubscribe()
                router.replace('/')
            }
        })

        const timeout = setTimeout(() => router.replace('/login'), 10000)

        return () => {
            subscription.unsubscribe()
            clearTimeout(timeout)
        }
    }, [router])

    return (
        <div className="min-h-screen bg-saf-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-saf-200 border-t-saf-500 rounded-full animate-spin" />
                <p className="text-saf-500 text-sm font-medium">Autenticando...</p>
            </div>
        </div>
    )
}
