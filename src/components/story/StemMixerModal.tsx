'use client';

import React from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Settings2 } from 'lucide-react';
import StemMixer from '@/components/player/StemMixer';

interface StemMixerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function StemMixerModal({ isOpen, onClose }: StemMixerModalProps) {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
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
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
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

                                <StemMixer />

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
