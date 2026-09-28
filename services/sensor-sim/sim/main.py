import asyncio
import os
import yaml
import httpx
import uvicorn
from pathlib import Path
from typing import Dict
from sim.room_model import SimulatedRoom
from sim.control import create_control_app

CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "rooms.yaml"

class SimulatorDaemon:
    def __init__(self, config_path: Path = CONFIG_PATH):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)

        self.api_url = self.config.get("api_url", "http://localhost:8000")
        self.device_key = self.config.get("device_key", "dev-secret-device-key-2026")
        self.tick_interval = self.config.get("tick_interval_sec", 1.0)
        self.heartbeat_interval = self.config.get("heartbeat_interval_sec", 10.0)

        # Initialize simulated rooms
        self.rooms: Dict[str, SimulatedRoom] = {}
        for r_cfg in self.config.get("rooms", []):
            room = SimulatedRoom(
                room_id=r_cfg["id"],
                device_id=r_cfg.get("device_id", f"esp32-{r_cfg['id'].lower()}"),
                capacity=r_cfg.get("capacity", 40),
                mode=r_cfg.get("mode", "auto"),
                ambient_temp=r_cfg.get("ambient_temp", 32.0),
                heartbeat_interval_sec=self.heartbeat_interval,
            )
            self.rooms[r_cfg["id"]] = room

        self.running = False
        self.command_poll_timer = 0.0

    async def post_event(self, client: httpx.AsyncClient, event):
        url = f"{self.api_url}/api/sensor-data"
        headers = {"X-Device-Key": self.device_key, "Content-Type": "application/json"}
        try:
            res = await client.post(url, json=event.model_dump(), headers=headers, timeout=2.0)
            if res.status_code == 202:
                # Event accepted by backend
                pass
        except Exception:
            # Backend not reachable yet — drop gracefully per §17
            pass

    async def poll_and_apply_commands(self, client: httpx.AsyncClient):
        """Polls backend command queue for each room and acknowledges executed commands (§7.1, §17)."""
        headers = {"X-Device-Key": self.device_key}
        for room_id, room in self.rooms.items():
            if room.offline_remaining_s > 0:
                continue
            url = f"{self.api_url}/api/classrooms/{room_id}/commands/pending"
            try:
                res = await client.get(url, headers=headers, timeout=2.0)
                if res.status_code == 200:
                    commands = res.json()
                    for cmd in commands:
                        cmd_id = cmd["id"]
                        device = cmd["device"]
                        action = cmd["command"]
                        room.appliances.apply_command(device, action)
                        # Acknowledge command execution
                        ack_url = f"{self.api_url}/api/commands/{cmd_id}/ack"
                        await client.post(ack_url, headers=headers, timeout=2.0)
            except Exception:
                pass

    async def run_simulation_loop(self):
        self.running = True
        print(f"[SensorSim] Starting simulation engine for {len(self.rooms)} rooms. Interval: {self.tick_interval}s")
        async with httpx.AsyncClient() as client:
            while self.running:
                for room_id, room in self.rooms.items():
                    event = room.tick(self.tick_interval)
                    if event:
                        await self.post_event(client, event)

                self.command_poll_timer += self.tick_interval
                if self.command_poll_timer >= 5.0:
                    self.command_poll_timer = 0.0
                    await self.poll_and_apply_commands(client)

                await asyncio.sleep(self.tick_interval)

def main():
    daemon = SimulatorDaemon()
    control_app = create_control_app(daemon.rooms)

    # Start simulation loop in background task
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    server_config = uvicorn.Config(control_app, host="0.0.0.0", port=8002, log_level="warning")
    server = uvicorn.Server(server_config)

    sim_task = loop.create_task(daemon.run_simulation_loop())
    server_task = loop.create_task(server.serve())

    try:
        loop.run_until_complete(asyncio.gather(sim_task, server_task))
    except (KeyboardInterrupt, SystemExit):
        daemon.running = False
        print("[SensorSim] Simulation terminated.")

if __name__ == "__main__":
    main()
