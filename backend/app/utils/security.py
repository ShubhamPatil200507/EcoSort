import io
import re
from pathlib import Path
from typing import Tuple
from PIL import Image
from fastapi import HTTPException, status
from app.config import settings

# Recognized magic byte signatures
MAGIC_SIGNATURES = [
    (b"\xFF\xD8\xFF", "jpeg"),
    (b"\x89PNG\r\n\x1a\n", "png"),
    (b"GIF87a", "gif"),
    (b"GIF89a", "gif"),
    (b"BM", "bmp"),
]

# Max permitted pixel dimension to prevent decompression bomb DoS
MAX_IMAGE_DIMENSION = 8192

def sanitize_safe_name(filename: str) -> str:
    """
    Sanitizes user-supplied filename to prevent path traversal and arbitrary file access.
    Strips directory separators and restricts to safe alphanumeric, hyphen, underscore, and dot chars.
    """
    basename = Path(filename).name
    # Strip dangerous characters
    cleaned = re.sub(r"[^a-zA-Z0-9_\-\.]", "", basename)
    # Ensure no leading dots or empty result
    cleaned = cleaned.lstrip(".")
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename supplied."
        )
    return cleaned

def validate_image_bytes(contents: bytes, filename: str = "upload.jpg") -> Tuple[str, int, int]:
    """
    Strict multi-stage validation for image uploads:
    1. Size and non-empty check
    2. Magic bytes verification (guards against MIME-type spoofing)
    3. PIL format & integrity verification (guards against malformed image payloads)
    4. Bounded dimensions check (guards against decompression bomb / pixel flood DoS)
    
    Returns (detected_format, width, height) upon success.
    """
    # 1. Non-empty check
    if not contents or len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    # 2. Extension check
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext and ext not in settings.ALLOWED_EXTENSIONS and filename != "blob":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '.{ext}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # 3. Maximum upload size check
    if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
        max_mb = settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {max_mb} MB."
        )

    # 4. Magic bytes verification
    detected_format = None
    if contents.startswith(b"RIFF") and len(contents) >= 12 and contents[8:12] == b"WEBP":
        detected_format = "webp"
    else:
        for sig, fmt in MAGIC_SIGNATURES:
            if contents.startswith(sig):
                detected_format = fmt
                break

    if not detected_format:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format: spoofed or corrupted image. Uploaded file does not contain valid image magic bytes (JPEG, PNG, WebP, GIF, BMP)."
        )

    # 4. PIL structural verification & dimension bounding
    try:
        with Image.open(io.BytesIO(contents)) as img:
            img.verify()
            width, height = img.size
            if width <= 0 or height <= 0:
                raise ValueError("Image has zero or negative dimensions.")
            if width > MAX_IMAGE_DIMENSION or height > MAX_IMAGE_DIMENSION:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Image dimensions ({width}x{height}) exceed maximum allowed dimension of {MAX_IMAGE_DIMENSION}px."
                )
            return detected_format, width, height
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Corrupted or invalid image structure: {str(exc)}"
        )
