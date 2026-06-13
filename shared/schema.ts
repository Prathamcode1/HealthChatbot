import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientName: text("patient_name").notNull(),
  patientEmail: text("patient_email").notNull(),
  doctorId: text("doctor_id").notNull(),
  appointmentDate: timestamp("appointment_date", { withTimezone: true }).notNull(),
  timezone: text("timezone").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("confirmed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: text("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  citations: text("citations").array(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ragDocuments = pgTable("rag_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  snippetId: text("snippet_id").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  embedding: text("embedding"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title"),
  slots: text("slots"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  status: true,
}).extend({
  patientName: z.string().min(2, "Name must be at least 2 characters"),
  patientEmail: z.string().email("Invalid email address"),
  appointmentDate: z.string().or(z.date()),
  timezone: z.string().min(1, "Timezone is required"),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
}).extend({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1, "Message content is required"),
});

export const insertRagDocumentSchema = createInsertSchema(ragDocuments).omit({
  id: true,
  createdAt: true,
  embedding: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertRagDocument = z.infer<typeof insertRagDocumentSchema>;
export type RagDocument = typeof ragDocuments.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  subSpecialty?: string;
  hospitalName?: string;
  locationArea?: string;
  rating?: number;
  fee?: number;
  avatar: string;
  available: boolean;
}

export interface ConversationSlots {
  patientName?: string;
  patientEmail?: string;
  doctorId?: string;
  appointmentDate?: string;
  timezone?: string;
  reason?: string;
}

export interface RAGResponse {
  answer: string;
  citations: string[];
}
