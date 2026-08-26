import io
import base64
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
from typing import Dict, Any, Tuple
from app.schemas import ELADetail


def perform_proper_ela(
    pil_image: Image.Image,
    qualities: Tuple[int, ...] = (75, 85, 95),
    scale_multiplier: float = 15.0,
    block_size: int = 16
) -> ELADetail:
    """
    Performs forensic Error Level Analysis (ELA) by:
    1. Re-saving image at multiple JPEG quality levels (75, 85, 95).
    2. Computing per-block error variance with numpy.
    3. Applying statistical thresholding (Z-score anomaly detection) across 16x16 grid blocks.
    4. Generating an amplified visual diff heatmap base64 for client inspection.
    """
    if pil_image.mode != "RGB":
        pil_image = pil_image.convert("RGB")

    w, h = pil_image.size

    # Re-save at primary quality 85 to compute primary diff
    buffer_85 = io.BytesIO()
    pil_image.save(buffer_85, "JPEG", quality=85)
    buffer_85.seek(0)
    resaved_85 = Image.open(buffer_85)

    # Compute pixel difference
    diff_image = ImageChops.difference(pil_image, resaved_85)
    diff_np = np.array(diff_image, dtype=np.float32)

    # Calculate overall metrics
    mean_error = float(np.mean(diff_np))
    variance = float(np.var(diff_np))

    # Multi-scale compression variance test across qualities (75, 85, 95)
    multi_quality_means = []
    for q in qualities:
        buf = io.BytesIO()
        pil_image.save(buf, "JPEG", quality=q)
        buf.seek(0)
        q_img = Image.open(buf)
        q_diff = ImageChops.difference(pil_image, q_img)
        multi_quality_means.append(float(np.mean(np.array(q_diff, dtype=np.float32))))

    # Block-wise statistical analysis (16x16 blocks)
    bw = w // block_size
    bh = h // block_size
    
    block_variances = []
    if bw > 2 and bh > 2:
        for by in range(bh):
            for bx in range(bw):
                patch = diff_np[by * block_size:(by + 1) * block_size, bx * block_size:(bx + 1) * block_size]
                block_variances.append(float(np.var(patch)))

    block_var_np = np.array(block_variances) if block_variances else np.array([0.0])
    mean_block_var = float(np.mean(block_var_np))
    std_block_var = float(np.std(block_var_np)) + 1e-6

    # Z-score thresholding for anomalous blocks (potential spliced / edited regions)
    z_scores = (block_var_np - mean_block_var) / std_block_var
    hotspots = int(np.sum(z_scores > 3.0)) # > 3 standard deviations from uniform compression floor
    hotspot_ratio = hotspots / max(1, len(block_variances))

    # Scoring calculation (100 = uniform compression/genuine, 0 = severe localized tampering)
    if hotspot_ratio > 0.08:
        # High localized variance disparity -> spliced or inpainted regions
        score = max(15, int(70 - (hotspot_ratio * 350)))
        anomaly_detected = True
        detail = f"High localized variance disparity ({hotspots} anomalous blocks) indicating potential splicing or inpainting"
    elif hotspot_ratio > 0.03:
        score = max(45, int(80 - (hotspot_ratio * 250)))
        anomaly_detected = True
        detail = f"Minor localized ELA anomaly detected ({hotspots} high-variance regions)"
    else:
        # Uniform compression curve
        score = min(95, max(75, int(95 - (variance * 0.15))))
        anomaly_detected = False
        detail = "Uniform JPEG compression error surface consistent with single-source capture"

    # Generate amplified visual heatmap (base64)
    extrema = diff_image.getextrema()
    max_diff = max([ex[1] for ex in extrema]) if extrema else 1
    scale = (255.0 / max(1, max_diff)) if max_diff > 0 else scale_multiplier
    amplified = ImageEnhance.Brightness(diff_image).enhance(scale)
    
    # Export to base64
    out_buf = io.BytesIO()
    # Downscale thumbnail if massive for fast payload delivery
    if max(w, h) > 1200:
        amplified.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
    amplified.save(out_buf, "PNG")
    ela_base64 = "data:image/png;base64," + base64.b64encode(out_buf.getvalue()).decode("utf-8")

    return ELADetail(
        score=score,
        detail=detail,
        mean_error=round(mean_error, 2),
        variance=round(variance, 2),
        anomaly_detected=anomaly_detected,
        hotspots=hotspots,
        ela_image_base64=ela_base64,
        metrics={
            "mean_error": round(mean_error, 3),
            "variance": round(variance, 3),
            "hotspot_blocks": hotspots,
            "hotspot_ratio_pct": round(hotspot_ratio * 100, 2),
            "multi_quality_diffs": [round(m, 2) for m in multi_quality_means]
        }
    )
