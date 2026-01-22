'use client';

import { useRouter } from 'next/navigation';
import LandingPage from '@/components/landing/LandingPage';

export default function VisionPage() {
    const router = useRouter();

    // When user clicks "Start App" or "Start Listening" on the Vision page,
    // we redirect them to the Home (Dashboard).
    const handleEnterApp = () => {
        router.push('/');
    };

    return <LandingPage onEnterApp={handleEnterApp} showNav={false} />;
}
