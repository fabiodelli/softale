'use client';

import { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import { AdminLayout, AdminButton } from '@/components/admin/AdminLayout';
import { supabase, type Story, getStories } from '@/lib/supabase';
import { Upload, Music, Video, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';

export default function SocialMixerPage() {
    // State
    const [stories, setStories] = useState<Story[]>([]);
    const [selectedStoryId, setSelectedStoryId] = useState<string>('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const isProduction = process.env.NODE_ENV === 'production';

    // Fetch Stories
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await getStories(undefined, true);
            setStories(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            setLoading(false);
        };
        load();
    }, []);

    // Dropzone
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { 'video/mp4': ['.mp4'] },
        maxFiles: 1,
        onDrop: (acceptedFiles) => {
            setVideoFile(acceptedFiles[0]);
        }
    });

    const handleMix = async () => {
        if (!selectedStoryId || !videoFile) return;
        if (!supabase) {
            setStatus('❌ Supabase client not initialized');
            return;
        }

        setProcessing(true);
        setStatus('🚀 Uploading & Mixing... This may take a minute.');

        try {
            // 1. Upload Raw Video
            const fileName = `raw/${Date.now()}-${videoFile.name.replace(/[^a-z0-9.]/gi, '_')}`;
            const { error: uploadError } = await supabase.storage
                .from('social')
                .upload(fileName, videoFile, {
                    contentType: 'video/mp4',
                    upsert: true
                });

            if (uploadError) throw new Error(`Upload Failed: ${uploadError.message}`);

            const { data: { publicUrl: videoUrl } } = supabase.storage.from('social').getPublicUrl(fileName);

            // 2. Trigger Mixing API
            const res = await fetch('/api/admin/mix-social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storyId: selectedStoryId,
                    videoUrl: videoUrl
                })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Mixing failed');

            setStatus(`✅ Success! Reel Created: ${result.url}`);
            setVideoFile(null);
            setSelectedStoryId('');
        } catch (error: any) {
            console.error(error);
            setStatus(`❌ Error: ${error.message}`);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AdminGuard>
            <AdminLayout
                title="Social Mixer"
                subtitle="Combine external visuals with story audio"
                backLink={{ href: '/admin/social', label: 'Back to Gallery' }}
            >
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">

                    {/* LEFT: Inputs */}
                    <div className="space-y-8">

                        {/* 1. Select Story */}
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                            <h3 className="text-zinc-100 font-semibold flex items-center gap-2 mb-4">
                                <span className="bg-violet-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                                Select Audio Source
                            </h3>
                            {loading ? (
                                <div className="animate-pulse h-10 bg-zinc-800 rounded-lg"></div>
                            ) : (
                                <select
                                    value={selectedStoryId}
                                    onChange={(e) => setSelectedStoryId(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-zinc-200 focus:ring-2 focus:ring-violet-500"
                                >
                                    <option value="">-- Choose a Story --</option>
                                    {stories.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.title} ({Math.ceil(s.duration / 60)}m)
                                        </option>
                                    ))}
                                </select>
                            )}
                            {selectedStoryId && (
                                <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Audio Track Ready
                                </div>
                            )}
                        </div>

                        {/* 2. Upload Video */}
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                            <h3 className="text-zinc-100 font-semibold flex items-center gap-2 mb-4">
                                <span className="bg-pink-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                Upload External Video
                            </h3>

                            <div {...getRootProps()} className={`
                                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                                ${isDragActive ? 'border-pink-500 bg-pink-500/10' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800'}
                                ${videoFile ? 'bg-green-500/5 border-green-500/50' : ''}
                            `}>
                                <input {...getInputProps()} />
                                {videoFile ? (
                                    <div className="text-green-400">
                                        <Video className="w-8 h-8 mx-auto mb-2" />
                                        <p className="font-semibold">{videoFile.name}</p>
                                        <p className="text-xs text-green-500/60 mt-1">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                ) : (
                                    <div className="text-zinc-500">
                                        <Upload className="w-8 h-8 mx-auto mb-2" />
                                        <p>{isDragActive ? "Drop video here..." : "Drag & Drop MP4 or Click to Browse"}</p>
                                        <p className="text-xs mt-2 text-zinc-600">Supports .mp4 (Veo 3.0 Output)</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT: Action & Status */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex-1 flex flex-col justify-center items-center text-center">

                            <div className="flex items-center gap-4 mb-8 opacity-50">
                                <Video className="w-10 h-10 text-pink-500" />
                                <ArrowRight className="w-6 h-6 text-zinc-600" />
                                <Music className="w-10 h-10 text-violet-500" />
                            </div>

                            <button
                                onClick={handleMix}
                                disabled={!selectedStoryId || !videoFile || processing || isProduction}
                                className={`
                                    w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all
                                    ${!selectedStoryId || !videoFile
                                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-pink-600 to-violet-600 text-white hover:scale-[1.02] shadow-xl shadow-violet-900/20'
                                    }
                                    ${processing ? 'animate-pulse cursor-wait' : ''}
                                `}
                            >
                                {processing ? 'Processing...' : 'Mix & Generate Reel'}
                            </button>

                            {status && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`mt-6 p-4 rounded-lg text-sm w-full ${status.includes('Success') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-zinc-800 text-zinc-300'}`}
                                >
                                    {status}
                                </motion.div>
                            )}

                        </div>

                        {isProduction && (
                            <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-xl text-amber-200 text-xs leading-relaxed">
                                <h4 className="flex items-center gap-2 mb-2 font-bold">
                                    <AlertTriangle className="w-3 h-3" /> Production Mode
                                </h4>
                                <p>
                                    Video mixing requires ffmpeg and cannot run on edge/serverless.
                                    Please run locally (<code className="bg-black/30 px-1 rounded">npm run dev</code>) to use this feature.
                                </p>
                            </div>
                        )}

                        <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl text-blue-200/60 text-xs leading-relaxed">
                            <h4 className="flex items-center gap-2 mb-2 font-semibold text-blue-300">
                                <AlertTriangle className="w-3 h-3" /> How it works
                            </h4>
                            <p>
                                The mixer will take the uploaded video and loop or trim it to match the story's highlight duration (usually 60s).
                                The story's audio file will be overlayed. The result is saved to your gallery.
                            </p>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        </AdminGuard>
    );
}
