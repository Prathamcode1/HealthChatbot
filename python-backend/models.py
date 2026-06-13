from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# ---------- Chat ----------
class ChatRequest(BaseModel):
    content: str
    conversationId: Optional[str] = None

class ChatResponse(BaseModel):
    conversationId: str
    response: str
    citations: List[str] = []

# ---------- Appointment ----------
class Appointment(BaseModel):
    id: str
    patientName: str
    patientEmail: str
    doctorId: str
    appointmentDate: datetime
    timezone: str
    status: str
    reason: Optional[str] = None
    createdAt: datetime

class AppointmentCreate(BaseModel):
    patientName: str
    patientEmail: str
    doctorId: str
    appointmentDate: datetime
    timezone: str
    reason: Optional[str] = None

class AppointmentRequest(BaseModel):
    patientName: str
    patientEmail: str
    doctorId: str
    appointmentDate: datetime
    timezone: str
    reason: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: str
    patientName: str
    patientEmail: str
    doctorId: str
    appointmentDate: datetime
    timezone: str
    status: str
    reason: Optional[str] = None
    createdAt: datetime

# ---------- Doctor ----------
class Doctor(BaseModel):
    id: str
    name: str
    specialty: str
    subSpecialty: Optional[str] = None
    hospitalName: Optional[str] = None
    locationArea: Optional[str] = None
    rating: Optional[float] = None
    fee: Optional[int] = None
    avatar: str = ""
    available: bool

# ---------- Conversation ----------
class Conversation(BaseModel):
    id: str
    title: Optional[str] = None
    slots: Optional[str] = None      # JSON string
    createdAt: datetime
    updatedAt: datetime

# ---------- Chat Message ----------
class ChatMessage(BaseModel):
    id: str
    conversationId: str
    role: str
    content: str
    citations: Optional[List[str]] = None
    createdAt: datetime

# ---------- Uploaded Chunk ----------
class UploadedChunk(BaseModel):
    id: str
    conversationId: str
    filename: str
    chunk_index: int
    content: str
    embedding: List[float]
    source: str
    created_at: datetime