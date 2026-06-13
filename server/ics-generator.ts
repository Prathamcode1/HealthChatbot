import { formatInTimeZone } from "date-fns-tz";

export function generateICS(
  patientName: string,
  patientEmail: string,
  doctorName: string,
  appointmentDate: Date,
  timezone: string,
  reason?: string
): string {
  const formatDate = (date: Date) => {
    return formatInTimeZone(date, timezone, "yyyyMMdd'T'HHmmss");
  };

  const startTime = formatDate(appointmentDate);
  const endDate = new Date(appointmentDate.getTime() + 60 * 60 * 1000);
  const endTime = formatDate(endDate);
  
  const now = new Date();
  const dtstamp = formatInTimeZone(now, "UTC", "yyyyMMdd'T'HHmmss'Z'");
  
  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@healthai.app`;
  
  const summary = `Medical Appointment with ${doctorName}`;
  const description = reason 
    ? `Appointment with ${doctorName}\\nReason: ${reason}\\nPatient: ${patientName}`
    : `Appointment with ${doctorName}\\nPatient: ${patientName}`;
  
  const location = "HealthAI Medical Center";
  
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HealthAI//Appointment Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=${timezone}:${startTime}`,
    `DTEND;TZID=${timezone}:${endTime}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `ATTENDEE;CN=${patientName};RSVP=TRUE:mailto:${patientEmail}`,
    `ORGANIZER;CN=${doctorName}:mailto:appointments@healthai.app`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${summary} in 15 minutes`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  
  return icsContent;
}
