'use client';

import dynamic from 'next/dynamic';

const UpdatePasswordForm = dynamic(() => import('@/components/auth/UpdatePasswordForm'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
    ),
});

export default function UpdatePassword() {
    return <UpdatePasswordForm />;
}
