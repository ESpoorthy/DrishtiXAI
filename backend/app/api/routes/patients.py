"""
Patient management routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ...db import get_db
from ...models.patient import Patient
from ...models.user import User
from ...schemas.patient import PatientCreate, PatientResponse
from ..dependencies import get_current_user, require_health_worker

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def register_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_health_worker)
):
    """
    Register a new patient
    
    Health workers can register patients at their facility
    """
    # Check if patient ID already exists
    existing = db.query(Patient).filter(
        Patient.patient_id == patient_data.patient_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Patient with ID {patient_data.patient_id} already exists"
        )
    
    # Create patient
    patient = Patient(
        **patient_data.model_dump(),
        registered_by=current_user.id,
        facility_name=current_user.facility_name
    )
    
    db.add(patient)
    db.commit()
    db.refresh(patient)
    
    return patient


@router.get("", response_model=List[PatientResponse])
def list_patients(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List patients
    
    Returns patients registered at user's facility
    """
    query = db.query(Patient)
    
    # Filter by facility for non-admin users
    if current_user.role != "admin" and current_user.facility_name:
        query = query.filter(Patient.facility_name == current_user.facility_name)
    
    patients = query.offset(skip).limit(limit).all()
    return patients


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get patient details by ID
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Check access
    if (current_user.role != "admin" and 
        current_user.facility_name and
        patient.facility_name != current_user.facility_name):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return patient


@router.get("/search/{patient_id_str}", response_model=PatientResponse)
def search_patient_by_id(
    patient_id_str: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search patient by their patient_id string (facility-assigned ID)
    """
    patient = db.query(Patient).filter(Patient.patient_id == patient_id_str).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id_str} not found"
        )
    
    # Check access
    if (current_user.role != "admin" and 
        current_user.facility_name and
        patient.facility_name != current_user.facility_name):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return patient
