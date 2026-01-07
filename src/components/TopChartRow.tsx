'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Story } from '@/lib/supabase';
import Carousel from './Carousel';
import StoryCard from './StoryCard';

interface TopChartRowProps {
    stories: Story[];
}

export default function TopChartRow({ stories }: TopChartRowProps) {
    // Take only top 10
    const topStories = stories.slice(0, 10);

    return (
        <section className="py-12 pl-4 md:pl-8 overflow-hidden">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-2xl">🔥</span> Trending Now
            </h3>

            <Carousel>
                {topStories.map((story, index) => {
                    const rank = index + 1;
                    return (
                        <motion.div
                            key={story.id}
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex-shrink-0 w-64 md:w-80" // Slightly larger for rank visibility
                        >
                            <StoryCard story={story} rank={rank} aspectRatio="video" />
                        </motion.div>
                    );
                })}
            </Carousel>
        </section >
    );
}
