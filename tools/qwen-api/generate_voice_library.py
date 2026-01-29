"""
Voice Library Generator for Softale
====================================
Generates pre-defined voice embeddings using VoiceDesign + Base model cloning workflow.
Each voice is saved as a pickle file containing the voice_clone_prompt.

Usage:
    python generate_voice_library.py
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

# ===== VOICE DEFINITIONS =====
# Each voice has: id, description (for VoiceDesign), sample_text, language

VOICES = [
    # Italian Voices
    {
        "id": "soft_female_it",
        "description": "Voce femminile italiana dolce e rilassante. Tono caldo, morbido, adatto per storie della buonanotte e meditazioni.",
        "sample_text": "Chiudi gli occhi e lasciati cullare dalla mia voce. Respira profondamente e rilassati.",
        "language": "Italian",
    },
    {
        "id": "soft_male_it",
        "description": "Voce maschile italiana profonda e calma. Tono rassicurante, pacato, ideale per rilassamento.",
        "sample_text": "Stasera ti racconto una storia speciale. Lascia andare ogni pensiero e ascolta.",
        "language": "Italian",
    },
    {
        "id": "narrator_female_it",
        "description": "Narratrice italiana professionale. Voce chiara, espressiva ma controllata, perfetta per storytelling.",
        "sample_text": "C'era una volta, in un regno lontano, una principessa che amava le stelle.",
        "language": "Italian",
    },
    {
        "id": "narrator_male_it",
        "description": "Narratore italiano coinvolgente. Voce calda con variazioni tonali, ottima per storie avventurose.",
        "sample_text": "Il cavaliere attraverso la foresta oscura, il cuore pieno di coraggio.",
        "language": "Italian",
    },
    {
        "id": "meditation_it",
        "description": "Voce italiana ipnotica per meditazione. Molto lenta, pause naturali, tono quasi sussurrato.",
        "sample_text": "Inspira... ed espira lentamente... senti il tuo corpo diventare leggero...",
        "language": "Italian",
    },
    {
        "id": "kids_it",
        "description": "Voce italiana allegra per bambini. Giocosa, entusiasta ma non eccessiva, coinvolgente.",
        "sample_text": "Ciao piccolo! Sei pronto per un'avventura magica con i tuoi amici animali?",
        "language": "Italian",
    },
    # English Voices
    {
        "id": "soft_female_en",
        "description": "Soft, warm female English voice. Gentle and soothing, perfect for bedtime stories.",
        "sample_text": "Close your eyes and let my voice guide you to a peaceful place.",
        "language": "English",
    },
    {
        "id": "soft_male_en",
        "description": "Deep, calm male English voice. Reassuring and steady, ideal for relaxation.",
        "sample_text": "Tonight, let go of all your worries. Just breathe and listen.",
        "language": "English",
    },
    {
        "id": "narrator_en",
        "description": "Professional English narrator. Clear articulation, engaging tone for storytelling.",
        "sample_text": "Once upon a time, in a land far away, there lived a wise old wizard.",
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
    print("SOFTALE VOICE LIBRARY GENERATOR")
    print("=" * 50)

    # Create output directories
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(REFERENCE_DIR, exist_ok=True)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.bfloat16 if device == "cuda" else torch.float32
    print(f"Device: {device}, Dtype: {dtype}")

    # Load VoiceDesign model
    print("\n[1/3] Loading VoiceDesign model...")
    design_model = Qwen3TTSModel.from_pretrained(
        VOICE_DESIGN_MODEL,
        device_map="auto" if device == "cuda" else None,
        dtype=dtype,
    )
    print("      VoiceDesign model loaded!")

    # Load Base model for cloning
    print("\n[2/3] Loading Base model for cloning...")
    clone_model = Qwen3TTSModel.from_pretrained(
        BASE_MODEL,
        device_map="auto" if device == "cuda" else None,
        dtype=dtype,
    )
    print("      Base model loaded!")

    # Generate voices
    print(f"\n[3/3] Generating {len(VOICES)} voices...")

    for i, voice in enumerate(VOICES):
        print(f"\n--- Voice {i+1}/{len(VOICES)}: {voice['id']} ---")

        # Step 1: Generate reference audio with VoiceDesign
        print(f"   Generating reference audio...")
        ref_wavs, sr = design_model.generate_voice_design(
            text=voice["sample_text"],
            language=voice["language"],
            instruct=voice["description"],
        )

        # Save reference audio
        ref_path = os.path.join(REFERENCE_DIR, f"{voice['id']}_reference.wav")
        sf.write(ref_path, ref_wavs[0], sr)
        print(f"   Saved reference: {ref_path}")

        # Step 2: Create voice clone prompt
        print(f"   Creating voice clone prompt...")
        voice_clone_prompt = clone_model.create_voice_clone_prompt(
            ref_audio=(ref_wavs[0], sr), ref_text=voice["sample_text"]
        )

        # Step 3: Save voice clone prompt as pickle
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
        test_text = (
            "Questo e un test della voce clonata."
            if voice["language"] == "Italian"
            else "This is a test of the cloned voice."
        )
        test_wavs, test_sr = clone_model.generate_voice_clone(
            text=test_text,
            language=voice["language"],
            voice_clone_prompt=voice_clone_prompt,
        )

        test_path = os.path.join(REFERENCE_DIR, f"{voice['id']}_test.wav")
        sf.write(test_path, test_wavs[0], test_sr)
        print(f"   Test audio: {test_path}")

        print(f"   [OK] Voice '{voice['id']}' complete!")

    print("\n" + "=" * 50)
    print(f"DONE! Generated {len(VOICES)} voices in {OUTPUT_DIR}")
    print("=" * 50)

    # Generate manifest
    manifest_path = os.path.join(OUTPUT_DIR, "manifest.json")
    import json

    manifest = {
        "version": "1.0",
        "voices": [
            {
                "id": v["id"],
                "description": v["description"],
                "language": v["language"],
                "file": f"{v['id']}.pkl",
            }
            for v in VOICES
        ],
    }
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"Manifest saved: {manifest_path}")


if __name__ == "__main__":
    main()
