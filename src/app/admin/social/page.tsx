'use client';

import { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import { AdminLayout, AdminButton, AdminBadge } from '@/components/admin/AdminLayout';
import Link from 'next/link';
import { supabase, Story } from '@/lib/supabase';
import { Download, Trash2, Check, Video, Copy, MessageSquare, X } from 'lucide-react';
import { generateCaption } from '@/lib/social-caption';

// Extended Story type with social fields
interface SocialStory extends Story {
    social_reel_url: string | null;
    social_status: 'draft' | 'generated' | 'approved' | 'posted' | null;
}

interface CaptionModalData {
    story: SocialStory;
    captions: ReturnType<typeof generateCaption>;
}

export default function SocialDashboard() {
    const [stories, setStories] = useState<SocialStory[]>([]);
    const [loading, setLoading] = useState(true);
    const [captionModal, setCaptionModal] = useState<CaptionModalData | null>(null);
    const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

    useEffect(() => {
        loadStories();
    }, []);

    async function loadStories() {
        if (!supabase) return;
        setLoading(true);
        // Fetch stories that have a reel generated
        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .not('social_reel_url', 'is', null) // Only ones with reels
            .order('created_at', { ascending: false });

        if (!error && data) {
            setStories(data as SocialStory[]);
        }
        setLoading(false);
    }

    const handleApprove = async (id: string, title: string) => {
        if (!confirm(`Confirm approval for "${title}"? This marks it as ready for auto-posting (future).`)) return;
        if (!supabase) return;
        const { error } = await supabase
            .from('stories')
            .update({ social_status: 'approved' })
            .eq('id', id);

        if (!error) {
            setStories(prev => prev.map(s => s.id === id ? { ...s, social_status: 'approved' } : s));
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete the social reel for "${title}"? the file will persist in storage but disappear from here.`)) return;
        if (!supabase) return;

        // Remove social fields from DB record
        const { error } = await supabase
            .from('stories')
            .update({
                social_status: null,
                social_reel_url: null
            })
            .eq('id', id);

        if (!error) {
            // Remove from local list
            setStories(prev => prev.filter(s => s.id !== id));
        }
    };

    return (
        <AdminGuard>
            <AdminLayout
                title="Social Media Studio"
                subtitle="Manage and export generated social media reels"
                backLink={{ href: '/admin', label: 'Dashboard' }}
                actions={
                    <div className="flex items-center gap-3">
                        <Link href="/admin/social/mixer">
                            <AdminButton variant="primary" className="flex items-center gap-2">
                                <Video size={14} />
                                Manual Mixer
                            </AdminButton>
                        </Link>
                        <div className="text-sm font-medium px-3 py-1 bg-white/5 rounded-full border border-white/5 text-gray-300 flex items-center gap-2">
                            <Video size={14} className="text-indigo-400" />
                            {stories.length} Reels Ready
                        </div>
                    </div>
                }
            >
                {loading ? (
                    <div className="text-center py-20 animate-pulse text-gray-500">Loading Reels...</div>
                ) : stories.length === 0 ? (
                    <div className="text-center py-32 border-2 border-dashed border-white/5 rounded-2xl bg-zinc-900/50">
                        <div className="text-4xl mb-4">🎬</div>
                        <p className="text-xl text-gray-400 font-medium">No generated reels found.</p>
                        <p className="text-sm text-gray-500 mt-2">Generate a reel from the Story Manager.</p>
                        <Link href="/admin/stories" className="inline-block mt-6">
                            <AdminButton variant="primary">Go to Stories</AdminButton>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {stories.map(story => (
                            <div key={story.id} className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow group flex flex-col">
                                {/* Video Player */}
                                <div className="aspect-[9/16] bg-black relative">
                                    <video
                                        src={story.social_reel_url || ''}
                                        controls
                                        className="w-full h-full object-cover"
                                        poster={story.cover_portrait_url || undefined}
                                        preload="metadata"
                                    />
                                    <div className="absolute top-3 right-3">
                                        <AdminBadge variant={
                                            story.social_status === 'approved' ? 'success' :
                                                story.social_status === 'posted' ? 'info' :
                                                    'warning'
                                        }>
                                            {story.social_status || 'Draft'}
                                        </AdminBadge>
                                    </div>
                                </div>

                                {/* Info & Actions */}
                                <div className="p-5 border-t border-white/5 flex flex-col flex-1">
                                    <h3 className="font-bold text-lg truncate mb-1 text-white">{story.title}</h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-[10px] uppercase font-bold text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">{story.category}</span>
                                    </div>

                                    <div className="mt-auto flex items-center gap-2 pt-4">
                                        {story.social_status !== 'approved' && story.social_status !== 'posted' ? (
                                            <AdminButton
                                                onClick={() => handleApprove(story.id, story.title)}
                                                className="flex-1"
                                                size="sm"
                                            >
                                                Approve
                                            </AdminButton>
                                        ) : (
                                            <div className="flex-1 flex justify-center">
                                                <AdminBadge variant="success">
                                                    <span className="flex items-center gap-1"><Check size={12} /> Approved</span>
                                                </AdminBadge>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => {
                                                const captions = generateCaption({
                                                    id: story.id,
                                                    title: story.title,
                                                    description: story.description || '',
                                                    category: story.category,
                                                    duration: story.duration
                                                });
                                                setCaptionModal({ story, captions });
                                            }}
                                            className="p-2 bg-zinc-800 hover:bg-violet-500/10 hover:border-violet-500/20 text-zinc-400 hover:text-violet-400 rounded-lg border border-zinc-700 transition flex items-center justify-center w-10 h-10"
                                            title="Generate Caption"
                                        >
                                            <MessageSquare size={16} />
                                        </button>

                                        <a
                                            href={story.social_reel_url || '#'}
                                            download
                                            className="p-2 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded-lg border border-zinc-700 transition flex items-center justify-center text-zinc-400 w-10 h-10"
                                            title="Download MP4"
                                        >
                                            <Download size={16} />
                                        </a>

                                        <button
                                            onClick={() => handleDelete(story.id, story.title)}
                                            className="p-2 bg-zinc-800 hover:bg-red-500/10 hover:border-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg border border-zinc-700 transition flex items-center justify-center w-10 h-10"
                                            title="Delete Reel"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Caption Modal */}
                {captionModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                                <h3 className="text-lg font-bold text-white">📝 Captions for "{captionModal.story.title}"</h3>
                                <button
                                    onClick={() => { setCaptionModal(null); setCopiedPlatform(null); }}
                                    className="p-2 hover:bg-zinc-800 rounded-lg transition"
                                >
                                    <X size={20} className="text-zinc-400" />
                                </button>
                            </div>
                            <div className="p-5 space-y-6 overflow-y-auto max-h-[70vh]">
                                {[
                                    { key: 'instagram', label: 'Instagram Reels', emoji: '📸', content: captionModal.captions.instagram },
                                    { key: 'tiktok', label: 'TikTok', emoji: '🎵', content: captionModal.captions.tiktok },
                                    { key: 'youtube', label: 'YouTube Shorts', emoji: '📺', content: captionModal.captions.youtube }
                                ].map(platform => (
                                    <div key={platform.key} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-semibold text-zinc-200">{platform.emoji} {platform.label}</span>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(platform.content);
                                                    setCopiedPlatform(platform.key);
                                                    setTimeout(() => setCopiedPlatform(null), 2000);
                                                }}
                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${copiedPlatform === platform.key
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30'
                                                    }`}
                                            >
                                                {copiedPlatform === platform.key ? (
                                                    <><Check size={14} /> Copied!</>
                                                ) : (
                                                    <><Copy size={14} /> Copy</>
                                                )}
                                            </button>
                                        </div>
                                        <pre className="text-sm text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">{platform.content}</pre>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </AdminLayout>
        </AdminGuard>
    );
}
