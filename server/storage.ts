import {
   appointments,
  type Appointment,
  type InsertAppointment,
  type ChatMessage,
  type InsertChatMessage,
  type Conversation,
  type InsertConversation,
  type Doctor,
  type ConversationSlots,
} from "../shared/schema";

import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export interface IStorage {
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  getAllAppointments(): Promise<Appointment[]>;

  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getMessagesByConversation(conversationId: string): Promise<ChatMessage[]>;

  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  updateConversationSlots(id: string, slots: ConversationSlots): Promise<void>;
  updateConversationTitle(id: string, title: string): Promise<void>;

  getDoctors(): Promise<Doctor[]>;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentValue += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  if (currentValue) {
    values.push(currentValue.trim());
  }
  
  return values;
}

function parseCSV(filePath: string): Doctor[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n');
  const headers = parseCSVLine(lines[0]);
  
  const doctors: Doctor[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    doctors.push({
      id: row['doctor_id'] || `dr-${i}`,
      name: row['doctor_name_en'] || 'Unknown',
      specialty: row['specialty'] || 'General Practice',
      subSpecialty: row['sub_specialty'] || undefined,
      hospitalName: row['hospital_name'] || undefined,
      locationArea: row['location_area'] || undefined,
      rating: row['rating'] ? parseFloat(row['rating']) : undefined,
      fee: row['fee'] ? parseInt(row['fee']) : undefined,
      avatar: '',
      available: row['telemedicine'] === 'True',
    });
  }
  
  return doctors;
}

// function parseCSV(filePath: string): Doctor[] {
//   const fileContent = fs.readFileSync(filePath, 'utf-8');
//   const lines = fileContent.split('\n');
//   const headers = lines[0].split(',').map(h => h.trim());
  
//   const doctors: Doctor[] = [];
  
//   for (let i = 1; i < lines.length; i++) {
//     const line = lines[i].trim();
//     if (!line) continue;
    
//     const values = line.split(',').map(v => v.trim());
//     const row: Record<string, string> = {};
    
//     headers.forEach((header, index) => {
//       row[header] = values[index] || '';
//     });
    
//     doctors.push({
//       id: row['doctor_id'] || `dr-${i}`,
//       name: row['doctor_name_en'] || 'Unknown',
//       specialty: row['specialty'] || 'General Practice',
//       avatar: '',
//       available: row['telemedicine'] === 'True' || Math.random() > 0.3,
//     });
//   }
  
//   return doctors;
// }

export class MemStorage implements IStorage {
  private appointments: Map<string, Appointment>;
  private chatMessages: Map<string, ChatMessage>;
  private conversations: Map<string, Conversation>;
  private doctors: Doctor[];

  constructor() {
    this.appointments = new Map();
    this.chatMessages = new Map();
    this.conversations = new Map();

    try {
      const csvPath = path.resolve(import.meta.dirname, '../attached_assets/doctors_300_dataset_1763920263351.csv');
      this.doctors = parseCSV(csvPath);
    } catch (error) {
      console.warn('Failed to load doctors from CSV, using fallback', error);
      this.doctors = [
        {
          id: "dr-sarah-johnson",
          name: "Dr. Sarah Johnson",
          specialty: "Endocrinologist",
          avatar: "",
          available: true,
        },
        {
          id: "dr-michael-chen",
          name: "Dr. Michael Chen",
          specialty: "Cardiologist",
          avatar: "",
          available: true,
        },
        {
          id: "dr-emily-rodriguez",
          name: "Dr. Emily Rodriguez",
          specialty: "Oncologist",
          avatar: "",
          available: true,
        },
      ];
    }
  }

  async createAppointment(
    insertAppointment: InsertAppointment,
  ): Promise<Appointment> {
    const id = randomUUID();
    const appointment: Appointment = {
      ...insertAppointment,
      id,
      appointmentDate: new Date(insertAppointment.appointmentDate),
      status: "confirmed",
      createdAt: new Date(),

      // FIX: ensure reason is never undefined
      reason: insertAppointment.reason ?? null,
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async createChatMessage(
    insertMessage: InsertChatMessage,
  ): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date(),

      // FIX: normalize optional fields
      citations: insertMessage.citations ?? null,
      metadata: insertMessage.metadata ?? null,
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getMessagesByConversation(
    conversationId: string,
  ): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter((msg) => msg.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createConversation(
    insertConversation: InsertConversation,
  ): Promise<Conversation> {
    const id = randomUUID();
    const now = new Date();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      title: insertConversation.title || null,
      slots: insertConversation.slots || null,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getAllConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }

  async updateConversationSlots(
    id: string,
    slots: ConversationSlots,
  ): Promise<void> {
    const conversation = this.conversations.get(id);
    if (conversation) {
      conversation.slots = JSON.stringify(slots);
      conversation.updatedAt = new Date();
    }
  }

  async updateConversationTitle(id: string, title: string): Promise<void> {
    const conversation = this.conversations.get(id);
    if (conversation) {
      conversation.title = title;
      conversation.updatedAt = new Date();
    }
  }

  async getDoctors(): Promise<Doctor[]> {
    return this.doctors;
  }
}

export class PostgresStorage implements IStorage {
  constructor(private fallback: MemStorage) {}

  // --- Appointments stored in PostgreSQL ---

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    // Ensure appointmentDate is a real Date object for Drizzle/Postgres
    const appointmentDate =
      appointment.appointmentDate instanceof Date
        ? appointment.appointmentDate
        : new Date(appointment.appointmentDate as any);

    if (isNaN(appointmentDate.getTime())) {
      throw new Error("Invalid appointmentDate value");
    }

    const [row] = await db
      .insert(appointments)
      .values({
        ...appointment,
        appointmentDate,
        status: (appointment as any).status ?? "confirmed",
      })
      .returning();

    return row;
  }


  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [row] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));

    return row ?? undefined;
  }

  async getAllAppointments(): Promise<Appointment[]> {
    const rows = await db.select().from(appointments);
    return rows;
  }

  // --- Everything else stays in-memory via the existing MemStorage ---

  async createChatMessage(msg: InsertChatMessage): Promise<ChatMessage> {
    return this.fallback.createChatMessage(msg);
  }

  async getMessagesByConversation(conversationId: string): Promise<ChatMessage[]> {
    return this.fallback.getMessagesByConversation(conversationId);
  }

  async createConversation(conv: InsertConversation): Promise<Conversation> {
    return this.fallback.createConversation(conv);
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.fallback.getConversation(id);
  }

  async getAllConversations(): Promise<Conversation[]> {
    return this.fallback.getAllConversations();
  }

  async updateConversationSlots(id: string, slots: ConversationSlots): Promise<void> {
    return this.fallback.updateConversationSlots(id, slots);
  }

  async updateConversationTitle(id: string, title: string): Promise<void> {
    return this.fallback.updateConversationTitle(id, title);
  }

  async getDoctors(): Promise<Doctor[]> {
    return this.fallback.getDoctors();
  }
}

const baseStorage = new MemStorage();
export const storage = new PostgresStorage(baseStorage);

