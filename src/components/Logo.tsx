'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'white';
    className?: string;
    showText?: boolean;
}

const sizeConfig = {
    sm: { icon: 'h-8', text: 'text-lg' },
    md: { icon: 'h-10', text: 'text-xl' },
    lg: { icon: 'h-12', text: 'text-2xl' },
};

export default function Logo({
    size = 'md',
    variant = 'default',
    className = '',
    showText = true
}: LogoProps) {
    const { icon, text } = sizeConfig[size];

    return (
        <Link href="/" className={`inline-flex items-center gap-2 group ${className}`}>
            <Image
                src="/assets/softale-icon.png"
                alt="Softale"
                width={200}
                height={200}
                className={`${icon} w-auto drop-shadow-lg group-hover:scale-105 transition-transform`}
            />
            {showText && (
                <span
                    className={`${text} font-semibold tracking-tight bg-clip-text text-transparent ${variant === 'white'
                            ? 'bg-white'
                            : 'bg-gradient-to-r from-indigo-600 to-violet-600'
                        }`}
                    style={{ fontFamily: 'Outfit, var(--font-inter), system-ui, sans-serif' }}
                >
                    Softale
                </span>
            )}
        </Link>
    );
}
