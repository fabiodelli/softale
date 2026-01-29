from huggingface_hub import snapshot_download

print("[DOWNLOAD] Downloading Qwen3-TTS-12Hz-1.7B-Base model...")
print("   This may take a few minutes (~3GB)")

path = snapshot_download(
    "Qwen/Qwen3-TTS-12Hz-1.7B-Base", local_dir="./models/Qwen3-TTS-12Hz-1.7B-Base"
)

print(f"[OK] Model downloaded to: {path}")
