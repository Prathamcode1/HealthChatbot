import uuid
import csv
import json
from datetime import datetime
from typing import List, Optional, Dict
from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from models import Appointment, Conversation, ChatMessage, Doctor
from config import DATABASE_URL

# ---------- Database setup ----------
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ---------- SQLAlchemy model for uploaded chunks ----------
class UploadedChunkDB(Base):
    __tablename__ = "uploaded_chunks"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, index=True, nullable=False)
    filename = Column(String, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Text, nullable=False)   # JSON string of list
    source = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)

# ---------- In-memory fallback (if DB not configured) ----------
_memory_appointments: Dict[str, Appointment] = {}
_memory_conversations: Dict[str, Conversation] = {}
_memory_messages: Dict[str, ChatMessage] = {}
_memory_doctors: List[Doctor] = []

def init_db():
    """Create all tables if they don't exist"""
    Base.metadata.create_all(engine)

# ---------- Storage class with both memory and DB methods ----------
class Storage:
    # ----- Doctors -----
    @staticmethod
    async def get_doctors() -> List[Doctor]:
        if _memory_doctors:
            return _memory_doctors
        csv_path = "../attached_assets/doctors_300_dataset_1763920263351.csv"
        import os
        if os.path.exists(csv_path):
            doctors = []
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    doctors.append(Doctor(
                        id=row.get('doctor_id', str(uuid.uuid4())),
                        name=row.get('doctor_name_en', 'Unknown'),
                        specialty=row.get('specialty', 'General Practice'),
                        subSpecialty=row.get('sub_specialty'),
                        hospitalName=row.get('hospital_name'),
                        locationArea=row.get('location_area'),
                        rating=float(row['rating']) if row.get('rating') else None,
                        fee=int(row['fee']) if row.get('fee') else None,
                        avatar="",
                        available=row.get('telemedicine') == 'True'
                    ))
            _memory_doctors.extend(doctors)
            return _memory_doctors
        # Fallback
        if not _memory_doctors:
            _memory_doctors.append(Doctor(id="dr-sarah-johnson", name="Dr. Sarah Johnson", specialty="Endocrinologist", avatar="", available=True))
            _memory_doctors.append(Doctor(id="dr-michael-chen", name="Dr. Michael Chen", specialty="Cardiologist", avatar="", available=True))
            _memory_doctors.append(Doctor(id="dr-emily-rodriguez", name="Dr. Emily Rodriguez", specialty="Oncologist", avatar="", available=True))
        return _memory_doctors

    # ----- Appointments -----
    @staticmethod
    async def create_appointment(data: dict) -> Appointment:
        appt_id = str(uuid.uuid4())
        now = datetime.now()
        appointment = Appointment(
            id=appt_id,
            patientName=data['patientName'],
            patientEmail=data['patientEmail'],
            doctorId=data['doctorId'],
            appointmentDate=data['appointmentDate'],
            timezone=data['timezone'],
            status="confirmed",
            reason=data.get('reason'),
            createdAt=now
        )
        _memory_appointments[appt_id] = appointment
        return appointment

    @staticmethod
    async def get_appointment(appt_id: str) -> Optional[Appointment]:
        return _memory_appointments.get(appt_id)

    @staticmethod
    async def get_all_appointments() -> List[Appointment]:
        return list(_memory_appointments.values())

    # ----- Conversations -----
    @staticmethod
    async def create_conversation() -> Conversation:
        conv_id = str(uuid.uuid4())
        now = datetime.now()
        conv = Conversation(id=conv_id, title=None, slots=None, createdAt=now, updatedAt=now)
        _memory_conversations[conv_id] = conv
        return conv

    @staticmethod
    async def get_conversation(conv_id: str) -> Optional[Conversation]:
        return _memory_conversations.get(conv_id)

    @staticmethod
    async def get_all_conversations() -> List[Conversation]:
        return sorted(_memory_conversations.values(), key=lambda c: c.updatedAt, reverse=True)

    @staticmethod
    async def update_conversation_slots(conv_id: str, slots: dict) -> None:
        conv = _memory_conversations.get(conv_id)
        if conv:
            conv.slots = json.dumps(slots)
            conv.updatedAt = datetime.now()

    @staticmethod
    async def update_conversation_title(conv_id: str, title: str) -> None:
        conv = _memory_conversations.get(conv_id)
        if conv:
            conv.title = title
            conv.updatedAt = datetime.now()

    # ----- Chat Messages -----
    @staticmethod
    async def create_chat_message(conv_id: str, role: str, content: str, citations: List[str] = None) -> ChatMessage:
        msg_id = str(uuid.uuid4())
        msg = ChatMessage(
            id=msg_id,
            conversationId=conv_id,
            role=role,
            content=content,
            citations=citations,
            createdAt=datetime.now()
        )
        _memory_messages[msg_id] = msg
        return msg

    @staticmethod
    async def get_messages_by_conversation(conv_id: str) -> List[ChatMessage]:
        return [m for m in _memory_messages.values() if m.conversationId == conv_id]

# ---------- Uploaded chunks DB operations ----------
async def save_uploaded_chunks(conversation_id: str, filename: str, chunks: list):
    """chunks: list of dicts with keys: content, embedding, source"""
    session = SessionLocal()
    try:
        for idx, chunk in enumerate(chunks):
            db_chunk = UploadedChunkDB(
                conversation_id=conversation_id,
                filename=filename,
                chunk_index=idx,
                content=chunk["content"],
                embedding=json.dumps(chunk["embedding"]),
                source=chunk["source"],
            )
            session.add(db_chunk)
        session.commit()
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

async def get_uploaded_chunks(conversation_id: str):
    session = SessionLocal()
    try:
        rows = session.query(UploadedChunkDB).filter(
            UploadedChunkDB.conversation_id == conversation_id
        ).order_by(UploadedChunkDB.chunk_index).all()
        print(f"DEBUG: Found {len(rows)} rows in DB for conv {conversation_id}")
        chunks = []
        for row in rows:
            chunks.append({
                "source": row.source,
                "content": row.content,
                "embedding": json.loads(row.embedding)
            })
        return chunks
    finally:
        session.close()

async def delete_uploaded_chunks_for_conversation(conversation_id: str):
    session = SessionLocal()
    try:
        session.query(UploadedChunkDB).filter(
            UploadedChunkDB.conversation_id == conversation_id
        ).delete()
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()