'use client';

import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [checkComplete, setCheckComplete] = useState(false);

    useEffect(() => {
        // Wait for auth loading to complete
        if (loading) return;

        // Debug log


        // No user = redirect to login
        if (!user) {

            router.push('/login?redirect=/admin');
            return;
        }

        // User exists but profile not yet loaded - wait more
        if (!profile) {

            // Set a timeout to check again
            const timer = setTimeout(() => {
                setCheckComplete(true);
            }, 1500);
            return () => clearTimeout(timer);
        }

        // Profile loaded - check role

        if (profile.role === 'admin') {
            setAuthorized(true);
            setCheckComplete(true);
        } else {

            router.push('/');
        }
    }, [user, profile, loading, router]);

    // Second check after timeout if profile never loaded
    useEffect(() => {
        if (checkComplete && !authorized && user && !profile) {

            router.push('/');
        }
    }, [checkComplete, authorized, user, profile, router]);

    if (loading || (!authorized && !checkComplete)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
                <p className="text-gray-500 text-sm">Verifying admin access...</p>
            </div>
        );
    }

    if (!authorized) {
        return null;
    }

    return <>{children}</>;
}
