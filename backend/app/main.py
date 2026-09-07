"""
DrishtiXAI - Main FastAPI Application
Explainable Diabetic Retinopathy Screening Platform
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .core.config import settings
from .db import Base, engine
from .api.routes import auth, patients, screenings, dashboard

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Explainable AI for Diabetic Retinopathy Screening in Rural India. "
        "A trust-first, rural-friendly screening and decision support system."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(patients.router, prefix=settings.API_V1_PREFIX)
app.include_router(screenings.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)

# Ensure upload directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs("./logs", exist_ok=True)


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "description": "Explainable Diabetic Retinopathy Screening Platform",
        "demo_mode": settings.DEMO_MODE,
        "api_docs": "/api/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "demo_mode": settings.DEMO_MODE
    }


@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    print(f"🚀 {settings.APP_NAME} is starting...")
    print(f"📊 Environment: {settings.ENVIRONMENT}")
    print(f"🧪 Demo Mode: {settings.DEMO_MODE}")
    
    if settings.DEMO_MODE:
        print("⚠️  WARNING: Running in DEMO MODE - predictions are synthetic")
        print("⚠️  NOT FOR CLINICAL USE - Research prototype only")
    
    # Create admin user if not exists
    from .db import SessionLocal
    from .models.user import User
    from .core.security import get_password_hash
    
    db = SessionLocal()
    admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
    
    if not admin:
        admin = User(
            email=settings.ADMIN_EMAIL,
            username="admin",
            hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
            full_name="System Administrator",
            role="admin",
            facility_name="DrishtiXAI System"
        )
        db.add(admin)
        db.commit()
        print(f"✅ Admin user created: {settings.ADMIN_EMAIL}")
    
    db.close()
    print("✅ Startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("👋 Shutting down gracefully...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )
