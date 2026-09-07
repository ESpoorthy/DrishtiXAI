# DrishtiXAI - System Architecture

## Overview

DrishtiXAI is built as a modern three-tier web application with clear separation of concerns:

1. **Presentation Layer**: Next.js frontend (React + TypeScript)
2. **Application Layer**: FastAPI backend (Python)
3. **Data Layer**: PostgreSQL database + File storage

---

## High-Level Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                        Users                                   │
│  Community Health Workers | Clinicians | Administrators        │
└───────────────┬───────────────────────────────────────────────┘
                │ HTTPS
                ↓
┌───────────────────────────────────────────────────────────────┐
│                   Frontend (Next.js/React)                     │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  Pages:                                                   ││
│  │  • Landing page          • Patient registration          ││
│  │  • Login/Auth            • Screening workflow            ││
│  │  • Dashboard             • Screening detail/review       ││
│  │  • Patient list          • Analytics                     ││
│  └──────────────────────────────────────────────────────────┘│
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  State Management (Zustand)                              ││
│  │  • Authentication state  • API client                    ││
│  │  • User session          • Local caching                 ││
│  └──────────────────────────────────────────────────────────┘│
└───────────────┬───────────────────────────────────────────────┘
                │ REST API (JSON)
                │ JWT Authentication
                ↓
┌───────────────────────────────────────────────────────────────┐
│                   Backend API (FastAPI)                        │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  API Routes (/api/v1)                                    ││
│  │  • /auth       - Authentication                          ││
│  │  • /patients   - Patient management                      ││
│  │  • /screenings - Screening CRUD + analysis               ││
│  │  • /dashboard  - Statistics and analytics                ││
│  └──────────────────────────────────────────────────────────┘│
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  Services (Business Logic)                               ││
│  │  • ScreeningService - Orchestrates ML pipeline           ││
│  │  • ReferralEngine   - Decision support logic             ││
│  │  • Authentication   - JWT/RBAC                           ││
│  └──────────────────────────────────────────────────────────┘│
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  ML Pipeline                                             ││
│  │  • ImageQualityAssessor  - Quality checking              ││
│  │  • DRClassifier          - Severity prediction           ││
│  │  • ExplainabilityEngine  - Grad-CAM generation           ││
│  └──────────────────────────────────────────────────────────┘│
└───────────────┬───────────────────────────────────────────────┘
                │
                ↓
┌───────────────────────────────────────────────────────────────┐
│                      Data Layer                                │
│                                                                │
│  ┌─────────────────────┬─────────────────────────────────────┐│
│  │ PostgreSQL/SQLite   │  File Storage                       ││
│  │ • Users             │  • Fundus images                    ││
│  │ • Patients          │  • Explanation heatmaps             ││
│  │ • Screenings        │  • Model weights                    ││
│  │ • Audit logs        │                                     ││
│  └─────────────────────┴─────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Frontend Architecture

#### Technology Choices

- **Next.js 14**: Server-side rendering, routing, and API routes
- **React 18**: Component-based UI
- **TypeScript**: Type safety and better developer experience
- **Tailwind CSS**: Utility-first styling for rapid development
- **Axios**: HTTP client with interceptors for auth
- **Zustand**: Lightweight state management

#### Key Design Patterns

1. **Modular Components**: Reusable UI components
2. **Layout Pattern**: Consistent app shell with navigation
3. **Protected Routes**: Authentication checks on private pages
4. **API Client Abstraction**: Centralized API calls with error handling
5. **Type Safety**: TypeScript interfaces matching backend schemas

#### Directory Structure

```
frontend/src/
├── components/        # Reusable React components
│   └── Layout.tsx    # Main app layout with nav
├── pages/            # Next.js pages (file-based routing)
│   ├── _app.tsx      # App wrapper with global config
│   ├── index.tsx     # Landing page
│   ├── login.tsx     # Authentication
│   ├── dashboard.tsx # Main dashboard
│   ├── patients/     # Patient pages
│   ├── screening/    # Screening pages
│   ├── reviews.tsx   # Clinician review queue
│   └── analytics.tsx # Analytics dashboard
├── lib/              # Shared utilities
│   └── api.ts        # API client singleton
├── store/            # State management
│   └── authStore.ts  # Auth state (Zustand)
├── types/            # TypeScript definitions
│   └── index.ts      # Shared types
└── styles/           # Global styles
    └── globals.css   # Tailwind + custom styles
```

---

### 2. Backend Architecture

#### Technology Choices

- **FastAPI**: Modern, fast Python web framework with auto-generated docs
- **SQLAlchemy**: ORM for database interactions
- **Pydantic**: Data validation and serialization
- **PyTorch**: Deep learning framework
- **OpenCV**: Image processing
- **Captum**: Model interpretability

#### Architectural Layers

```
┌────────────────────────────────────┐
│        API Routes Layer            │
│  (HTTP endpoints, request/response)│
└──────────────┬─────────────────────┘
               ↓
┌────────────────────────────────────┐
│       Service Layer                │
│  (Business logic, orchestration)   │
└──────────────┬─────────────────────┘
               ↓
┌────────────────────────────────────┐
│     ML/Processing Layer            │
│  (AI models, image processing)     │
└──────────────┬─────────────────────┘
               ↓
┌────────────────────────────────────┐
│      Data Access Layer             │
│  (Database operations, ORM)        │
└────────────────────────────────────┘
```

#### Directory Structure

```
backend/app/
├── api/                  # API layer
│   ├── routes/          # Endpoint definitions
│   │   ├── auth.py      # Authentication endpoints
│   │   ├── patients.py  # Patient CRUD
│   │   ├── screenings.py# Screening operations
│   │   └── dashboard.py # Analytics endpoints
│   └── dependencies.py  # Dependency injection (auth, DB)
├── core/                # Core configuration
│   ├── config.py        # Settings (env-based)
│   └── security.py      # JWT, password hashing
├── db/                  # Database layer
│   └── base.py          # DB connection, session
├── models/              # SQLAlchemy models
│   ├── user.py
│   ├── patient.py
│   ├── screening.py
│   └── audit.py
├── schemas/             # Pydantic schemas (validation)
│   ├── user.py
│   ├── patient.py
│   └── screening.py
├── services/            # Business logic layer
│   ├── screening_service.py  # Orchestrates pipeline
│   └── referral_engine.py    # Decision support
├── ml/                  # Machine learning layer
│   ├── models/          # AI models
│   │   └── dr_classifier.py   # DR classification
│   ├── quality/         # Quality assessment
│   │   └── quality_assessor.py
│   └── xai/             # Explainability
│       └── gradcam.py   # Grad-CAM implementation
├── utils/               # Shared utilities
│   └── file_utils.py    # File operations
└── main.py              # FastAPI app entry point
```

---

### 3. AI/ML Pipeline

#### Complete Workflow

```
Input: Fundus Image
        ↓
┌─────────────────────────────────────┐
│   1. Image Quality Assessment       │
│                                     │
│   Checks:                           │
│   • Blur detection (Laplacian var)  │
│   • Illumination (brightness)       │
│   • Contrast (std deviation)        │
│   • Field coverage (non-black %)   │
│                                     │
│   Output: Quality score (0-1)       │
│           Quality label              │
│           Issues list                │
│           Guidance message           │
└──────────────┬──────────────────────┘
               ↓
        Quality >= threshold?
               │
        ┌──────┴──────┐
        NO            YES
        ↓              ↓
   Reject image    ┌──────────────────────┐
   with guidance   │ 2. DR Classification │
                   │                      │
                   │ Model: EfficientNet-B0│
                   │ Input: 224x224 RGB   │
                   │ Output: 5 classes     │
                   │         + confidence  │
                   └──────────┬───────────┘
                              ↓
                   ┌──────────────────────┐
                   │ 3. Explainability    │
                   │                      │
                   │ Method: Grad-CAM     │
                   │ • Forward pass       │
                   │ • Backward gradients │
                   │ • Weighted activation│
                   │ • Heatmap overlay    │
                   └──────────┬───────────┘
                              ↓
                   ┌──────────────────────┐
                   │ 4. Referral Engine   │
                   │                      │
                   │ Inputs:              │
                   │ • Severity           │
                   │ • Confidence         │
                   │ • Image quality      │
                   │ • Patient risk       │
                   │                      │
                   │ Output: Priority     │
                   │         Reasoning    │
                   └──────────────────────┘
                              ↓
                        Final Report
```

#### Image Quality Assessment Algorithm

```python
def assess_quality(image):
    scores = []
    issues = []
    
    # 1. Blur detection
    laplacian_var = cv2.Laplacian(gray, CV2_64F).var()
    if laplacian_var < threshold:
        issues.append("blurred")
        scores.append(low_score)
    
    # 2. Illumination check
    mean_brightness = np.mean(gray)
    if mean_brightness < dark_threshold:
        issues.append("too dark")
    elif mean_brightness > bright_threshold:
        issues.append("overexposed")
    
    # 3. Contrast check
    contrast = gray.std()
    if contrast < contrast_threshold:
        issues.append("low contrast")
    
    # 4. Coverage check
    non_black_ratio = np.sum(gray > 20) / total_pixels
    if non_black_ratio < coverage_threshold:
        issues.append("incomplete field")
    
    overall_score = np.mean(scores)
    
    return {
        quality: categorize(overall_score),
        score: overall_score,
        issues: issues,
        guidance: generate_guidance(issues)
    }
```

#### Grad-CAM Explainability

```python
def generate_gradcam(model, image, target_class):
    # 1. Forward pass
    output = model(image)
    
    # 2. Backward pass for target class
    model.zero_grad()
    output[0][target_class].backward()
    
    # 3. Get gradients and activations
    gradients = get_gradients()  # from hooks
    activations = get_activations()  # from hooks
    
    # 4. Calculate weights (global average pooling of gradients)
    weights = gradients.mean(dim=[2, 3])
    
    # 5. Weighted combination of activation maps
    cam = torch.sum(weights * activations, dim=1)
    cam = F.relu(cam)  # Only positive influence
    
    # 6. Normalize to [0, 1]
    cam = (cam - cam.min()) / (cam.max() - cam.min())
    
    # 7. Resize to original image size
    cam_resized = cv2.resize(cam, (orig_width, orig_height))
    
    # 8. Create heatmap overlay
    heatmap = cv2.applyColorMap(cam_resized * 255, COLORMAP_JET)
    overlay = cv2.addWeighted(original_image, 0.5, heatmap, 0.5, 0)
    
    return overlay
```

#### Referral Prioritization Logic

```python
def determine_referral_priority(severity, confidence, quality, risk_factors):
    # Base priority on severity
    if severity >= 3:  # Severe NPDR or PDR
        priority = "urgent"
    elif severity >= 2:  # Moderate NPDR
        priority = "priority"
    elif severity == 1:  # Mild NPDR
        priority = "routine"
    else:  # No DR
        priority = "routine"
    
    # Adjust for low confidence
    if confidence < 0.6:
        priority = max(priority, "priority")
        requires_review = True
    
    # Adjust for poor quality
    if quality == "poor":
        priority = "priority"
        requires_review = True
    
    # Adjust for risk factors
    if has_high_risk_factors(risk_factors):
        if severity > 0:
            priority = upgrade_priority(priority)
    
    reasoning = generate_reasoning(severity, confidence, priority)
    
    return {
        priority: priority,
        reasoning: reasoning,
        requires_human_review: requires_review
    }
```

---

### 4. Database Schema

```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    role ENUM('health_worker', 'clinician', 'admin'),
    is_active BOOLEAN DEFAULT TRUE,
    facility_name VARCHAR,
    language_preference VARCHAR DEFAULT 'en',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Patients table
CREATE TABLE patients (
    id INTEGER PRIMARY KEY,
    patient_id VARCHAR UNIQUE NOT NULL,  -- Facility-assigned ID
    full_name VARCHAR NOT NULL,
    age INTEGER NOT NULL,
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    phone VARCHAR,
    village_name VARCHAR,
    district VARCHAR,
    state VARCHAR,
    has_diabetes VARCHAR,
    diabetes_duration_years INTEGER,
    has_hypertension VARCHAR,
    previous_eye_exam VARCHAR,
    registered_by INTEGER REFERENCES users(id),
    facility_name VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Screenings table
CREATE TABLE screenings (
    id INTEGER PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    eye_side ENUM('left', 'right'),
    screening_date TIMESTAMP DEFAULT NOW(),
    performed_by INTEGER REFERENCES users(id),
    facility_name VARCHAR,
    
    -- Image info
    image_path VARCHAR NOT NULL,
    image_filename VARCHAR NOT NULL,
    
    -- Quality assessment
    image_quality ENUM('good', 'acceptable', 'poor'),
    quality_score FLOAT,
    quality_issues TEXT,  -- JSON
    quality_guidance TEXT,
    
    -- AI prediction
    predicted_severity INTEGER,  -- 0-4
    prediction_confidence FLOAT,
    class_probabilities TEXT,  -- JSON
    model_version VARCHAR,
    is_demo_mode BOOLEAN DEFAULT TRUE,
    
    -- Explainability
    has_explanation BOOLEAN DEFAULT FALSE,
    explanation_path VARCHAR,
    attention_regions TEXT,  -- JSON
    explanation_summary TEXT,
    
    -- Referral
    referral_priority ENUM('routine', 'priority', 'urgent'),
    referral_reasoning TEXT,
    requires_human_review BOOLEAN DEFAULT FALSE,
    
    -- Clinical review
    reviewed_by INTEGER REFERENCES users(id),
    review_date TIMESTAMP,
    clinician_agrees BOOLEAN,
    clinician_severity INTEGER,
    clinician_notes TEXT,
    final_referral_priority ENUM('routine', 'priority', 'urgent'),
    
    -- Status
    status ENUM('image_uploaded', 'quality_check_failed', 
                'analyzed', 'clinician_reviewed', 'pending_sync'),
    is_synced BOOLEAN DEFAULT TRUE,
    created_offline BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    user_role VARCHAR,
    action VARCHAR NOT NULL,
    screening_id INTEGER REFERENCES screenings(id),
    patient_id INTEGER REFERENCES patients(id),
    details TEXT,  -- JSON
    model_version VARCHAR,
    ip_address VARCHAR,
    user_agent VARCHAR,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_screenings_patient ON screenings(patient_id);
CREATE INDEX idx_screenings_status ON screenings(status);
CREATE INDEX idx_screenings_priority ON screenings(referral_priority);
CREATE INDEX idx_screenings_date ON screenings(screening_date);
CREATE INDEX idx_audit_logs_screening ON audit_logs(screening_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

---

### 5. Security Architecture

#### Authentication Flow

```
1. User submits credentials (username, password)
        ↓
2. Backend verifies against hashed password (bcrypt)
        ↓
3. Generate JWT token with claims:
   {
     "sub": user_id,
     "exp": expiration_time
   }
        ↓
4. Return token + user info to frontend
        ↓
5. Frontend stores token (localStorage)
        ↓
6. Subsequent requests include token in Authorization header
        ↓
7. Backend verifies token signature and expiration
        ↓
8. Extract user_id, load user from DB
        ↓
9. Check user.is_active and role permissions
        ↓
10. Process request or return 401/403
```

#### Role-Based Access Control (RBAC)

```
Roles:
├── health_worker
│   ├── Register patients
│   ├── Perform screenings
│   ├── View own facility's data
│   └── Cannot review or override AI
│
├── clinician
│   ├── All health_worker permissions
│   ├── Review screenings
│   ├── Override AI decisions
│   ├── Add clinical notes
│   └── View high-priority queue
│
└── admin
    ├── All clinician permissions
    ├── View all facilities
    ├── Access analytics
    ├── Manage users
    └── System configuration
```

---

### 6. API Design

#### RESTful Principles

- Resource-based URLs
- HTTP methods for CRUD operations
- JSON request/response bodies
- Proper status codes
- Pagination for list endpoints
- Filtering via query parameters

#### Authentication

All endpoints (except `/auth/login` and `/auth/register`) require:

```
Authorization: Bearer <jwt_token>
```

#### Example API Calls

**Login**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}

Response:
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    ...
  }
}
```

**Create Screening**
```http
POST /api/v1/screenings
Authorization: Bearer <token>
Content-Type: multipart/form-data

patient_id=1
eye_side=right
image=<binary>

Response:
{
  "id": 1,
  "patient_id": 1,
  "eye_side": "right",
  "status": "image_uploaded",
  ...
}
```

**Analyze Screening**
```http
POST /api/v1/screenings/1/analyze
Authorization: Bearer <token>

Response:
{
  "id": 1,
  "image_quality": "good",
  "quality_score": 0.85,
  "predicted_severity": 2,
  "prediction_confidence": 0.87,
  "referral_priority": "priority",
  ...
}
```

---

### 7. Deployment Architecture

#### Recommended Production Setup

```
┌────────────────────────────────────────────────────────┐
│                      Load Balancer                      │
│                      (nginx/HAProxy)                    │
└──────────────┬────────────────────┬────────────────────┘
               │                    │
    ┌──────────▼──────────┐  ┌─────▼──────────┐
    │  Frontend Server 1  │  │  Frontend N     │
    │  (Next.js/Node)     │  │  (Next.js/Node) │
    └──────────┬──────────┘  └─────┬──────────┘
               │                    │
               └──────────┬─────────┘
                          │
               ┌──────────▼──────────┐
               │   API Gateway       │
               └──────────┬──────────┘
                          │
               ┌──────────▼──────────┐
               │  Backend API        │
               │  (FastAPI/Gunicorn) │
               │  - Multiple workers │
               └──────────┬──────────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
    ┌───────▼────────┐         ┌───────▼────────┐
    │  PostgreSQL    │         │  File Storage  │
    │  (Primary+Rep) │         │  (S3/MinIO)    │
    └────────────────┘         └────────────────┘
```

#### Docker Deployment

See `DEPLOYMENT.md` for detailed Docker setup.

---

### 8. Scalability Considerations

#### Backend Scaling

- **Horizontal**: Multiple Gunicorn workers
- **Caching**: Redis for session/frequently accessed data
- **Async**: FastAPI's async capabilities for I/O operations
- **Queue**: Celery for long-running ML tasks

#### ML Pipeline Scaling

- **GPU Acceleration**: Deploy on GPU-enabled instances
- **Model Serving**: TorchServe or TensorFlow Serving
- **Batch Processing**: Queue images for batch inference
- **Model Caching**: Keep model in memory across requests

#### Database Scaling

- **Read Replicas**: For analytics queries
- **Connection Pooling**: SQLAlchemy pool
- **Indexing**: Proper indexes on frequently queried columns
- **Partitioning**: Time-based partitioning for large tables

---

### 9. Monitoring & Observability

#### Key Metrics

**Application**
- Request rate, latency, error rate
- Active users, concurrent sessions
- API endpoint performance

**ML Pipeline**
- Inference latency
- Confidence distribution
- Quality check failure rate
- Prediction distribution

**Business**
- Screenings per day
- High-priority cases
- Clinician agreement rate
- Average time-to-review

#### Logging Strategy

```python
# Structured logging
logger.info("screening_analyzed", extra={
    "screening_id": screening.id,
    "patient_id": patient.id,
    "severity": result.severity,
    "confidence": result.confidence,
    "model_version": settings.MODEL_VERSION,
    "processing_time_ms": elapsed_time
})
```

---

## Design Decisions & Rationale

### Why FastAPI?

- Modern Python framework with excellent performance
- Automatic OpenAPI documentation
- Built-in validation with Pydantic
- Native async support
- Easy dependency injection

### Why Next.js?

- Server-side rendering for better SEO
- File-based routing simplicity
- Built-in API routes
- Great developer experience
- Production-ready out of the box

### Why EfficientNet?

- Good accuracy/efficiency tradeoff
- Suitable for resource-constrained deployment
- Well-documented architecture
- Pre-trained weights available

### Why Grad-CAM?

- Visual and intuitive explanations
- Computationally efficient
- No model modification required
- Works with any CNN architecture

### Why JWT?

- Stateless authentication
- Scalable (no server-side session storage)
- Works well with microservices
- Industry standard

---

## Conclusion

DrishtiXAI's architecture prioritizes:

1. **Modularity**: Clear separation of concerns
2. **Scalability**: Horizontal scaling capability
3. **Security**: Authentication, authorization, audit trails
4. **Reliability**: Error handling, validation, quality gates
5. **Maintainability**: Clean code, type safety, documentation
6. **Extensibility**: Easy to add new features or models

The architecture is production-ready with appropriate modifications for specific deployment environments.
