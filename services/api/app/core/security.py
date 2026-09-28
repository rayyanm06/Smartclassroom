from fastapi import Header, HTTPException, status
from app.core.config import settings

async def verify_device_key(x_device_key: str = Header(None, alias="X-Device-Key")):
    """Validates X-Device-Key header against configured secret (§7)."""
    if not x_device_key or x_device_key != settings.DEVICE_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid X-Device-Key authentication header."
        )
    return x_device_key
