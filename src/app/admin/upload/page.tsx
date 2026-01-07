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

                <main className="max-w-4xl mx-auto px-4 py-8">
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

                    {/* Upload Section */}
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 mb-8">
                        <h2 className="text-lg font-semibold mb-4">Upload Ambient Sounds</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            Upload MP3 files to the <code className="bg-slate-800 px-1 rounded">ambient/</code> folder.
                            These files can be used as background sounds in stories.
                        </p>

                        <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-indigo-500/50 transition">
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
                                className="cursor-pointer"
                            >
                                <div className="text-4xl mb-3">🔊</div>
                                <div className="text-white font-medium mb-1">Click to select MP3 files</div>
                                <div className="text-gray-500 text-sm">or drag and drop</div>
                            </label>
                        </div>

                        {files.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-sm font-medium text-gray-400 mb-3">Selected Files ({files.length})</h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {files.map((file, i) => (
                                        <div key={i} className="flex items-center justify-between bg-slate-800/50 px-3 py-2 rounded-lg text-sm">
                                            <span className="text-white">{file.name}</span>
                                            <span className="text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl font-medium transition"
                                >
                                    {uploading ? 'Uploading...' : `Upload ${files.length} File(s)`}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Existing Files */}
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold mb-4">Existing Ambient Files ({existingAmbients.length})</h2>

                        {existingAmbients.length === 0 ? (
                            <p className="text-gray-500 text-center py-6">No ambient files uploaded yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {existingAmbients.map((name) => (
                                    <div key={name} className="flex items-center justify-between bg-slate-800/50 px-4 py-3 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">🎵</span>
                                            <span className="text-white font-medium">{name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={supabase?.storage.from('audio').getPublicUrl(`ambient/${name}`).data.publicUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm transition"
                                            >
                                                Preview
                                            </a>
                                            <button
                                                onClick={() => handleDelete(name)}
                                                className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded transition"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </AdminGuard>
    );
}
