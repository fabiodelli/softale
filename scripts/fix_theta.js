const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load env explicitly
const envPath = path.join(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const lines = envConfig.split(/\r?\n/);
lines.forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
        const idx = line.indexOf('=');
        if (idx !== -1) {
            const key = line.substring(0, idx).trim();
            const value = line.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
            process.env[key] = value;
        }
    }
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixVelvet() {
    console.log("🛠️ Fixing 'The Velvet Descent' (Deep Theta) Category...");

    const { data: story } = await supabase
        .from('stories')
        .select('*')
        .eq('title', 'The Velvet Descent')
        .single();

    if (story) {
        console.log(`✅ Found: "${story.title}" (Current: ${story.category})`);

        const { error } = await supabase
            .from('stories')
            .update({ category: 'music_instrumental' })
            .eq('id', story.id);

        if (!error) console.log("✅ Category updated to 'music_instrumental'. Loop ENABLED!");
        else console.error("❌ Update failed", error);
    } else {
        console.log("❌ Not found 'The Velvet Descent'");
    }
}

fixVelvet();
