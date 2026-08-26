import io
import base64
import numpy as np
from PIL import Image
from scipy import fft as sp_fft
from typing import Dict, Any
from app.schemas import FrequencyDetail


def perform_frequency_fft(pil_image: Image.Image, target_size: int = 512) -> FrequencyDetail:
    """
    Computes 2D Fast Fourier Transform (FFT) on image luminance.
    Performs radially-averaged power spectrum analysis and checks against known real-camera noise floor curves.
    Detects periodic grid harmonics, checkerboard spikes, and upsampling artifacts characteristic of GANs/Diffusion decoders.
    """
    # Convert to grayscale luminance
    gray = pil_image.convert("L")
    
    # Resize to standardized power-of-two square for FFT symmetry
    gray_resized = gray.resize((target_size, target_size), Image.Resampling.BILINEAR)
    img_np = np.array(gray_resized, dtype=np.float32)

    # 2D FFT and center shift (low frequencies in center, high on outer ring)
    fft2 = sp_fft.fft2(img_np)
    fft_shifted = sp_fft.fftshift(fft2)
    magnitude_spectrum = np.abs(fft_shifted)

    # Log power spectrum for visual representation and statistical analysis
    log_spectrum = np.log1p(magnitude_spectrum)

    # Center coordinates
    cy, cx = target_size // 2, target_size // 2

    # Radially averaged power spectrum computation
    y, x = np.indices((target_size, target_size))
    r = np.sqrt((x - cx) ** 2 + (y - cy) ** 2).astype(np.int32)
    max_r = min(cx, cy)

    # Bin luminance energies radially
    radial_profile = np.zeros(max_r, dtype=np.float64)
    radial_counts = np.zeros(max_r, dtype=np.int32)
    
    for radius in range(1, max_r):
        mask = (r == radius)
        radial_counts[radius] = np.sum(mask)
        if radial_counts[radius] > 0:
            radial_profile[radius] = np.mean(log_spectrum[mask])

    # Real camera sensors exhibit smooth 1/f^alpha exponential power spectrum falloff.
    # AI upscalers/diffusion models produce high-frequency spikes and unnatural harmonic bumps.
    rad_indices = np.arange(10, max_r - 20)
    profile_slice = radial_profile[rad_indices]
    
    # Linear fit in log-log space to test 1/f decay conformance
    log_rad = np.log(rad_indices)
    log_prof = np.log(np.maximum(1e-3, profile_slice))
    
    slope, intercept = np.polyfit(log_rad, log_prof, 1)
    fitted = slope * log_rad + intercept
    residual_variance = float(np.var(log_prof - fitted))

    # Detect high-frequency periodic peak outliers (grid artifacts)
    high_freq_mask = (r > (max_r * 0.45)) & (r < max_r)
    high_freq_vals = log_spectrum[high_freq_mask]
    hf_mean = np.mean(high_freq_vals)
    hf_std = np.std(high_freq_vals) + 1e-6
    
    # Count extreme frequency peaks (Z > 3.8 in outer quadrants)
    peak_outliers = int(np.sum((high_freq_vals - hf_mean) / hf_std > 3.8))
    anomaly_ratio = float(peak_outliers / max(1, len(high_freq_vals)))

    # Compute score (100 = natural physical sensor decay, 0 = synthetic grid harmonics)
    if anomaly_ratio > 0.008 or residual_variance > 0.045:
        score = max(20, int(60 - (anomaly_ratio * 4000)))
        detail = f"High-frequency periodic spectral spikes detected ({peak_outliers} peaks), typical of convolutional upsampling/diffusion harmonics"
    elif anomaly_ratio > 0.003 or residual_variance > 0.025:
        score = max(55, int(75 - (residual_variance * 500)))
        detail = "Mild spectral harmonic deviations from natural 1/f camera noise floor curve"
    else:
        score = min(96, max(75, int(96 - (residual_variance * 400))))
        detail = "Smooth 1/f radially averaged power spectrum decay consistent with physical optical camera sensors"

    # Render normalized FFT power spectrum image (base64)
    norm_spec = ((log_spectrum - np.min(log_spectrum)) / (np.max(log_spectrum) - np.min(log_spectrum) + 1e-6) * 255.0).astype(np.uint8)
    fft_pil = Image.fromarray(norm_spec, mode="L")
    
    out_buf = io.BytesIO()
    fft_pil.save(out_buf, "PNG")
    fft_base64 = "data:image/png;base64," + base64.b64encode(out_buf.getvalue()).decode("utf-8")

    return FrequencyDetail(
        score=score,
        detail=detail,
        radial_falloff_fit=round(float(slope), 3),
        high_freq_anomaly_ratio=round(anomaly_ratio, 4),
        grid_peaks_count=peak_outliers,
        fft_image_base64=fft_base64,
        metrics={
            "spectral_slope": round(float(slope), 3),
            "residual_variance": round(residual_variance, 4),
            "peak_outliers": peak_outliers,
            "anomaly_ratio": round(anomaly_ratio, 5)
        }
    )
