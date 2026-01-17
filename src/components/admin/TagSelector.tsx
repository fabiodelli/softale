'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Hash } from 'lucide-react';
import { getTagStats, TagStat } from '@/lib/supabase';

interface TagSelectorProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
}

export function TagSelector({ value = [], onChange, placeholder = 'Add tags...' }: TagSelectorProps) {
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState<TagStat[]>([]);
    const [allTags, setAllTags] = useState<TagStat[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load available tags once
    useEffect(() => {
        getTagStats().then(data => {
            setAllTags(data);
        });
    }, []);

    // Filter suggestions locally
    useEffect(() => {
        if (!input.trim()) {
            setSuggestions([]);
            return;
        }
        const lowerInput = input.toLowerCase();
        const matches = allTags
            .filter(t =>
                t.tag.toLowerCase().includes(lowerInput) &&
                !value.includes(t.tag) // Exclude already selected
            )
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5 matches

        setSuggestions(matches);
        setShowSuggestions(true);
    }, [input, allTags, value]);

    // Click outside to close
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const addTag = (tag: string) => {
        const trimmed = tag.trim();
        if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed]);
        }
        setInput('');
        setShowSuggestions(false);
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(t => t !== tagToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (input.trim()) {
                addTag(input);
            }
        } else if (e.key === 'Backspace' && !input && value.length > 0) {
            removeTag(value[value.length - 1]);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <div className="flex flex-wrap gap-2 p-3 bg-zinc-900 border border-zinc-700 rounded-xl min-h-[3rem] focus-within:ring-2 focus-within:ring-violet-500 transition">
                {value.map(tag => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 animate-in zoom-in-50 duration-200"
                    >
                        <Hash size={10} className="opacity-50" />
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-white transition-colors"
                        >
                            <X size={12} />
                        </button>
                    </span>
                ))}

                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => input && setShowSuggestions(true)}
                    className="bg-transparent border-none outline-none text-white placeholder-zinc-600 flex-1 min-w-[120px]"
                    placeholder={value.length === 0 ? placeholder : ''}
                />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (input.trim().length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <ul className="max-h-48 overflow-y-auto divide-y divide-zinc-800">
                        {suggestions.map(s => (
                            <li
                                key={s.tag}
                                onClick={() => addTag(s.tag)}
                                className="px-4 py-3 hover:bg-zinc-800 cursor-pointer flex justify-between items-center group transition-colors"
                            >
                                <span className="text-zinc-300 group-hover:text-white font-medium flex items-center gap-2">
                                    <Hash size={12} className="text-violet-500" />
                                    {s.tag}
                                </span>
                                <span className="text-xs text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-800">
                                    Used {s.count}x
                                </span>
                            </li>
                        ))}
                        {/* New Tag Option (if input doesn't match exactly) */}
                        {!suggestions.some(s => s.tag.toLowerCase() === input.toLowerCase()) && (
                            <li
                                onClick={() => addTag(input)}
                                className="px-4 py-3 hover:bg-emerald-500/10 cursor-pointer flex items-center gap-2 group border-t border-zinc-800"
                            >
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition">
                                    <Plus size={14} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-emerald-400 font-bold text-sm">Create "{input}"</span>
                                    <span className="text-[10px] text-zinc-500">New tag</span>
                                </div>
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
