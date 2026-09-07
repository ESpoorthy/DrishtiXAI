"""
Audit log model for tracking all system actions
Critical for medical AI accountability and trust
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from ..db.base import Base


class AuditLog(Base):
    """
    Audit log for tracking all critical actions in the system
    Essential for trustworthy AI and regulatory compliance
    """
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Who did what
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_role = Column(String, nullable=True)
    action = Column(String, nullable=False, index=True)  # e.g., "screening_analyzed", "clinician_review"
    
    # What was affected
    screening_id = Column(Integer, ForeignKey("screenings.id"), nullable=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True, index=True)
    
    # Details
    details = Column(Text, nullable=True)  # JSON string with action details
    model_version = Column(String, nullable=True)
    
    # Audit trail metadata
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    
    # Timestamp
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    def __repr__(self):
        return f"<AuditLog {self.action} by User {self.user_id} at {self.timestamp}>"
