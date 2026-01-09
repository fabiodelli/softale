'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    loading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
    loading = false
}: ConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
                            {/* Header */}
                            <div className={`p-6 flex items-start gap-4 ${isDestructive ? 'bg-red-50' : 'bg-slate-50'}`}>
                                <div className={`p-3 rounded-xl flex-shrink-0 ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className={`text-lg font-bold ${isDestructive ? 'text-red-900' : 'text-slate-900'}`}>{title}</h3>
                                    <p className={`mt-1 text-sm ${isDestructive ? 'text-red-600/80' : 'text-slate-500'}`}>{message}</p>
                                </div>
                                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="p-4 bg-white border-t border-slate-100 flex gap-3 justify-end">
                                <button
                                    onClick={onClose}
                                    disabled={loading}
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition border border-slate-200"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={loading}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition shadow-lg
                                        ${isDestructive
                                            ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20'
                                            : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}
                                        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    {loading ? 'Processing...' : confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
