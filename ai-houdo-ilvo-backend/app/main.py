import io
import logging
from typing import List
from PIL import Image

from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.schemas import (
    AnalyzeResponse,
    ImageAnalysisItem,
    SignalsContainer
)
from app.models.c2pa_check import check_c2pa
from app.models.ensemble import predict_ensemble, init_models
from app.models.ela import perform_proper_ela
from app.models.frequency import perform_frequency_fft
from app.models.metadata import check_metadata
from app.scoring import calculate_nija_score

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-houdo-ilvo")

app = FastAPI(
    title="AI Houdo Ilvo Forensic Backend",
    description="Accuracy-focused multi-signal image forensics & AI detection API (C2PA + HF Ensemble + ELA + FFT + EXIF)",
    version="2.0.0"
)

# Enable CORS for frontend web application integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    logger.info("Initializing AI Houdo Ilvo Backend...")
    # Trigger model warm-up in background thread if available
    try:
        init_models()
    except Exception as e:
        logger.warning(f"Background model initialization warning: {e}")


@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Houdo Ilvo Forensics Engine v2",
        "description": "5-Signal accuracy engine (C2PA 30%, Ensemble AI-Gen 35%, ELA 20%, 2D FFT 10%, EXIF 5%)"
    }


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_images(images: List[UploadFile] = File(...)):
    """
    POST /analyze
    Stateless endpoint: processes uploaded image(s) completely in memory.
    Runs 5-signal calibrated forensic pipeline and returns composite Nija Score.
    """
    if not images:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No image files provided in 'images' field."
        )

    results: List[ImageAnalysisItem] = []

    for file_upload in images:
        try:
            filename = file_upload.filename or "uploaded_image.jpg"
            image_bytes = await file_upload.read()
            file_size_bytes = len(image_bytes)

            if file_size_bytes == 0:
                continue

            # Load in Pillow
            pil_image = Image.open(io.BytesIO(image_bytes))
            width, height = pil_image.size
            mime_type = file_upload.content_type or "image/jpeg"

            # Execute 5 forensic signals in memory
            c2pa_result = check_c2pa(image_bytes, mime_type=mime_type)
            ensemble_result = predict_ensemble(pil_image)
            ela_result = perform_proper_ela(pil_image)
            fft_result = perform_frequency_fft(pil_image)
            metadata_result = check_metadata(image_bytes)

            signals = SignalsContainer(
                c2pa=c2pa_result,
                ai_gen_ensemble=ensemble_result,
                ela=ela_result,
                frequency=fft_result,
                metadata=metadata_result
            )

            # Compute composite Nija Score and verdict
            nija_score, verdict_info, caveats = calculate_nija_score(signals)

            item = ImageAnalysisItem(
                filename=filename,
                nija_score=nija_score,
                verdict=verdict_info["verdict"],
                kannada_verdict=verdict_info["kannada"],
                english_translation=verdict_info["english"],
                verdict_band=verdict_info["band"],
                verdict_description=verdict_info["description"],
                caveats=caveats,
                signals=signals,
                width=width,
                height=height,
                file_size_bytes=file_size_bytes
            )
            results.append(item)

        except Exception as err:
            logger.error(f"Error processing {file_upload.filename}: {err}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to analyze image '{file_upload.filename}': {str(err)}"
            )

    return AnalyzeResponse(
        results=results,
        processed_count=len(results)
    )
