const fs = require('fs');
const path = require('path');

console.log("🔍 DIAGNOSTICA AMBIENTE");
console.log("--------------------------------------------------");

// 1. Verify CWD
const cwd = process.cwd();
console.log(`📂 CWD: ${cwd}`);

// 2. List all files in root (looking for .env variants)
try {
    const files = fs.readdirSync(cwd);
    const envFiles = files.filter(f => f.startsWith('.env'));
    console.log(`📄 File .env trovati:`, envFiles);
} catch (e) {
    console.error("❌ Impossibile leggere la directory:", e.message);
}

// 3. Inspect .env.local specifically
const envPath = path.join(cwd, '.env.local');
if (fs.existsSync(envPath)) {
    console.log(`✅ .env.local ESISTE.`);

    try {
        const stats = fs.statSync(envPath);
        console.log(`📊 Dimensione: ${stats.size} bytes`);

        const content = fs.readFileSync(envPath, 'utf8');
        console.log(`📝 Contenuto RAW (Primi 100 char):`);
        console.log("--- INIZIO ---");
        console.log(content.substring(0, 100));
        console.log("--- FINE ---");

        // Search specifically for the key pattern
        const hasKey = content.includes('STABLE_AUDIO_API_KEY');
        console.log(`🔑 Chiave 'STABLE_AUDIO_API_KEY' trovata nel testo? ${hasKey ? "SI ✅" : "NO ❌"}`);

        if (hasKey) {
            // Try to extract it naively
            const match = content.match(/STABLE_AUDIO_API_KEY=(.*)/);
            if (match) {
                const captured = match[1].trim();
                console.log(`👀 Valore letto (oscurato): ${captured.substring(0, 5)}...${captured.substring(captured.length - 4)}`);
                console.log(`📏 Lunghezza valore: ${captured.length}`);
            }
        }

    } catch (readErr) {
        console.error("❌ Errore lettura file:", readErr.message);
    }
} else {
    console.error(`❌ .env.local NON TROVATO in ${envPath}`);
    console.log("Suggerimento: Controlla se il file si chiama .env.local.txt (Windows nasconde le estensioni!)");
}
console.log("--------------------------------------------------");
