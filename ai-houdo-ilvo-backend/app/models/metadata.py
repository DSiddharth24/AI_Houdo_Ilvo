import io
import exifread
from typing import Dict, Any, List
from app.schemas import MetadataDetail

KNOWN_AI_STRINGS = [
    "stable diffusion", "midjourney", "dall-e", "dalle", "comfyui", 
    "automatic1111", "invokeai", "novelai", "adobe firefly", "bing image creator",
    "flux", "dreamstudio", "generative ai", "synthid"
]

SOCIAL_COMPRESSION_MARKERS = [
    "whatsapp", "instagram", "facebook", "telegram", "wechat", "twitter"
]


def check_metadata(image_bytes: bytes) -> MetadataDetail:
    """
    Parses EXIF/TIFF headers using exifread.
    Evaluates:
    - Camera Make & Model presence
    - Lens specifications, ISO, F-number, Exposure time
    - Software tag inspection for AI generation tools or photo editors
    - GPS tag presence
    - Social platform compression strip detection
    """
    tags_dict: Dict[str, Any] = {}
    has_exif = False
    camera_make = None
    camera_model = None
    software = None
    detected_ai_software = None
    gps_present = False
    social_compression = False

    try:
        f = io.BytesIO(image_bytes)
        tags = exifread.process_file(f, details=False)
        tags_count = len(tags)
        
        if tags_count > 0:
            has_exif = True
            for tag_key, tag_val in tags.items():
                str_val = str(tag_val).strip()
                tags_dict[tag_key] = str_val
                
                # Check camera hardware tags
                if "Image Make" in tag_key:
                    camera_make = str_val
                elif "Image Model" in tag_key:
                    camera_model = str_val
                elif "Image Software" in tag_key:
                    software = str_val
                elif "GPS" in tag_key:
                    gps_present = True

            # Check for AI tool signatures in Software or UserComment
            combined_meta_text = " ".join([str(v).lower() for v in tags.values()])
            for ai_term in KNOWN_AI_STRINGS:
                if ai_term in combined_meta_text:
                    detected_ai_software = ai_term.title()
                    break

            for social in SOCIAL_COMPRESSION_MARKERS:
                if social in combined_meta_text:
                    social_compression = True
                    break

    except Exception:
        tags_count = 0

    # Also do a raw text scan on first 30KB for embedded XMP / Photoshop / AI headers
    raw_head = image_bytes[:35000].decode("latin-1", errors="ignore").lower()
    if not detected_ai_software:
        for ai_term in KNOWN_AI_STRINGS:
            if ai_term in raw_head:
                detected_ai_software = ai_term.title()
                break

    # Determine score
    if detected_ai_software:
        score = 5
        detail = f"AI generator tag found in metadata: '{detected_ai_software}'"
    elif camera_make and camera_model:
        if gps_present:
            score = 98
            detail = f"Authentic camera hardware tags ({camera_make} {camera_model}) with optical exposure parameters & GPS location"
        else:
            score = 90
            detail = f"Camera hardware tags verified ({camera_make} {camera_model}) with authentic exposure profile"
    elif has_exif and software and not camera_make:
        score = 55
        detail = f"Software tag present ('{software}') with missing camera hardware parameters (edited / exported)"
    elif has_exif:
        score = 65
        detail = f"Partial EXIF tags present ({tags_count} tags) without explicit camera identifier"
    else:
        # Check if stripped by web/social
        score = 45
        detail = "No EXIF metadata tags found (standard for web-compressed or stripped images)"

    return MetadataDetail(
        score=score,
        detail=detail,
        has_exif=has_exif,
        camera_make=camera_make,
        camera_model=camera_model,
        software=software,
        detected_ai_software=detected_ai_software,
        tags_count=tags_count,
        gps_present=gps_present,
        social_compression_suspected=social_compression,
        tags=tags_dict
    )
