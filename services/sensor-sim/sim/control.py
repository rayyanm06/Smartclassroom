from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Literal
from sim.room_model import SimulatedRoom

class ModePayload(BaseModel):
    mode: Literal["auto", "follow_camera", "force_occupied", "force_empty"]

class AppliancePayload(BaseModel):
    device: Literal["ac", "light"]
    command: Literal["on", "off"]

def create_control_app(rooms: Dict[str, SimulatedRoom]) -> FastAPI:
    app = FastAPI(title="Sensor Simulator Control Server", version="1.0.0")

    @app.get("/control/state")
    def get_state():
        return {
            room_id: {
                "room_id": r.room_id,
                "mode": r.mode,
                "people_count": r.simulated_people,
                "ac_status": r.appliances.ac_status,
                "light_status": r.appliances.light_status,
                "offline_remaining_s": max(0.0, r.offline_remaining_s),
                "internal_temp": round(r.dht.internal_temp, 2),
            }
            for room_id, r in rooms.items()
        }

    @app.put("/control/{room_id}/mode")
    def set_mode(room_id: str, payload: ModePayload):
        room = rooms.get(room_id)
        if not room:
            raise HTTPException(status_code=404, detail=f"Room '{room_id}' not found in simulator.")
        room.set_mode(payload.mode)
        return {"room_id": room_id, "mode": room.mode}

    @app.post("/control/{room_id}/appliances")
    def set_appliances(room_id: str, payload: AppliancePayload):
        room = rooms.get(room_id)
        if not room:
            raise HTTPException(status_code=404, detail=f"Room '{room_id}' not found in simulator.")
        room.appliances.apply_command(payload.device, payload.command)
        return {
            "room_id": room_id,
            "ac_status": room.appliances.ac_status,
            "light_status": room.appliances.light_status
        }

    @app.post("/control/{room_id}/offline")
    def trigger_offline(room_id: str, seconds: float = 90.0):
        room = rooms.get(room_id)
        if not room:
            raise HTTPException(status_code=404, detail=f"Room '{room_id}' not found in simulator.")
        room.force_offline(seconds)
        return {"room_id": room_id, "offline_seconds": seconds}

    return app
