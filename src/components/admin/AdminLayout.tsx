'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

interface AdminLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
    backLink?: { href: string; label: string };
    actions?: ReactNode;
}

export function AdminLayout({
    children,
    title,
    subtitle,
    backLink,
    actions
}: AdminLayoutProps) {
    return (
        <div className="min-h-screen bg-zinc-950">
            {/* Header */}
            <header className="sticky top-0 z-10 backdrop-blur-md bg-zinc-950/80 border-b border-zinc-800">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {backLink && (
                                <Link
                                    href={backLink.href}
                                    className="flex items-center gap-2 text-zinc-400 hover:text-zinc-50 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    <span className="text-sm">{backLink.label}</span>
                                </Link>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-zinc-50">{title}</h1>
                                {subtitle && <p className="text-sm text-zinc-400 mt-0.5">{subtitle}</p>}
                            </div>
                        </div>
                        {actions && <div className="flex items-center gap-3">{actions}</div>}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    );
}

// Reusable button styles
export function AdminButton({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}: {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    const variants = {
        primary: 'bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white shadow-lg shadow-violet-500/25',
        secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-50 border border-zinc-700',
        danger: 'bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20',
        ghost: 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-50'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    return (
        <button
            className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
            {...props}
        >
            {children}
        </button>
    );
}

// Status badge component
export function AdminBadge({
    children,
    variant = 'default'
}: {
    children: ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}) {
    const variants = {
        default: 'bg-zinc-800 text-zinc-300',
        success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        error: 'bg-red-500/10 text-red-400 border-red-500/20',
        info: 'bg-violet-500/10 text-violet-400 border-violet-500/20'
    };

    return (
        <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
      ${variants[variant]}
    `}>
            {children}
        </span>
    );
}
