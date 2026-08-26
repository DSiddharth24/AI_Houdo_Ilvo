# AI Houdo Ilvo (ಎಐ ಹೌದೋ ಇಲ್ವೋ)

> **"Is it AI or not?"** — A 5-signal forensic & provenance verification suite to detect AI-generated images, synthetic diffusion artifacts, spliced composites, and metadata tampering using a calibrated **Nija Score (0–100)**.

---

## 📌 Overview

With generative diffusion models advancing rapidly, single-model detectors and superficial eyeball tests are prone to false positives and bypasses. **AI Houdo Ilvo** evaluates images across **5 independent forensic, spectral, statistical, and cryptographic layers** to provide an explainable breakdown of authenticity rather than an opaque black-box label.

---

## 🎯 Calibrated 5-Signal Architecture & Nija Scoring

**Nija (ನೈಜ)** is the Kannada word for *"real" / "authentic"*. The **Nija Score (0–100)** reflects the probability that an image is an authentic optical camera capture:

- **Higher Score (85–100)**: Authentic, untouched optical photograph.
- **Lower Score (0–29)**: Synthetic, generative AI, or heavily manipulated.

| Signal | Weight | Forensic Target & Methodology |
| :--- | :---: | :--- |
| 🛡️ **C2PA Content Credentials** | **30%** | Cryptographic JUMBF box parser scanning for signed C2PA provenance manifests, digital signatures, and declared generative AI assertions (Adobe Firefly, DALL-E, SynthID). **Includes hard override upon verified AI disclosure.** |
| 🧠 **Ensemble AI Classifier** | **35%** | Multi-classifier ensemble analyzing sensor microtexture noise floors, chromatic dispersion variance, spatial gradient kurtosis, and optional server-side multimodal vision reasoning. |
| 🔬 **Forensic Error Level Analysis (ELA)** | **20%** | Multi-scale JPEG re-compression (quality levels 75/85/95) measuring 16×16 block error variance, Z-score hotspot detection ($Z > 3.0$), and interactive amplified difference maps to uncover localized splicing and inpainting. |
| 📊 **2D FFT Frequency Spectrum** | **10%** | 2D Fast Fourier Transform (Cooley-Tukey Radix-2) computed on luminance. Measures radially averaged power spectrum (RAPS) against natural $1/f$ sensor noise decay and catches periodic grid upsampling harmonics. |
| 📁 **EXIF Metadata Integrity** | **5%** | Deep parsing of TIFF/ICC/XMP/IPTC/GPS headers for optical hardware tags (Make, Model, Lens, ISO, F-stop) and leaked generator software tags (Midjourney, DALL-E, Stable Diffusion, ComfyUI, Photoshop). |

---

## 🎭 Verdict Categories

- **85–100**: `Fully Nija guru ✅` — **Completely Genuine Photo**  
  *Passed all forensic checks: authentic camera noise floor, uniform error level distribution, and natural sensor dynamics.*
- **60–84**: `Thumba filter hodidiya? 🤨` — **Filtered / Lightly Retouched**  
  *Base capture is authentic, but post-processing, color grading, face filters, or smoothing adjustments were detected.*
- **30–59**: `Idu edit maadidru guru 🔍` — **Edited / Composite Splicing**  
  *Localized tampering detected. ELA indicates significant variance discrepancies between spliced regions and background.*
- **0–29**: `Machine maadidhu guru 🚨` — **Synthetic / AI-Generated**  
  *High synthetic diffusion confidence, periodic grid spectral spikes, or cryptographic C2PA AI generation assertion.*

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun** / **yarn**

### Installation

1. **Clone the repository:**
   ```bash
   git clone <YOUR_REPO_URL>
   cd ai-houdo-ilvo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional):**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   *(Optional)* If you want to enable multimodal vision reasoning in the backend ensemble, add your Gemini API key in `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *Note: If no API key is provided, the engine runs locally using deterministic statistical microtexture, spatial gradient, and noise floor classifiers.*

4. **Start the local development server:**
   ```bash
   npm run dev
   ```

5. **Open in your browser:**
   Navigate to:
   ```
   http://localhost:3000
   ```

---

## 📦 Production Build

To compile and bundle both the React frontend and the Express backend into production-ready standalone artifacts:

```bash
# Build Vite client assets and bundle server.ts via esbuild
npm run build

# Launch the production server
npm start
```

The application will be served at `http://localhost:3000`.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Backend & Server**: Node.js, Express, Multer, Tsx, esbuild
- **Image Processing & Forensics**:
  - `jpeg-js` & `pngjs` for in-memory raster manipulation and multi-scale ELA
  - `exifr` for complete binary EXIF/XMP/IPTC/ICC parsing
  - Custom Cooley-Tukey 2D Fast Fourier Transform (FFT) for spectral power density
  - C2PA / JUMBF binary box structure scanner
  - `@google/genai` SDK for optional multimodal vision reasoning

---

## 🔒 Privacy & Data Handling

- All forensic computations (ELA, FFT, microtexture analysis, C2PA extraction, EXIF inspection) are executed **in-memory** on your local machine.
- Uploaded image buffers are never written to disk or saved to external databases.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
