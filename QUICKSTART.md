# DrishtiXAI - Quick Start Guide

Get DrishtiXAI up and running in under 10 minutes!

## 🚀 Prerequisites

- **Python 3.9+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)

## ⚡ Quick Setup (Windows)

### Option 1: Automated Setup (Recommended)

```powershell
# 1. Clone the repository
git clone <repository-url>
cd Diabetic-Retinopathy-screening-platform

# 2. Run setup script
.\setup.ps1

# This will:
# - Create Python virtual environment
# - Install all dependencies
# - Set up environment files
# - Create necessary directories
```

### Option 2: Manual Setup

#### Backend Setup

```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env

# Edit .env and CHANGE DEFAULT PASSWORDS!
```

#### Frontend Setup

```powershell
# Navigate to frontend (in new terminal)
cd frontend

# Install dependencies
npm install

# Create environment file
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
echo NEXT_PUBLIC_APP_NAME=DrishtiXAI >> .env.local
```

## 🏃 Running the Application

### Terminal 1: Start Backend

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

✅ Backend running at: http://localhost:8000  
📚 API Docs: http://localhost:8000/api/docs

### Terminal 2: Start Frontend

```powershell
cd frontend
npm run dev
```

✅ Frontend running at: http://localhost:3000

## 🔐 First Login

Open http://localhost:3000 and login with:

- **Username**: `admin`
- **Password**: `change-me-in-production`

⚠️ **IMPORTANT**: Change this password in production!

## 📋 Try the Complete Workflow

### 1. Register a Patient

1. Click **Patients** → **Register New Patient**
2. Fill in patient information:
   - Patient ID: `DEMO001`
   - Name: `Test Patient`
   - Age: `45`
   - Gender: `Male`
   - Has Diabetes: `Yes`
3. Click **Register & Proceed to Screening**

### 2. Perform Screening

1. Select eye side (Left or Right)
2. Upload a fundus image (or use a test image)
3. Click **Upload & Analyze**
4. Wait for AI analysis (~5-10 seconds)

### 3. View Results

The system will display:
- ✅ Image Quality Assessment
- 🔍 DR Severity Prediction
- 🧠 AI Explanation (Grad-CAM heatmap)
- 📊 Referral Priority Recommendation

### 4. Clinician Review (Optional)

If you're logged in as a clinician or admin:
1. Navigate to **Reviews** to see pending cases
2. Click on a screening to review
3. Agree/disagree with AI assessment
4. Add clinical notes
5. Submit review

## 🧪 Running Tests

```powershell
# Backend tests
cd backend
.\venv\Scripts\Activate.ps1
pytest tests/ -v

# Expected output: All tests should pass
```

## 🐳 Docker Quick Start

If you prefer Docker:

```powershell
# Build and run all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# Database: localhost:5432
```

Stop services:
```powershell
docker-compose down
```

## 📊 Features to Try

### Health Worker Interface
- ✅ Patient registration with medical history
- ✅ Image capture/upload
- ✅ Automatic quality checking
- ✅ Simple screening results
- ✅ Referral recommendations

### Clinician Dashboard
- ✅ Review queue (high-priority cases)
- ✅ Detailed screening reports
- ✅ AI explanation visualization
- ✅ Clinical review workflow
- ✅ Override AI decisions

### Admin Analytics
- ✅ System dashboard with metrics
- ✅ Model performance analytics
- ✅ Confidence distribution charts
- ✅ Quality metrics
- ✅ Clinician agreement rates

## 🔍 Verify Installation

### Check Backend

```powershell
# Test health endpoint
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","environment":"development","demo_mode":true}
```

### Check Frontend

Open http://localhost:3000 - you should see the landing page with the DrishtiXAI logo.

## 🐛 Troubleshooting

### Backend won't start

**Error**: "No module named 'app'"
```powershell
# Make sure you're in the backend directory and venv is activated
cd backend
.\venv\Scripts\Activate.ps1
```

**Error**: "Address already in use"
```powershell
# Port 8000 is occupied, use different port
uvicorn app.main:app --reload --port 8001
```

### Frontend won't start

**Error**: "npm: command not found"
```powershell
# Install Node.js from nodejs.org
```

**Error**: "Port 3000 already in use"
```powershell
# Use different port
$env:PORT=3001; npm run dev
```

### Database errors

**Error**: "could not connect to database"
```powershell
# The app uses SQLite by default (no setup needed)
# Check if database file can be created in backend directory
```

### Can't login

1. Make sure backend is running
2. Check credentials (username: `admin`, password: `change-me-in-production`)
3. Check browser console for errors (F12)
4. Try clearing browser cache/cookies

## 📱 Testing on Mobile

The interface is mobile-responsive:

1. Find your local IP address:
```powershell
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

2. Update frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=http://192.168.1.100:8000
```

3. Access from mobile browser:
```
http://192.168.1.100:3000
```

## 🎯 Demo Mode

The system runs in **DEMO MODE** by default:
- Uses synthetic AI predictions
- No trained model required
- Clearly labeled as "DEMO"
- Perfect for evaluation and testing

To use a real trained model:
1. Train or obtain a DR classification model
2. Save as `.pth` file in `models/` directory
3. Edit `backend/.env`:
```
DEMO_MODE=false
MODEL_PATH=./models/your_model.pth
```
4. Restart backend

## 📚 Next Steps

1. **Explore the Interface**: Try all three user roles
2. **Read the Documentation**: Check out ARCHITECTURE.md and MODEL_CARD.md
3. **Review the Code**: Understand the ML pipeline
4. **Customize**: Modify for your specific needs
5. **Deploy**: See README.md for production deployment

## 🆘 Need Help?

- **Documentation**: See README.md for comprehensive guide
- **Architecture**: See ARCHITECTURE.md for system design
- **Model Info**: See MODEL_CARD.md for AI details
- **API Docs**: http://localhost:8000/api/docs (when backend running)

## ⚠️ Important Reminders

1. **This is a DEMO/RESEARCH PROTOTYPE**
2. **NOT for clinical use without validation**
3. **Change default passwords in production**
4. **Review security settings before deployment**
5. **Obtain proper regulatory approvals**

## ✅ Quick Checklist

- [ ] Python 3.9+ installed
- [ ] Node.js 18+ installed
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Can login with admin credentials
- [ ] Can register a test patient
- [ ] Can perform a test screening
- [ ] Can view screening results
- [ ] Tests pass successfully

## 🎉 You're All Set!

DrishtiXAI is ready for evaluation and demonstration. Enjoy exploring the explainable AI screening system!

---

**Smart India Hackathon 2026** | **SIH26038** | **MathWorks**
