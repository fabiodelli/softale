"""
Qwen 3 TTS API Microservice v2.0
================================
A FastAPI server with Voice Library support for consistent voice cloning.

Features:
- Voice Design: Create new voices from text prompts
- Voice Clone: Use pre-generated voice library for consistent output

Usage:
    uvicorn server:app --host 0.0.0.0 --port 8000 --reload
"""

import os
import sys
import io
import json
import base64
import pickle
from typing import Optional, List
from contextlib import asynccontextmanager

import torch
import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

# --- SOX MOCK (Windows Compatibility) ---
from types import ModuleType

mock_sox = ModuleType("sox")


class MockTransformer:
    def norm(self, *args, **kwargs):
        return self

    def build_array(self, input_array, *args, **kwargs):
        return input_array


mock_sox.Transformer = MockTransformer
sys.modules["sox"] = mock_sox
# -----------------------------------------

# Add the experiment repo to path
QWEN_REPO_PATH = os.path.join(
    os.path.dirname(__file__), "..", "qwen-tts-experiment", "qwen3_tts_repo"
)
if os.path.exists(QWEN_REPO_PATH) and QWEN_REPO_PATH not in sys.path:
    sys.path.insert(0, QWEN_REPO_PATH)

# Global model holders
design_model = None  # VoiceDesign model
clone_model = None  # Base model for cloning
voice_library = {}  # Loaded voice_clone_prompts
SAMPLE_RATE = 24000

# Paths
VOICE_LIBRARY_PATH = os.path.join(os.path.dirname(__file__), "voice_library")
BASE_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "models", "Qwen3-TTS-12Hz-1.7B-Base"
)


# --- Request/Response Models ---
class GenerateRequest(BaseModel):
    text: str
    instruction: str = "Professional English voice, calm and warm."
    language: str = "English"
    output_format: str = "base64"


class GenerateWithVoiceRequest(BaseModel):
    text: str
    voice_id: str
    language: str = "English"
    output_format: str = "base64"


class GenerateResponse(BaseModel):
    success: bool
    audio_base64: Optional[str] = None
    sample_rate: int = SAMPLE_RATE
    message: Optional[str] = None


class VoiceInfo(BaseModel):
    id: str
    description: str
    language: str


class VoiceListResponse(BaseModel):
    voices: List[VoiceInfo]


# --- Voice Library Loading ---
def load_voice_library():
    """Load all voice_clone_prompts from the voice library."""
    global voice_library

    manifest_path = os.path.join(VOICE_LIBRARY_PATH, "manifest.json")
    if not os.path.exists(manifest_path):
        print("   [WARN] No voice library manifest found")
        return

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    for voice in manifest.get("voices", []):
        voice_id = voice["id"]
        pkl_path = os.path.join(VOICE_LIBRARY_PATH, voice["file"])

        if os.path.exists(pkl_path):
            with open(pkl_path, "rb") as f:
                data = pickle.load(f)
                voice_library[voice_id] = {
                    "description": voice["description"],
                    "language": voice["language"],
                    "prompt": data["voice_clone_prompt"],
                }
            print(f"   [OK] Loaded voice: {voice_id}")
        else:
            print(f"   [WARN] Voice file not found: {pkl_path}")

    print(f"   Total voices loaded: {len(voice_library)}")


# --- Lifespan: Load Models on Startup ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    global design_model, clone_model
    print("=" * 50)
    print("QWEN TTS API v2.0 - Starting...")
    print("=" * 50)

    try:
        from qwen_tts import Qwen3TTSModel

        device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.bfloat16 if device == "cuda" else torch.float32
        print(f"Device: {device}, Dtype: {dtype}")

        # Load VoiceDesign model (for backward compatibility)
        print("\n[1/3] Loading VoiceDesign model...")
        design_model = Qwen3TTSModel.from_pretrained(
            "Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign",
            device_map="auto" if device == "cuda" else None,
            dtype=dtype,
        )
        print("      [OK] VoiceDesign model ready")

        # Load Base model for voice cloning
        print("\n[2/3] Loading Base model (for voice cloning)...")
        if os.path.exists(BASE_MODEL_PATH):
            clone_model = Qwen3TTSModel.from_pretrained(
                BASE_MODEL_PATH,
                device_map="auto" if device == "cuda" else None,
                dtype=dtype,
            )
            print("      [OK] Base model ready")
        else:
            print(f"      [WARN] Base model not found at {BASE_MODEL_PATH}")
            print("      Voice cloning will be unavailable")

        # Load voice library
        print("\n[3/3] Loading Voice Library...")
        load_voice_library()

        print("\n" + "=" * 50)
        print("SERVER READY!")
        print("=" * 50 + "\n")

    except ImportError as e:
        print(f"[ERROR] Could not import qwen_tts: {e}")
        design_model = None
        clone_model = None
    except Exception as e:
        print(f"[ERROR] Model load failed: {e}")
        design_model = None
        clone_model = None

    yield

    print("Shutting down Qwen API...")
    design_model = None
    clone_model = None


# --- FastAPI App ---
app = FastAPI(
    title="Qwen3-TTS API v2.0",
    description="TTS with Voice Library support",
    version="2.0.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health_check():
    """Check if the models are loaded and ready."""
    return {
        "status": "ok" if design_model is not None else "model_not_loaded",
        "design_model": "loaded" if design_model else "not_loaded",
        "clone_model": "loaded" if clone_model else "not_loaded",
        "voice_library": list(voice_library.keys()),
        "voice_count": len(voice_library),
        "cuda_available": torch.cuda.is_available(),
    }


@app.get("/voices", response_model=VoiceListResponse)
async def list_voices():
    """List all available voices in the library."""
    voices = [
        VoiceInfo(id=vid, description=vdata["description"], language=vdata["language"])
        for vid, vdata in voice_library.items()
    ]
    return VoiceListResponse(voices=voices)


@app.post("/generate", response_model=GenerateResponse)
async def generate_audio(request: GenerateRequest):
    """
    Generate audio using Voice Design (creates new voice each time).
    Use /generate_with_voice for consistent voice output.
    """
    if design_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        print(f"[DESIGN] Generating: '{request.text[:50]}...'")

        wavs, sr = design_model.generate_voice_design(
            text=[request.text],
            instruct=[request.instruction],
            language=[request.language],
        )

        if not wavs or len(wavs) == 0:
            return GenerateResponse(success=False, message="No audio generated")

        audio_buffer = io.BytesIO()
        sf.write(audio_buffer, wavs[0], sr, format="WAV")
        audio_bytes = audio_buffer.getvalue()

        if request.output_format == "wav":
            return Response(
                content=audio_bytes,
                media_type="audio/wav",
                headers={"X-Sample-Rate": str(sr)},
            )

        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        return GenerateResponse(success=True, audio_base64=audio_b64, sample_rate=sr)

    except Exception as e:
        print(f"[ERROR] Generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate_with_voice", response_model=GenerateResponse)
async def generate_with_voice(request: GenerateWithVoiceRequest):
    """
    Generate audio using a pre-defined voice from the library.
    This ensures consistent voice across multiple calls.
    """
    if clone_model is None:
        raise HTTPException(status_code=503, detail="Clone model not loaded")

    if request.voice_id not in voice_library:
        raise HTTPException(
            status_code=404,
            detail=f"Voice '{request.voice_id}' not found. Available: {list(voice_library.keys())}",
        )

    try:
        voice_data = voice_library[request.voice_id]
        print(f"[CLONE] Voice: {request.voice_id} | Text: '{request.text[:50]}...'")

        wavs, sr = clone_model.generate_voice_clone(
            text=request.text,
            language=request.language,
            voice_clone_prompt=voice_data["prompt"],
        )

        if not wavs or len(wavs) == 0:
            return GenerateResponse(success=False, message="No audio generated")

        audio_buffer = io.BytesIO()
        sf.write(audio_buffer, wavs[0], sr, format="WAV")
        audio_bytes = audio_buffer.getvalue()

        if request.output_format == "wav":
            return Response(
                content=audio_bytes,
                media_type="audio/wav",
                headers={"X-Sample-Rate": str(sr)},
            )

        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        print(f"[OK] Generated {len(audio_bytes)} bytes")
        return GenerateResponse(success=True, audio_base64=audio_b64, sample_rate=sr)

    except Exception as e:
        print(f"[ERROR] Clone generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
