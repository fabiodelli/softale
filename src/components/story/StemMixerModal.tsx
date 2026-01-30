'use client';

import React from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Settings2 } from 'lucide-react';
import StemMixer from '@/components/player/StemMixer';

interface StemMixerModalProps {
    isOpen: boolean;
    onClose: () => void;
    isPremium: boolean;
}

export default function StemMixerModal({ isOpen, onClose, isPremium }: StemMixerModalProps) {
    const isLocked = !isPremium; // Lock if NOT premium

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[50000]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl p-6 text-left align-middle shadow-2xl transition-all border border-white/40">
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-bold leading-6 text-slate-900 flex items-center gap-2"
                                    >
                                        <Settings2 className="w-5 h-5 text-indigo-600" />
                                        Audio Mixer
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="rounded-full p-1 hover:bg-slate-100 transition"
                                    >
                                        <X className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>

                                <div className="relative">
                                    {isLocked && (
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-xl text-center p-4">
                                            <div className="bg-amber-100 p-3 rounded-full mb-3">
                                                <Settings2 className="w-6 h-6 text-amber-600" />
                                            </div>
                                            <h4 className="text-slate-900 font-bold mb-1">Premium Feature</h4>
                                            <p className="text-slate-600 text-sm mb-4">Unlock audio mixing to customize voice, music, and ambience levels.</p>
                                            <button
                                                onClick={() => window.location.href = '/upgrade'}
                                                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition"
                                            >
                                                Unlock Premium
                                            </button>
                                        </div>
                                    )}
                                    <div className={isLocked ? 'opacity-50 pointer-events-none filter blur-sm' : ''}>
                                        <StemMixer />
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
