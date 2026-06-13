import type { ConversationSlots } from "../shared/schema";
import templates from "../shared/templates.json";

export function detectIntent(message: string): {
  isBookingIntent: boolean;
  isHealthQuery: boolean;
} {
  const lowerMessage = message.toLowerCase();
  
  const bookingKeywords = [
    "book", "appointment", "schedule", "doctor", "see a doctor",
    "consultation", "visit", "meet", "reserve"
  ];
  
  const healthKeywords = [
    "symptom", "disease", "condition", "treatment", "pain",
    "fever", "cough", "diabetes", "cancer", "blood pressure",
    "what is", "how do", "should i", "is it normal"
  ];
  
  const isBookingIntent = bookingKeywords.some(keyword => lowerMessage.includes(keyword));
  const isHealthQuery = healthKeywords.some(keyword => lowerMessage.includes(keyword));
  
  return { isBookingIntent, isHealthQuery };
}

export function extractSlotFromMessage(
  message: string,
  slotType: keyof ConversationSlots
): string | null {
  const lowerMessage = message.toLowerCase();
  
  if (slotType === "patientName") {
    const namePatterns = [
      /my name is ([a-z\s]+)/i,
      /i'm ([a-z\s]+)/i,
      /i am ([a-z\s]+)/i,
      /call me ([a-z\s]+)/i,
    ];
    
    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match) return match[1].trim();
    }
    
    if (message.length < 50 && !lowerMessage.includes("@") && /^[a-z\s]+$/i.test(message)) {
      return message.trim();
    }
  }
  
  if (slotType === "patientEmail") {
    const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
    const match = message.match(emailPattern);
    if (match) return match[0];
  }
  
  if (slotType === "timezone") {
    const timezones = [
      "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
      "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Shanghai", "Australia/Sydney",
      "EST", "CST", "MST", "PST", "GMT", "UTC"
    ];
    
    for (const tz of timezones) {
      if (lowerMessage.includes(tz.toLowerCase()) || lowerMessage.replace(/\s+/g, "_").includes(tz.toLowerCase())) {
        return tz.includes("/") ? tz : `America/${tz}`;
      }
    }
    
    if (lowerMessage.includes("eastern") || lowerMessage.includes("est") || lowerMessage.includes("edt")) {
      return "America/New_York";
    }
    if (lowerMessage.includes("central") || lowerMessage.includes("cst") || lowerMessage.includes("cdt")) {
      return "America/Chicago";
    }
    if (lowerMessage.includes("mountain") || lowerMessage.includes("mst") || lowerMessage.includes("mdt")) {
      return "America/Denver";
    }
    if (lowerMessage.includes("pacific") || lowerMessage.includes("pst") || lowerMessage.includes("pdt")) {
      return "America/Los_Angeles";
    }
  }
  
  if (slotType === "appointmentDate") {
    const datePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})|(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/;
    const timePattern = /(\d{1,2}):(\d{2})\s*(am|pm)?/i;
    
    const dateMatch = message.match(datePattern);
    const timeMatch = message.match(timePattern);
    
    if (dateMatch && timeMatch) {
      try {
        const date = new Date(dateMatch[0]);
        const [, hours, minutes, ampm] = timeMatch;
        let hour = parseInt(hours);
        
        if (ampm && ampm.toLowerCase() === "pm" && hour < 12) {
          hour += 12;
        } else if (ampm && ampm.toLowerCase() === "am" && hour === 12) {
          hour = 0;
        }
        
        date.setHours(hour, parseInt(minutes), 0, 0);
        return date.toISOString();
      } catch (e) {
        return null;
      }
    }
  }
  
  return null;
}

export function getNextMissingSlot(slots: ConversationSlots): keyof ConversationSlots | null {
  const requiredSlots: Array<keyof ConversationSlots> = [
    "patientName",
    "patientEmail",
    "doctorId",
    "appointmentDate",
    "timezone",
  ];
  
  for (const slot of requiredSlots) {
    if (!slots[slot]) {
      return slot;
    }
  }
  
  return null;
}

export function getSlotPrompt(slotType: keyof ConversationSlots): string {
  const prompts: Record<keyof ConversationSlots, string> = {
    patientName: templates.chat.askPatientName,
    patientEmail: templates.chat.askPatientEmail,
    doctorId: templates.chat.askDoctorPreference,
    appointmentDate: templates.chat.askAppointmentDate,
    timezone: templates.chat.askTimezone,
    reason: templates.chat.askReason,
  };
  
  return prompts[slotType] || "Could you provide more information?";
}

export function areAllRequiredSlotsFilled(slots: ConversationSlots): boolean {
  return !!(
    slots.patientName &&
    slots.patientEmail &&
    slots.doctorId &&
    slots.appointmentDate &&
    slots.timezone
  );
}

export function formatConfirmationMessage(
  slots: ConversationSlots,
  doctorName: string
): string {
  return templates.chat.confirmBooking
    .replace("{patientName}", slots.patientName || "")
    .replace("{patientEmail}", slots.patientEmail || "")
    .replace("{doctorName}", doctorName)
    .replace("{appointmentDate}", slots.appointmentDate || "")
    .replace("{timezone}", slots.timezone || "")
    .replace("{reason}", slots.reason || "General consultation");
}
