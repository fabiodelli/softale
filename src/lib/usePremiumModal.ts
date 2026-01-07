import { create } from 'zustand';

interface PremiumModalStore {
    isOpen: boolean;
    open: () => void;
    close: () => void;
}

export const usePremiumModal = create<PremiumModalStore>((set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
}));
