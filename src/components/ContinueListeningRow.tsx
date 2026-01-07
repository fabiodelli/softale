'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getListeningProgress, ListeningProgress } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';
import Carousel from './Carousel';
import StoryCard from './StoryCard';

export default function ContinueListeningRow() {
    const { user } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState<ListeningProgress[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            if (user) {
                const data = await getListeningProgress(user.id);
                // Filter: has story data, not completed, has progress
                const valid = data.filter(p => p.stories && !p.completed && p.progress_seconds > 10);
                setItems(valid);
            }
            setLoading(false);
        }
        load();
    }, [user]);

    if (loading || items.length === 0) return null;

    return (
        <section className="py-8 px-4 md:px-8 w-full">
            <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                <span>🔄</span> Continue Listening
            </h3>
            <Carousel>
                {items.map((item) => {
                    const story = item.stories!;
                    const progressPercent = Math.min(100, (item.progress_seconds / story.duration) * 100);

                    return (
                        <div
                            key={story.id}
                            className="flex-shrink-0 w-64 md:w-72"
                        >
                            <StoryCard
                                story={story}
                                // Explicitly passing onClick breaks the Link internal behavior of StoryCard, but StoryCard handles no-onClick by wrapping in Link.
                                // However, we want to route to /story/ID. StoryCard does that by default if onClick is undef.
                                // Wait, `ContinueListeningRow` doesn't pass special params.
                                // But maybe we want `?continue=true`? Not strictly needed as player state persists.
                                progress={progressPercent}
                                aspectRatio="video"
                            />
                        </div>
                    );
                })}
            </Carousel>
        </section>
    );
}
