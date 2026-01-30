import React from 'react';
import { notFound } from 'next/navigation';
import { getStoryBySlug } from '@/lib/supabase';
import { Metadata } from 'next';
import ImmersivePlayer from '@/components/story/ImmersivePlayer';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const story = await getStoryBySlug(slug);

    if (!story) {
        return {
            title: 'Story Not Found | Softale',
        };
    }

    return {
        title: `${story.title} | Softale`,
        description: story.description,
        openGraph: {
            images: [story.cover_landscape_url || story.cover_url],
        },
    };
}

export default async function StoryDetailPage({ params }: PageProps) {
    const { slug } = await params;
    const story = await getStoryBySlug(slug);

    if (!story) {
        return notFound();
    }

    // Force full screen override just in case
    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900">
            <ImmersivePlayer story={story} />
        </div>
    );
}
