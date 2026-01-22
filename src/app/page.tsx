import { getStories, getCollections } from '@/lib/supabase';
import { Suspense } from 'react';
import HomeClient from '@/components/home/HomeClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Softale',
  description: 'Drift off to sleep with calming audio stories, meditations, and ambient sounds.',
};

// Force dynamic rendering if we want fresh data on every request, 
// or let it catch if we want static generation with revalidation.
// For a "feed" type app, revalidation (e.g., every hour) is usually best.
// export const revalidate = 3600; 

export default async function HomePage() {
  // Fetch data on the server
  // Promise.all ensures we fetch in parallel
  const [stories, collections] = await Promise.all([
    getStories(),
    getCollections()
  ]);

  return (
    <main>
      <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
        <HomeClient
          initialStories={stories}
          initialCollections={collections}
        />
      </Suspense>
    </main>
  );
}
