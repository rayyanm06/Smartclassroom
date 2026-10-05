import { useNavigate } from 'react-router-dom';
import { BrutalistButton } from '../overlays/BrutalistButton';
import { runDashboardTransition } from '../transition/dashboardTransition';

interface StoryStep {
  number: string;
  title: string;
  tag: string;
  desc: string;
  spec: string[];
}

const STORY_STEPS: StoryStep[] = [
  {
    number: '01',
    title: 'THE EMPTY CLASSROOM',
    tag: 'BASELINE ENVIRONMENT',
    desc: 'Room 508 represents standard academic infrastructure with unoccupied desks, blackboard, and standard lighting fixtures consuming power regardless of human presence.',
    spec: ['Location: Room 508 · Building 4', 'Status: Baseline Idle', 'Loads: Unmanaged'],
  },
  {
    number: '02',
    title: 'ESP32 CENTRAL CONTROLLER',
    tag: 'TARGET HARDWARE',
    desc: 'Dual-core Tensilica Xtensa LX6 MCU operating as the local sensor hub and relay actuator interface with onboard WiFi/BLE telemetry.',
    spec: ['SoC: ESP32-WROOM-32', 'Freq: 240 MHz', 'IO: 36 GPIOs (Target Prototype)'],
  },
  {
    number: '03',
    title: 'PIR MOTION DETECTION',
    tag: 'SIMULATED SENSOR',
    desc: 'Passive Infrared sensor module detecting infrared radiant heat changes across segmented Fresnel zones with adjustable delay and sensitivity.',
    spec: ['Model: HC-SR501 Pyroelectric', 'Cone: 120° Field of View', 'Simulation: Active in dev pipeline'],
  },
  {
    number: '04',
    title: 'DHT11 CLIMATE MONITORING',
    tag: 'SIMULATED SENSOR',
    desc: 'Single-bus digital temperature and relative humidity sensor delivering calibrated environmental telemetry packets every 2 seconds.',
    spec: ['Range: 0-50°C ±2°C', 'Humidity: 20-90% RH ±5%', 'Bus: Single-wire digital protocol'],
  },
  {
    number: '05',
    title: 'PHYSICAL WIRE INTEGRATION',
    tag: 'ELECTRICAL BUS',
    desc: 'Dupont ribbon wiring harness providing isolated 5V power rails, common system ground, and high-impedance GPIO logic interconnects.',
    spec: ['Rails: 5V DC, 3.3V DC, GND', 'Lines: GPIO 13, 14, 18, 19, 21', 'Protection: Optocoupled'],
  },
  {
    number: '06',
    title: 'DUAL RELAY ORCHESTRATION',
    tag: 'TARGET HARDWARE',
    desc: 'Two-channel isolated electromagnetic relay module switching 230V mains lines powering the ceiling lighting grid and split-unit air conditioner.',
    spec: ['Rating: 10A 250V AC', 'Relay 01: LED Ceiling Battens', 'Relay 02: Split AC Unit'],
  },
  {
    number: '07',
    title: 'AUTOMATED ENERGY CONSERVATION',
    tag: 'DECISION LOGIC',
    desc: 'Hardware senses -> Backend decision logic evaluates inactivity thresholds -> Commands dispatch -> Relays open -> Lights & AC power down automatically.',
    spec: ['Sensing -> Backend Rule Engine -> Relays', 'Inactivity Timer: Dynamic', 'Energy Saved: Up to 42%'],
  },
  {
    number: '08',
    title: 'IPHONE RTSP CAMERA STREAM',
    tag: 'LIVE PROTOTYPE',
    desc: 'High-definition video ingest stream delivered over RTSP protocol directly into OpenCV frame buffer for edge computer vision inference.',
    spec: ['Stream: rtsp://172.20.10.1:554/stream', 'Resolution: 640x480 @ 30 FPS', 'Protocol: RTSP / H.264'],
  },
  {
    number: '09',
    title: 'YOLO11n EDGE INFERENCE',
    tag: 'LIVE PROTOTYPE',
    desc: 'Ultralytics YOLO11 nano neural network detecting human classroom occupants in real-time without facial recognition or biometric privacy intrusion.',
    spec: ['Model: YOLO11n ONNX', 'Inference Latency: ~65ms', 'Class: Person (ID: 0)'],
  },
  {
    number: '10',
    title: 'HOST TELEMETRY DASHBOARD',
    tag: 'CENTRAL PLATFORM',
    desc: 'Unified FastAPI 8000 and MySQL platform processing real-time occupancy counts, timetable scheduling, power metrics, and relay control.',
    spec: ['Backend: FastAPI (Port 8000)', 'Database: MySQL 8.0 (Port 3306)', 'Frontend: React + Vite (Port 5173)'],
  },
];

export function StaticStoryboard() {
  const navigate = useNavigate();

  const handleLaunch = () => {
    runDashboardTransition(navigate);
  };

  return (
    <main className="min-h-screen bg-[var(--lp-paper)] text-[var(--lp-ink)] font-mono p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <header className="border-b-4 border-[var(--lp-ink)] pb-8 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 bg-[var(--lp-yellow)] border border-[var(--lp-ink)] inline-block" />
            <span className="text-xs font-black tracking-widest uppercase text-stone-600">
              SMART CLASSROOM · SYSTEM ARCHITECTURE SPECIFICATION
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase leading-none">
            STATIC SYSTEM STORYBOARD
          </h1>
          <p className="mt-2 text-stone-600 text-sm max-w-xl">
            Accessible static view for reduced-motion preferences. Explore the 10 core architectural stages
            of the autonomous classroom energy & vision system.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <BrutalistButton variant="primary" size="md" onClick={handleLaunch}>
            OPEN DASHBOARD →
          </BrutalistButton>
          <span className="text-[10px] text-stone-500 font-bold">
            DEMO SEQUENCE · NOT LIVE STATUS
          </span>
        </div>
      </header>

      {/* Grid of Steps */}
      <div className="space-y-8">
        {STORY_STEPS.map((step) => (
          <section
            key={step.number}
            className="lp-card bg-white p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start"
          >
            {/* Step badge */}
            <div className="shrink-0 flex md:flex-col items-center justify-center w-16 h-16 bg-[var(--lp-yellow)] border-2 border-[var(--lp-ink)] font-black text-2xl shadow-[4px_4px_0px_#111]">
              {step.number}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">{step.title}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-stone-100 border border-stone-400 rounded">
                  {step.tag}
                </span>
              </div>

              <p className="text-sm text-stone-700 leading-relaxed font-sans font-medium">
                {step.desc}
              </p>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-200">
                {step.spec.map((item, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-bold text-stone-600 bg-stone-50 px-2.5 py-1 border border-stone-300 rounded"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Climax Footer */}
      <footer className="mt-16 pt-8 border-t-4 border-[var(--lp-ink)] text-center flex flex-col items-center gap-6">
        <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
          READY TO ENTER THE LIVE TELEMETRY MATRIX?
        </h2>
        <BrutalistButton
          variant="primary"
          size="lg"
          onClick={handleLaunch}
          className="max-w-md w-full"
        >
          INITIALIZE DASHBOARD →
        </BrutalistButton>
        <p className="text-xs text-stone-500 font-bold">
          DEMO SEQUENCE · SAMPLE VALUES · NOT LIVE HARDWARE STATUS
        </p>
      </footer>
    </main>
  );
}
