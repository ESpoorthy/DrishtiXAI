<<<<<<< HEAD
# DrishtiXAI

**Explainable AI for Diabetic Retinopathy Screening in Rural India**

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-blue)](https://sih.gov.in)
[![Problem Statement](https://img.shields.io/badge/PS-SIH26038-green)](https://sih.gov.in)
[![Organization](https://img.shields.io/badge/Org-MathWorks-orange)](https://mathworks.com)

## ⚠️ IMPORTANT DISCLAIMER

**THIS IS A RESEARCH PROTOTYPE FOR DEMONSTRATION AND EVALUATION PURPOSES ONLY.**

- **NOT VALIDATED FOR CLINICAL USE**
- **NOT A MEDICAL DEVICE**
- **NOT A REPLACEMENT FOR PROFESSIONAL MEDICAL DIAGNOSIS**
- All predictions require clinical validation and professional review
- Regulatory approval required before any clinical deployment

---

## 🎯 Problem Statement

**SIH26038**: Explainable AI for Diabetic Retinopathy Screening in Rural India

**Organization**: MathWorks  
**Category**: Software  
**Theme**: Clean & Green Technology

### Challenge

Design an explainable, trustworthy, rural-friendly diabetic retinopathy screening system that:
- Analyzes retinal fundus images
- Predicts DR severity/risk
- Explains why the model made its prediction
- Identifies poor-quality images
- Provides referral prioritization
- Works for community health workers, patients, and clinicians

---

## 🌟 Solution Overview

**DrishtiXAI** is a comprehensive AI-powered screening and decision support system designed specifically for rural Indian healthcare environments. It combines state-of-the-art deep learning with explainable AI techniques to provide trustworthy, actionable insights for diabetic retinopathy screening.

### Key Differentiators

1. **Explainable AI**: Grad-CAM visualizations show which retinal regions influenced predictions
2. **Trust-First Design**: Confidence scores, uncertainty quantification, and human-in-the-loop workflow
3. **Quality Gate**: Automatic image quality assessment before prediction
4. **Rural-Optimized**: Mobile-first, offline-capable, multilingual-ready design
5. **Clinical Decision Support**: Referral prioritization engine with risk stratification
6. **Audit Trail**: Complete tracking for medical AI accountability

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌──────────────┬──────────────┬─────────────────────────┐ │
│  │ Health Worker│  Clinician   │   Admin Dashboard       │ │
│  │  Interface   │  Dashboard   │   & Analytics           │ │
│  └──────────────┴──────────────┴─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕ REST API
┌─────────────────────────────────────────────────────────────┐
│                   Backend API (FastAPI)                      │
│  ┌──────────────┬──────────────┬─────────────────────────┐ │
│  │     Auth     │   Patient    │    Screening Service    │ │
│  │     RBAC     │  Management  │    Dashboard/Analytics  │ │
│  └──────────────┴──────────────┴─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    AI/ML Pipeline (PyTorch)                  │
│  ┌──────────────┬──────────────┬─────────────────────────┐ │
│  │Image Quality │ DR Classifier│  Explainability Engine  │ │
│  │  Assessor    │(EfficientNet)│     (Grad-CAM)          │ │
│  └──────────────┴──────────────┴─────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Referral Prioritization Engine                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              Data Layer (PostgreSQL/SQLite)                  │
│   Users | Patients | Screenings | Audit Logs               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔬 AI Pipeline

### Complete Screening Workflow

```
Fundus Image Upload
        ↓
┌─────────────────────┐
│ Image Quality Check │ ← Blur, illumination, contrast, coverage
└─────────────────────┘
        ↓
   Quality OK?
        ↓
┌─────────────────────┐
│ DR Classification   │ ← EfficientNet-B0 (5 severity levels)
└─────────────────────┘
        ↓
┌─────────────────────┐
│ Explainability      │ ← Grad-CAM attention heatmap
└─────────────────────┘
        ↓
┌─────────────────────┐
│ Referral Priority   │ ← Severity + Confidence + Risk factors
└─────────────────────┘
        ↓
   Clinician Review
```

### DR Severity Classification

Following standard clinical classification:

- **0**: No DR
- **1**: Mild NPDR (Non-Proliferative Diabetic Retinopathy)
- **2**: Moderate NPDR
- **3**: Severe NPDR
- **4**: Proliferative DR

### Referral Priority Levels

- **ROUTINE**: Annual follow-up
- **PRIORITY**: Review within weeks
- **URGENT**: Immediate ophthalmologist referral

---

## ✨ Features

### For Community Health Workers

- ✅ Simple patient registration
- ✅ Easy image capture/upload interface
- ✅ Automatic quality feedback
- ✅ Clear referral recommendations
- ✅ Patient-friendly language
- ✅ Offline-capable (queued sync)

### For Clinicians

- ✅ Complete screening reports
- ✅ Original + AI explanation images
- ✅ Confidence scores and uncertainty
- ✅ Risk stratification
- ✅ Review and override AI decisions
- ✅ Clinical notes
- ✅ High-priority case queue

### For Administrators

- ✅ Real-time dashboard
- ✅ Performance analytics
- ✅ AI/clinician agreement metrics
- ✅ Quality monitoring
- ✅ Audit trail
- ✅ System health indicators

### AI Transparency Features

- **Confidence Scores**: Every prediction includes confidence level
- **Visual Explanations**: Grad-CAM heatmaps show model attention
- **Quality Gates**: Poor images flagged before prediction
- **Uncertainty Handling**: Low-confidence cases route to human review
- **Model Versioning**: Track which model version made prediction
- **Audit Logs**: Complete trail of all screening activities

---

## 🚀 Quick Start

### Prerequisites

- **Backend**: Python 3.9+
- **Frontend**: Node.js 18+
- **Database**: PostgreSQL (or SQLite for dev)

### Installation

#### 1. Clone Repository

```bash
git clone <repository-url>
cd Diabetic-Retinopathy-screening-platform
```

#### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env

# Edit .env with your configuration
# IMPORTANT: Change default passwords!
```

#### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env.local

# Edit .env.local if needed
```

### Running the Application

#### Terminal 1: Start Backend

```bash
cd backend
venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`  
API Documentation: `http://localhost:8000/api/docs`

#### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will be available at: `http://localhost:3000`

### Default Login Credentials

**⚠️ CHANGE IN PRODUCTION!**

- **Username**: `admin`
- **Password**: `change-me-in-production`
- **Role**: Admin

---

## 📖 Usage Guide

### 1. Register a Patient

1. Navigate to **Patients** → **Register New Patient**
2. Fill in patient information (ID, name, age, medical history)
3. Click **Register & Proceed to Screening**

### 2. Perform Screening

1. Select eye (left/right)
2. Upload fundus image (JPG/PNG, max 10MB)
3. Click **Upload & Analyze**
4. Wait for AI analysis (~5-10 seconds)

### 3. Review Results

The system will show:
- **Image Quality Assessment** (Good/Acceptable/Poor)
- **DR Severity Prediction** with confidence
- **AI Explanation** (heatmap visualization)
- **Referral Priority Recommendation**

### 4. Clinician Review (if applicable)

1. Clinicians can view all screening details
2. Review AI explanation and reasoning
3. Agree or disagree with AI assessment
4. Provide clinical notes
5. Set final referral priority

---

## 🧪 Demo Mode

**Current Status: DEMO MODE ENABLED**

The system runs in demo mode by default, which:
- Uses synthetic predictions (no trained model required)
- Generates realistic confidence scores and class probabilities
- Creates demonstration explanation heatmaps
- Clearly labels all outputs as "DEMO MODE"

### Why Demo Mode?

Training a production-quality DR classification model requires:
- Large labeled dataset (10,000+ images)
- Clinical validation
- Multiple weeks of GPU training
- Regulatory compliance

Demo mode allows evaluation of:
- ✅ System architecture
- ✅ User interface/workflow
- ✅ Explainability approach
- ✅ Decision support logic
- ✅ Integration capabilities

### Switching to Real Model

1. Train or obtain a DR classification model
2. Save weights as `.pth` file
3. Update `backend/app/core/config.py`:
   ```python
   DEMO_MODE = False
   MODEL_PATH = "./models/dr_model.pth"
   ```
4. Restart backend

---

## 🔒 Security & Privacy

### Implemented

- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Password hashing (bcrypt)
- ✅ Secure session management
- ✅ Audit logging for all actions
- ✅ Input validation
- ✅ CORS configuration

### For Production

- [ ] HTTPS/TLS encryption
- [ ] Data encryption at rest
- [ ] PHI compliance (HIPAA/equivalent)
- [ ] Regular security audits
- [ ] Penetration testing
- [ ] Secure credential management

---

## 📊 Model Card

### Model Information

- **Architecture**: EfficientNet-B0
- **Task**: Multi-class classification (5 classes)
- **Input**: RGB fundus images (224x224)
- **Output**: DR severity (0-4) with confidence

### Intended Use

**Primary**: Screening decision support in resource-limited settings  
**Users**: Trained community health workers with clinician oversight  
**Not For**: Autonomous diagnosis, treatment decisions, or replacing ophthalmologist examination

### Limitations

- ⚠️ Current version is DEMO/PROTOTYPE
- ⚠️ Requires clinical validation before deployment
- ⚠️ Performance depends heavily on image quality
- ⚠️ May not generalize across different cameras/populations
- ⚠️ Should not be sole basis for clinical decisions
- ⚠️ Regulatory approval required for clinical use

### Ethical Considerations

- **Fairness**: Performance should be evaluated across demographic groups
- **Bias**: Training data representation affects model fairness
- **Transparency**: Explainability helps but doesn't guarantee correctness
- **Accountability**: Human clinician remains responsible for final decisions
- **Privacy**: Patient data must be protected per local regulations

---

## 🏥 Clinical Workflow Integration

### Recommended Deployment Model

```
Community Health Center
        ↓
Health Worker Screening (DrishtiXAI)
        ↓
    ┌─────────┴─────────┐
    ↓                   ↓
Routine Cases      Urgent Cases
    ↓                   ↓
Regular Follow-up  Immediate Referral
                        ↓
                 Ophthalmologist
```

### Quality Assurance

1. **Regular Calibration**: Validate against expert grading
2. **Performance Monitoring**: Track agreement rates
3. **Continuous Training**: Update model with new data
4. **Feedback Loop**: Incorporate clinician corrections

---

## 🛠️ Development

### Project Structure

```
Diabetic-Retinopathy-screening-platform/
├── backend/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── core/          # Config, security
│   │   ├── db/            # Database
│   │   ├── ml/            # AI/ML pipeline
│   │   │   ├── models/    # DR classifier
│   │   │   ├── quality/   # Quality assessor
│   │   │   └── xai/       # Grad-CAM
│   │   ├── models/        # Database models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utilities
│   ├── tests/             # Backend tests
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Next.js pages
│   │   ├── lib/           # API client
│   │   ├── store/         # State management
│   │   ├── types/         # TypeScript types
│   │   └── styles/        # Global styles
│   ├── public/            # Static assets
│   ├── package.json
│   └── tsconfig.json
├── models/                # Model weights (not in repo)
├── data/                  # Data directory
└── README.md
```

### Technology Stack

**Backend**
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- PostgreSQL/SQLite (Database)
- PyTorch (Deep learning)
- OpenCV (Image processing)
- Captum (Explainability)

**Frontend**
- Next.js 14 (React framework)
- TypeScript (Type safety)
- Tailwind CSS (Styling)
- Axios (HTTP client)
- Zustand (State management)

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v --cov=app
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Patient registration
- [ ] Image upload (valid and invalid formats)
- [ ] Image quality assessment
- [ ] DR prediction
- [ ] Explanation generation
- [ ] Referral prioritization
- [ ] Clinician review submission
- [ ] Dashboard statistics
- [ ] Analytics page

---

## 📈 Future Enhancements

### Near Term

- [ ] PWA offline functionality
- [ ] Multilingual support (Hindi, Tamil, Telugu, etc.)
- [ ] Export screening reports (PDF)
- [ ] Batch screening mode
- [ ] Mobile app (React Native)

### Long Term

- [ ] Federated learning for privacy-preserving model updates
- [ ] Integration with electronic health records
- [ ] Telemedicine consultation feature
- [ ] Longitudinal patient tracking
- [ ] Population health analytics
- [ ] Model retraining pipeline

---

## 📄 License

This project is developed for Smart India Hackathon 2026.

---

## 👥 Team

**Team Name**: [Your Team Name]

**Members**:
- [Member 1] - [Role]
- [Member 2] - [Role]
- [Member 3] - [Role]
- [Member 4] - [Role]
- [Member 5] - [Role]
- [Member 6] - [Role]

---

## 🙏 Acknowledgments

- **MathWorks** for the problem statement
- **Smart India Hackathon 2026** for the opportunity
- Open-source community for tools and libraries
- Medical professionals for clinical insights

---

## 📞 Contact

For questions or support:
- Email: [your-email@example.com]
- GitHub: [repository-url]

---

## ⚖️ Regulatory & Compliance Note

This system is a **research prototype** and has not been:
- Validated in clinical trials
- Approved by medical device regulators (FDA, CDSCO, etc.)
- Certified for clinical use

**Before any clinical deployment**, the following are required:
1. Clinical validation studies
2. Regulatory approval
3. Quality management system (ISO 13485)
4. Risk management (ISO 14971)
5. Clinical evidence documentation
6. Post-market surveillance plan

**The system is for research, demonstration, and educational purposes only.**

---

**Built with ❤️ for Smart India Hackathon 2026**
=======
## 👥 ## Team

**Team: AetherAi**

| GitHub Handle | Name | Role |
|---|---|---|
| [@ESpoorthy](https://github.com/ESpoorthy) | Sai Spoorthy Eturu | Collaborator |
| [@Kommera-Harihansika](https://github.com/Kommera-Harihansika) | Kommera Harihanika | Collaborator |
| [@Duddalasrija](https://github.com/Duddalasrija) | Duddala Srija | Collaborator |
| [@glory-pranavi](https://github.com/glory-pranavi) | Glory Pranavi B | Collaborator |
| [@Katakam Sahithi Rithvika](https://github.com/sahithirithvika) | Katakam Sahithi Rithvika | Collaborator |
| [@Shamithri Gowravarapu](https://github.com/shami2398) | Shamithri Gowravarapu | Repository Owner |
>>>>>>> d0088b3d7c08737eb8c1770e8484721e21c569c9
