import pytest
from sim.pir import PirSensor
from sim.dht11 import Dht11Sensor
from sim.appliances import ApplianceManager
from sim.room_model import SimulatedRoom

def test_pir_sensor_hold_and_lockout():
    pir = PirSensor(hold_s=5.0, lockout_s=3.0)
    
    # Empty room: should not trigger
    is_high, is_rising = pir.tick(dt=1.0, people_count=0)
    assert not is_high
    assert not is_rising

    # Force a trigger
    pir.is_high = True
    pir.hold_remaining = 5.0

    # Advance 2 seconds -> should remain HIGH
    is_high, is_rising = pir.tick(dt=2.0, people_count=10)
    assert is_high
    assert not is_rising # not rising edge since already high

    # Advance 3.5 seconds -> hold expires, transitions to lockout
    is_high, is_rising = pir.tick(dt=3.5, people_count=10)
    assert not is_high
    assert pir.lockout_remaining > 0

    # Advance 2 seconds -> still in lockout (even with people present)
    is_high, is_rising = pir.tick(dt=2.0, people_count=50)
    assert not is_high

def test_dht11_quantisation_and_thermal_dynamics():
    dht = Dht11Sensor(initial_temp=30.0, ambient_temp=34.0)

    # Test quantisation: read() must return whole integer floats or None
    for _ in range(50):
        t, h = dht.read()
        if t is not None:
            assert t == float(round(t))
            assert h == float(round(h))

    # Test AC cooling: running AC for 30 simulated minutes should cool room
    for _ in range(180): # 180 * 10s = 30 min
        dht.tick(dt=10.0, people_count=0, ac_on=True)
    assert dht.internal_temp < 28.0

    # Test human metabolic heat: 40 people in room with AC off
    temp_before = dht.internal_temp
    for _ in range(120): # 20 minutes
        dht.tick(dt=10.0, people_count=40, ac_on=False)
    assert dht.internal_temp > temp_before

def test_appliance_forgetfulness_and_commands():
    appliance = ApplianceManager()
    
    # Class start
    appliance.on_class_start()
    assert appliance.ac_status or appliance.light_status

    # Command application
    changed = appliance.apply_command("ac", "off")
    assert changed
    assert appliance.ac_status is False

    changed_light = appliance.apply_command("light", "off")
    assert appliance.light_status is False

def test_simulated_room_dropout_and_cadence():
    room = SimulatedRoom(
        room_id="TEST101",
        device_id="esp32-test101",
        capacity=40,
        mode="force_occupied",
        heartbeat_interval_sec=10.0
    )

    # Force offline for 30 seconds
    room.force_offline(30.0)
    event = room.tick(dt=10.0)
    assert event is None # suppressed during offline

    # Advance past offline
    room.tick(dt=25.0)
    # Next heartbeat tick should emit event
    event = room.tick(dt=10.0)
    assert event is not None
    assert event.classroom_id == "TEST101"
    assert event.source == "simulation"
