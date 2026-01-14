'use client';

import { ReactNode } from 'react';

interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => ReactNode;
    className?: string;
}

interface AdminTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (item: T) => string;
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
    loading?: boolean;
}

export function AdminTable<T extends Record<string, unknown>>({
    columns,
    data,
    keyExtractor,
    onRowClick,
    emptyMessage = 'No data found',
    loading = false
}: AdminTableProps<T>) {
    if (loading) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12">
                <div className="flex items-center justify-center gap-3 text-zinc-400">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12">
                <div className="text-center text-zinc-400">
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>{emptyMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="bg-zinc-900/80 border-b border-zinc-800">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={`px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider ${col.className || ''}`}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                    {data.map((item) => (
                        <tr
                            key={keyExtractor(item)}
                            onClick={() => onRowClick?.(item)}
                            className={`
                bg-zinc-900/30 
                ${onRowClick ? 'cursor-pointer hover:bg-zinc-800/50' : ''}
                transition-colors
              `}
                        >
                            {columns.map((col) => (
                                <td
                                    key={col.key}
                                    className={`px-6 py-4 text-sm text-zinc-300 ${col.className || ''}`}
                                >
                                    {col.render
                                        ? col.render(item)
                                        : String(item[col.key] ?? '-')
                                    }
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
