# DrishtiXAI — Multi-Disease Rural Eye Screening Platform

> **Research Prototype — NOT for clinical use.**  
> All AI predictions require validation by a qualified ophthalmologist.

DrishtiXAI is an explainable AI screening platform for **Diabetic Retinopathy, Glaucoma, and Cataract** detection from retinal fundus images. Built for rural Indian healthcare settings with low-resource connectivity in mind.

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Quick Start (Local)](#quick-start-local)
4. [Installation — Backend](#installation--backend)
5. [Installation — Frontend](#installation--frontend)
6. [Running the Platform](#running-the-platform)
7. [Default Credentials](#default-credentials)
8. [API Documentation](#api-documentation)
9. [API Reference](#api-reference)
10. [Multi-Disease Pipeline](#multi-disease-pipeline)
11. [Risk Scoring System](#risk-scoring-system)
12. [PDF Report Generation](#pdf-report-generation)
13. [Project Structure](#project-structure)
14. [Configuration](#configuration)
15. [Clinical Disclaimer](#clinical-disclaimer)

---

## Features

| Feature | Status |
|---------|--------|
| Diabetic Retinopathy detection (5 grades) | ✅ Phase 1 |
| Glaucoma detection (4 grades) | ✅ Phase 1 |
| Image quality + modality gate | ✅ Phase 1 |
| Grad-CAM explainability heatmap | ✅ Phase 1 |
| Composite risk scoring (0–100) | ✅ Phase 1 |
| Server-side PDF patient report | ✅ Phase 1 |
| Clinician review workflow | ✅ Phase 1 |
| Admin dashboard with audit log | ✅ Phase 1 |
| Cataract detection (4 grades) | 🔶 Phase 2 stub |
| Real trained model weights | ⬜ Requires dataset |
| Offline PWA sync | ⬜ Planned |

---

## Architecture

```
┌─────────────────────┐      HTTP/JSON      ┌─────────────────────────────┐
│   Next.js Frontend  │ ◄──────────────────► │   FastAPI Backend            │
│   (React + Tailwind)│                      │   (Python 3.10)              │
│   Port 3000         │                      │   Port 8000                  │
└─────────────────────┘                      └──────────┬──────────────────┘
                                                        │
                              ┌─────────────────────────┼──────────────────┐
                              │                         │                  │
                    ┌─────────▼──────┐    ┌─────────────▼──────┐  ┌───────▼──────┐
                    │  ML Pipeline   │    │   SQLite / Postgres │  │  Static files│
                    │  DR Classifier │    │   (SQLAlchemy ORM)  │  │  Fundus imgs │
                    │  Glaucoma Cls. │    └────────────────────┘  └──────────────┘
                    │  Cataract Cls. │
                    │  Quality Gate  │
                    │  Grad-CAM XAI  │
                    │  Risk Scoring  │
                    │  Referral Eng. │
                    └────────────────┘
```

**Stack:**
- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Zustand, Recharts
- **Backend:** FastAPI 0.104, Python 3.10, SQLAlchemy 2.0, Pydantic v2
- **ML:** PyTorch (EfficientNet-B0), OpenCV, NumPy, Captum (Grad-CAM)
- **PDF:** ReportLab 4.1 (server-side) + jsPDF (client fallback)
- **DB:** SQLite (dev) / PostgreSQL (production)
- **Auth:** JWT (python-jose) + bcrypt

---

## Quick Start (Local)

```powershell
# Clone / open project
cd C:\Users\HARI\sih2\DrishtiXAI

# Start both services with one command
powershell -ExecutionPolicy Bypass -File start.ps1
```

Then open:
- **App** → http://localhost:3000
- **API Docs** → http://localhost:8000/api/docs

Login with `admin` / `change-me-in-production`.

---

## Installation — Backend

### Prerequisites

- Python 3.10+
- pip

### Steps

```powershell
cd backend

# 1. Create virtual environment (recommended)
python -m venv venv
.\venv\Scripts\Activate.ps1

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create environment file
Copy-Item ..\  .env.example .env
# Edit .env — set SECRET_KEY and JWT_SECRET_KEY (min 32 chars each)
```

### Minimum `.env` for development

```env
ENVIRONMENT=development
DEBUG=true
SECRET_KEY=your-secret-key-minimum-32-characters-long
JWT_SECRET_KEY=your-jwt-secret-minimum-32-characters-long
DATABASE_URL=sqlite:///./drishti_dev.db
DEMO_MODE=true
CORS_ORIGINS=["http://localhost:3000"]
ADMIN_EMAIL=admin@drishti.local
ADMIN_PASSWORD=your-admin-password
```

> `SECRET_KEY` and `JWT_SECRET_KEY` must be at least 32 characters.  
> Generate them with: `python -c "import secrets; print(secrets.token_hex(32))"`

---

## Installation — Frontend

### Prerequisites

- Node.js 18+
- npm 9+

### Steps

```powershell
cd frontend

# Install dependencies
npm install

# Create environment file
# Create frontend/.env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_APP_NAME=DrishtiXAI
```

---

## Running the Platform

### Option A — Single script (recommended)

```powershell
# From DrishtiXAI root:
powershell -ExecutionPolicy Bypass -File start.ps1
```

Starts both backend (port 8000) and frontend (port 3000) together.  
Press `Ctrl+C` to stop both.

### Option B — Separate terminals

**Terminal 1 — Backend:**
```powershell
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```powershell
cd frontend
npm run dev
```

### Option C — Docker Compose

```powershell
# Requires Docker Desktop
docker-compose up --build
```

---

## Default Credentials

| Role | Username | Password | Access |
|------|----------|----------|--------|
| Admin | `admin` | `change-me-in-production` | Full system access |

> Change the admin password in `.env` before deploying.  
> Register additional users via `POST /api/v1/auth/register`.

**User Roles:**
- `health_worker` — register patients, upload + analyse screenings
- `clinician` — all health_worker permissions + clinician review + analytics
- `admin` — all permissions + admin dashboard + audit log

---

## API Documentation

Interactive API docs (Swagger UI) are available at:

```
http://localhost:8000/api/docs
```

ReDoc alternative:
```
http://localhost:8000/api/redoc
```

Raw OpenAPI JSON:
```
http://localhost:8000/openapi.json
```

---

## API Reference

All routes are prefixed with `/api/v1`.

### Authentication

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/auth/register` | Register new user | — |
| `POST` | `/auth/login` | Login, returns JWT | — |

**Login request:**
```json
POST /api/v1/auth/login
{
  "username": "admin",
  "password": "change-me-in-production"
}
```

**Login response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { "id": 1, "role": "admin", "full_name": "..." }
}
```

All subsequent requests require:
```
Authorization: Bearer <access_token>
```

---

### Patients

| Method | Path | Description | Role |
|--------|------|-------------|------|
| `POST` | `/patients` | Register patient | health_worker+ |
| `GET` | `/patients` | List patients (facility-scoped) | any |
| `GET` | `/patients/{id}` | Get patient details | any |
| `GET` | `/patients/search/{patient_id_str}` | Search by string ID | any |

---

### Screenings

| Method | Path | Description | Role |
|--------|------|-------------|------|
| `POST` | `/screenings` | Upload fundus image | health_worker+ |
| `POST` | `/screenings/{id}/analyze` | Run full AI pipeline | any |
| `POST` | `/screenings/{id}/review` | Submit clinician review | clinician+ |
| `GET` | `/screenings` | List screenings | any |
| `GET` | `/screenings/{id}` | Get screening detail | any |
| `GET` | `/screenings/{id}/image` | Download original image | any |
| `GET` | `/screenings/{id}/explanation` | Download Grad-CAM heatmap | any |

**Upload + Analyse (two-step):**
```powershell
# Step 1: Upload
$form = @{ patient_id = 1; eye_side = "right"; image = Get-Item "fundus.jpg" }
$s = Invoke-RestMethod -Uri ".../screenings" -Method Post -Form $form -Headers $h

# Step 2: Analyse
$result = Invoke-RestMethod -Uri ".../screenings/$($s.id)/analyze" -Method Post -Headers $h
```

**Analyse response includes:**
```json
{
  "id": 42,
  "predicted_severity": 2,
  "prediction_confidence": 0.83,
  "glaucoma_severity": 1,
  "glaucoma_confidence": 0.71,
  "cataract_severity": 0,
  "cataract_confidence": 0.78,
  "risk_score": 48,
  "risk_category": "medium",
  "risk_breakdown": "{\"dr_points\":18.3,\"glaucoma_points\":5.0,...}",
  "referral_priority": "priority",
  "has_explanation": true,
  "status": "analyzed"
}
```

---

### Reports — PDF

| Method | Path | Description | Role |
|--------|------|-------------|------|
| `GET` | `/reports/{screening_id}/pdf` | Download PDF report | any |

Returns a streaming `application/pdf` response.  
Falls back to plain text if ReportLab is unavailable.

**Example (curl):**
```bash
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/api/v1/reports/42/pdf \
     --output report.pdf
```

**PDF contents:**
- Patient demographics
- Image quality assessment
- DR, Glaucoma, Cataract results table
- Composite risk score + breakdown
- Referral recommendation
- Grad-CAM explanation summary
- Clinician review (if completed)
- Clinical disclaimer (mandatory)

---

### Dashboard

| Method | Path | Description | Role |
|--------|------|-------------|------|
| `GET` | `/dashboard/statistics` | Full stats incl. multi-disease | any |
| `GET` | `/dashboard/recent-screenings` | Recent 10 screenings | any |
| `GET` | `/dashboard/high-priority-cases` | Urgent + review-required | clinician+ |
| `GET` | `/dashboard/model-performance` | Confidence + quality metrics | clinician+ |
| `GET` | `/dashboard/admin/summary` | System-wide admin overview | admin |

**Statistics response includes:**
```json
{
  "total_screenings": 150,
  "today_screenings": 12,
  "high_risk_cases": 8,
  "glaucoma_distribution": { "none":90,"suspect":45,"probable":12,"advanced":3 },
  "cataract_distribution": { "none":110,"trace":28,"moderate":10,"dense":2 },
  "weekly_trend": [{"date":"Mon","count":18}, ...]
}
```

**Admin summary response includes:**
```json
{
  "total_users": 5,
  "active_users": 5,
  "total_patients": 80,
  "role_breakdown": { "health_worker":3,"clinician":1,"admin":1 },
  "facility_breakdown": [{"facility":"PHC Wardha","count":45}],
  "recent_audit": [{"action":"screening_analyzed","user_role":"health_worker",...}]
}
```

---

## Multi-Disease Pipeline

Every `POST /screenings/{id}/analyze` runs this 7-step pipeline:

```
Image
  │
  ▼
┌─────────────────────────────────────┐
│ Step 1: Quality & Modality Gate     │  → Rejects non-fundus or poor-quality images
│  - Modality heuristic (circular     │
│    disc, red channel dominance)     │
│  - Blur / illumination / contrast   │
└─────────────────┬───────────────────┘
                  │ can_proceed=True
  ┌───────────────┼──────────────────┐
  ▼               ▼                  ▼
Step 2: DR     Step 3: Glaucoma   Step 4: Cataract (P2)
EfficientNet   CDR proxy +        Opacity / clarity
pixel heuristic rim variance      heuristic (Phase 2)
severity 0–4   severity 0–3       severity 0–3
  │               │                  │
  └───────┬────────┘                  │
          ▼                           │
     Step 5: Grad-CAM                 │
     (on DR prediction)               │
          │                           │
          └─────────────┬─────────────┘
                        ▼
                  Step 6: Risk Score
                  DR(40) + Glaucoma(30) +
                  Cataract(20) + Clinical(30)
                  → 0–100, Low/Medium/High
                        │
                        ▼
                  Step 7: Referral Engine
                  + multi-disease upgrade
                  → routine/priority/urgent
```

**Demo mode:** All classifiers use pixel-analysis heuristics. The same image always produces the same result (deterministic). No trained weights required.

**Real model mode:** Set `DEMO_MODE=false` in `.env` and place model weights at:
```
backend/models/dr_model.pth       # EfficientNet-B0, 5-class DR
backend/models/glaucoma_model.pth # EfficientNet-B0, 4-class glaucoma
backend/models/cataract_model.pth # EfficientNet-B0, 4-class cataract (Phase 2)
```

---

## Risk Scoring System

The composite risk score combines AI predictions + patient clinical factors:

| Component | Max Points | Notes |
|-----------|-----------|-------|
| DR severity | 40 | Scaled by DR confidence |
| Glaucoma severity | 30 | Scaled by glaucoma confidence |
| Cataract severity | 20 | Scaled by cataract confidence (Phase 2) |
| Clinical factors | 30 | Diabetes, duration, hypertension, age, prior exam |
| Quality penalty | −10 | Applied for poor or borderline image quality |
| **Total (raw)** | **120** | Normalised to 0–100 |

**Risk categories:**
| Score | Category | Action |
|-------|----------|--------|
| 0–34 | 🟢 Low | Routine follow-up |
| 35–64 | 🟡 Medium | Ophthalmologist appointment within weeks |
| 65–100 | 🔴 High | Prompt ophthalmologist referral |

**Confidence weighting:** Low-confidence predictions contribute less to the score:
- ≥80% confidence → full weight (1.0×)
- 60–79% → partial weight (0.5–1.0×)
- <60% → half weight (0.5×)

> Risk score is for **decision support only**. Not a validated clinical risk calculator.

---

## PDF Report Generation

DrishtiXAI generates patient reports two ways:

### Server-side (ReportLab) — preferred

`GET /api/v1/reports/{screening_id}/pdf`

- Full A4 multi-page PDF
- Embedded tables, colour-coded results, risk breakdown
- Mandatory clinical disclaimer on every page
- Works without a browser

### Client-side (jsPDF) — fallback

Called from the screening detail page "PDF Report" button.  
Embeds fundus image and Grad-CAM heatmap directly.

Both include:
- Patient name, ID, demographics
- DR / Glaucoma / Cataract results
- Risk score and breakdown
- Referral recommendation
- Clinician review (if completed)
- Model version and demo mode flag
- Disclaimer: *"Research Prototype — NOT FOR CLINICAL USE"*

---

## Project Structure

```
DrishtiXAI/
├── start.ps1                    ← One-command launcher
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
│
├── backend/
│   ├── .env                     ← Environment variables (create from .env.example)
│   ├── requirements.txt
│   └── app/
│       ├── main.py              ← FastAPI app, CORS, routers, startup
│       ├── core/
│       │   ├── config.py        ← Pydantic settings (loaded from .env)
│       │   └── security.py      ← JWT creation/verification, bcrypt
│       ├── api/
│       │   ├── dependencies.py  ← get_current_user, role guards
│       │   └── routes/
│       │       ├── auth.py
│       │       ├── patients.py
│       │       ├── screenings.py
│       │       ├── dashboard.py  ← Stats, admin summary, model performance
│       │       └── reports.py    ← PDF report endpoint (NEW)
│       ├── db/
│       │   └── base.py          ← SQLAlchemy engine, session, Base
│       ├── models/              ← SQLAlchemy ORM models
│       │   ├── user.py
│       │   ├── patient.py
│       │   ├── screening.py     ← Extended with glaucoma/cataract/risk columns
│       │   └── audit.py
│       ├── schemas/             ← Pydantic request/response schemas
│       │   ├── user.py
│       │   ├── patient.py
│       │   └── screening.py     ← Extended ScreeningResponse
│       ├── ml/
│       │   ├── models/
│       │   │   ├── dr_classifier.py       ← DR (EfficientNet-B0, 5-class)
│       │   │   ├── glaucoma_classifier.py ← Glaucoma (NEW, 4-class)
│       │   │   └── cataract_classifier.py ← Cataract Phase 2 (NEW, 4-class)
│       │   ├── quality/
│       │   │   └── quality_assessor.py    ← 2-stage quality + modality gate
│       │   └── xai/
│       │       └── gradcam.py             ← Grad-CAM + demo explanation engine
│       └── services/
│           ├── screening_service.py  ← Multi-disease pipeline orchestrator (UPDATED)
│           ├── referral_engine.py    ← Referral priority decision engine
│           └── risk_scoring.py       ← Composite risk scoring (NEW)
│
└── frontend/
    ├── package.json
    └── src/
        ├── types/index.ts        ← All TypeScript types (UPDATED)
        ├── lib/
        │   ├── api.ts            ← Axios client + all endpoint wrappers (UPDATED)
        │   ├── pdf.ts            ← Client-side jsPDF report
        │   └── utils.ts          ← Date/badge/score helpers
        ├── store/
        │   └── authStore.ts      ← Zustand auth state
        ├── components/
        │   ├── Layout.tsx        ← Sidebar nav (UPDATED — Admin Panel link)
        │   └── ui/
        │       ├── ScreeningResultBanner.tsx
        │       ├── ConfidenceBar.tsx
        │       ├── ImageViewer.tsx
        │       ├── RiskScoreBadge.tsx      ← Arc gauge + breakdown (NEW)
        │       ├── DiseaseResultCard.tsx   ← Per-disease result card (NEW)
        │       └── MultiDiseaseResults.tsx ← Combined 3-disease section (NEW)
        └── pages/
            ├── dashboard.tsx
            ├── admin.tsx              ← Admin dashboard page (NEW)
            ├── patients/
            ├── screening/
            │   ├── new.tsx            ← UPDATED: MultiDiseaseResults injected
            │   └── [id].tsx           ← UPDATED: MultiDiseaseResults + server PDF
            ├── reviews.tsx
            ├── analytics.tsx
            └── model-performance.tsx
```

---

## Configuration

All backend settings live in `backend/.env`. Full reference:

```env
# ── Application ──────────────────────────────────────
ENVIRONMENT=development        # development | production
DEBUG=true
API_HOST=0.0.0.0
API_PORT=8000

# ── Security (REQUIRED — min 32 chars each) ───────────
SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
JWT_SECRET_KEY=<generate separately>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ── Database ──────────────────────────────────────────
DATABASE_URL=sqlite:///./drishti_dev.db
# For PostgreSQL: postgresql://user:pass@localhost:5432/drishti_db

# ── Storage ───────────────────────────────────────────
UPLOAD_DIR=./data/uploads
MAX_UPLOAD_SIZE=10485760        # 10 MB

# ── ML Models ─────────────────────────────────────────
MODEL_PATH=./models
DEMO_MODE=true                  # false = use real model weights
MODEL_VERSION=v2.0.0
CONFIDENCE_THRESHOLD=0.7
QUALITY_THRESHOLD=0.6

# ── Referral thresholds ───────────────────────────────
URGENT_REFERRAL_SEVERITY=3
PRIORITY_REFERRAL_SEVERITY=2
LOW_CONFIDENCE_THRESHOLD=0.6

# ── CORS ─────────────────────────────────────────────
CORS_ORIGINS=["http://localhost:3000"]

# ── Admin defaults ────────────────────────────────────
ADMIN_EMAIL=admin@drishti.local
ADMIN_PASSWORD=change-me-in-production
```

### Frontend environment (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=DrishtiXAI
```

---

## Clinical Disclaimer

> **DrishtiXAI is a research prototype developed for SIH 2026 (SIH26038).**
>
> - All AI predictions are generated by pixel-analysis heuristics in demo mode.
> - No model has been trained on a validated clinical dataset.
> - Results must **not** be used as the basis for any medical decision.
> - All outputs require review and confirmation by a qualified ophthalmologist.
> - Glaucoma and Cataract detection modules are particularly experimental (Phase 2).
> - The risk score is a decision-support tool, not a validated clinical risk calculator.
> - This software is provided for educational and research purposes only.

---

## Development Notes

**Resetting the database** (after schema changes):

```powershell
# Stop the backend, then:
Remove-Item backend/drishti_dev.db -Force
# Restart — SQLAlchemy recreates all tables automatically
```

**Adding real model weights:**

1. Train EfficientNet-B0 on your dataset (5-class for DR, 4-class for glaucoma/cataract)
2. Save checkpoint as `{"model_state_dict": state_dict}`
3. Place at `backend/models/dr_model.pth` (or glaucoma/cataract equivalents)
4. Set `DEMO_MODE=false` and `MODEL_PATH=./models` in `.env`

**Running tests:**

```powershell
cd backend
pytest tests/ -v
```

---

*Built for Smart India Hackathon 2026 — SIH26038*  
*© 2026 DrishtiXAI Team*
