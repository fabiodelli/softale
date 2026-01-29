"""
Test script for Qwen API
========================
Run this after starting the server to verify it's working.

Usage:
    python test_api.py
"""

import requests
import base64
import os

API_URL = "http://localhost:8000"


def test_health():
    """Check if server is running and model is loaded."""
    print("🔍 Testing /health endpoint...")
    try:
        resp = requests.get(f"{API_URL}/health", timeout=5)
        data = resp.json()
        print(f"   Status: {data.get('status')}")
        print(f"   CUDA: {data.get('cuda_available')}")
        return data.get("status") == "ok"
    except requests.exceptions.ConnectionError:
        print("   ❌ Server not running. Start it with: uvicorn server:app --reload")
        return False


def test_generate():
    """Test audio generation."""
    print("\n🎙️ Testing /generate endpoint...")

    payload = {
        "text": "Ciao, questa è una prova del sistema Qwen per Softale.",
        "instruction": "Voce maschile italiana, calda e professionale, adatta per una narrazione rilassante.",
        "language": "Italian",
        "output_format": "base64",
    }

    try:
        resp = requests.post(f"{API_URL}/generate", json=payload, timeout=120)

        if resp.status_code != 200:
            print(f"   ❌ Error {resp.status_code}: {resp.text}")
            return False

        data = resp.json()

        if data.get("success"):
            audio_b64 = data.get("audio_base64")
            audio_bytes = base64.b64decode(audio_b64)

            # Save to file
            output_path = "test_output.wav"
            with open(output_path, "wb") as f:
                f.write(audio_bytes)

            print(f"   ✅ Success! Audio saved to: {output_path}")
            print(f"   Sample Rate: {data.get('sample_rate')} Hz")
            print(f"   Size: {len(audio_bytes) / 1024:.1f} KB")
            return True
        else:
            print(f"   ❌ Generation failed: {data.get('message')}")
            return False

    except requests.exceptions.Timeout:
        print("   ⚠️ Request timed out. First generation may take longer.")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def test_generate_file():
    """Test direct WAV file download."""
    print("\n📥 Testing /generate/file endpoint...")

    payload = {
        "text": "Questo è un test per il download diretto del file audio.",
        "instruction": "Voce femminile, dolce e rilassante.",
        "language": "Italian",
    }

    try:
        resp = requests.post(f"{API_URL}/generate/file", json=payload, timeout=120)

        if resp.status_code == 200:
            output_path = "test_output_direct.wav"
            with open(output_path, "wb") as f:
                f.write(resp.content)
            print(f"   ✅ Success! Audio saved to: {output_path}")
            print(f"   Size: {len(resp.content) / 1024:.1f} KB")
            return True
        else:
            print(f"   ❌ Error {resp.status_code}: {resp.text}")
            return False

    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


if __name__ == "__main__":
    print("=" * 50)
    print("   QWEN API TEST SUITE")
    print("=" * 50)

    if not test_health():
        print("\n⚠️ Server not ready. Exiting.")
        exit(1)

    test_generate()
    # test_generate_file()  # Uncomment to test file download

    print("\n" + "=" * 50)
    print("   Tests Complete!")
    print("=" * 50)
