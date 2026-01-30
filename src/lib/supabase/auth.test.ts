import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signUp, signIn, signOut, signInWithGoogle } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';

describe('supabase auth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('signUp', () => {
        it('should call supabase.auth.signUp with correct params', async () => {
            const mockData = { id: 'test-user', email: 'test@example.com' };
            // @ts-ignore
            supabase.auth.signUp.mockResolvedValue({ data: mockData, error: null });

            const result = await signUp('test@example.com', 'password123');

            expect(supabase.auth.signUp).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123'
            });
            expect(result).toEqual(mockData);
        });

        it('should throw error if signUp fails', async () => {
            const mockError = { message: 'Sign up failed' };
            // @ts-ignore
            supabase.auth.signUp.mockResolvedValue({ data: null, error: mockError });

            await expect(signUp('test@example.com', 'password123')).rejects.toEqual(mockError);
        });
    });

    describe('signIn', () => {
        it('should call signInWithPassword', async () => {
            const mockData = { session: { access_token: '123' } };
            // @ts-ignore
            supabase.auth.signInWithPassword.mockResolvedValue({ data: mockData, error: null });

            const result = await signIn('test@example.com', 'password123');

            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123'
            });
            expect(result).toEqual(mockData);
        });
    });

    describe('signOut', () => {
        it('should call signOut', async () => {
            // @ts-ignore
            supabase.auth.signOut.mockResolvedValue({ error: null });

            await signOut();

            expect(supabase.auth.signOut).toHaveBeenCalled();
        });
    });

    describe('oauth', () => {
        it('should call signInWithOAuth for Google', async () => {
            // @ts-ignore
            supabase.auth.signInWithOAuth.mockResolvedValue({ data: { url: 'https://auth.url' }, error: null });

            await signInWithGoogle();

            expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({
                provider: 'google',
                options: expect.objectContaining({
                    queryParams: {
                        prompt: 'select_account',
                        access_type: 'offline'
                    }
                })
            }));
        });
    });
});
