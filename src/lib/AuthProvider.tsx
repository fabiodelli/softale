'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, getProfile, type UserProfile } from './supabase';

// ========================================
// Auth Context
// ========================================

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    isAuthenticated: boolean;
    isConfigured: boolean;
    isPremium: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    isAuthenticated: false,
    isConfigured: false,
    isPremium: false,
    signOut: async () => { },
    refreshProfile: async () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

// ========================================
// Auth Provider
// ========================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user profile
    const fetchProfile = async (userId: string, accessToken?: string) => {
        const profileData = await getProfile(userId, accessToken);
        setProfile(profileData);
    };

    // Refresh profile
    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    // Sign out
    const handleSignOut = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
        setUser(null);
        setProfile(null);
        setSession(null);
        setLoading(false); // Ensure loading is false after signout
    };

    // Listen to auth state changes
    useEffect(() => {
        if (!supabase || !isSupabaseConfigured) {
            setLoading(false);
            return;
        }

        // Get initial session
        supabase.auth.getSession()
            .then(({ data: { session } }) => {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    fetchProfile(session.user.id, session.access_token);
                }
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await fetchProfile(session.user.id, session.access_token);
                } else {
                    setProfile(null);
                }

                setLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const value = {
        user,
        profile,
        session,
        loading,
        isAuthenticated: !!user,
        isConfigured: isSupabaseConfigured,
        isPremium: profile?.is_premium ?? false,
        signOut: handleSignOut,
        refreshProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
