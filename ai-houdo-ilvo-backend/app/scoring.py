from typing import Tuple, List, Dict, Any
from app.schemas import SignalsContainer

# Signal weights calibrated for high-accuracy backend forensics (Sum = 100)
WEIGHTS = {
    "c2pa": 30,
    "ai_gen_ensemble": 35,
    "ela": 20,
    "frequency": 10,
    "metadata": 5
}

BENGALURU_VERDICTS = {
    "genuine": {
        "band": "genuine",
        "verdict": "Genuine Photo",
        "kannada": "Fully Nija guru ✅",
        "english": "Completely Genuine Photo",
        "description": "Passed all physical and provenance checks: authentic noise floor, uniform error level distribution, and natural sensor dynamics."
    },
    "touched_up": {
        "band": "touched_up",
        "verdict": "Touched Up",
        "kannada": "Thumba filter hodidiya? 🤨 (touched up much?)",
        "english": "Filtered / Lightly Retouched",
        "description": "Base capture appears authentic, but subtle post-processing, color grading, face filters, or slight smoothing adjustments were detected across the image."
    },
    "edited": {
        "band": "edited",
        "verdict": "Edited / Manipulated",
        "kannada": "Idu edit maadidru guru 🔍 (this one's been edited)",
        "english": "Edited / Composite Splicing",
        "description": "Localized tampering or image splicing detected. Error Level Analysis shows significant variance discrepancies between spliced regions and base background."
    },
    "ai_generated": {
        "band": "ai_generated",
        "verdict": "AI-Generated",
        "kannada": "Machine maadidhu guru 🚨 (a machine made this)",
        "english": "Synthetic / AI-Generated",
        "description": "High AI-generation model confidence, characteristic diffusion/GAN high-frequency spectral artifacts, or generative provenance manifest detected."
    },
    "inconclusive": {
        "band": "inconclusive",
        "verdict": "Inconclusive",
        "kannada": "Confirm illa guru 🤷 (can't confirm)",
        "english": "Inconclusive / Mixed Signals",
        "description": "Forensic signals exhibit high disagreement or heavy re-compression prevents definitive single classification."
    }
}


def calculate_nija_score(signals: SignalsContainer) -> Tuple[int, Dict[str, str], List[str]]:
    """
    Combines all 5 signals into a calibrated Nija Score (0 - 100):
    - C2PA Content Credentials (30%)
    - Ensemble AI-Gen Classifier (35%)
    - Forensic ELA (20%)
    - Frequency Domain FFT (10%)
    - Metadata Integrity (5%)

    Special override rules:
    - If C2PA explicitly and cryptographically discloses AI creation -> Score clamped to <= 10.
    - If C2PA provides camera-signed cryptographical provenance -> Score boosted to >= 90.
    """
    c2pa_score = signals.c2pa.score
    ai_score = signals.ai_gen_ensemble.score
    ela_score = signals.ela.score
    freq_score = signals.frequency.score
    meta_score = signals.metadata.score

    caveats: List[str] = []

    # Social compression check caveat
    if not signals.metadata.has_exif and not signals.c2pa.has_manifest:
        caveats.append("Image appears stripped of metadata/credentials (common on WhatsApp/Instagram/Twitter re-uploads).")

    # If C2PA manifest is present and confirmed AI:
    if signals.c2pa.has_manifest and signals.c2pa.ai_disclosed:
        nija_score = min(10, c2pa_score)
        caveats.append("C2PA cryptographic manifest directly disclosed AI generative origin.")
    # If C2PA manifest is present and verified camera hardware:
    elif signals.c2pa.has_manifest and signals.c2pa.is_valid and not signals.c2pa.ai_disclosed:
        base_calc = (
            (c2pa_score * WEIGHTS["c2pa"]) +
            (ai_score * WEIGHTS["ai_gen_ensemble"]) +
            (ela_score * WEIGHTS["ela"]) +
            (freq_score * WEIGHTS["frequency"]) +
            (meta_score * WEIGHTS["metadata"])
        ) / 100.0
        nija_score = max(90, int(round(base_calc)))
        caveats.append("C2PA verified hardware cryptographic provenance manifest attached.")
    else:
        # Standard weighted composite
        weighted_sum = (
            (c2pa_score * WEIGHTS["c2pa"]) +
            (ai_score * WEIGHTS["ai_gen_ensemble"]) +
            (ela_score * WEIGHTS["ela"]) +
            (freq_score * WEIGHTS["frequency"]) +
            (meta_score * WEIGHTS["metadata"])
        ) / 100.0
        nija_score = int(round(max(0, min(100, weighted_sum))))

    # Select verdict band
    if nija_score >= 85:
        verdict_data = BENGALURU_VERDICTS["genuine"]
    elif nija_score >= 60:
        verdict_data = BENGALURU_VERDICTS["touched_up"]
    elif nija_score >= 30:
        verdict_data = BENGALURU_VERDICTS["edited"]
    else:
        verdict_data = BENGALURU_VERDICTS["ai_generated"]

    # Check for severe disagreement between AI model and ELA / FFT
    scores = [ai_score, ela_score, freq_score]
    if (max(scores) - min(scores)) > 60 and not signals.c2pa.has_manifest:
        # High variance across physical and neural models
        if 40 <= nija_score <= 65:
            verdict_data = BENGALURU_VERDICTS["inconclusive"]
            caveats.append("High disagreement between neural ensemble and physical frequency signals.")

    return nija_score, verdict_data, caveats
