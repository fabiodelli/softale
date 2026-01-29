"""
Voice Library Generator - English Only (Additional Voices)
===========================================================
Generates additional English voice embeddings.
"""

import os
import sys
import pickle
import torch
import soundfile as sf

# Add qwen_tts to path
QWEN_REPO_PATH = os.path.join(
    os.path.dirname(__file__), "..", "qwen-tts-experiment", "qwen3_tts_repo"
)
if os.path.exists(QWEN_REPO_PATH) and QWEN_REPO_PATH not in sys.path:
    sys.path.insert(0, QWEN_REPO_PATH)

from qwen_tts import Qwen3TTSModel

# ===== ADDITIONAL ENGLISH VOICES =====
VOICES = [
    {
        "id": "narrator_female_en",
        "description": "Professional female English narrator. Clear, engaging, expressive but controlled. Perfect for fantasy and kids stories.",
        "sample_text": "Once upon a time, in a magical forest, there lived a curious little fox named Luna.",
        "language": "English",
    },
    {
        "id": "narrator_male_en",
        "description": "Deep, dramatic male narrator. Rich storytelling voice with varying intonation. Great for adventure tales.",
        "sample_text": "The brave knight stood at the edge of the mountain, gazing upon the vast kingdom below.",
        "language": "English",
    },
    {
        "id": "meditation_female_en",
        "description": "Ultra-calm female meditation voice. Very slow pace, natural pauses, almost hypnotic. Breathy and gentle.",
        "sample_text": "Take a deep breath in... and slowly release... feel your body becoming lighter with each exhale...",
        "language": "English",
    },
    {
        "id": "meditation_male_en",
        "description": "Deep, zen-like male meditation voice. Low register, extremely calm, with mindful pauses.",
        "sample_text": "Let go of all tension... allow your thoughts to drift away like clouds in a peaceful sky...",
        "language": "English",
    },
    {
        "id": "whisper_female_en",
        "description": "Soft whisper female voice. ASMR-style, intimate, barely above a whisper. Perfect for deep sleep content.",
        "sample_text": "Close your eyes now... the night is gentle and quiet... you are safe and warm...",
        "language": "English",
    },
]

# ===== CONFIGURATION =====
VOICE_DESIGN_MODEL = "Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign"
BASE_MODEL = "./models/Qwen3-TTS-12Hz-1.7B-Base"
OUTPUT_DIR = "./voice_library"
REFERENCE_DIR = "./voice_library/references"


def main():
    print("=" * 50)
    print("ADDITIONAL ENGLISH VOICES GENERATOR")
    print("=" * 50)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(REFERENCE_DIR, exist_ok=True)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.bfloat16 if device == "cuda" else torch.float32
    print(f"Device: {device}, Dtype: {dtype}")

    print("\n[1/3] Loading VoiceDesign model...")
    design_model = Qwen3TTSModel.from_pretrained(
        VOICE_DESIGN_MODEL,
        device_map="auto" if device == "cuda" else None,
        dtype=dtype,
    )
    print("      VoiceDesign model loaded!")

    print("\n[2/3] Loading Base model for cloning...")
    clone_model = Qwen3TTSModel.from_pretrained(
        BASE_MODEL,
        device_map="auto" if device == "cuda" else None,
        dtype=dtype,
    )
    print("      Base model loaded!")

    print(f"\n[3/3] Generating {len(VOICES)} additional English voices...")

    for i, voice in enumerate(VOICES):
        print(f"\n--- Voice {i+1}/{len(VOICES)}: {voice['id']} ---")

        # Step 1: Generate reference audio
        print(f"   Generating reference audio...")
        ref_wavs, sr = design_model.generate_voice_design(
            text=voice["sample_text"],
            language=voice["language"],
            instruct=voice["description"],
        )

        ref_path = os.path.join(REFERENCE_DIR, f"{voice['id']}_reference.wav")
        sf.write(ref_path, ref_wavs[0], sr)
        print(f"   Saved reference: {ref_path}")

        # Step 2: Create voice clone prompt
        print(f"   Creating voice clone prompt...")
        voice_clone_prompt = clone_model.create_voice_clone_prompt(
            ref_audio=(ref_wavs[0], sr), ref_text=voice["sample_text"]
        )

        # Step 3: Save voice clone prompt
        prompt_path = os.path.join(OUTPUT_DIR, f"{voice['id']}.pkl")
        with open(prompt_path, "wb") as f:
            pickle.dump(
                {
                    "id": voice["id"],
                    "description": voice["description"],
                    "language": voice["language"],
                    "voice_clone_prompt": voice_clone_prompt,
                },
                f,
            )
        print(f"   Saved prompt: {prompt_path}")

        # Step 4: Test the cloned voice
        print(f"   Testing cloned voice...")
        test_wavs, test_sr = clone_model.generate_voice_clone(
            text="This is a test of the cloned voice quality.",
            language=voice["language"],
            voice_clone_prompt=voice_clone_prompt,
        )

        test_path = os.path.join(REFERENCE_DIR, f"{voice['id']}_test.wav")
        sf.write(test_path, test_wavs[0], test_sr)
        print(f"   Test audio: {test_path}")

        print(f"   [OK] Voice '{voice['id']}' complete!")

    # Update manifest with all English voices
    print("\nUpdating manifest...")
    import json

    all_voices = [
        {
            "id": "soft_female_en",
            "description": "Soft, warm female. Perfect for sleep stories.",
            "language": "English",
        },
        {
            "id": "soft_male_en",
            "description": "Deep, calm male. Ideal for relaxation.",
            "language": "English",
        },
        {
            "id": "narrator_en",
            "description": "Professional narrator. Engaging storytelling.",
            "language": "English",
        },
    ]

    for v in VOICES:
        all_voices.append(
            {
                "id": v["id"],
                "description": v["description"].split(".")[0] + ".",
                "language": v["language"],
            }
        )

    manifest = {
        "version": "1.1",
        "language": "English",
        "voices": [{**v, "file": f"{v['id']}.pkl"} for v in all_voices],
    }

    manifest_path = os.path.join(OUTPUT_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"\n{'=' * 50}")
    print(f"DONE! Total English voices: {len(all_voices)}")
    print(f"{'=' * 50}")


if __name__ == "__main__":
    main()
