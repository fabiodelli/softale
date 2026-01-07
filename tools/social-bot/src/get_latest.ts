import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
    const { data, error } = await supabase
        .from('stories')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error(error);
    } else {
        console.log('Most recent story:', data[0]);
    }
}

main();
