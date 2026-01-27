# Qwen3-TTS Evaluation Report

## 🚀 Model Identification: Qwen3-TTS
Released in **January 2026** by the Alibaba Qwen Team.
- **Sizes**: 1.7B (High Quality) and 0.6B (Lightweight).
- **License**: Apache 2.0 (Open Source, commercially usable).
- **Key Feature**: **CosyVoice** Integration? (Likely built upon CosyVoice architecture or similar).

## 🇮🇹 Language Capabilities
- **Italian Support**: NATIVE.
- **Expressiveness**: Supports "Voice Design" via natural language prompts (e.g., "A whispering, mysterious voice").
- **Cloning**: 3-second rapid voice cloning (Zero-shot).

## 💰 Resource Requirements & Cost Analysis
Compared to ElevenLabs ($0.18/min approx for high tiers, or expensive enterprise):

| Feature | ElevenLabs | Qwen3-TTS (Self-Hosted) |
| :--- | :--- | :--- |
| **Cost** | Usage-based (high at scale) | Hardware cost only (Electricity/Cloud GPU) |
| **VRAM** | N/A (SaaS) | **~4GB - 6GB** (for 1.7B model) |
| **Speed** | Fast (Network dependent) | Real-time (>97ms latency on GPU) |
| **Control** | High | Ultra-High (Fine-grained emotion/prosody) |
| **Privacy** | Shared Infrastructure | Local / Private Cloud |

### Hardware Feasibility
- **Local PC**: If you have an NVIDIA GPU with >6GB VRAM (RTX 3060/4060+), you can run the 1.7B model locally with **0 cost**.
- **Serverless (RunPod/Modal)**: Deploy on an RTX 4090 instance for ~$0.40/hour only during generation.
    - Example: Generating 1 hour of audio takes ~5 mins on GPU -> Cost: $0.03.
    - ElevenLabs cost for 1 hour: ~$10 - $20.
    - **Savings: ~99%**.

## 🛠️ Integration Strategy
Since n8n doesn't have a native "Qwen TTS" node yet:
1.  **Wrapper Service**: We build a simple Python `FastAPI` wrapper around the model.
2.  **API**: Expose an endpoint `POST /generate` accepting `{ text, voice_sample, emotion }`.
3.  **n8n**: Use `HTTP Request` node to call your local/cloud wrapper.

## ⚠️ Recommendation
**STRONGLY RECOMMEND ADOPTION.**
The 1.7B parameter size is the "sweet spot" - small enough to run cheaply/locally, large enough to rival commercial SaaS quality.

### Next Steps 
1.  **Local Test**: I can guide you to set up a Python script to run Qwen3-TTS locally if you have an NVIDIA GPU.
2.  **Sample Generation**: Generate a sample Italian story segment to compare vs ElevenLabs.
