'use client';

import { ReactNode } from 'react';

interface AdminCardProps {
    children: ReactNode;
    className?: string;
    gradient?: boolean;
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function AdminCard({
    children,
    className = '',
    gradient = false,
    hover = false,
    padding = 'md'
}: AdminCardProps) {
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
    };

    return (
        <div className={`
      relative rounded-xl
      bg-zinc-900/80 backdrop-blur-sm
      border border-zinc-800
      ${hover ? 'transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-lg hover:shadow-violet-500/5' : ''}
      ${gradient ? 'before:absolute before:inset-0 before:rounded-xl before:p-[1px] before:bg-gradient-to-br before:from-violet-500/20 before:to-transparent before:-z-10' : ''}
      ${paddingClasses[padding]}
      ${className}
    `}>
            {children}
        </div>
    );
}

interface AdminCardHeaderProps {
    icon?: ReactNode;
    title: string;
    subtitle?: string;
    action?: ReactNode;
}

export function AdminCardHeader({ icon, title, subtitle, action }: AdminCardHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                        {icon}
                    </div>
                )}
                <div>
                    <h3 className="text-lg font-semibold text-zinc-50">{title}</h3>
                    {subtitle && <p className="text-sm text-zinc-400">{subtitle}</p>}
                </div>
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}
