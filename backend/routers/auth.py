from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import bcrypt
import models
from database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginInput(BaseModel):
    email: str
    password: str

class KAMOut(BaseModel):
    id: int
    name: str
    email: str
    country: str

    class Config:
        from_attributes = True

@router.post("/login", response_model=KAMOut)
def login(input: LoginInput, db: Session = Depends(get_db)):
    """Login con email y contraseña — verifica credenciales contra la DB."""
    kam = db.query(models.KAM).filter(models.KAM.email == input.email).first()
    if not kam:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if not kam.password_hash:
        raise HTTPException(status_code=401, detail="Este usuario usa OAuth. Inicia sesión con Google.")
    if not bcrypt.checkpw(input.password.encode(), kam.password_hash.encode()):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return kam

@router.get("/kam-by-email", response_model=KAMOut)
def get_kam_by_email(email: str, db: Session = Depends(get_db)):
    """Obtener KAM por email — usado por NextAuth para validar sesiones OAuth."""
    kam = db.query(models.KAM).filter(models.KAM.email == email).first()
    if not kam:
        raise HTTPException(status_code=404, detail="KAM no encontrado")
    return kam