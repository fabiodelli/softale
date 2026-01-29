# Qwen TTS API Microservice

Local FastAPI server that keeps the Qwen3-TTS model loaded in memory for fast text-to-speech generation.

## Setup

1. **Install Dependencies**:
   ```bash
   cd tools/qwen-api
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   pip install -r requirements.txt
   ```

2. **Install Qwen TTS Package** (from the experiment repo):
   ```bash
   pip install -e ../qwen-tts-experiment/qwen3_tts_repo
   ```

3. **Start the Server**:
   ```bash
   uvicorn server:app --host 0.0.0.0 --port 8000
   ```

## API Endpoints

### `GET /health`
Check if the model is loaded.

### `POST /generate`
Generate audio from text.

**Request Body**:
```json
{
    "text": "Testo da sintetizzare",
    "instruction": "Voce maschile italiana, calma e professionale",
    "language": "Italian",
    "output_format": "base64"
}
```

**Response**:
```json
{
    "success": true,
    "audio_base64": "UklGRiQA...",
    "sample_rate": 24000
}
```

### `POST /generate/file`
Same as above but returns raw WAV file for download.

## Usage from Node.js (Audio Factory)

```typescript
const response = await fetch('http://localhost:8000/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        text: "Your narration text here",
        instruction: "Professional Italian voice, calm",
        language: "Italian"
    })
});

const { audio_base64 } = await response.json();
const audioBuffer = Buffer.from(audio_base64, 'base64');
fs.writeFileSync('output.wav', audioBuffer);
```
