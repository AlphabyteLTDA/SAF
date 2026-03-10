"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, BookMarked, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function BottomNavBar() {
    const pathname = usePathname()
    const { user, isLoading } = useAuth()

    // Protect the NavBar component from showing on unauthenticated or login pages
    if (isLoading || !user || pathname === '/login' || pathname === '/register') {
        return null
    }

    const navItems = [
        {
            name: 'Catálogo',
            href: '/',
            icon: BookOpen,
        },
        {
            name: 'Meus Livros',
            href: '/loans',
            icon: BookMarked,
        },
        {
            name: 'Perfil',
            href: '/profile',
            icon: User,
        },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-saf-200 flex justify-around items-center px-2 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] md:hidden">
            {navItems.map((item) => {
                const isActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/')
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        aria-label={item.name}
                        className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] flex-1 
              ${isActive ? 'text-saf-500' : 'text-saf-400 hover:text-saf-500'}
              transition-colors duration-200`}
                    >
                        <item.icon className={`h-6 w-6 mb-1 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                        <span className={`text-[10px] sm:text-xs font-medium ${isActive ? 'font-bold' : ''}`}>
                            {item.name}
                        </span>
                    </Link>
                )
            })}
        </nav>
    )
}
