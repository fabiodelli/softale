import os
import sys
import torch
import scipy.io.wavfile
from types import ModuleType

# --- SOX BINDING MOCK ---
# The 'sox' python library (installed as dependency) tries to find 'sox' binary on import.
# On Windows, this often crashes if the binary isn't in PATH.
# Since we only use Feature Extraction (VoiceDesign) which might not strictly need the binary implementation
# if we bypass the specific calls, we inject a Mock module globally.
print("[INFO] Injecting Mock SoX to bypass binary check...")
mock_sox = ModuleType("sox")


class MockTransformer:
    def norm(self, *args, **kwargs):
        return self

    def build_array(self, input_array, *args, **kwargs):
        return input_array


mock_sox.Transformer = MockTransformer
sys.modules["sox"] = mock_sox
# ------------------------

# Add the cloned repo to path so we can import 'qwen_tts' even if pip install -e failed silently
repo_path = os.path.join(os.getcwd(), "qwen3_tts_repo")
if repo_path not in sys.path:
    sys.path.append(repo_path)

try:
    from qwen_tts.inference.qwen3_tts_model import Qwen3TTSModel

    print("[SUCCESS] Successfully imported Qwen3TTSModel")
except ImportError as e:
    print(f"[WARNING] Import Error: {e}")
    # Try one deeper level if structure is different
    try:
        sys.path.append(os.path.join(repo_path, "qwen_tts"))
        from qwen3_tts_model import Qwen3TTSModel

        print("[SUCCESS] Successfully imported Qwen3TTSModel (via fallback path)")
    except Exception as e2:
        print(
            f"[ERROR] Failed to import Qwen3TTSModel. Ensure you ran 'pip install -e .' in qwen3_tts_repo"
        )
        sys.exit(1)

# CONFIGURATION
# Using VoiceDesign model because it allows text-to-speech with just a text instruction (no ref audio needed)
MODEL_NAME = "Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign"

OUTPUT_DIR = "output_audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)


def generate_audio():
    print(f"Loading Qwen3-TTS Model ({MODEL_NAME})...")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    try:
        # Load model using the class method
        tts_model = Qwen3TTSModel.from_pretrained(
            MODEL_NAME, device_map="auto" if device == "cuda" else None
        )

        text = "Ciao, questa è la voce di Qwen Tre. Sto parlando in italiano."
        instruction = "Male voice, professional, deep, calm."

        output_path = os.path.join(OUTPUT_DIR, "qwen3_voice_design.wav")

        print(f"Generating: '{text}' with style '{instruction}'")

        # Generate Voice Design
        wavs, sr = tts_model.generate_voice_design(
            text=[text], instruct=[instruction], language=["Italian"]
        )

        # Save first result
        if wavs:
            # Check if wav is float or int
            wav_data = wavs[0]
            scipy.io.wavfile.write(output_path, sr, wav_data)
            print(f"[SUCCESS] Saved to {output_path}")
        else:
            print("[ERROR] No audio generated.")

    except Exception as e:
        print(f"[ERROR] Generation Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    generate_audio()
