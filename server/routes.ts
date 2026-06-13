import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse } from "./gemini";
import { generateRAGResponse } from "./rag";
import {
  detectIntent,
  extractSlotFromMessage,
  getNextMissingSlot,
  getSlotPrompt,
  areAllRequiredSlotsFilled,
  formatConfirmationMessage,
} from "./slot-filling";
import { generateICS } from "./ics-generator";
import {
  insertAppointmentSchema,
  insertChatMessageSchema,
  insertConversationSchema,
  type ConversationSlots,
} from "../shared/schema";
import templates from "../shared/templates.json";

// Import diabetes risk module
import {
  questions as diabetesQuestions,
  calculateRisk,
  getOrCreateSession,
  updateSession,
  advanceSession,
  isSessionComplete,
  getAnswers,
  clearSession,
} from "./diabetesRisk";

// Improved diabetes risk query detection
function isDiabetesRiskQuery(message: string): boolean {
  const lower = message.toLowerCase();
  const hasDiabetes = lower.includes('diabetes') || lower.includes('diabetic');
  const hasIntent = lower.includes('risk') || 
                    lower.includes('check') || 
                    lower.includes('test') || 
                    lower.includes('am i') ||
                    lower.includes('predict') ||
                    lower.includes('chance') ||
                    lower.includes('likelihood');
  return hasDiabetes && hasIntent;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/doctors", async (req, res) => {
    try {
      const doctors = await storage.getDoctors();
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch doctors" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validatedData);
      res.json(appointment);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid appointment data" });
    }
  });

  app.get("/api/appointments", async (req, res) => {
    try {
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/:id/ics", async (req, res) => {
    try {
      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      const doctors = await storage.getDoctors();
      const doctor = doctors.find((d) => d.id === appointment.doctorId);
      if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
      }

      const appointmentDate = appointment.appointmentDate instanceof Date 
        ? appointment.appointmentDate 
        : new Date(appointment.appointmentDate);

      const icsContent = generateICS(
        appointment.patientName,
        appointment.patientEmail,
        doctor.name,
        appointmentDate,
        appointment.timezone,
        appointment.reason || undefined
      );

      res.setHeader("Content-Type", "text/calendar");
      res.setHeader("Content-Disposition", `attachment; filename="appointment-${appointment.id}.ics"`);
      res.send(icsContent);
    } catch (error) {
      console.error("ICS generation error:", error);
      res.status(500).json({ error: "Failed to generate ICS file" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const conversation = await storage.createConversation({});
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/messages/:conversationId", async (req, res) => {
    try {
      const messages = await storage.getMessagesByConversation(req.params.conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { content, conversationId } = req.body;

      let currentConversationId = conversationId;
      if (!currentConversationId) {
        const newConversation = await storage.createConversation({});
        currentConversationId = newConversation.id;
      }

      await storage.createChatMessage({
        conversationId: currentConversationId,
        role: "user",
        content,
      });

      const conversation = await storage.getConversation(currentConversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const slots: ConversationSlots = conversation.slots
        ? JSON.parse(conversation.slots)
        : {};

      // Detect intent: booking and health flags
      const { isBookingIntent, isHealthQuery } = detectIntent(content);

      let responseContent = "";
      let citations: string[] = [];
      const isInBookingFlow = Object.keys(slots).some(key => slots[key as keyof ConversationSlots]);

      // ---------- DIABETES RISK FLOW ----------
      const session = getOrCreateSession(currentConversationId);
      const hasActiveSession = session.step > 0 && session.step <= diabetesQuestions.length;

      console.log("Checking diabetes flow:", { isBookingIntent, isInBookingFlow, hasActiveSession, isHealthQuery, content });

      if (!isBookingIntent && !isInBookingFlow && (isDiabetesRiskQuery(content) || hasActiveSession)) {
        console.log("Diabetes flow triggered for:", content);
        console.log("Session step:", session.step);

        // If just starting (step 0) and it's a diabetes query, ask first question
        if (session.step === 0) {
          if (isDiabetesRiskQuery(content)) {
            advanceSession(currentConversationId);
            const question = diabetesQuestions[0].text;
            responseContent = question;
          } else {
            // No responseContent set – will fall through to other flows
          }
        }
        // If session is in progress, process the answer
        else if (session.step > 0 && session.step <= diabetesQuestions.length) {
          const currentQ = diabetesQuestions[session.step - 1];
          const answer = content.trim();
          let isValid = true;
          let errorMsg = '';

          // Validate based on question type with natural language handling
          if (currentQ.type === 'number') {
            // Extract first number from the text
            const match = answer.match(/\d+/);
            if (match) {
              const num = parseInt(match[0], 10);
              if (currentQ.validate(num.toString())) {
                updateSession(currentConversationId, num.toString());
              } else {
                isValid = false;
                errorMsg = `Please provide a valid ${currentQ.key} (positive number).`;
              }
            } else {
              isValid = false;
              errorMsg = `Please provide your ${currentQ.key} as a number.`;
            }
          } else if (currentQ.type === 'boolean') {
            const lowerAnswer = answer.toLowerCase();
            if (lowerAnswer.includes('yes') || lowerAnswer.includes('yeah') || lowerAnswer.includes('yep') || lowerAnswer === 'y') {
              updateSession(currentConversationId, 'yes');
            } else if (lowerAnswer.includes('no') || lowerAnswer.includes('nope') || lowerAnswer === 'n') {
              updateSession(currentConversationId, 'no');
            } else {
              isValid = false;
              errorMsg = `Please answer with yes or no.`;
            }
          } else if (currentQ.type === 'string' && currentQ.options) {
            const lowerAnswer = answer.toLowerCase();
            const matchedOption = currentQ.options.find(opt => lowerAnswer.includes(opt));
            if (matchedOption) {
              updateSession(currentConversationId, matchedOption);
            } else {
              isValid = false;
              errorMsg = `Please answer with one of: ${currentQ.options.join(', ')}.`;
            }
          }

          if (!isValid) {
            responseContent = errorMsg || `Please answer with a valid ${currentQ.type}.`;
            // Stay in diabetes flow, do not advance step
          } else {
            advanceSession(currentConversationId);

            if (isSessionComplete(currentConversationId)) {
              const answers = getAnswers(currentConversationId);
              if (answers) {
                const result = calculateRisk(answers);
                const disclaimer = "\n\n**Disclaimer:** This is not a medical diagnosis. Only a healthcare professional can determine if you have diabetes. Please consult a doctor for proper evaluation.";
                responseContent = `Based on your answers, your diabetes risk score is **${result.score}** (${result.category} risk).\n\n${result.recommendation}${disclaimer}`;
                clearSession(currentConversationId);
              } else {
                responseContent = "Sorry, I couldn't process your answers. Please start over.";
                clearSession(currentConversationId);
              }
            } else {
              // Ask next question
              const nextQuestion = diabetesQuestions[session.step].text;
              responseContent = nextQuestion;
            }
          }
        }

        // If we have a response, save and return early
        if (responseContent) {
          await storage.createChatMessage({
            conversationId: currentConversationId,
            role: "assistant",
            content: responseContent,
          });

          if (!conversation.title) {
            const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
            await storage.updateConversationTitle(currentConversationId, title);
          }

          console.log("Diabetes response:", responseContent);
          return res.json({
            conversationId: currentConversationId,
            response: responseContent,
            citations: [],
          });
        }
      }
      // ---------- END DIABETES FLOW ----------

      // ---------- BOOKING FLOW ----------
      if (isBookingIntent || isInBookingFlow) {
        // Extract slot values from message
        for (const slotKey of Object.keys(slots) as Array<keyof ConversationSlots>) {
          if (!slots[slotKey]) {
            const extracted = extractSlotFromMessage(content, slotKey);
            if (extracted) {
              slots[slotKey] = extracted;
            }
          }
        }

        if (!slots.patientName) {
          const extracted = extractSlotFromMessage(content, "patientName");
          if (extracted) slots.patientName = extracted;
        }

        if (!slots.patientEmail) {
          const extracted = extractSlotFromMessage(content, "patientEmail");
          if (extracted) slots.patientEmail = extracted;
        }

        if (!slots.timezone) {
          const extracted = extractSlotFromMessage(content, "timezone");
          if (extracted) slots.timezone = extracted;
        }

        if (!slots.doctorId) {
          const doctors = await storage.getDoctors();
          const lowerContent = content.toLowerCase();
          const matchedDoctor = doctors.find(d => 
            lowerContent.includes(d.name.toLowerCase()) || 
            lowerContent.includes(d.specialty.toLowerCase())
          );
          if (matchedDoctor) {
            slots.doctorId = matchedDoctor.id;
          }
        }

        await storage.updateConversationSlots(currentConversationId, slots);

        const nextSlot = getNextMissingSlot(slots);

        if (nextSlot === "doctorId") {
          const doctors = await storage.getDoctors();
          const availableDoctors = doctors.filter((d) => d.available);
          responseContent = templates.chat.askDoctorPreference + "\n\nAvailable doctors:\n" +
            availableDoctors.map((d) => `- ${d.name} (${d.specialty})`).join("\n");
        } else if (nextSlot) {
          responseContent = getSlotPrompt(nextSlot);
        } else if (areAllRequiredSlotsFilled(slots)) {
          const doctors = await storage.getDoctors();
          const doctor = doctors.find((d) => d.id === slots.doctorId);
          if (doctor) {
            responseContent = formatConfirmationMessage(slots, doctor.name);
          }
        }

        if ((content.toLowerCase().includes("yes") || content.toLowerCase().includes("confirm")) && 
            areAllRequiredSlotsFilled(slots)) {
          try {
            const appointment = await storage.createAppointment({
              patientName: slots.patientName!,
              patientEmail: slots.patientEmail!,
              doctorId: slots.doctorId!,
              appointmentDate: slots.appointmentDate!,
              timezone: slots.timezone!,
              reason: slots.reason,
            });
            responseContent = templates.chat.bookingSuccess;
            await storage.updateConversationSlots(currentConversationId, {});
          } catch (error) {
            responseContent = templates.chat.bookingError;
          }
        }
      } 
      // ---------- HEALTH QUERIES ----------
      else if (isHealthQuery) {
        // Simple check for short greetings – send welcome message
        const lowerContent = content.toLowerCase().trim();
        const isGreeting = lowerContent.length < 10 && (
          lowerContent.includes('hello') ||
          lowerContent.includes('hi') ||
          lowerContent.includes('hey') ||
          lowerContent.includes('good morning') ||
          lowerContent.includes('good afternoon') ||
          lowerContent.includes('good evening')
        );

        if (isGreeting) {
          responseContent = templates.chat.welcome;
        } else {
          // Treat as health query: first try RAG, then fallback to Gemini
          const ragResult = await generateRAGResponse(content);

          if (ragResult.citations.length > 0) {
            const systemPrompt = `You are a helpful health assistant. Use the following medical information to answer the user's question. 
Always cite your sources using the format [SOURCE_ID].

Medical Information:
${ragResult.answer}

Provide a clear, helpful answer based on this information. Include citations.`;

            try {
              const aiResponse = await generateChatResponse(
                [{ role: "user", content }],
                systemPrompt
              );
              responseContent = aiResponse;
              citations = ragResult.citations;
            } catch (error) {
              responseContent = ragResult.answer;
              citations = ragResult.citations;
            }
          } else {
            const systemPrompt = `You are a helpful health assistant. Provide accurate, helpful health information based on your knowledge. Be clear and balanced. If you're uncertain about medical information, recommend consulting a healthcare provider or booking an appointment with a doctor.`;

            try {
              const aiResponse = await generateChatResponse(
                [{ role: "user", content }],
                systemPrompt
              );
              responseContent = aiResponse;
              citations = [];
            } catch (error) {
              responseContent = "I'd be happy to help with health information, but I couldn't generate a response. Would you like to book an appointment with a doctor instead?";
            }
          }
        }
      } 
      // ---------- NON‑HEALTH QUERIES (FIXED RESPONSE) ----------
      else {
        responseContent = templates.chat.welcome;
      }

      // Save assistant message
      await storage.createChatMessage({
        conversationId: currentConversationId,
        role: "assistant",
        content: responseContent,
        citations: citations.length > 0 ? citations : undefined,
      });

      // Set conversation title if not already set
      if (!conversation.title) {
        const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
        await storage.updateConversationTitle(currentConversationId, title);
      }

      res.json({
        conversationId: currentConversationId,
        response: responseContent,
        citations,
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: error.message || "Failed to process chat" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}