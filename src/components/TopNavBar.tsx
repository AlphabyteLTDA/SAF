"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, BookMarked, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function TopNavBar() {
    const pathname = usePathname()
    const { user, isLoading } = useAuth()

    // Protect the NavBar component from showing on unauthenticated or login pages
    // Same logic as BottomNavBar
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
        <header className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-white border-b border-saf-100 items-center justify-between px-8 z-50 shadow-sm">
            <Link
                href="/"
                className="flex items-center gap-2 group min-h-[44px]"
            >
                <div className="w-8 h-8 bg-saf-100 rounded-lg flex items-center justify-center text-saf-500 group-hover:bg-saf-200 transition-colors">
                    <BookOpen className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg tracking-tight text-saf-900">SAF<span className="text-saf-500">.</span></span>
            </Link>

            <nav className="flex items-center gap-8 h-full">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/')
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-2 h-full border-b-2 px-1 transition-all duration-200 
                                ${isActive ? 'border-saf-500 text-saf-600 font-bold' : 'border-transparent text-saf-400 hover:text-saf-600'}`
                            }
                        >
                            <item.icon className="w-4 h-4" />
                            <span className="text-sm">{item.name}</span>
                        </Link>
                    )
                })}
            </nav>
        </header>
    )
}
