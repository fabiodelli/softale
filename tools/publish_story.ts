import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
    const id = process.argv[2];
    if (!id) throw new Error('Provide ID');

    console.log(`Publishing ${id}...`);
    const { error } = await supabase
        .from('stories')
        .update({ is_published: true })
        .eq('id', id);

    if (error) console.error(error);
    else console.log('✅ Published!');
}

main();
