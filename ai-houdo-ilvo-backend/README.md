# AI Houdo Ilvo (ಎಐ ಹೌದೋ ಇಲ್ವೋ) — Forensic Backend (v2 Accuracy Engine)

High-accuracy Python FastAPI service that detects whether an uploaded image is AI-generated, edited/manipulated, or genuine using a calibrated 5-signal composite **Nija Score**.

---

## 🎯 Revised Scoring Signals (Backend Accuracy Calibration)

| Signal | Weight | Method | What It Catches |
|---|:---:|---|---|
| **C2PA Content Credentials** | **30%** | Embedded cryptographically signed provenance manifest inspection (`c2pa-python` / JUMBF boxes) | Cryptographic provenance from OpenAI DALL-E, Adobe Firefly, Microsoft, Google SynthID, and camera hardware certificates. Override capability if explicit AI creation is disclosed. |
| **Ensemble AI-Gen Classifier** | **35%** | Server-side PyTorch ensemble of full-size Hugging Face models (`umm-maybe/AI-image-detector`, `Organika/sdxl-detector`, `Ateeqq/ai-vs-human-generated-image-detection`) | High-accuracy detection of Midjourney, Stable Diffusion, Flux, DALL-E, and GAN textures without quantization loss. |
| **Forensic ELA (Proper)** | **20%** | Python multi-scale JPEG re-saving (75, 85, 95), block-wise error variance via `numpy`, statistical Z-score thresholding | Localized splicing, clone-stamping, Photoshop healing brushes, and selective inpainting. |
| **Frequency Domain (Proper FFT)** | **10%** | `scipy.fft` 2D Fast Fourier Transform on pixel luminance, radially-averaged power spectrum fitting | Periodic upsampling grid harmonics, checkerboard artifacts from transposed convolutions, and deviations from optical 1/f noise floor curves. |
| **Metadata Integrity** | **5%** | `exifread` binary header parser | Camera make/model verification, exposure parameter consistency (ISO, F-stop), GPS tags, and software leak detection. |

---

## ⚖️ Accuracy Realities & Caveats

1. **Ensemble Averaging Advantage**: Running an ensemble of 2–3 full-size PyTorch models server-side typically pushes detection accuracy from ~75–85% to **~85–92%** across diverse validation sets compared to single client-side models.
2. **C2PA Adoption Scope**: C2PA is the single most trustworthy cryptographic signal *when present*. However, outside tools like DALL-E 3, Adobe Firefly, and select mirrorless cameras, many genuine photos do not yet carry C2PA manifests. Absence is treated as neutral (score: 50).
3. **Social Media Re-compression (WhatsApp / Instagram / Twitter)**: Re-uploading photos through social apps strips both EXIF and C2PA while applying aggressive lossy re-compression. The engine detects this and attaches an explicit caveat rather than silently penalizing authenticity.

---

## 🚀 Running Locally

### 1. Install Dependencies
```bash
cd ai-houdo-ilvo-backend
pip install -r requirements.txt
```

### 2. Start the Server
```bash
uvicorn app.main:app --reload --port 8000
```

The API docs are available at `http://localhost:8000/docs`.

---

## 🐳 Docker Build & Deployment (Render / Railway / Fly.io)

```bash
docker build -t ai-houdo-ilvo-backend .
docker run -p 8000:8000 ai-houdo-ilvo-backend
```

### Deployment Configuration
- **Render / Railway / Fly.io**: Create a new Web Service pointing to `ai-houdo-ilvo-backend/Dockerfile`.
- Set Environment Variable in Frontend: `VITE_API_URL=https://your-backend.railway.app`

---

## 📡 API Contract

### `POST /analyze`
**Headers:** `Content-Type: multipart/form-data`  
**Body:** `images` (one or more image files)

**Sample JSON Response:**
```json
{
  "results": [
    {
      "filename": "photo1.jpg",
      "nija_score": 78,
      "verdict": "Touched Up",
      "kannada_verdict": "Thumba filter hodidiya? 🤨 (touched up much?)",
      "english_translation": "Filtered / Lightly Retouched",
      "verdict_band": "touched_up",
      "caveats": [],
      "signals": {
        "c2pa": {
          "score": 50,
          "detail": "No C2PA Content Credentials manifest found (Neutral — common for most web photos)",
          "has_manifest": false,
          "is_valid": false
        },
        "ai_gen_ensemble": {
          "score": 82,
          "detail": "2/3 models flagged low AI likelihood",
          "per_model": {
            "umm-maybe/AI-image-detector": 84.5,
            "Organika/sdxl-detector": 79.5
          }
        },
        "ela": {
          "score": 65,
          "detail": "Minor localized anomaly in top-right region",
          "mean_error": 2.45,
          "variance": 4.12,
          "hotspots": 5
        },
        "frequency": {
          "score": 88,
          "detail": "Smooth 1/f radially averaged power spectrum decay consistent with physical optical camera sensors",
          "grid_peaks_count": 0
        },
        "metadata": {
          "score": 40,
          "detail": "Partial EXIF tags present without explicit camera identifier",
          "has_exif": true
        }
      }
    }
  ],
  "processed_count": 1,
  "engine": "AI Houdo Ilvo v2 Accuracy Engine"
}
```
