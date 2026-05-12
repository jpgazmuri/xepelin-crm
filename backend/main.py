from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import companies, notes, health, auth

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Xepelin CRM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://xepelin-crm.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(companies.router)
app.include_router(notes.router)
app.include_router(health.router)
app.include_router(auth.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "xepelin-crm-api"}