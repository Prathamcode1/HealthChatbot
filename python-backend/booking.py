import re
from typing import Optional

def detect_intent(message: str) -> dict:
    lower = message.lower()
    booking_keywords = []
    health_keywords = ["symptom", "disease", "condition", "treatment", "pain", "fever", "cough", "diabetes", "cancer", "blood pressure", "what is", "how do", "should i", "is it normal", "लक्षण", "बुखार", "दर्द", "कैंसर", "रोग", "anemia"]
    is_booking = any(k in lower for k in booking_keywords)
    is_health = any(k in lower for k in health_keywords)
    return {"isBookingIntent": is_booking, "isHealthQuery": is_health}

def extract_slot(message: str, slot_type: str) -> Optional[str]:
    lower = message.lower()
    if slot_type == "patientName":
        patterns = [r"my name is ([a-z\s]+)", r"i'm ([a-z\s]+)", r"i am ([a-z\s]+)", r"call me ([a-z\s]+)"]
        for p in patterns:
            m = re.search(p, message, re.I)
            if m:
                return m.group(1).strip()
        if len(message) < 50 and not re.search(r"@", message) and re.match(r"^[a-z\s]+$", message, re.I):
            return message.strip()
    elif slot_type == "patientEmail":
        m = re.search(r"[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}", message, re.I)
        if m:
            return m.group(0)
    elif slot_type == "timezone":
        tz_map = {
            "eastern": "America/New_York", "est": "America/New_York", "edt": "America/New_York",
            "central": "America/Chicago", "cst": "America/Chicago", "cdt": "America/Chicago",
            "mountain": "America/Denver", "mst": "America/Denver", "mdt": "America/Denver",
            "pacific": "America/Los_Angeles", "pst": "America/Los_Angeles", "pdt": "America/Los_Angeles"
        }
        for key, tz in tz_map.items():
            if key in lower:
                return tz
    elif slot_type == "appointmentDate":
        # simple date extraction (e.g., "tomorrow at 2pm")
        # you can expand this
        pass
    return None

def get_next_missing_slot(slots: dict) -> Optional[str]:
    required = ["patientName", "patientEmail", "doctorId", "appointmentDate", "timezone"]
    for s in required:
        if not slots.get(s):
            return s
    return None

def get_slot_prompt(slot_type: str) -> str:
    prompts = {
        "patientName": "May I have your full name?",
        "patientEmail": "What is your email address?",
        "doctorId": "Which doctor would you like to see? (e.g., Dr. Sarah Johnson, Endocrinologist)",
        "appointmentDate": "When would you like to schedule the appointment? (e.g., tomorrow at 2pm)",
        "timezone": "What is your timezone? (e.g., Eastern, Central, Pacific)",
        "reason": "What is the reason for your visit?"
    }
    return prompts.get(slot_type, "Could you provide more information?")

def format_confirmation(slots: dict, doctor_name: str) -> str:
    return f"Please confirm your appointment:\n- Name: {slots.get('patientName')}\n- Email: {slots.get('patientEmail')}\n- Doctor: {doctor_name}\n- Date: {slots.get('appointmentDate')}\n- Timezone: {slots.get('timezone')}\n- Reason: {slots.get('reason', 'General consultation')}\n\nReply 'yes' to confirm."