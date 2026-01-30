import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { getStories, getStoryById, getStoryBySlug } from '@/lib/supabase/stories';
import { supabase } from '@/lib/supabase/client';

describe('supabase stories', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getStories', () => {
        it('should fetch published stories by default', async () => {
            const mockData = [{ id: '1', title: 'Story 1' }];
            // Setup mock chain
            // supabase.from('stories').select('*').order(...)...
            // We need to match the chain in implementation:
            // .from().select().order() -> then logic appends .in() or .eq()

            // Mock implementation details:
            const selectMock = vi.fn().mockReturnThis();
            const orderMock = vi.fn().mockReturnThis();
            const inMock = vi.fn().mockReturnThis();
            const eqMock = vi.fn().mockReturnThis();
            const thenMock = vi.fn().mockResolvedValue({ data: mockData, error: null });

            // Using a more flexible mock approach for the chain
            const queryMock = {
                select: selectMock,
                order: orderMock,
                in: inMock,
                eq: eqMock,
                then: (resolve: any) => resolve({ data: mockData, error: null }),
            };

            (supabase!.from as Mock).mockReturnValue(queryMock);

            const result = await getStories(undefined, false);

            expect(supabase!.from).toHaveBeenCalledWith('stories');
            expect(selectMock).toHaveBeenCalledWith('*');
            expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
            expect(eqMock).toHaveBeenCalledWith('is_published', true);
            expect(result).toEqual(mockData);
        });

        it('should filter by category if provided', async () => {
            const queryMock = {
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                then: (resolve: any) => resolve({ data: [], error: null }),
            };
            (supabase!.from as Mock).mockReturnValue(queryMock);

            await getStories(['fantasy'], false);

            expect(queryMock.in).toHaveBeenCalledWith('category', ['fantasy']);
        });

        it('should NOT filter by category if "all" is included', async () => {
            const queryMock = {
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                then: (resolve: any) => resolve({ data: [], error: null }),
            };
            (supabase!.from as Mock).mockReturnValue(queryMock);

            await getStories(['all', 'fantasy'], false);

            expect(queryMock.in).not.toHaveBeenCalled();
        });
    });

    describe('getStoryById', () => {
        it('should fetch single story by id', async () => {
            const mockStory = { id: '123', title: 'Test Story' };
            const singleMock = vi.fn().mockResolvedValue({ data: mockStory, error: null });
            const eqMock = vi.fn().mockReturnValue({ single: singleMock });
            const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

            (supabase!.from as Mock).mockReturnValue({ select: selectMock });

            const result = await getStoryById('123');

            expect(supabase!.from).toHaveBeenCalledWith('stories');
            expect(eqMock).toHaveBeenCalledWith('id', '123');
            expect(result).toEqual(mockStory);
        });
    });
});
