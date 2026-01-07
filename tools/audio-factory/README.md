# Softale Audio Factory

AI-powered pipeline per generare audio stories di alta qualità.

## Setup

```bash
cd tools/audio-factory
npm install
```

Configura le API keys in `.env`:
```
ANTHROPIC_API_KEY=sk-xxx    # Per script generation (Claude)
ELEVENLABS_API_KEY=xxx      # Per voice synthesis
SUNO_API_KEY=xxx            # Per music generation (optional)
```

## Pipeline

### 1. Genera Script
```bash
npm run script "A peaceful journey through a moonlit forest"
```

### 2. Genera Voice
```bash
npm run voice <story_id>
```

### 3. Genera Music
```bash
npm run music <story_id>
```

### 4. Mix Finale
```bash
npm run mix <story_id>
```

### Pipeline Completa
```bash
npm run full "A calming sleep story about floating on clouds"
```

## Output Structure

```
output/<story_id>/
├── script.json         # Generated script
├── voice.mp3          # Narration audio
├── music.mp3          # Background music
├── ambient.mp3        # Ambient sounds (optional)
└── final.mp3          # Mixed final audio
```

## Cost Estimates

| Component | API | Cost per Story |
|-----------|-----|----------------|
| Script | Claude 3.5 | ~$0.10-0.20 |
| Voice | ElevenLabs | ~$0.30-0.60 |
| Music | Suno | ~$0.10-0.20 |
| **Total** | | **~$0.50-1.00** |
