const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), 'tools', 'audio-factory', '.env');
console.log(`🔍 Checking Factory Keys in: ${envPath}`);

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');

    const keysToCheck = [
        'ANTHROPIC_API_KEY',
        'OPENAI_API_KEY',
        'STABILITY_API_KEY',
        'ELEVENLABS_API_KEY',
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY'
    ];

    keysToCheck.forEach(key => {
        const exists = content.includes(key);
        // Naive check: does the line have a value?
        const match = content.match(new RegExp(`${key}=(.+)`));
        const hasValue = match && match[1].trim().length > 5; // Valid length check

        console.log(`${key}: ${hasValue ? "✅ READY" : "❌ MISSING"}`);
    });

} else {
    console.error("❌ .env file not found!");
}
