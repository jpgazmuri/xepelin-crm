from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import models, schemas
from database import get_db

router = APIRouter(prefix="/notes", tags=["notes"])

@router.get("/company/{company_id}", response_model=list[schemas.NoteOut])
def get_notes(company_id: int, db: Session = Depends(get_db)):
    return db.query(models.Note)\
             .filter(models.Note.company_id == company_id)\
             .order_by(models.Note.created_at.desc())\
             .all()

@router.post("/company/{company_id}", response_model=schemas.NoteOut)
def create_note(company_id: int, note: schemas.NoteCreate, db: Session = Depends(get_db)):
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    new_note = models.Note(company_id=company_id, content=note.content)
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

@router.patch("/{note_id}", response_model=schemas.NoteOut)
def update_note(note_id: int, update: schemas.NoteUpdate, db: Session = Depends(get_db)):
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    note.content = update.content
    note.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(note)
    return note

@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    db.delete(note)
    db.commit()
    return {"ok": True}