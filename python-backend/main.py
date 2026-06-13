import uuid
import os
import json
import math
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request, Response, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from ehr_predictor import init_ehr_predictor, get_ehr_predictor
from rag import RAGSystem, process_pdf_bytes
from gemini_client import generate_chat_response
from booking import detect_intent, extract_slot, get_next_missing_slot, get_slot_prompt, format_confirmation
from ics_generator import generate_ics
from models import ChatRequest, ChatResponse, AppointmentRequest, AppointmentResponse, Doctor, Conversation
from storage import Storage
from tb_predictor import init_tb_predictor, get_tb_predictor

# ---------- In-memory store for uploaded documents ----------
UPLOADED_DOCS_MEMORY: dict[str, list] = {}

# ---------- Helper: cosine similarity ----------
def cosine_similarity(a: list, b: list) -> float:
    dot = sum(x*y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x*x for x in a))
    norm_b = math.sqrt(sum(y*y for y in b))
    return dot / (norm_a * norm_b) if norm_a and norm_b else 0

# ---------- Helper: search uploaded docs ----------
async def search_uploaded_docs(conv_id: str, query_embedding: list, top_k: int = 3, threshold: float = 0.05):
    chunks = UPLOADED_DOCS_MEMORY.get(conv_id, [])
    if not chunks:
        return []
    results = []
    for chunk in chunks:
        score = cosine_similarity(query_embedding, chunk["embedding"])
        if score > threshold:
            results.append((chunk["source"], chunk["content"], score))
    results.sort(key=lambda x: x[2], reverse=True)
    return results[:top_k]

# ---------- Lifespan ----------
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading RAG system...")
    app.state.rag = RAGSystem("pdfs")   # PDFs are in python-backend/pdfs
    init_ehr_predictor()
    init_tb_predictor()
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ---------- API Routes ----------
@app.post("/api/upload-pdf")
async def upload_pdf(
    conversationId: str = Form(""),
    file: UploadFile = File(...)
):
    if not conversationId or conversationId.strip() == "":
        conv = await Storage.create_conversation()
        conversationId = conv.id
        print(f"Created new conversation for upload: {conversationId}")
    else:
        print(f"Upload using existing conversation: {conversationId}")

    if not file.filename.endswith('.pdf'):
        raise HTTPException(400, "Only PDF files are allowed")
    contents = await file.read()
    model = app.state.rag.model
    chunks = process_pdf_bytes(contents, file.filename, model)
    if not chunks:
        raise HTTPException(400, "Could not extract text from PDF")
    if conversationId not in UPLOADED_DOCS_MEMORY:
        UPLOADED_DOCS_MEMORY[conversationId] = []
    UPLOADED_DOCS_MEMORY[conversationId].extend(chunks)
    print(f"Uploaded {len(chunks)} chunks for conversation {conversationId}")
    return {"message": f"Processed {len(chunks)} chunks from {file.filename}", "conversationId": conversationId}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    conv_id = req.conversationId
    if not conv_id:
        conv = await Storage.create_conversation()
        conv_id = conv.id
    await Storage.create_chat_message(conv_id, "user", req.content)

    conv = await Storage.get_conversation(conv_id)
    slots = json.loads(conv.slots) if conv and conv.slots else {}

    intent = detect_intent(req.content)
    is_booking = intent["isBookingIntent"]
    is_health = intent["isHealthQuery"]
    is_in_booking_flow = any(slots.get(k) for k in ["patientName", "patientEmail", "doctorId"])

    # Booking flow
    if is_booking or is_in_booking_flow:
        for slot in ["patientName", "patientEmail", "timezone", "appointmentDate"]:
            if not slots.get(slot):
                val = extract_slot(req.content, slot)
                if val:
                    slots[slot] = val
        if not slots.get("doctorId"):
            doctors = await Storage.get_doctors()
            lower = req.content.lower()
            for doc in doctors:
                if doc.name.lower() in lower or doc.specialty.lower() in lower:
                    slots["doctorId"] = doc.id
                    break
        await Storage.update_conversation_slots(conv_id, slots)

        next_slot = get_next_missing_slot(slots)
        if next_slot == "doctorId":
            doctors = await Storage.get_doctors()
            avail = [d for d in doctors if d.available]
            prompt = "Which doctor would you like to see?\n\nAvailable doctors:\n" + "\n".join(f"- {d.name} ({d.specialty})" for d in avail)
            response = prompt
        elif next_slot:
            response = get_slot_prompt(next_slot)
        else:
            doctor = None
            doctors = await Storage.get_doctors()
            for d in doctors:
                if d.id == slots.get("doctorId"):
                    doctor = d
                    break
            if doctor:
                response = format_confirmation(slots, doctor.name)
            else:
                response = "All information collected. Reply 'yes' to confirm your appointment."
        if (req.content.lower() in ("yes", "confirm") and next_slot is None):
            doctor = next((d for d in await Storage.get_doctors() if d.id == slots.get("doctorId")), None)
            if doctor:
                await Storage.create_appointment({
                    "patientName": slots["patientName"],
                    "patientEmail": slots["patientEmail"],
                    "doctorId": slots["doctorId"],
                    "appointmentDate": datetime.now(),
                    "timezone": slots.get("timezone", "America/New_York"),
                    "reason": slots.get("reason")
                })
                response = "Your appointment has been booked successfully! A calendar invite will be sent to your email."
                await Storage.update_conversation_slots(conv_id, {})
            else:
                response = "Sorry, there was an error booking your appointment. Please try again."
        await Storage.create_chat_message(conv_id, "assistant", response)
        return ChatResponse(conversationId=conv_id, response=response, citations=[])

    # Health queries
    if is_health:
        global_results = app.state.rag.search(req.content)
        query_emb = app.state.rag.model.encode(req.content).tolist()
        uploaded_results = await search_uploaded_docs(conv_id, query_emb, top_k=3, threshold=0.05)
        all_results = uploaded_results + global_results
        all_results.sort(key=lambda x: x[2], reverse=True)
        rag_results = all_results[:3]

        if rag_results:
            context = "\n\n".join(f"[{sid}] {text}" for sid, text, _ in rag_results)
            citations = [sid for sid, _, _ in rag_results]
            system_prompt = f"You are a helpful health assistant. Use the following medical information to answer the user's question. Always cite your sources using the format [SOURCE_ID].\n\nMedical Information:\n{context}\n\nProvide a clear, helpful answer based on this information. Include citations."
            answer = await generate_chat_response(req.content, system_prompt)
            await Storage.create_chat_message(conv_id, "assistant", answer, citations)
            return ChatResponse(conversationId=conv_id, response=answer, citations=citations)
        else:
            system_prompt = "You are a helpful health assistant. Provide accurate, helpful health information based on your knowledge. Be clear and balanced. If you're uncertain, recommend consulting a doctor."
            answer = await generate_chat_response(req.content, system_prompt)
            await Storage.create_chat_message(conv_id, "assistant", answer)
            return ChatResponse(conversationId=conv_id, response=answer, citations=[])

    # Non‑health
    default_response = "Hello! I'm your AI health assistant. I can help you with health questions and book appointments with our doctors. How can I assist you today?"
    await Storage.create_chat_message(conv_id, "assistant", default_response)
    return ChatResponse(conversationId=conv_id, response=default_response, citations=[])

# ---------- Other API endpoints ----------
@app.get("/api/doctors")
async def get_doctors():
    return await Storage.get_doctors()

@app.post("/api/appointments", response_model=AppointmentResponse)
async def create_appointment(req: AppointmentRequest):
    appt = await Storage.create_appointment(req.model_dump())
    return appt

@app.get("/api/appointments")
async def get_appointments():
    return await Storage.get_all_appointments()

@app.get("/api/appointments/{appt_id}/ics")
async def get_appointment_ics(appt_id: str):
    appt = await Storage.get_appointment(appt_id)
    if not appt:
        raise HTTPException(404, "Appointment not found")
    doctors = await Storage.get_doctors()
    doctor = next((d for d in doctors if d.id == appt.doctorId), None)
    if not doctor:
        raise HTTPException(404, "Doctor not found")
    ics = generate_ics(appt.patientName, appt.patientEmail, doctor.name, appt.appointmentDate, appt.timezone, appt.reason or "")
    return Response(content=ics, media_type="text/calendar", headers={"Content-Disposition": f"attachment; filename=appointment-{appt_id}.ics"})

@app.post("/api/conversations")
async def create_conversation():
    conv = await Storage.create_conversation()
    return conv

@app.get("/api/conversations")
async def get_conversations():
    return await Storage.get_all_conversations()

@app.get("/api/messages/{conv_id}")
async def get_messages(conv_id: str):
    return await Storage.get_messages_by_conversation(conv_id)

# ---------- EHR (10‑Year CHD) Prediction Endpoint ----------
@app.post("/api/predict/ehr")
async def predict_ehr(request: Request):
    data = await request.json()
    try:
        predictor = get_ehr_predictor()
        prediction, probability = predictor.predict(data)
        return {
            "prediction": prediction,
            "probability": probability,
            "message": "High risk of CHD in 10 years" if prediction == 1 else "Low risk of CHD in 10 years"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ---------- TB Chest X‑ray Prediction Endpoint ----------
@app.post("/api/predict/tb")
async def predict_tb(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(400, "Only image files (PNG, JPG, JPEG) are allowed")
    contents = await file.read()
    try:
        predictor = get_tb_predictor()
        result = predictor.predict(contents)
        return result
    except Exception as e:
        raise HTTPException(400, detail=str(e))

# ---------- Serve Static Frontend ----------
frontend_path = os.path.join(os.path.dirname(__file__), "../dist/public")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
else:
    print(f"Frontend not found at {frontend_path}")
    @app.get("/")
    async def root():
        return {"message": "Frontend not built. Run 'npm run build' first."}