import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [isSessionLoading, setIsSessionLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        async function initAuth() {
            try {
                const { data } = await supabase.auth.getSession()
                if (mounted) {
                    setUser(data?.session?.user || null)
                    setIsSessionLoading(false)
                }
            } catch (err) {
                if (mounted) setIsSessionLoading(false)
            }
        }

        initAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (mounted) {
                    setUser(session?.user || null)
                    setIsSessionLoading(false)
                }

                if (event === 'SIGNED_IN' && session?.user) {
                    const u = session.user
                    await supabase.from('profiles').upsert({
                        id: u.id,
                        full_name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? u.email?.split('@')[0] ?? 'Usuário',
                        email: u.email ?? '',
                        role: 'leitora',
                    }, { onConflict: 'id', ignoreDuplicates: true })
                }
            }
        )

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    // Assynchronous, cached, non-blocking fetch of the Role from the DB
    const { data: dbRole } = useQuery({
        queryKey: ['userRole', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user!.id)
                .single()
            if (error) throw error
            return data?.role || 'leitora'
        },
        enabled: !!user,
        staleTime: 10 * 60 * 1000, // 10 minutes cache
    })

    return {
        user,
        role: user ? (dbRole || 'leitora') : null,
        isLoading: isSessionLoading
    }
}
