"""
File handling utilities
"""
import os
import uuid
from pathlib import Path
from fastapi import UploadFile
from ..core.config import settings


def allowed_file(filename: str) -> bool:
    """
    Check if file extension is allowed
    
    Args:
        filename: Name of the file
        
    Returns:
        True if file extension is allowed
    """
    return Path(filename).suffix.lower() in settings.ALLOWED_EXTENSIONS


def generate_unique_filename(original_filename: str) -> str:
    """
    Generate unique filename while preserving extension
    
    Args:
        original_filename: Original filename
        
    Returns:
        Unique filename
    """
    extension = Path(original_filename).suffix
    unique_name = f"{uuid.uuid4()}{extension}"
    return unique_name


async def save_upload_file(upload_file: UploadFile, destination: str) -> str:
    """
    Save uploaded file to destination
    
    Args:
        upload_file: FastAPI UploadFile object
        destination: Destination path
        
    Returns:
        Path where file was saved
    """
    # Ensure destination directory exists
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    
    # Save file
    with open(destination, "wb") as f:
        content = await upload_file.read()
        f.write(content)
    
    return destination


def get_upload_path(filename: str, user_id: int) -> str:
    """
    Generate upload path for a file
    
    Args:
        filename: Name of the file
        user_id: ID of user uploading
        
    Returns:
        Full path where file should be saved
    """
    # Organize by user ID for better management
    user_dir = Path(settings.UPLOAD_DIR) / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    unique_filename = generate_unique_filename(filename)
    
    return str(user_dir / unique_filename)
