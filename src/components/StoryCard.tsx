import { Story } from '@/lib/supabase';
import StoryCardHorizontal from './story/StoryCardHorizontal';
import StoryCardDefault from './story/StoryCardDefault';

interface StoryCardProps {
    story: Story;
    onClick?: () => void;
    className?: string;
    aspectRatio?: 'video' | 'portrait' | 'square' | 'horizontal';
    progress?: number; // 0 to 100 for progress bar
    rank?: number; // 1, 2, 3... for Top Charts
}

export default function StoryCard(props: StoryCardProps) {
    if (props.aspectRatio === 'horizontal') {
        return <StoryCardHorizontal {...props} />;
    }

    return <StoryCardDefault {...props} aspectRatio={props.aspectRatio as 'video' | 'portrait' | 'square' || 'square'} />;
}
