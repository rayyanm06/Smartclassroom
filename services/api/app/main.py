from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import health, classrooms, timetable, settings as settings_router, ingest, dashboard, alerts

app = FastAPI(
    title="Smart Classroom Management API",
    description="Multi-source classroom occupancy, sensor fusion, and resource management engine.",
    version="1.0.0",
)

# Enable CORS for Web frontend & Vision service preview
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(classrooms.router)
app.include_router(timetable.router)
app.include_router(settings_router.router)
app.include_router(ingest.router)
app.include_router(dashboard.router)
app.include_router(alerts.router)

@app.get("/")
def root():
    return {
        "service": "Smart Classroom Management API",
        "version": "1.0.0",
        "docs_url": "/docs",
    }
