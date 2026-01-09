'use client';

import { useState, useRef, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function UploadPage() {
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [existingAmbients, setExistingAmbients] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchExistingAmbients = async () => {
        if (!supabase) return;
        const { data, error } = await supabase.storage
            .from('audio')
            .list('ambient', { limit: 100, sortBy: { column: 'name', order: 'asc' } });

        if (!error && data) {
            setExistingAmbients(data.map(f => f.name));
        }
    };

    // Fetch existing ambient files on mount
    useEffect(() => {
        fetchExistingAmbients();
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        // Filter to only MP3 files
        const mp3Files = selectedFiles.filter(f => f.type === 'audio/mpeg' || f.name.endsWith('.mp3'));
        setFiles(mp3Files);
        if (mp3Files.length !== selectedFiles.length) {
            setStatus('⚠️ Some files were skipped (only MP3 allowed)');
        } else {
            setStatus('');
        }
    };

    const handleUpload = async () => {
        if (!supabase || files.length === 0) return;

        setUploading(true);
        setStatus('Uploading...');

        let successCount = 0;
        let errorCount = 0;

        for (const file of files) {
            try {
                // Upload to audio/ambient folder
                const fileName = `ambient/${file.name}`;
                const { error } = await supabase.storage
                    .from('audio')
                    .upload(fileName, file, {
                        contentType: 'audio/mpeg',
                        upsert: true
                    });

                if (error) throw error;
                successCount++;
            } catch (err: any) {
                console.error(`Failed to upload ${file.name}:`, err);
                errorCount++;
            }
        }

        setUploading(false);
        setFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';

        if (errorCount === 0) {
            setStatus(`✅ Uploaded ${successCount} file(s) successfully!`);
        } else {
            setStatus(`⚠️ Uploaded ${successCount}, failed ${errorCount}`);
        }

        // Refresh list
        fetchExistingAmbients();
    };

    const handleDelete = async (fileName: string) => {
        if (!confirm(`Delete "${fileName}"?`)) return;
        if (!supabase) return;

        try {
            const { error } = await supabase.storage
                .from('audio')
                .remove([`ambient/${fileName}`]);

            if (error) throw error;
            setStatus(`🗑️ Deleted "${fileName}"`);
            fetchExistingAmbients();
        } catch (err: any) {
            setStatus(`Error: ${err.message}`);
        }
    };

    return (
        <AdminGuard>
            <div className="min-h-screen bg-slate-950 pb-20 text-white">
                <header className="bg-slate-900 border-b border-white/5 sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link href="/admin" className="text-gray-400 hover:text-white">← Back</Link>
                            <h1 className="text-xl font-bold ml-4">Ambient Sound Upload</h1>
                        </div>
                    </div>
                </header>

                <main className="max-w-[1600px] mx-auto px-6 py-8">
                    {status && (
                        <div className={`mb-6 p-4 rounded-lg border flex justify-between items-center ${status.includes('✅') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            status.includes('⚠️') ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                status.includes('Error') ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                    'bg-slate-900 border-white/10 text-gray-400'
                            }`}>
                            <span>{status}</span>
                            <button onClick={() => setStatus('')} className="text-gray-500 hover:text-white">✕</button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* LEFT: Upload Section */}
                        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl sticky top-24">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="text-emerald-400">📤</span> Upload Ambient Sounds
                            </h2>
                            <p className="text-gray-400 text-sm mb-6">
                                Upload MP3 files to the <code className="bg-slate-800 px-1 rounded text-emerald-400">ambient/</code> folder.
                                These assets become available immediately for new stories.
                            </p>

                            <div className="border-2 border-dashed border-white/10 rounded-xl p-12 text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition group cursor-pointer">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".mp3,audio/mpeg"
                                    multiple
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="ambient-upload"
                                />
                                <label
                                    htmlFor="ambient-upload"
                                    className="cursor-pointer w-full h-full block"
                                >
                                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🔊</div>
                                    <div className="text-white font-bold text-lg mb-1 group-hover:text-emerald-400">Click to Select Files</div>
                                    <div className="text-gray-500 text-sm">Supported: MP3</div>
                                </label>
                            </div>

                            {files.length > 0 && (
                                <div className="mt-6 animate-in fade-in slide-in-from-top-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Queue ({files.length})</h3>
                                        <button onClick={() => setFiles([])} className="text-xs text-red-400 hover:text-red-300">Clear</button>
                                    </div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto bg-slate-950 p-2 rounded-lg border border-white/5">
                                        {files.map((file, i) => (
                                            <div key={i} className="flex items-center justify-between bg-slate-800/30 px-3 py-2 rounded text-sm">
                                                <div className="truncate max-w-[70%] text-white">{file.name}</div>
                                                <div className="text-gray-500 text-xs text-mono">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        className="mt-6 w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:grayscale rounded-xl font-bold text-white shadow-lg shadow-emerald-900/20 transition transform hover:scale-[1.02]"
                                    >
                                        {uploading ? 'Processing...' : `🚀 Upload ${files.length} File(s)`}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Existing Files */}
                        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold">Library ({existingAmbients.length})</h2>
                                <button onClick={fetchExistingAmbients} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                    <span>↻</span> Refresh
                                </button>
                            </div>

                            {existingAmbients.length === 0 ? (
                                <div className="p-12 text-center text-gray-600 border border-dashed border-white/5 rounded-xl">
                                    Empty Library
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                                    {existingAmbients.map((name) => (
                                        <div key={name} className="flex items-center justify-between bg-slate-800/30 hover:bg-slate-800/80 p-4 rounded-xl transition group border border-transparent hover:border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg shadow-inner">🎵</div>
                                                <span className="text-gray-200 font-medium">{name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition">
                                                <a
                                                    href={supabase?.storage.from('audio').getPublicUrl(`ambient/${name}`).data.publicUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1.5 bg-slate-700 hover:bg-white hover:text-black rounded-lg text-xs font-bold transition"
                                                    title="Play"
                                                >
                                                    ▶
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(name)}
                                                    className="p-2 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition"
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </AdminGuard>
    );
}
