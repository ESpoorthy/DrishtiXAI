"""
DrishtiXAI - Main FastAPI Application
Explainable Diabetic Retinopathy Screening Platform
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .core.config import settings
from .db import Base, engine, SessionLocal
from .api.routes import auth, patients, screenings, dashboard

# Create database tables on startup
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown logic."""
    # ── Startup ──────────────────────────────────────────────
    print(f"🚀 {settings.APP_NAME} is starting...")
    print(f"📊 Environment: {settings.ENVIRONMENT}")
    print(f"🧪 Demo Mode: {settings.DEMO_MODE}")

    if settings.DEMO_MODE:
        print("⚠️  WARNING: Running in DEMO MODE - predictions are synthetic")
        print("⚠️  NOT FOR CLINICAL USE - Research prototype only")

    # Create admin user if not exists
    from .models.user import User
    from .core.security import get_password_hash

    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                email=settings.ADMIN_EMAIL,
                username="admin",
                hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                full_name="System Administrator",
                role="admin",
                facility_name="DrishtiXAI System",
            )
            db.add(admin)
            db.commit()
            print(f"✅ Admin user created: {settings.ADMIN_EMAIL}")
    finally:
        db.close()

    print("✅ Startup complete")

    yield  # Application runs here

    # ── Shutdown ─────────────────────────────────────────────
    print("👋 Shutting down gracefully...")


# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Explainable AI for Diabetic Retinopathy Screening in Rural India. "
        "A trust-first, rural-friendly screening and decision support system."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routers
app.include_router(auth.router,       prefix=settings.API_V1_PREFIX)
app.include_router(patients.router,   prefix=settings.API_V1_PREFIX)
app.include_router(screenings.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router,  prefix=settings.API_V1_PREFIX)

# Ensure upload and log directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs("./logs", exist_ok=True)

# Serve uploaded images and Grad-CAM heatmaps as static files
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/")
def root():
    """Root endpoint — returns app metadata."""
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "description": "Explainable Diabetic Retinopathy Screening Platform",
        "demo_mode": settings.DEMO_MODE,
        "api_docs": "/api/docs",
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "demo_mode": settings.DEMO_MODE,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
    )