import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("cardio.db");
const JWT_SECRET = "cardio-ai-secret-key-2024";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    settings TEXT DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    doctor_id TEXT NOT NULL,
    name TEXT NOT NULL,
    age INTEGER,
    heart_rate INTEGER,
    blood_pressure TEXT,
    cholesterol INTEGER,
    spo2 INTEGER,
    difficulty TEXT DEFAULT 'Medium',
    medications TEXT DEFAULT '[]',
    settings TEXT DEFAULT '{}',
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
  );

  CREATE TABLE IF NOT EXISTS medication_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT NOT NULL,
    medication_name TEXT NOT NULL,
    video_url TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    seen INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT NOT NULL,
    type TEXT NOT NULL,
    video_url TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Add medications column to patients if it doesn't exist
try {
  db.prepare("ALTER TABLE patients ADD COLUMN medications TEXT DEFAULT '[]'").run();
} catch (e) {}

// Migration: Ensure doctor names are unique
try {
  db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_doctors_name ON doctors(name)").run();
} catch (e) {}

// Seed: System Doctor
try {
  db.prepare("INSERT OR IGNORE INTO doctors (id, name, password) VALUES (?, ?, ?)").run('SYSTEM', 'System', 'system-locked');
} catch (e) {}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // WebSocket logic
  const clients = new Map<string, WebSocket>();

  wss.on("connection", (ws, req) => {
    let userId: string | null = null;

    ws.on("message", (message) => {
      const data = JSON.parse(message.toString());
      if (data.type === "auth") {
        userId = data.userId;
        if (userId) clients.set(userId, ws);
      } else if (data.type === "message") {
        const { receiverId, content } = data;
        if (userId) {
          const stmt = db.prepare("INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)");
          const info = stmt.run(userId, receiverId, content);
          
          const msg = {
            id: info.lastInsertRowid,
            sender_id: userId,
            receiver_id: receiverId,
            content,
            timestamp: new Date().toISOString(),
            seen: 0
          };

          // Send to receiver if online
          const receiverWs = clients.get(receiverId);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify({ type: "message", message: msg }));
          }
          // Send back to sender for confirmation
          ws.send(JSON.stringify({ type: "message_sent", message: msg }));
        }
      }
    });

    ws.on("close", () => {
      if (userId) clients.delete(userId);
    });
  });

  // Auth Routes
  app.post("/api/auth/doctor/signup", async (req, res) => {
    const { name, password } = req.body;
    const trimmedName = name.trim();
    const id = Math.random().toString(36).substr(2, 9);
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      db.prepare("INSERT INTO doctors (id, name, password) VALUES (?, ?, ?)").run(id, trimmedName, hashedPassword);
      const token = jwt.sign({ id, role: "doctor" }, JWT_SECRET);
      res.json({ token, user: { id, name: trimmedName, role: "doctor" } });
    } catch (e: any) {
      if (e.message.includes("UNIQUE constraint failed")) {
        res.status(400).json({ error: "Username already exists" });
      } else {
        res.status(400).json({ error: "Signup failed" });
      }
    }
  });

  app.post("/api/auth/doctor/login", async (req, res) => {
    const { name, password } = req.body;
    const trimmedName = name.trim();
    const doctor = db.prepare("SELECT * FROM doctors WHERE name = ?").get(trimmedName) as any;
    if (doctor && await bcrypt.compare(password, doctor.password)) {
      const token = jwt.sign({ id: doctor.id, role: "doctor" }, JWT_SECRET);
      res.json({ token, user: { id: doctor.id, name: doctor.name, role: "doctor", settings: JSON.parse(doctor.settings || '{}') } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/auth/patient/signup", async (req, res) => {
    const { name, age, heartRate, bloodPressure, cholesterol, spo2, difficulty } = req.body;
    const id = "P" + Math.random().toString(36).substr(2, 6).toUpperCase();
    try {
      db.prepare(`
        INSERT INTO patients (id, doctor_id, name, age, heart_rate, blood_pressure, cholesterol, spo2, difficulty)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, 'SYSTEM', name, age || 0, heartRate || 70, bloodPressure || '120/80', cholesterol || 180, spo2 || 98, difficulty || 'Medium');
      
      const token = jwt.sign({ id, role: "patient" }, JWT_SECRET);
      res.json({ token, user: { id, name, role: "patient", settings: {} } });
    } catch (e: any) {
      res.status(400).json({ error: "Signup failed" });
    }
  });

  app.post("/api/auth/patient/login", (req, res) => {
    const { id } = req.body;
    const patient = db.prepare("SELECT * FROM patients WHERE id = ?").get(id) as any;
    if (patient) {
      const token = jwt.sign({ id: patient.id, role: "patient" }, JWT_SECRET);
      res.json({ 
        token, 
        user: { 
          ...patient, 
          role: "patient", 
          settings: JSON.parse(patient.settings || '{}'),
          medications: JSON.parse(patient.medications || '[]')
        } 
      });
    } else {
      res.status(401).json({ error: "Invalid Credentials" });
    }
  });

  // Patient Management
  app.post("/api/patients", (req, res) => {
    try {
      const { doctorId, name, age, heartRate, bloodPressure, cholesterol, spo2, difficulty, medications } = req.body;
      const id = "P" + Math.random().toString(36).substr(2, 6).toUpperCase();
      db.prepare(`
        INSERT INTO patients (id, doctor_id, name, age, heart_rate, blood_pressure, cholesterol, spo2, difficulty, medications)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, doctorId, name, age, heartRate, bloodPressure, cholesterol, spo2, difficulty, JSON.stringify(medications || []));
      res.json({ id });
    } catch (e: any) {
      console.error("Patient registration error:", e);
      res.status(500).json({ error: e.message || "Failed to register patient" });
    }
  });

  app.get("/api/doctors/:id/patients", (req, res) => {
    const patients = db.prepare("SELECT * FROM patients WHERE doctor_id = ?").all(req.params.id);
    res.json(patients.map((p: any) => ({ 
      ...p, 
      settings: JSON.parse(p.settings || '{}'),
      medications: JSON.parse(p.medications || '[]')
    })));
  });

  app.delete("/api/patients/:id", (req, res) => {
    db.prepare("DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?").run(req.params.id, req.params.id);
    db.prepare("DELETE FROM workouts WHERE patient_id = ?").run(req.params.id);
    db.prepare("DELETE FROM notifications WHERE user_id = ?").run(req.params.id);
    db.prepare("DELETE FROM patients WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Settings
  app.post("/api/settings/:role/:id", (req, res) => {
    const { role, id } = req.params;
    const settings = JSON.stringify(req.body);
    if (role === "doctor") {
      db.prepare("UPDATE doctors SET settings = ? WHERE id = ?").run(settings, id);
    } else {
      db.prepare("UPDATE patients SET settings = ? WHERE id = ?").run(settings, id);
    }
    res.json({ success: true });
  });

  // Workouts
  app.post("/api/workouts", (req, res) => {
    const { patientId, type, videoUrl } = req.body;
    db.prepare("INSERT INTO workouts (patient_id, type, video_url) VALUES (?, ?, ?)").run(patientId, type, videoUrl);
    
    // Notify doctor
    const patient = db.prepare("SELECT * FROM patients WHERE id = ?").get(patientId) as any;
    if (patient) {
      db.prepare("INSERT INTO notifications (user_id, content, type) VALUES (?, ?, ?)").run(
        patient.doctor_id,
        `Patient ${patient.name} completed a ${type} workout.`,
        "workout"
      );
    }
    res.json({ success: true });
  });

  app.get("/api/patients/:id/workouts", (req, res) => {
    const workouts = db.prepare("SELECT * FROM workouts WHERE patient_id = ? ORDER BY timestamp DESC").all(req.params.id);
    const medLogs = db.prepare("SELECT * FROM medication_logs WHERE patient_id = ? ORDER BY timestamp DESC").all(req.params.id);
    
    const combined = [
      ...workouts.map(w => ({ ...w, logType: 'workout' })),
      ...medLogs.map(m => ({ ...m, logType: 'medication', type: m.medication_name }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json(combined);
  });

  // Medication Logs
  app.post("/api/medication-logs", (req, res) => {
    const { patientId, medicationName, videoUrl } = req.body;
    db.prepare("INSERT INTO medication_logs (patient_id, medication_name, video_url) VALUES (?, ?, ?)").run(patientId, medicationName, videoUrl);
    
    // Notify doctor
    const patient = db.prepare("SELECT * FROM patients WHERE id = ?").get(patientId) as any;
    if (patient) {
      db.prepare("INSERT INTO notifications (user_id, content, type) VALUES (?, ?, ?)").run(
        patient.doctor_id,
        `Patient ${patient.name} took their medication: ${medicationName}.`,
        "medication"
      );
    }
    res.json({ success: true });
  });

  // Notifications
  app.get("/api/notifications/:userId", (req, res) => {
    const notifications = db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY timestamp DESC").all(req.params.userId);
    res.json(notifications);
  });

  app.post("/api/notifications/:id/read", (req, res) => {
    db.prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Messages History
  app.get("/api/messages/:u1/:u2", (req, res) => {
    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE (sender_id = ? AND receiver_id = ?) 
      OR (sender_id = ? AND receiver_id = ?)
      ORDER BY timestamp ASC
    `).all(req.params.u1, req.params.u2, req.params.u2, req.params.u1);
    res.json(messages);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
