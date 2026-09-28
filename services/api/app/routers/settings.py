from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.db import get_db
from app.models.setting import Setting
from app.schemas.settings import SettingsResponse, SettingsUpdate
from app.core.settings_defaults import PRESET_DEFAULTS

router = APIRouter(prefix="/api/settings", tags=["settings"])

def get_or_create_settings(db: Session) -> Setting:
    setting = db.scalars(select(Setting).where(Setting.key == "system_thresholds")).first()
    if not setting:
        preset = "demo"
        setting = Setting(
            key="system_thresholds",
            preset=preset,
            value=PRESET_DEFAULTS[preset],
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

@router.get("", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    setting = get_or_create_settings(db)
    return SettingsResponse(preset=setting.preset, values=setting.value)

@router.put("", response_model=SettingsResponse)
def update_settings(payload: SettingsUpdate, db: Session = Depends(get_db)):
    setting = get_or_create_settings(db)
    if payload.preset:
        if payload.preset not in PRESET_DEFAULTS:
            raise HTTPException(status_code=400, detail=f"Unknown preset '{payload.preset}'.")
        setting.preset = payload.preset
        # If preset changed and no values supplied, apply default for that preset
        if not payload.values:
            setting.value = PRESET_DEFAULTS[payload.preset]

    if payload.values:
        current_vals = dict(setting.value)
        current_vals.update(payload.values)
        setting.value = current_vals

    db.commit()
    db.refresh(setting)
    return SettingsResponse(preset=setting.preset, values=setting.value)

@router.post("/preset/{name}", response_model=SettingsResponse)
def switch_preset(name: str, db: Session = Depends(get_db)):
    if name not in PRESET_DEFAULTS:
        raise HTTPException(status_code=400, detail=f"Invalid preset '{name}'. Must be 'production' or 'demo'.")
    setting = get_or_create_settings(db)
    setting.preset = name
    setting.value = PRESET_DEFAULTS[name]
    db.commit()
    db.refresh(setting)
    return SettingsResponse(preset=setting.preset, values=setting.value)
