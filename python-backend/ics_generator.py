from icalendar import Calendar, Event
from datetime import timedelta
import uuid

def generate_ics(patient_name: str, patient_email: str, doctor_name: str,
                 appointment_date, timezone: str, reason: str = "") -> str:
    cal = Calendar()
    cal.add('prodid', '-//HealthAI//Appointment Booking//EN')
    cal.add('version', '2.0')
    event = Event()
    event.add('uid', f"{uuid.uuid4()}@healthai.app")
    event.add('dtstart', appointment_date)
    event.add('dtend', appointment_date + timedelta(hours=1))
    event.add('summary', f"Medical Appointment with {doctor_name}")
    event.add('description', f"Appointment with {doctor_name}\\nReason: {reason}\\nPatient: {patient_name}")
    event.add('location', "HealthAI Medical Center")
    event.add('attendee', f"mailto:{patient_email}")
    cal.add_component(event)
    return cal.to_ical().decode('utf-8')