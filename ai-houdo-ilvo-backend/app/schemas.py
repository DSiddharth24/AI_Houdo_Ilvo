from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class SignalDetail(BaseModel):
    score: int = Field(..., ge=0, le=100, description="0-100 score, higher = more genuine")
    detail: str = Field(..., description="Human-readable summary of the signal")
    metrics: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Raw technical metrics")


class AIEnsembleDetail(SignalDetail):
    per_model: Optional[Dict[str, float]] = Field(
        default_factory=dict, 
        description="Individual model human/real probability predictions"
    )
    models_evaluated: Optional[List[str]] = Field(default_factory=list)


class C2PADetail(SignalDetail):
    has_manifest: bool = False
    is_valid: bool = False
    issuer: Optional[str] = None
    claim_generator: Optional[str] = None
    actions: Optional[List[str]] = Field(default_factory=list)
    ai_disclosed: Optional[bool] = None


class ELADetail(SignalDetail):
    mean_error: Optional[float] = None
    variance: Optional[float] = None
    anomaly_detected: Optional[bool] = None
    hotspots: Optional[int] = None
    ela_image_base64: Optional[str] = None


class FrequencyDetail(SignalDetail):
    radial_falloff_fit: Optional[float] = None
    high_freq_anomaly_ratio: Optional[float] = None
    grid_peaks_count: Optional[int] = None
    fft_image_base64: Optional[str] = None


class MetadataDetail(SignalDetail):
    has_exif: bool = False
    camera_make: Optional[str] = None
    camera_model: Optional[str] = None
    software: Optional[str] = None
    detected_ai_software: Optional[str] = None
    tags_count: int = 0
    gps_present: bool = False
    social_compression_suspected: bool = False
    tags: Optional[Dict[str, Any]] = Field(default_factory=dict)


class SignalsContainer(BaseModel):
    c2pa: C2PADetail
    ai_gen_ensemble: AIEnsembleDetail
    ela: ELADetail
    frequency: FrequencyDetail
    metadata: MetadataDetail


class ImageAnalysisItem(BaseModel):
    filename: str
    nija_score: int = Field(..., ge=0, le=100)
    verdict: str
    kannada_verdict: Optional[str] = None
    english_translation: Optional[str] = None
    verdict_band: Optional[str] = None
    verdict_description: Optional[str] = None
    caveats: Optional[List[str]] = Field(default_factory=list)
    signals: SignalsContainer
    width: Optional[int] = None
    height: Optional[int] = None
    file_size_bytes: Optional[int] = None


class AnalyzeResponse(BaseModel):
    results: List[ImageAnalysisItem]
    processed_count: int
    engine: str = "AI Houdo Ilvo v2 Accuracy Engine (Ensemble + C2PA + Forensic ELA + FFT + EXIF)"
